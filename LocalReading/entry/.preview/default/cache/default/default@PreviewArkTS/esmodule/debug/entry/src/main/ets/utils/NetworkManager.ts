import connection from "@ohos:net.connection";
import hilog from "@ohos:hilog";
import type { BusinessError } from "@ohos:base";
const TAG = 'NetworkManager';
export interface NetworkInfo {
    isConnected: boolean;
    networkType: connection.NetBearType;
    isWifi: boolean;
    isCellular: boolean;
    isEthernet: boolean;
    isBluetooth: boolean;
}
export class NetworkManager {
    private static instance: NetworkManager;
    private networkInfo: NetworkInfo = {
        isConnected: false,
        networkType: 0,
        isWifi: false,
        isCellular: false,
        isEthernet: false,
        isBluetooth: false
    };
    private listeners: ((info: NetworkInfo) => void)[] = [];
    private netConnection: connection.NetConnection | null = null;
    public static getInstance(): NetworkManager {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager();
        }
        return NetworkManager.instance;
    }
    /**
     * 初始化网络管理器
     */
    async initialize(): Promise<boolean> {
        try {
            // 获取当前网络状态
            await this.updateNetworkStatus();
            // 注册网络状态变化监听
            await this.registerNetworkListener();
            hilog.info(0x0000, TAG, 'Network manager initialized');
            return true;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Network manager initialization failed: ${(error as Error).message}`);
            return false;
        }
    }
    /**
     * 获取当前网络信息
     */
    getNetworkInfo(): NetworkInfo {
        const infoCopy: NetworkInfo = {
            isConnected: this.networkInfo.isConnected,
            networkType: this.networkInfo.networkType,
            isWifi: this.networkInfo.isWifi,
            isCellular: this.networkInfo.isCellular,
            isEthernet: this.networkInfo.isEthernet,
            isBluetooth: this.networkInfo.isBluetooth
        };
        return infoCopy;
    }
    /**
     * 检查是否适合同步
     */
    isSuitableForSync(wifiOnly: boolean = true): boolean {
        if (!this.networkInfo.isConnected) {
            return false;
        }
        if (wifiOnly) {
            return this.networkInfo.isWifi;
        }
        return this.networkInfo.isWifi || this.networkInfo.isCellular || this.networkInfo.isEthernet;
    }
    /**
     * 添加网络状态变化监听器
     */
    addListener(listener: (info: NetworkInfo) => void): void {
        this.listeners.push(listener);
    }
    /**
     * 移除网络状态变化监听器
     */
    removeListener(listener: (info: NetworkInfo) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
     * 更新网络状态
     */
    private async updateNetworkStatus(): Promise<void> {
        try {
            hilog.info(0x0000, TAG, 'updateNetworkStatus: start');
            // 检查网络是否可用
            const hasDefaultNet = connection.hasDefaultNetSync();
            hilog.info(0x0000, TAG, `hasDefaultNetSync: ${hasDefaultNet}`);
            if (!hasDefaultNet) {
                hilog.info(0x0000, TAG, 'No default network, set disconnected');
                this.setNetworkInfo(false, 0);
                return;
            }
            // 获取默认网络句柄
            const netHandle = connection.getDefaultNetSync();
            hilog.info(0x0000, TAG, `getDefaultNetSync: netId=${netHandle?.netId}`);
            if (!netHandle || netHandle.netId === 0) {
                hilog.info(0x0000, TAG, 'Invalid netHandle, set disconnected');
                this.setNetworkInfo(false, 0);
                return;
            }
            // 获取网络能力信息
            const netCapabilities = connection.getNetCapabilitiesSync(netHandle);
            hilog.info(0x0000, TAG, `getNetCapabilitiesSync: bearerTypes=${JSON.stringify(netCapabilities?.bearerTypes)}`);
            if (!netCapabilities || !netCapabilities.bearerTypes) {
                hilog.info(0x0000, TAG, 'No capabilities, set disconnected');
                this.setNetworkInfo(false, 0);
                return;
            }
            // 确定网络类型（HarmonyOS NetBearType 常量: BEARER_WIFI=1, BEARER_CELLULAR=2, BEARER_ETHERNET=3, BEARER_BLUETOOTH=4）
            let networkType = 0;
            const bearerTypes = netCapabilities.bearerTypes;
            hilog.info(0x0000, TAG, `Checking bearer types: ${JSON.stringify(bearerTypes)}`);
            // 直接使用数值判断，避免枚举值异常问题
            if (bearerTypes.includes(1)) {
                networkType = 1; // WiFi
                hilog.info(0x0000, TAG, 'Detected: WiFi (type=1)');
            }
            else if (bearerTypes.includes(2)) {
                networkType = 2; // Cellular
                hilog.info(0x0000, TAG, 'Detected: Cellular (type=2)');
            }
            else if (bearerTypes.includes(3)) {
                networkType = 3; // Ethernet
                hilog.info(0x0000, TAG, 'Detected: Ethernet (type=3)');
            }
            else if (bearerTypes.includes(4)) {
                networkType = 4; // Bluetooth
                hilog.info(0x0000, TAG, 'Detected: Bluetooth (type=4)');
            }
            else {
                hilog.info(0x0000, TAG, `Unknown bearer type: ${JSON.stringify(bearerTypes)}`);
            }
            hilog.info(0x0000, TAG, `setNetworkInfo: connected=true, networkType=${networkType}`);
            this.setNetworkInfo(true, networkType);
        }
        catch (error) {
            const err = error as Error;
            hilog.error(0x0000, TAG, `Update network status failed: ${err.message}, stack: ${err.stack}`);
            this.setNetworkInfo(false, 0);
        }
    }
    /**
     * 注册网络状态变化监听
     */
    private async registerNetworkListener(): Promise<void> {
        try {
            // 创建网络连接监听器（不传参数，使用默认配置）
            this.netConnection = connection.createNetConnection();
            if (!this.netConnection) {
                hilog.error(0x0000, TAG, 'createNetConnection returned null, skip listener registration');
                return;
            }
            hilog.info(0x0000, TAG, 'NetConnection created successfully');
            // 监听网络可用事件
            this.netConnection.on('netAvailable', (data: connection.NetHandle) => {
                hilog.info(0x0000, TAG, `Network available: ${data.netId}`);
                this.updateNetworkStatus();
            });
            // 监听网络能力变化事件
            this.netConnection.on('netCapabilitiesChange', (data: connection.NetCapabilityInfo) => {
                hilog.info(0x0000, TAG, `Network capabilities changed: ${data.netHandle.netId}`);
                this.updateNetworkStatus();
            });
            // 监听网络丢失事件
            this.netConnection.on('netLost', (data: connection.NetHandle) => {
                hilog.info(0x0000, TAG, `Network lost: ${data.netId}`);
                this.setNetworkInfo(false, 0);
            });
            // 监听网络不可用事件
            this.netConnection.on('netUnavailable', () => {
                hilog.info(0x0000, TAG, 'Network unavailable');
                this.setNetworkInfo(false, 0);
            });
            // 注册监听器
            this.netConnection.register((error: BusinessError) => {
                if (error) {
                    hilog.error(0x0000, TAG, `Failed to register network listener: ${error.message}`);
                }
                else {
                    hilog.info(0x0000, TAG, 'Network listener registered successfully');
                }
            });
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Register network listener failed: ${(error as Error).message}`);
        }
    }
    /**
     * 设置网络信息并通知监听器
     */
    private setNetworkInfo(isConnected: boolean, networkType: connection.NetBearType): void {
        const oldInfo = this.getNetworkInfo();
        this.networkInfo.isConnected = isConnected;
        this.networkInfo.networkType = networkType;
        // 使用数值常量判断网络类型（HarmonyOS NetBearType: BEARER_WIFI=1, BEARER_CELLULAR=2, BEARER_ETHERNET=3, BEARER_BLUETOOTH=4）
        this.networkInfo.isWifi = networkType === 1;
        this.networkInfo.isCellular = networkType === 2;
        this.networkInfo.isEthernet = networkType === 3;
        this.networkInfo.isBluetooth = networkType === 4;
        hilog.info(0x0000, TAG, `setNetworkInfo: isConnected=${isConnected}, networkType=${networkType}, isWifi=${this.networkInfo.isWifi}, isCellular=${this.networkInfo.isCellular}`);
        // 如果网络状态发生变化，通知所有监听器
        if (this.hasNetworkChanged(oldInfo, this.networkInfo)) {
            this.notifyListeners();
        }
    }
    /**
     * 检查网络状态是否发生变化
     */
    private hasNetworkChanged(oldInfo: NetworkInfo, newInfo: NetworkInfo): boolean {
        return oldInfo.isConnected !== newInfo.isConnected ||
            oldInfo.networkType !== newInfo.networkType;
    }
    /**
     * 通知所有监听器
     */
    private notifyListeners(): void {
        const info = this.getNetworkInfo();
        this.listeners.forEach(listener => {
            try {
                listener(info);
            }
            catch (error) {
                hilog.error(0x0000, TAG, `Network listener error: ${(error as Error).message}`);
            }
        });
    }
    /**
     * 清理资源
     */
    cleanup(): void {
        // 取消所有网络监听
        try {
            if (this.netConnection) {
                this.netConnection.unregister((error: BusinessError) => {
                    if (error) {
                        hilog.error(0x0000, TAG, `Failed to unregister network listener: ${error.message}`);
                    }
                });
                this.netConnection = null;
            }
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Cleanup network manager failed: ${(error as Error).message}`);
        }
        this.listeners = [];
    }
}
