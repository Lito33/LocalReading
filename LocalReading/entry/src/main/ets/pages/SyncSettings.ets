import { DistributedSyncManager, SyncStatus } from '../utils/DistributedSyncManager'
import { SyncManager, SyncData, ImportResult } from '../utils/SyncManager'
import { NetworkManager, NetworkInfo } from '../utils/NetworkManager'
import { GlobalContext } from '../common/GlobalContext'
import { common, abilityAccessCtrl, Permissions } from '@kit.AbilityKit'
import { hilog } from '@kit.PerformanceAnalysisKit'
import { promptAction } from '@kit.ArkUI'
import preferences from '@ohos.data.preferences'

const TAG: string = 'SyncSettings';

@Entry
@Component
struct SyncSettings {
  @State syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: 0
  }
  @State lastSyncTime: string = '从未同步'
  @State syncError: string = ''
  @State autoSyncEnabled: boolean = false
  @State wifiOnlySync: boolean = true
  @State syncProgress: number = 0
  @State showImportDialog: boolean = false    // 是否显示导入对话框


  @StorageLink('eyeMode') eyeMode: boolean = false;
  
  private context: common.UIAbilityContext = GlobalContext.getInstance().getContext() as common.UIAbilityContext
  private syncManager: DistributedSyncManager = DistributedSyncManager.getInstance()
  private networkManager: NetworkManager = NetworkManager.getInstance()
  private statusMonitorTimer: number = -1     // 状态监控定时器ID
  private autoSyncTimer: number = -1          // 自动同步定时器ID
  private readonly AUTO_SYNC_INTERVAL: number = 5 * 60 * 1000  // 自动同步间隔：5分钟
  
  async aboutToAppear() {
    // 初始化网络管理器
    await this.networkManager.initialize()
    this.loadSyncStatus()
    this.startSyncStatusMonitoring()
  }
  
  aboutToDisappear() {
    this.stopSyncStatusMonitoring()
    this.stopAutoSync()
  }
  
  build() {
    Column() {
      // 标题
      Text('数据同步设置')
        .fontColor(Color.Black)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin({ top: 50, bottom: 10 })
      
      Scroll() {
        Column({ space: 20 }) {
          // 同步状态卡片
          this.buildStatusCard()
          
          // 设备列表
          this.buildDeviceInfo()
          
          // 同步设置
          this.buildSyncSettings()
          
          // 操作按钮
          this.buildActionButtons()
          
          // 手动导入导出
          this.buildManualOperations()
        }
        .width('100%')
        .padding({ left: 20, right: 20, bottom: 20 })
      }
      .width('100%')
      .layoutWeight(1)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))
  }
  
  @Builder
  buildStatusCard() {
    Column() {
      Row() {
        // 状态指示器
        Circle({ width: 12, height: 12 })
          .fill(this.syncStatus.lastSyncTime > 0 ? '#52C41A' : '#FF4D4F')
          .margin({ right: 8 })
        
        Text('设备同步')
          .fontSize(16)
          .fontColor('#333')
        
        Blank()
        
        Text(this.syncStatus.isSyncing ? '同步中...' : '就绪')
          .fontSize(14)
          .fontColor(this.syncStatus.isSyncing ? '#1890FF' : '#52C41A')
      }
      .width('100%')
      .margin({ bottom: 12 })
      
      Row() {
        Text('最后同步时间：')
          .fontSize(14)
          .fontColor('#666')
        
        Text(this.lastSyncTime)
          .fontSize(14)
          .fontColor('#333')
      }
      .width('100%')
      .margin({ bottom: 8 })
      
      // 同步进度条
      if (this.syncStatus.isSyncing) {
        Progress({ value: this.syncProgress, total: 100, type: ProgressType.Linear })
          .width('100%')
          .height(4)
          .color('#1890FF')
          .backgroundColor('#E8E8E8')
          .margin({ top: 8 })
      }
      
      // 错误信息
      if (this.syncStatus.syncError) {
        Text(this.syncStatus.syncError)
          .fontSize(12)
          .fontColor('#FF4D4F')
          .margin({ top: 8 })
          .width('100%')
          .textAlign(TextAlign.Center)
      }
      
    }
    .width('100%')
    .padding(16)
    .backgroundColor(Color.White)
    .borderRadius(8)
    .shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 })
  }
  
  @Builder
  buildDeviceInfo() {
    Column() {
      Row() {
        Text('跨设备同步')
          .fontColor(Color.Black)
          .fontSize(18)
          .fontWeight(FontWeight.Medium)
        
        Blank()
        
        Text('自动同步')
          .fontSize(14)
          .fontColor('#666')
      }
      .width('100%')
      .margin({ bottom: 12 })
      
      Column({ space: 12 }) {
        Row() {
          Text('同步用户数据')
            .fontSize(16)
            .fontColor('#333')
          
          Blank()
          
          Text('账号、设置')
            .fontSize(12)
            .fontColor('#999')
        }
        .width('100%')

        
        Row() {
          Text('同步设置')
            .fontSize(16)
            .fontColor('#333')
          
          Blank()
          
          Text('字体、主题、亮度')
            .fontSize(12)
            .fontColor('#999')
        }
        .width('100%')
      }
      .width('100%')
      .padding(16)
      .backgroundColor('#F8F9FA')
      .borderRadius(8)
    }
    .width('100%')
    .padding(16)
    .backgroundColor(Color.White)
    .borderRadius(8)
    .shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 })
  }
  
  @Builder
  buildSyncSettings() {
    Column() {
      Text('同步设置')
        .fontColor(Color.Black)
        .fontSize(18)
        .fontWeight(FontWeight.Medium)
        .margin({ bottom: 16 })
      
      // 自动同步开关
      Row() {
        Text('自动同步')
          .fontSize(16)
          .fontColor('#333')
        
        Blank()
        
        Toggle({ type: ToggleType.Switch, isOn: this.autoSyncEnabled })
          .onChange((value: boolean) => {
            this.autoSyncEnabled = value
            this.saveSyncSettings()
            // 立即启动或停止自动同步
            if (value) {
              this.startAutoSync()
            } else {
              this.stopAutoSync()
            }
          })
      }
      .width('100%')
      .margin({ bottom: 12 })
      
      // WiFi同步开关
      Row() {
        Text('仅WiFi同步')
          .fontSize(16)
          .fontColor('#333')
        
        Blank()
        
        Toggle({ type: ToggleType.Switch, isOn: this.wifiOnlySync })
          .onChange((value: boolean) => {
            this.wifiOnlySync = value
            this.saveSyncSettings()
          })
      }
      .width('100%')
      
    }
    .width('100%')
    .padding(16)
    .backgroundColor(Color.White)
    .borderRadius(8)
    .shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 })
  }
  
  @Builder
  buildActionButtons() {
    Row() {
      // 立即同步按钮
      Button('立即同步', { type: ButtonType.Normal })
        .width('45%')
        .height(44)
        .backgroundColor('#1890FF')
        .fontColor(Color.White)
        .fontSize(16)
        .borderRadius(6)
        .enabled(!this.syncStatus.isSyncing)
        .onClick(() => {
          this.startSync()
        })
      
      Blank()
      
      // 恢复数据按钮
      Button('恢复数据', { type: ButtonType.Normal })
        .width('45%')
        .height(44)
        .backgroundColor('#FAAD14')
        .fontColor(Color.White)
        .fontSize(16)
        .borderRadius(6)
        .enabled(!this.syncStatus.isSyncing)
        .onClick(() => {
          this.restoreData()
        })
      
    }
    .width('100%')
    .padding({ left: 16, right: 16 })
  }
  
  @Builder
  buildManualOperations() {
    Column() {
      Text('手动操作')
        .fontColor(Color.Black)
        .fontSize(18)
        .fontWeight(FontWeight.Medium)
        .margin({ bottom: 16 })
      
      Row() {
        Button('导出数据', { type: ButtonType.Normal })
          .width('45%')
          .height(44)
          .backgroundColor('#FAAD14')
          .fontColor(Color.White)
          .fontSize(16)
          .borderRadius(6)
          .onClick(() => {
            this.exportData()
          })
        
        Blank()
        
        Button('导入数据', { type: ButtonType.Normal })
          .width('45%')
          .height(44)
          .backgroundColor('#722ED1')
          .fontColor(Color.White)
          .fontSize(16)
          .borderRadius(6)
          .onClick(() => {
            this.importData()
          })
      }
      .width('100%')
      
    }
    .width('100%')
    .padding(16)
    .backgroundColor($r('app.color.page_background1'))
    .borderRadius(8)
    .shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 })
  }
  
  // 加载同步状态
  private async loadSyncStatus(): Promise<void> {
    try {
      // 初始化分布式同步管理器
      const initialized = await this.syncManager.initialize();
      if (!initialized) {
        this.syncStatus.syncError = '同步服务初始化失败';
        return;
      }
      
      // 设置数据变化回调
      this.syncManager.setDataChangedCallback(() => {
        this.updateSyncStatus();
      });
      
      // 加载同步状态
      this.updateSyncStatus();
      
      // 加载设置
      this.loadSyncSettings();
      
    } catch (error) {
      hilog.error(0x0000, TAG, `Load sync status failed: ${error.message}`);
      this.syncStatus.syncError = '加载同步状态失败';
    }
  }
  
  // 开始同步状态监控
  private startSyncStatusMonitoring() {
    // 先清理可能存在的旧定时器
    this.stopSyncStatusMonitoring();
    
    // 每5秒更新一次状态
    this.statusMonitorTimer = setInterval(() => {
      this.updateSyncStatus();
    }, 5000);
    
    hilog.info(0x0000, TAG, `状态监控已启动，定时器ID: ${this.statusMonitorTimer}`);
  }
  
  // 停止同步状态监控
  private stopSyncStatusMonitoring() {
    if (this.statusMonitorTimer !== -1) {
      clearInterval(this.statusMonitorTimer);
      hilog.info(0x0000, TAG, `状态监控已停止，清理定时器ID: ${this.statusMonitorTimer}`);
      this.statusMonitorTimer = -1;
    }
  }
  
  // 启动自动同步
  private startAutoSync() {
    // 先停止之前的定时器
    this.stopAutoSync();
    
    // 检查权限
    this.checkAndRequestPermission().then((hasPermission) => {
      if (!hasPermission) {
        hilog.warn(0x0000, TAG, '没有分布式同步权限，无法启动自动同步');
        this.autoSyncEnabled = false;
        this.saveSyncSettings();
        return;
      }
      
      // 立即执行一次同步
      this.performAutoSync();
      
      // 启动定时同步
      this.autoSyncTimer = setInterval(() => {
        this.performAutoSync();
      }, this.AUTO_SYNC_INTERVAL);
      
      hilog.info(0x0000, TAG, `自动同步已启动，间隔: ${this.AUTO_SYNC_INTERVAL / 1000} 秒`);
      promptAction.showToast({
        message: '自动同步已开启',
        duration: 1500
      });
    });
  }
  
  // 停止自动同步
  private stopAutoSync() {
    if (this.autoSyncTimer !== -1) {
      clearInterval(this.autoSyncTimer);
      hilog.info(0x0000, TAG, `自动同步已停止，清理定时器ID: ${this.autoSyncTimer}`);
      this.autoSyncTimer = -1;
    }
  }
  
  // 执行自动同步
  private async performAutoSync() {
    // 如果正在同步，跳过
    if (this.syncStatus.isSyncing) {
      hilog.info(0x0000, TAG, '正在同步中，跳过本次自动同步');
      return;
    }
    
    // 检查网络条件
    if (!this.networkManager.isSuitableForSync(this.wifiOnlySync)) {
      const networkInfo = this.networkManager.getNetworkInfo();
      if (!networkInfo.isConnected) {
        hilog.info(0x0000, TAG, '无网络连接，跳过自动同步');
      } else if (this.wifiOnlySync && !networkInfo.isWifi) {
        hilog.info(0x0000, TAG, '当前非WiFi网络，已开启仅WiFi同步，跳过自动同步');
      }
      return;
    }
    
    hilog.info(0x0000, TAG, '开始执行自动同步...');
    
    try {
      const success = await this.syncManager.syncData();
      if (success) {
        hilog.info(0x0000, TAG, '自动同步成功');
        this.updateSyncStatus();
      } else {
        hilog.warn(0x0000, TAG, '自动同步失败');
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `自动同步出错: ${error.message}`);
    }
  }
  
  // 更新同步状态
  private updateSyncStatus() {
    const syncStatus = this.syncManager.getSyncStatus();
    this.syncStatus.isSyncing = syncStatus.isSyncing;
    this.syncStatus.lastSyncTime = syncStatus.lastSyncTime;
    this.syncStatus.syncError = syncStatus.syncError;
    this.lastSyncTime = this.formatTime(syncStatus.lastSyncTime);
  }
  
  // 检查并请求分布式数据同步权限
  private async checkAndRequestPermission(): Promise<boolean> {
    const permissions: Permissions[] = ['ohos.permission.DISTRIBUTED_DATASYNC'];
    
    try {
      const atManager = abilityAccessCtrl.createAtManager();
      
      // 检查是否已授权
      const grantStatus = await atManager.checkAccessToken(
        this.context.applicationInfo.accessTokenId,
        permissions[0]
      );
      
      if (grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
        return true;
      }
      
      // 请求权限
      const result = await atManager.requestPermissionsFromUser(this.context, permissions);
      
      if (result.authResults[0] === 0) {
        return true;
      } else {
        promptAction.showToast({
          message: '需要分布式数据同步权限才能使用此功能',
          duration: 2000
        });
        return false;
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `Permission check failed: ${JSON.stringify(error)}`);
      return false;
    }
  }
  
  // 开始同步
  private async startSync() {
    // 先检查权限
    const hasPermission = await this.checkAndRequestPermission();
    if (!hasPermission) {
      return;
    }
    
    // 检查网络条件
    if (!this.networkManager.isSuitableForSync(this.wifiOnlySync)) {
      const networkInfo = this.networkManager.getNetworkInfo();
      if (!networkInfo.isConnected) {
        promptAction.showToast({
          message: '无网络连接，无法同步',
          duration: 2000
        });
      } else if (this.wifiOnlySync && !networkInfo.isWifi) {
        promptAction.showToast({
          message: '当前非WiFi网络，已开启仅WiFi同步',
          duration: 2000
        });
      }
      return;
    }
    
    this.syncStatus.isSyncing = true;
    this.syncStatus.syncError = '';
    this.syncProgress = 0;
    
    try {
      // 进度更新
      const progressInterval = setInterval(() => {
        this.syncProgress += 10;
        if (this.syncProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 200);
      
      const success = await this.syncManager.syncData();
      
      clearInterval(progressInterval);
      this.syncProgress = 100;
      
      if (success) {
        this.lastSyncTime = this.formatTime(Date.now());
        promptAction.showToast({
          message: '数据同步成功',
          duration: 2000
        });
      } else {
        this.syncStatus.syncError = '同步失败';
        promptAction.showToast({
          message: '同步失败',
          duration: 2000
        });
      }
      
    } catch (error) {
      this.syncStatus.syncError = '同步过程中发生错误';
      hilog.error(0x0000, TAG, `Sync failed: ${error.message}`);
    } finally {
      this.syncStatus.isSyncing = false;
      this.updateSyncStatus();
    }
  }
  
  // 恢复数据
  private async restoreData() {
    // 先检查权限
    const hasPermission = await this.checkAndRequestPermission();
    if (!hasPermission) {
      return;
    }
    
    this.syncStatus.isSyncing = true;
    this.syncStatus.syncError = '';
    
    try {
      const success = await this.syncManager.restoreData();
      
      if (success) {
        promptAction.showToast({
          message: '数据恢复成功',
          duration: 2000
        });
        this.updateSyncStatus();
      } else {
        promptAction.showToast({
          message: '没有可恢复的数据',
          duration: 2000
        });
      }
      
    } catch (error) {
      this.syncStatus.syncError = '恢复数据失败';
      hilog.error(0x0000, TAG, `Restore failed: ${error.message}`);
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }
  

  // 导出数据
  private async exportData() {
    try {
      hilog.info(0x0000, TAG, '开始导出数据...');
      
      // 调用 SyncManager 导出数据
      const exportFilePath: string = await SyncManager.exportData();
      
      if (exportFilePath) {
        hilog.info(0x0000, TAG, `数据导出成功: ${exportFilePath}`);
        promptAction.showToast({
          message: `数据导出成功`,
          duration: 2000
        });
      } else {
        hilog.error(0x0000, TAG, '导出失败：无数据可导出');
        promptAction.showToast({
          message: '无数据可导出',
          duration: 2000
        });
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `数据导出失败: ${error}`);
      promptAction.showToast({
        message: '数据导出失败',
        duration: 2000
      });
    }
  }
  
  // 导入数据
  private async importData() {
    try {
      hilog.info(0x0000, TAG, '开始选择导入文件...');

      // 显示确认对话框
      AlertDialog.show({
        title: '导入数据',
        message: '导入数据将覆盖当前的用户数据和阅读进度，是否继续？',
        primaryButton: {
          value: '取消',
          action: () => {
            hilog.info(0x0000, TAG, '用户取消导入');
          }
        },
        secondaryButton: {
          value: '选择文件',
          fontColor: Color.Red,
          action: async () => {
            try {
              // 调用文件选择器并导入
              const result = await SyncManager.selectAndImportData();
              
              if (result.success) {
                hilog.info(0x0000, TAG, '数据导入成功');
                promptAction.showToast({
                  message: result.message,
                  duration: 10000
                });
                // 刷新同步状态
                this.loadSyncStatus();
              } else {
                // 用户取消选择不显示错误提示
                if (result.message !== '用户取消选择') {
                  hilog.error(0x0000, TAG, `数据导入失败: ${result.message}`);
                  promptAction.showToast({
                    message: result.message,
                    duration: 2000
                  });
                }
              }
            } catch (importError) {
              hilog.error(0x0000, TAG, `导入过程出错: ${importError}`);
              promptAction.showToast({
                message: '导入过程出错',
                duration: 2000
              });
            }
          }
        }
      });
    } catch (error) {
      hilog.error(0x0000, TAG, `导入数据失败: ${error}`);
      promptAction.showToast({
        message: '导入数据失败',
        duration: 2000
      });
    }
  }
  
  // 加载同步设置
  private async loadSyncSettings() {
    try {
      // 使用本地存储加载设置
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const prefs = await preferences.getPreferences(context, 'sync_preferences');
      
      this.autoSyncEnabled = await prefs.get('auto_sync_enabled', false) as boolean;
      this.wifiOnlySync = await prefs.get('wifi_only_sync', true) as boolean;
      
      hilog.info(0x0000, TAG, `同步设置加载成功，自动同步: ${this.autoSyncEnabled}`);
      
      // 如果自动同步已开启，启动定时同步
      if (this.autoSyncEnabled) {
        this.startAutoSync();
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `加载同步设置失败: ${error.message}`);
      // 加载失败使用默认值
      this.autoSyncEnabled = false;
      this.wifiOnlySync = true;
    }
  }
  
  // 保存同步设置
  private async saveSyncSettings() {
    try {
      // 使用本地存储保存设置
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const prefs = await preferences.getPreferences(context, 'sync_preferences');
      
      await prefs.put('auto_sync_enabled', this.autoSyncEnabled);
      await prefs.put('wifi_only_sync', this.wifiOnlySync);
      await prefs.flush();
      
      hilog.info(0x0000, TAG, '同步设置保存成功');
    } catch (error) {
      hilog.error(0x0000, TAG, `保存同步设置失败: ${error.message}`);
    }
  }
  
  // 格式化时间
  private formatTime(timestamp: number): string {
    if (timestamp === 0) {
      return '从未同步'
    }
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - timestamp
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else {
      return date.toLocaleDateString()
    }
  }
  

  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }
}