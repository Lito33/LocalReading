import hilog from "@ohos:hilog";
import type common from "@ohos:app.ability.common";
import type { BusinessError } from "@ohos:base";
import type preferences from "@ohos:data.preferences";
import { StorageUtil } from "@bundle:com.example.readerkitdemo/entry/ets/utils/StorageUtil";
import { SettingStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import { GlobalContext } from "@bundle:com.example.readerkitdemo/entry/ets/common/GlobalContext";
import type { SyncData } from './SyncManager';
import { DistributedDataManager } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedDataManager";
import type { DeviceInfo, SyncStatus } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedDataManager";
import type { StoredUserCredential } from './PasswordUtil';
import { BookStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookStorage";
class ParsedUserData {
    username: string = '';
    email: string = '';
    avatar: string = '';
    createdAt: number = 0;
    constructor(username?: string, email?: string, avatar?: string, createdAt?: number) {
        if (username)
            this.username = username;
        if (email)
            this.email = email;
        if (avatar)
            this.avatar = avatar;
        if (createdAt)
            this.createdAt = createdAt;
    }
}
const TAG = 'CloudSyncService';
export class CloudSyncService {
    private static isCloudAvailable: boolean = false;
    private static isDistributedEnabled: boolean = false;
    private static distributedManager: DistributedDataManager = DistributedDataManager.getInstance();
    /**
     * 初始化云服务和分布式数据管理
     */
    static async initialize(): Promise<boolean> {
        try {
            // 检查华为云服务是否可用
            CloudSyncService.isCloudAvailable = await CloudSyncService.checkCloudServiceAvailability();
            // 初始化分布式数据管理
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            CloudSyncService.isDistributedEnabled = await CloudSyncService.distributedManager.initialize(context);
            hilog.info(0x0000, TAG, `Cloud service available: ${CloudSyncService.isCloudAvailable}`);
            hilog.info(0x0000, TAG, `Distributed data enabled: ${CloudSyncService.isDistributedEnabled}`);
            return CloudSyncService.isCloudAvailable || CloudSyncService.isDistributedEnabled;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Initialize cloud service failed: ${(error as BusinessError).message}`);
            CloudSyncService.isCloudAvailable = false;
            CloudSyncService.isDistributedEnabled = false;
            return false;
        }
    }
    /**
     * 上传数据到云端和同步到设备
     */
    static async uploadToCloud(): Promise<boolean> {
        if (!CloudSyncService.isCloudAvailable && !CloudSyncService.isDistributedEnabled) {
            hilog.warn(0x0000, TAG, 'Neither cloud service nor distributed data is available');
            return false;
        }
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            // 获取用户数据和设置
            const users = await StorageUtil.getAllUsers();
            const currentUser = await StorageUtil.getCurrentUser();
            const settings = await SettingStorage.loadSettings(context);
            // 获取书名列表（仅用于提示）
            const bookNames: string[] = [];
            const userAccounts = Object.keys(users);
            for (const account of userAccounts) {
                const userBooks = await BookStorage.loadBooks(context, account);
                for (const book of userBooks) {
                    bookNames.push(book.getBookName());
                }
            }
            // 构建同步数据
            const syncData: SyncData = {
                version: '2.0',
                timestamp: Date.now(),
                users: users,
                currentUser: currentUser,
                settings: settings,
                bookNames: bookNames
            };
            let success = false;
            // 优先使用分布式数据同步
            if (CloudSyncService.isDistributedEnabled) {
                success = await CloudSyncService.syncToDistributedDevices(syncData);
                hilog.info(0x0000, TAG, 'Distributed sync result: ' + success);
            }
            // 如果分布式同步失败或不可用，使用云端备份
            if (!success && CloudSyncService.isCloudAvailable) {
                success = await CloudSyncService.uploadDataToCloud(syncData);
                hilog.info(0x0000, TAG, 'Cloud upload result: ' + success);
            }
            if (success) {
                hilog.info(0x0000, TAG, 'Data sync/upload success');
                // 保存上传时间戳
                await CloudSyncService.saveLastSyncTime();
            }
            return success;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Upload/sync failed: ${(error as BusinessError).message}`);
            return false;
        }
    }
    /**
     * 从云端下载数据或从设备同步
     */
    static async downloadFromCloud(): Promise<boolean> {
        if (!CloudSyncService.isCloudAvailable && !CloudSyncService.isDistributedEnabled) {
            hilog.warn(0x0000, TAG, 'Neither cloud service nor distributed data is available');
            return false;
        }
        try {
            const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
            let syncData: SyncData | null = null;
            // 优先从分布式设备同步
            if (CloudSyncService.isDistributedEnabled) {
                syncData = await CloudSyncService.syncFromDistributedDevices();
                hilog.info(0x0000, TAG, 'Distributed sync data: ' + (syncData ? 'found' : 'not found'));
            }
            // 如果分布式同步没有数据，从云端下载
            if (!syncData && CloudSyncService.isCloudAvailable) {
                syncData = await CloudSyncService.downloadDataFromCloud();
                hilog.info(0x0000, TAG, 'Cloud download data: ' + (syncData ? 'found' : 'not found'));
            }
            if (!syncData) {
                hilog.warn(0x0000, TAG, 'No data found from cloud or distributed devices');
                return false;
            }
            // 恢复数据
            await StorageUtil.saveAllUsers(syncData.users);
            if (syncData.settings) {
                await SettingStorage.saveSettings(context, syncData.settings);
            }
            // 设置当前用户
            if (syncData.currentUser) {
                await StorageUtil.setLoggedIn(syncData.currentUser);
            }
            hilog.info(0x0000, TAG, 'Download/sync from cloud/distributed success');
            return true;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Download/sync failed: ${(error as BusinessError).message}`);
            return false;
        }
    }
    /**
     * 检查云端或设备数据是否有更新
     */
    static async checkCloudUpdate(): Promise<boolean> {
        if (!CloudSyncService.isCloudAvailable && !CloudSyncService.isDistributedEnabled) {
            return false;
        }
        try {
            const lastSyncTime = await CloudSyncService.getLastSyncTime();
            // 检查云端更新
            if (CloudSyncService.isCloudAvailable) {
                const cloudUpdateTime = await CloudSyncService.getCloudUpdateTime();
                if (cloudUpdateTime > lastSyncTime) {
                    return true;
                }
            }
            // 检查分布式设备更新
            if (CloudSyncService.isDistributedEnabled) {
                const distributedUpdateTime = await CloudSyncService.getDistributedUpdateTime();
                if (distributedUpdateTime > lastSyncTime) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Check update failed: ${(error as BusinessError).message}`);
            return false;
        }
    }
    /**
     * 获取同步状态
     */
    static getSyncStatus(): SyncStatus {
        return CloudSyncService.distributedManager.getSyncStatus();
    }
    /**
     * 获取设备列表
     */
    static getDeviceList(): DeviceInfo[] {
        return CloudSyncService.distributedManager.getDeviceList();
    }
    /**
     * 手动同步到所有设备
     */
    static async syncToAllDevices(): Promise<boolean> {
        if (!CloudSyncService.isDistributedEnabled) {
            return false;
        }
        return await CloudSyncService.distributedManager.syncToAllDevices();
    }
    /**
     * 保存偏好设置
     */
    static async savePreference(key: string, value: preferences.ValueType): Promise<boolean> {
        if (!CloudSyncService.isDistributedEnabled) {
            return false;
        }
        return await CloudSyncService.distributedManager.savePreference(key, value);
    }
    /**
     * 获取偏好设置
     */
    static async getPreference(key: string, defaultValue: preferences.ValueType): Promise<preferences.ValueType> {
        if (!CloudSyncService.isDistributedEnabled) {
            return defaultValue;
        }
        return await CloudSyncService.distributedManager.getPreference(key, defaultValue);
    }
    // ========== 私有方法 ==========
    /**
     * 同步数据到分布式设备
     */
    private static async syncToDistributedDevices(data: SyncData): Promise<boolean> {
        try {
            // 将数据保存到分布式数据库
            // data.users是Record<string, StoredUserCredential>
            const userKeys = Object.keys(data.users);
            for (let i = 0; i < userKeys.length; i++) {
                const key = userKeys[i];
                const credential = data.users[key];
                // 将凭证对象转为JSON字符串再解析
                const credentialJson = JSON.stringify(credential);
                const parsedData: Record<string, string | number> = JSON.parse(credentialJson);
                const user = new ParsedUserData(parsedData.username as string, parsedData.email as string, parsedData.avatar as string, parsedData.createdAt as number);
                const userData = CloudSyncService.buildUserDataRecord(user);
                await CloudSyncService.distributedManager.insertUser(userData);
            }
            // 同步到所有设备
            return await CloudSyncService.distributedManager.syncToAllDevices();
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Distributed sync failed: ${(error as BusinessError).message}`);
            return false;
        }
    }
    /**
     * 从分布式设备同步数据
     */
    private static async syncFromDistributedDevices(): Promise<SyncData | null> {
        try {
            const users = await CloudSyncService.distributedManager.queryUsers();
            if (users.length === 0) {
                return null;
            }
            // 将用户数组转换为Record格式
            const usersRecord: Record<string, StoredUserCredential> = {};
            users.forEach((user, index) => {
                usersRecord[`user_${index}`] = { hash: '', salt: '' };
            });
            const currentUserObj = new ParsedUserData(users[0] ? users[0].username : '', users[0] ? users[0].email : '', users[0] ? users[0].avatar : '', users[0] ? users[0].createdAt : 0);
            const syncData: SyncData = {
                version: '2.0',
                timestamp: Date.now(),
                users: usersRecord,
                currentUser: users[0] ? JSON.stringify(currentUserObj) : '',
                settings: null,
                bookNames: []
            };
            return syncData;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Distributed sync from devices failed: ${(error as BusinessError).message}`);
            return null;
        }
    }
    private static async checkCloudServiceAvailability(): Promise<boolean> {
        // 模拟检查云服务可用性
        // 实际实现需要调用华为云服务API
        return new Promise<boolean>((resolve: (value: boolean) => void) => {
            setTimeout(() => {
                // 模拟云服务可用性检查
                resolve(true); // 或根据实际情况返回
            }, 100);
        });
    }
    private static async uploadDataToCloud(data: SyncData): Promise<boolean> {
        // 模拟上传到云端
        // 实际实现需要调用华为云存储API
        return new Promise<boolean>((resolve: (value: boolean) => void) => {
            setTimeout(() => {
                // 模拟上传成功
                resolve(true);
            }, 500);
        });
    }
    private static async downloadDataFromCloud(): Promise<SyncData | null> {
        // 模拟从云端下载
        // 实际实现需要调用华为云存储API
        return new Promise<SyncData | null>((resolve: (value: SyncData | null) => void) => {
            setTimeout(() => {
                // 模拟下载数据
                resolve(null); // 返回null表示没有数据
            }, 500);
        });
    }
    private static async getCloudUpdateTime(): Promise<number> {
        // 模拟获取云端更新时间
        return new Promise<number>((resolve: (value: number) => void) => {
            setTimeout(() => {
                resolve(Date.now() - 3600000); // 1小时前
            }, 100);
        });
    }
    private static async getDistributedUpdateTime(): Promise<number> {
        // 获取分布式设备的最新更新时间
        try {
            const users = await CloudSyncService.distributedManager.queryUsers();
            if (users.length > 0) {
                return Math.max(...users.map(user => user.createdAt));
            }
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
    private static async saveLastSyncTime(): Promise<void> {
        // 保存最后同步时间到分布式Preferences
        if (CloudSyncService.isDistributedEnabled) {
            await CloudSyncService.distributedManager.savePreference('last_sync_time', Date.now());
        }
    }
    private static async getLastSyncTime(): Promise<number> {
        // 获取最后同步时间
        if (CloudSyncService.isDistributedEnabled) {
            return await CloudSyncService.distributedManager.getPreference('last_sync_time', 0) as number;
        }
        return 0;
    }
    private static buildUserDataRecord(user: ParsedUserData): Record<string, string | number | boolean> {
        const userData: Record<string, string | number | boolean> = {};
        userData.username = user.username;
        userData.email = user.email || '';
        userData.avatar = user.avatar || '';
        userData.created_at = user.createdAt || Date.now();
        userData.updated_at = Date.now();
        userData.device_id = CloudSyncService.getDeviceId();
        return userData;
    }
    private static getDeviceId(): string {
        // 获取当前设备ID（简化实现）
        return 'local_device_' + Date.now();
    }
}
export type { DeviceInfo, SyncStatus };
