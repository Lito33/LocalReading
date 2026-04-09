import preferences from "@ohos:data.preferences";
import type common from "@ohos:app.ability.common";
import hilog from "@ohos:hilog";
const TAG = "ProgressStorage";
export interface BookProgress {
    bookIdentity: string; // 书籍唯一标识（书名_作者），用于跨设备匹配
    filePath: string; // 本地文件路径（之前用本地存储使用来定位文件ToT）
    bookName: string; // 书名
    author: string; // 作者
    resourceIndex: number; // 章节索引
    startDomPos: string; // 文档位置
    chapterName: string; // 章节名
    lastReadTime: number; // 最后阅读时间
}
export class ProgressStorage {
    private static getStoreName(account?: string): string {
        // 只有当 account 是有效的非空字符串时才使用用户专属存储
        return (account && account.length > 0) ? `reader_progress_${account}` : 'reader_progress_default';
    }
    static async saveAllProgresses(context: common.UIAbilityContext, progresses: BookProgress[], account?: string): Promise<void> {
        const storeName = ProgressStorage.getStoreName(account);
        hilog.info(0x0000, TAG, `ProgressStorage: saving to ${storeName}, count=${progresses.length}`);
        const pref = await preferences.getPreferences(context, storeName);
        await pref.put('book_progress', JSON.stringify(progresses));
        await pref.flush();
    }
    static async loadAllProgresses(context: common.UIAbilityContext, account?: string): Promise<BookProgress[]> {
        const storeName = ProgressStorage.getStoreName(account);
        hilog.info(0x000, TAG, `ProgressStorage: loading from ${storeName}`);
        const pref = await preferences.getPreferences(context, storeName);
        const json = await pref.get('book_progress', '[]');
        try {
            const progresses = JSON.parse(json as string) as BookProgress[];
            hilog.info(0x000, TAG, `ProgressStorage: loaded ${progresses.length} records from ${storeName}`);
            return progresses;
        }
        catch {
            hilog.info(0x000, TAG, `ProgressStorage: failed to parse JSON from ${storeName}`);
            return [];
        }
    }
    static async saveProgress(context: common.UIAbilityContext, progress: BookProgress, account?: string): Promise<void> {
        const progresses = await ProgressStorage.loadAllProgresses(context, account);
        // 优先使用 filePath 匹配（确保每个文件都有独立的进度记录）
        // 其次使用 bookIdentity 匹配（用于跨设备同步场景）
        const index = progresses.findIndex(p => p.filePath === progress.filePath ||
            (p.bookIdentity && progress.bookIdentity && p.bookIdentity === progress.bookIdentity));
        const newProgress: BookProgress = {
            bookIdentity: progress.bookIdentity || ProgressStorage.generateBookIdentity(progress.bookName, progress.author),
            filePath: progress.filePath,
            bookName: progress.bookName,
            author: progress.author,
            resourceIndex: progress.resourceIndex,
            startDomPos: progress.startDomPos,
            chapterName: progress.chapterName,
            lastReadTime: Date.now()
        };
        hilog.info(0x0000, TAG, `saveProgress: filePath=${progress.filePath}, bookIdentity=${newProgress.bookIdentity}, ` +
            `foundIndex=${index}, totalProgresses=${progresses.length}`);
        if (index >= 0) {
            progresses[index] = newProgress;
            hilog.info(0x0000, TAG, `saveProgress: updated existing progress at index ${index}`);
        }
        else {
            progresses.push(newProgress);
            hilog.info(0x0000, TAG, `saveProgress: added new progress, total now ${progresses.length}`);
        }
        await ProgressStorage.saveAllProgresses(context, progresses, account);
    }
    //查询单个阅读进度，没用了
    static async getProgress(context: common.UIAbilityContext, filePath: string, account?: string): Promise<BookProgress> {
        const progresses = await ProgressStorage.loadAllProgresses(context, account);
        const foundProgress = progresses.find(p => p.filePath === filePath);
        if (foundProgress) {
            return foundProgress;
        }
        else {
            // 返回默认的进度对象
            const defaultProgress: BookProgress = {
                bookIdentity: '',
                filePath: filePath,
                bookName: '',
                author: '',
                resourceIndex: 0,
                startDomPos: '',
                chapterName: '',
                lastReadTime: 0
            };
            return defaultProgress;
        }
    }
    /**
     * 根据书籍标识获取进度（用于跨设备同步匹配）
     */
    static async getProgressByIdentity(context: common.UIAbilityContext, bookIdentity: string, account?: string): Promise<BookProgress | null> {
        const progresses = await ProgressStorage.loadAllProgresses(context, account);
        return progresses.find(p => p.bookIdentity === bookIdentity) || null;
    }
    /**
     * 生成书籍唯一标识
     */
    static generateBookIdentity(bookName: string, author: string): string {
        const name = (bookName || '').trim().toLowerCase();
        const auth = (author || '').trim().toLowerCase();
        return `${name}_${auth}`;
    }
    /**
     * 合并远程进度到本地（用于同步）
     * 如果本地有相同书籍，更新进度；否则添加新进度
     */
    static async mergeProgress(context: common.UIAbilityContext, remoteProgress: BookProgress, localFilePath: string, account?: string): Promise<void> {
        const progresses = await ProgressStorage.loadAllProgresses(context, account);
        // 查找本地是否有相同书籍（通过 bookIdentity 匹配）
        const index = progresses.findIndex(p => p.bookIdentity && remoteProgress.bookIdentity && p.bookIdentity === remoteProgress.bookIdentity);
        const mergedProgress: BookProgress = {
            bookIdentity: remoteProgress.bookIdentity,
            filePath: localFilePath,
            bookName: remoteProgress.bookName,
            author: remoteProgress.author,
            resourceIndex: remoteProgress.resourceIndex,
            startDomPos: remoteProgress.startDomPos,
            chapterName: remoteProgress.chapterName,
            lastReadTime: remoteProgress.lastReadTime
        };
        if (index >= 0) {
            // 本地有记录，更新进度（保留本地 filePath）
            progresses[index] = mergedProgress;
        }
        else {
            // 本地无记录，添加新进度
            progresses.push(mergedProgress);
        }
        await ProgressStorage.saveAllProgresses(context, progresses, account);
    }
}
