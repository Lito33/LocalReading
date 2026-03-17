import { connection } from '@kit.NetworkKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { BusinessError } from '@kit.BasicServicesKit';

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
    networkType: 0, // 使用0表示未知网络类型
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
      
    } catch (error) {
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
      const netHandle = connection.getDefaultNetSync();
      
      if (!netHandle) {
        this.setNetworkInfo(false, 0);
        return;
      }

      // 检查网络是否可用
      const hasDefaultNet = connection.hasDefaultNetSync();
      
      if (hasDefaultNet) {
        // 获取网络能力信息
        const netCapabilities = connection.getNetCapabilitiesSync(netHandle);
        
        // 确定网络类型
        let networkType = 0;
        if (netCapabilities.bearerTypes.includes(connection.NetBearType.BEARER_WIFI)) {
          networkType = connection.NetBearType.BEARER_WIFI;
        } else if (netCapabilities.bearerTypes.includes(connection.NetBearType.BEARER_CELLULAR)) {
          networkType = connection.NetBearType.BEARER_CELLULAR;
        } else if (netCapabilities.bearerTypes.includes(connection.NetBearType.BEARER_ETHERNET)) {
          networkType = connection.NetBearType.BEARER_ETHERNET;
        } else if (netCapabilities.bearerTypes.includes(connection.NetBearType.BEARER_BLUETOOTH)) {
          networkType = connection.NetBearType.BEARER_BLUETOOTH;
        }
        
        this.setNetworkInfo(true, networkType);
      } else {
        this.setNetworkInfo(false, 0);
      }
      
    } catch (error) {
      hilog.error(0x0000, TAG, `Update network status failed: ${(error as Error).message}`);
      this.setNetworkInfo(false, 0);
    }
  }

  /**
   * 注册网络状态变化监听
   */
  private async registerNetworkListener(): Promise<void> {
    try {
      // 创建网络连接监听器
      this.netConnection = connection.createNetConnection(undefined, 0);
      
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

      // 监听网络连接属性变化事件（使用netCapabilitiesChange事件替代）
      // netConnectionPropertiesChange 不是标准事件，使用 netCapabilitiesChange 监听网络变化

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
      });
      
    } catch (error) {
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
    this.networkInfo.isWifi = networkType === connection.NetBearType.BEARER_WIFI;
    this.networkInfo.isCellular = networkType === connection.NetBearType.BEARER_CELLULAR;
    this.networkInfo.isEthernet = networkType === connection.NetBearType.BEARER_ETHERNET;
    this.networkInfo.isBluetooth = networkType === connection.NetBearType.BEARER_BLUETOOTH;

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
      } catch (error) {
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
    } catch (error) {
      hilog.error(0x0000, TAG, `Cleanup network manager failed: ${(error as Error).message}`);
    }
    
    this.listeners = [];
  }
}