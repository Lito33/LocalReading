import distributedDataObject from "@ohos:data.distributedDataObject";
import type common from "@ohos:app.ability.common";
import hilog from "@ohos:hilog";
import type { BusinessError } from "@ohos:base";
import { StorageUtil } from "@bundle:com.example.readerkitdemo/entry/ets/utils/StorageUtil";
import { SettingStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import type { PersistedReaderSettings } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import { GlobalContext } from "@bundle:com.example.readerkitdemo/entry/ets/common/GlobalContext";
import type { StoredUserCredential } from './PasswordUtil';
import { ProgressStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
import type { BookProgress } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
const TAG = 'DistributedSyncManager';
const SESSION_ID = 'local_reading_sync_v2'; // 固定sessionId，同账号设备自动同步
// 同步数据结构
class SyncDataObject {
    version: string = '1.0';
    timestamp: number = 0;
    usersJson: string = '{}'; // Record<string, StoredUserCredential> 的 JSON
    currentUser: string = '';
    settingsJson: string = ''; // PersistedReaderSettings 的 JSON
    progressesJson: string = '[]'; // BookProgress[] 的 JSON（阅读进度）
}
// 同步状态
export interface SyncStatus {
    isSyncing: boolean;
    lastSyncTime: number;
    syncError?: string;
}
export class DistributedSyncManager {
    private static instance: DistributedSyncManager;
    private dataObject: distributedDataObject.DataObject | null = null;
    private syncStatus: SyncStatus = {
        isSyncing: false,
        lastSyncTime: 0
    };
    private onDataChanged: (() => void) | null = null;
    public static getInstance(): DistributedSyncManager {
        if (!DistributedSyncManager.instance) {
            DistributedSyncManager.instance = new DistributedSyncManager();
        }
        return DistributedSyncManager.instance;
    }
    /**
     * 初始化分布式数据对象
     */
    async initialize(): Promise<boolean> {
        try {
            // 如果已存在数据对象，先断开之前的连接
            if (this.dataObject) {
                try {
                    await this.dataObject.setSessionId('');
                    hilog.info(0x0000, TAG, 'Previous session disconnected');
                }
                catch (e) {
                    hilog.warn(0x0000, TAG, 'Failed to disconnect previous session');
                }
                this.dataObject = null;
            }
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 创建初始数据对象
            const sourceData = new SyncDataObject();
            // 创建分布式数据对象
            this.dataObject = distributedDataObject.create(context, sourceData);
            // 设置sessionId加入分布式组网
            await this.dataObject.setSessionId(SESSION_ID);
            // 监听数据变化
            this.setupChangeListener();
            hilog.info(0x0000, TAG, 'Distributed sync manager initialized successfully');
            return true;
        }
        catch (error) {
            const err = error as BusinessError;
            hilog.error(0x0000, TAG, `Initialize failed: ${err.message}`);
            return false;
        }
    }
    /**
     * 设置数据变化监听器
     */
    private setupChangeListener(): void {
        if (!this.dataObject)
            return;
        this.dataObject.on('change', (sessionId: string, fields: Array<string>) => {
            hilog.info(0x0000, TAG, `Data changed from session: ${sessionId}, fields: ${fields.join(',')}`);
            // 如果是远程设备的数据变化，需要应用到本地
            if (fields.includes('timestamp')) {
                this.applyRemoteData();
            }
        });
    }
    /**
     * 应用远程数据到本地
     */
    private async applyRemoteData(): Promise<void> {
        if (!this.dataObject)
            return;
        try {
            // 使用索引访问分布式数据对象的属性
            const remoteTimestamp = this.dataObject['timestamp'] as number;
            if (!remoteTimestamp || remoteTimestamp <= this.syncStatus.lastSyncTime) {
                return;
            }
            hilog.info(0x0000, TAG, 'Applying remote data to local storage');
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 恢复用户数据
            const remoteUsersJson = this.dataObject['usersJson'] as string;
            if (remoteUsersJson) {
                const users: Record<string, StoredUserCredential> = JSON.parse(remoteUsersJson);
                await StorageUtil.saveAllUsers(users);
            }
            // 恢复设置
            const remoteSettingsJson = this.dataObject['settingsJson'] as string;
            if (remoteSettingsJson) {
                const settings: PersistedReaderSettings = JSON.parse(remoteSettingsJson);
                await SettingStorage.saveSettings(context, settings);
            }
            // 恢复阅读进度
            const remoteProgressesJson = this.dataObject['progressesJson'] as string;
            if (remoteProgressesJson) {
                const remoteProgresses: BookProgress[] = JSON.parse(remoteProgressesJson);
                await this.mergeReadingProgresses(context, remoteProgresses);
            }
            // 设置当前用户
            const remoteCurrentUser = this.dataObject['currentUser'] as string;
            if (remoteCurrentUser) {
                await StorageUtil.setLoggedIn(remoteCurrentUser);
                AppStorage.setOrCreate('currentUser', remoteCurrentUser);
            }
            this.syncStatus.lastSyncTime = remoteTimestamp;
            // 通知UI更新
            if (this.onDataChanged) {
                this.onDataChanged();
            }
            hilog.info(0x0000, TAG, 'Remote data applied successfully');
        }
        catch (error) {
            const err = error as BusinessError;
            hilog.error(0x0000, TAG, `Apply remote data failed: ${err.message}`);
        }
    }
    /**
     * 合并远程阅读进度到本地
     * 策略：对于相同书籍，取较新的阅读进度
     */
    private async mergeReadingProgresses(context: common.UIAbilityContext, remoteProgresses: BookProgress[]): Promise<void> {
        try {
            const currentUser = await StorageUtil.getCurrentUser();
            const localProgresses = await ProgressStorage.loadAllProgresses(context, currentUser);
            // 创建本地进度映射（按 bookIdentity 索引）
            const localMap = new Map<string, BookProgress>();
            for (const progress of localProgresses) {
                if (progress.bookIdentity) {
                    localMap.set(progress.bookIdentity, progress);
                }
            }
            // 合并远程进度
            for (const remoteProgress of remoteProgresses) {
                if (!remoteProgress.bookIdentity)
                    continue;
                const localProgress = localMap.get(remoteProgress.bookIdentity);
                if (!localProgress) {
                    // 本地没有此书籍进度，直接添加（保留本地 filePath 为空，后续用户打开书籍时会更新）
                    localMap.set(remoteProgress.bookIdentity, remoteProgress);
                    hilog.info(0x0000, TAG, `Added new progress: ${remoteProgress.bookName}`);
                }
                else {
                    // 本地有此书籍，比较时间戳，取较新的
                    if (remoteProgress.lastReadTime > localProgress.lastReadTime) {
                        // 远程更新，合并（保留本地 filePath）
                        const merged: BookProgress = {
                            bookIdentity: remoteProgress.bookIdentity,
                            filePath: localProgress.filePath || remoteProgress.filePath,
                            bookName: remoteProgress.bookName,
                            author: remoteProgress.author,
                            resourceIndex: remoteProgress.resourceIndex,
                            startDomPos: remoteProgress.startDomPos,
                            chapterName: remoteProgress.chapterName,
                            lastReadTime: remoteProgress.lastReadTime
                        };
                        localMap.set(remoteProgress.bookIdentity, merged);
                        hilog.info(0x0000, TAG, `Updated progress: ${remoteProgress.bookName}`);
                    }
                    else {
                        hilog.info(0x0000, TAG, `Kept local progress: ${localProgress.bookName}`);
                    }
                }
            }
            // 保存合并后的进度
            const mergedProgresses = Array.from(localMap.values());
            await ProgressStorage.saveAllProgresses(context, mergedProgresses, currentUser);
            hilog.info(0x0000, TAG, `Merged ${mergedProgresses.length} reading progresses`);
        }
        catch (error) {
            const err = error as BusinessError;
            hilog.error(0x0000, TAG, `Merge reading progresses failed: ${err.message}`);
        }
    }
    /**
     * 同步本地数据到分布式对象
     */
    async syncData(): Promise<boolean> {
        if (!this.dataObject) {
            hilog.warn(0x0000, TAG, 'Data object not initialized');
            return false;
        }
        this.syncStatus.isSyncing = true;
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 获取本地数据
            const users = await StorageUtil.getAllUsers();
            const currentUser = await StorageUtil.getCurrentUser();
            const settings = await SettingStorage.loadSettings(context);
            const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
            const now = Date.now();
            // 更新分布式对象属性
            this.dataObject['version'] = '1.0';
            this.dataObject['timestamp'] = now;
            this.dataObject['usersJson'] = JSON.stringify(users);
            this.dataObject['currentUser'] = currentUser;
            this.dataObject['settingsJson'] = settings ? JSON.stringify(settings) : '';
            this.dataObject['progressesJson'] = JSON.stringify(progresses);
            // 保存到本地持久化（"local" 表示本地设备）
            await this.dataObject.save('local');
            this.syncStatus.lastSyncTime = now;
            this.syncStatus.isSyncing = false;
            this.syncStatus.syncError = undefined;
            hilog.info(0x0000, TAG, `Data synced successfully, including ${progresses.length} reading progresses`);
            return true;
        }
        catch (error) {
            const err = error as BusinessError;
            this.syncStatus.isSyncing = false;
            this.syncStatus.syncError = err.message;
            hilog.error(0x0000, TAG, `Sync failed: ${err.message}`);
            return false;
        }
    }
    /**
     * 仅同步阅读进度（轻量级同步，用于阅读过程中实时同步）
     */
    async syncProgressOnly(): Promise<boolean> {
        if (!this.dataObject) {
            hilog.warn(0x0000, TAG, 'Data object not initialized');
            return false;
        }
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            const currentUser = await StorageUtil.getCurrentUser();
            const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
            // 标记本次同步时间
            const now = Date.now();
            // 仅更新进度相关属性
            this.dataObject['timestamp'] = now;
            this.dataObject['progressesJson'] = JSON.stringify(progresses);
            await this.dataObject.save('local');
            this.syncStatus.lastSyncTime = now;
            hilog.info(0x0000, TAG, `Progress synced: ${progresses.length} records`);
            return true;
        }
        catch (error) {
            const err = error as BusinessError;
            hilog.error(0x0000, TAG, `Progress sync failed: ${err.message}`);
            return false;
        }
    }
    /**
     * 从分布式对象恢复数据
     */
    async restoreData(): Promise<boolean> {
        if (!this.dataObject)
            return false;
        try {
            // 检查是否有远程数据
            const remoteTimestamp = this.dataObject['timestamp'] as number;
            if (!remoteTimestamp || remoteTimestamp === 0) {
                hilog.info(0x0000, TAG, 'No remote data to restore');
                return false;
            }
            await this.applyRemoteData();
            return true;
        }
        catch (error) {
            const err = error as BusinessError;
            hilog.error(0x0000, TAG, `Restore failed: ${err.message}`);
            return false;
        }
    }
    /**
     * 获取同步状态
     */
    getSyncStatus(): SyncStatus {
        return {
            isSyncing: this.syncStatus.isSyncing,
            lastSyncTime: this.syncStatus.lastSyncTime,
            syncError: this.syncStatus.syncError
        };
    }
    /**
     * 设置数据变化回调
     */
    setDataChangedCallback(callback: () => void): void {
        this.onDataChanged = callback;
    }
    /**
     * 退出分布式组网
     */
    async disconnect(): Promise<void> {
        if (this.dataObject) {
            try {
                await this.dataObject.setSessionId('');
                hilog.info(0x0000, TAG, 'Disconnected from distributed network');
            }
            catch (error) {
                const err = error as BusinessError;
                hilog.error(0x0000, TAG, `Disconnect failed: ${err.message}`);
            }
        }
    }
}
