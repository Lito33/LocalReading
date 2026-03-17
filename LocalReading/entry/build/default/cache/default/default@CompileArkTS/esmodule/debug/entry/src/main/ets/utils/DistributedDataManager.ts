import relationalStore from "@ohos:data.relationalStore";
import preferences from "@ohos:data.preferences";
import type { BusinessError } from "@ohos:base";
import hilog from "@ohos:hilog";
import type common from "@ohos:app.ability.common";
const TAG = 'DistributedDataManager';
const STORE_NAME = 'local_reading_db';
const PREFERENCES_STORE_NAME = 'local_reading_prefs';
export interface DeviceInfo {
    deviceId: string;
    deviceName: string;
    deviceType: number;
    online: boolean;
}
export interface UserData {
    id: number;
    username: string;
    email: string;
    avatar: string;
    createdAt: number;
}
export interface SyncStatus {
    isSyncing: boolean;
    lastSyncTime: number;
    syncError?: string;
    connectedDevices: number;
}
export class DistributedDataManager {
    private static instance: DistributedDataManager;
    private rdbStore: relationalStore.RdbStore | null = null;
    private prefs: preferences.Preferences | null = null;
    private context: common.UIAbilityContext | null = null;
    private syncStatus: SyncStatus = {
        isSyncing: false,
        lastSyncTime: 0,
        connectedDevices: 0
    };
    private deviceList: DeviceInfo[] = [];
    public static getInstance(): DistributedDataManager {
        if (!DistributedDataManager.instance) {
            DistributedDataManager.instance = new DistributedDataManager();
        }
        return DistributedDataManager.instance;
    }
    /**
     * 初始化分布式数据管理器
     */
    async initialize(context: common.UIAbilityContext): Promise<boolean> {
        this.context = context;
        try {
            // 初始化分布式数据库
            await this.initRdbStore();
            // 初始化分布式Preferences
            await this.initDistributedPreferences();
            // 启动设备发现
            await this.startDeviceDiscovery();
            // 监听数据变化
            this.setupDataChangeListener();
            hilog.info(0x0000, TAG, 'Distributed data manager initialized successfully');
            return true;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Initialize failed: ${error.message}`);
            return false;
        }
    }
    /**
     * 初始化分布式数据库
     */
    private async initRdbStore(): Promise<void> {
        const STORE_CONFIG: relationalStore.StoreConfig = {
            name: STORE_NAME,
            securityLevel: relationalStore.SecurityLevel.S1
        };
        this.rdbStore = await relationalStore.getRdbStore(this.context!, STORE_CONFIG);
        // 创建数据表
        await this.createTables();
        // 设置分布式表
        await this.setDistributedTables();
    }
    /**
     * 创建数据表
     */
    private async createTables(): Promise<void> {
        if (!this.rdbStore)
            return;
        // 用户表
        await this.rdbStore.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        device_id TEXT
      )
    `);
        // 阅读进度表
        await this.rdbStore.executeSql(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        book_id TEXT NOT NULL,
        book_title TEXT,
        current_page INTEGER,
        total_pages INTEGER,
        progress REAL,
        last_read_time INTEGER,
        device_id TEXT,
        updated_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
        // 阅读设置表
        await this.rdbStore.executeSql(`
      CREATE TABLE IF NOT EXISTS reader_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        font_size INTEGER,
        theme TEXT,
        brightness REAL,
        line_spacing REAL,
        device_id TEXT,
        updated_at INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    }
    /**
     * 设置分布式表
     */
    private async setDistributedTables(): Promise<void> {
        if (!this.rdbStore)
            return;
        await this.rdbStore.setDistributedTables(['users', 'reading_progress', 'reader_settings']);
        hilog.info(0x0000, TAG, 'Distributed tables set successfully');
    }
    /**
     * 初始化分布式Preferences
     */
    private async initDistributedPreferences(): Promise<void> {
        try {
            this.prefs = await preferences.getPreferences(this.context!, PREFERENCES_STORE_NAME);
            hilog.info(0x0000, TAG, 'Distributed preferences initialized');
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Init distributed preferences failed: ${(error as BusinessError).message}`);
        }
    }
    /**
     * 启动设备发现
     */
    private async startDeviceDiscovery(): Promise<void> {
        try {
            // 获取可信设备列表 - 简化实现，实际使用时需要根据具体API调整
            this.deviceList = [];
            this.syncStatus.connectedDevices = 0;
            hilog.info(0x0000, TAG, 'Device discovery initialized');
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Device discovery failed: ${error.message}`);
        }
    }
    /**
     * 设置数据变化监听器
     */
    private setupDataChangeListener(): void {
        if (!this.rdbStore)
            return;
        this.rdbStore.on('dataChange', relationalStore.SubscribeType.SUBSCRIBE_TYPE_REMOTE, (storeObserver) => {
            hilog.info(0x0000, TAG, 'Data changed on remote device');
            // 处理远程数据变化
            this.handleRemoteDataChange();
        });
    }
    /**
     * 处理远程数据变化
     */
    private async handleRemoteDataChange(): Promise<void> {
        // 这里可以添加数据变化处理逻辑
        // 例如：更新本地缓存、发送通知等
        hilog.info(0x0000, TAG, 'Handling remote data change');
    }
    /**
     * 同步数据到所有设备
     */
    async syncToAllDevices(): Promise<boolean> {
        if (!this.rdbStore)
            return false;
        this.syncStatus.isSyncing = true;
        try {
            const predicates = new relationalStore.RdbPredicates('users');
            // 推送数据到所有设备
            await this.rdbStore.sync(relationalStore.SyncMode.SYNC_MODE_PUSH, predicates);
            this.syncStatus.lastSyncTime = Date.now();
            this.syncStatus.isSyncing = false;
            hilog.info(0x0000, TAG, 'Data synced to all devices successfully');
            return true;
        }
        catch (error) {
            this.syncStatus.isSyncing = false;
            this.syncStatus.syncError = error.message;
            hilog.error(0x0000, TAG, `Sync failed: ${error.message}`);
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
            syncError: this.syncStatus.syncError,
            connectedDevices: this.syncStatus.connectedDevices
        };
    }
    /**
     * 获取设备列表
     */
    getDeviceList(): DeviceInfo[] {
        return [...this.deviceList];
    }
    /**
     * 保存用户偏好设置（分布式）
     */
    async savePreference(key: string, value: preferences.ValueType): Promise<boolean> {
        if (!this.prefs)
            return false;
        try {
            await this.prefs.put(key, value);
            await this.prefs.flush();
            return true;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Save preference failed: ${(error as BusinessError).message}`);
            return false;
        }
    }
    /**
     * 获取用户偏好设置
     */
    async getPreference(key: string, defaultValue: preferences.ValueType): Promise<preferences.ValueType> {
        if (!this.prefs)
            return defaultValue;
        try {
            const value = await this.prefs.get(key, defaultValue);
            return value;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Get preference failed: ${(error as BusinessError).message}`);
            return defaultValue;
        }
    }
    /**
     * 插入用户数据
     */
    async insertUser(user: Record<string, string | number | boolean>): Promise<boolean> {
        if (!this.rdbStore)
            return false;
        try {
            await this.rdbStore.insert('users', user);
            return true;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Insert user failed: ${(error as BusinessError).message}`);
            return false;
        }
    }
    /**
     * 查询用户数据
     */
    async queryUsers(): Promise<UserData[]> {
        if (!this.rdbStore)
            return [];
        try {
            const predicates = new relationalStore.RdbPredicates('users');
            const resultSet = await this.rdbStore.query(predicates, ['id', 'username', 'email', 'avatar', 'created_at']);
            const users: UserData[] = [];
            while (resultSet.goToNextRow()) {
                users.push({
                    id: resultSet.getLong(resultSet.getColumnIndex('id')),
                    username: resultSet.getString(resultSet.getColumnIndex('username')),
                    email: resultSet.getString(resultSet.getColumnIndex('email')),
                    avatar: resultSet.getString(resultSet.getColumnIndex('avatar')),
                    createdAt: resultSet.getLong(resultSet.getColumnIndex('created_at'))
                });
            }
            resultSet.close();
            return users;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Query users failed: ${(error as BusinessError).message}`);
            return [];
        }
    }
    /**
     * 清理资源
     */
    cleanup(): void {
        if (this.rdbStore) {
            this.rdbStore.close();
        }
    }
}
