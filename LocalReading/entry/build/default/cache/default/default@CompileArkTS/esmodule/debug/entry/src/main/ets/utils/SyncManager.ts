import fileIo from "@ohos:file.fs";
import type common from "@ohos:app.ability.common";
import hilog from "@ohos:hilog";
import { StorageUtil } from "@bundle:com.example.readerkitdemo/entry/ets/utils/StorageUtil";
import { SettingStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import type { PersistedReaderSettings } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import { GlobalContext } from "@bundle:com.example.readerkitdemo/entry/ets/common/GlobalContext";
import buffer from "@ohos:buffer";
import type { StoredUserCredential } from './PasswordUtil';
import picker from "@ohos:file.picker";
import { BookStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookStorage";
const TAG = 'SyncManager';
// 简化的同步数据结构
export interface SyncData {
    version: string;
    timestamp: number;
    users: Record<string, StoredUserCredential>;
    currentUser: string;
    settings: PersistedReaderSettings | null;
    bookNames: string[]; // 仅保存书名列表，用于提示用户
}
export interface ImportResult {
    success: boolean;
    message: string;
    bookNames?: string[]; // 导入时返回之前的书名列表
}
export class SyncManager {
    /**
     * 导出数据到文件（用于手动同步）
     * 仅导出用户账号、阅读设置和书名列表（用于提示）
     */
    static async exportData(): Promise<string> {
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 1. 先弹出文件选择器让用户选择保存位置
            const fileName = `reader_sync_${Date.now()}.json`;
            const documentSaveOptions = new picker.DocumentSaveOptions();
            documentSaveOptions.newFileNames = [fileName];
            const documentViewPicker = new picker.DocumentViewPicker(context);
            const saveResult = await documentViewPicker.save(documentSaveOptions);
            if (!saveResult || saveResult.length === 0) {
                hilog.info(0x0000, TAG, '用户取消保存');
                return '';
            }
            const userSaveUri = saveResult[0];
            hilog.info(0x0000, TAG, `用户选择保存位置: ${userSaveUri}`);
            // 2. 获取用户数据和设置
            const users = await StorageUtil.getAllUsers();
            const currentUser = await StorageUtil.getCurrentUser();
            const settings = await SettingStorage.loadSettings(context);
            // 3. 获取所有书名列表（仅用于提示）
            const bookNames: string[] = [];
            const userAccounts = Object.keys(users);
            for (const account of userAccounts) {
                const userBooks = await BookStorage.loadBooks(context, account);
                for (const book of userBooks) {
                    bookNames.push(book.getBookName());
                }
            }
            hilog.info(0x0000, TAG, `导出书名列表: ${bookNames.length} 本`);
            // 4. 构建同步数据
            const syncData: SyncData = {
                version: '2.0',
                timestamp: Date.now(),
                users: users,
                currentUser: currentUser,
                settings: settings,
                bookNames: bookNames
            };
            const jsonData = JSON.stringify(syncData, null, 2);
            hilog.info(0x0000, TAG, `准备写入数据，大小: ${jsonData.length} 字节`);
            // 5. 写入文件
            const file = fileIo.openSync(userSaveUri, fileIo.OpenMode.WRITE_ONLY | fileIo.OpenMode.CREATE);
            const buf = buffer.from(jsonData, 'utf-8');
            fileIo.writeSync(file.fd, buf.buffer);
            fileIo.closeSync(file);
            hilog.info(0x0000, TAG, `数据导出成功: ${userSaveUri}`);
            return userSaveUri;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Export failed: ${error.message}`);
            throw new Error(`Export failed: ${error.message}`);
        }
    }
    /**
     * 从文件导入数据（用于手动同步）
     * 仅导入用户账号和阅读设置，返回书名列表用于提示
     * @param fileUri 文件URI（从文件选择器获取）
     */
    static async importData(fileUri: string): Promise<ImportResult> {
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 直接使用URI打开文件
            const file = fileIo.openSync(fileUri, fileIo.OpenMode.READ_ONLY);
            const stat = fileIo.statSync(file.fd);
            const buf = new ArrayBuffer(stat.size);
            fileIo.readSync(file.fd, buf);
            fileIo.closeSync(file);
            const importContent = buffer.from(buf, 0).toString();
            const syncData: SyncData = JSON.parse(importContent);
            // 验证数据格式
            if (!syncData.version || !syncData.users) {
                hilog.error(0x0000, TAG, 'Invalid sync data format');
                return { success: false, message: '文件格式无效' };
            }
            // 恢复用户数据
            await StorageUtil.saveAllUsers(syncData.users);
            // 恢复设置
            if (syncData.settings) {
                await SettingStorage.saveSettings(context, syncData.settings);
            }
            // 设置当前用户
            if (syncData.currentUser) {
                await StorageUtil.setLoggedIn(syncData.currentUser);
            }
            hilog.info(0x0000, TAG, 'Import success');
            return {
                success: true,
                message: '数据导入成功',
                bookNames: syncData.bookNames || []
            };
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Import failed: ${error.message}`);
            return { success: false, message: `导入失败: ${error.message}` };
        }
    }
    /**
     * 选择文件并导入数据
     * 弹出文件选择器让用户选择要导入的JSON文件
     */
    static async selectAndImportData(): Promise<ImportResult> {
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 创建文件选择选项
            const documentSelectOptions = new picker.DocumentSelectOptions();
            documentSelectOptions.maxSelectNumber = 1;
            documentSelectOptions.fileSuffixFilters = ['.json'];
            // 创建文件选择器
            const documentViewPicker = new picker.DocumentViewPicker(context);
            const selectResult = await documentViewPicker.select(documentSelectOptions);
            if (!selectResult || selectResult.length === 0) {
                hilog.info(0x0000, TAG, '用户取消选择文件');
                return { success: false, message: '用户取消选择' };
            }
            const selectedUri = selectResult[0];
            hilog.info(0x0000, TAG, `用户选择文件: ${selectedUri}`);
            // 调用 importData 完成导入
            const result = await SyncManager.importData(selectedUri);
            // 如果导入成功且有书籍列表，构建更详细的提示信息
            if (result.success && result.bookNames && result.bookNames.length > 0) {
                result.message = `数据导入成功。您之前有 ${result.bookNames.length} 本书：${result.bookNames.join('、')}，请重新导入书籍文件`;
            }
            return result;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Import failed: ${error.message}`);
            return { success: false, message: `导入失败: ${error.message}` };
        }
    }
}
