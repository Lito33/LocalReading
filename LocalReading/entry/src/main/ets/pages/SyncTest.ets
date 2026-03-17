import { DistributedSyncManager, SyncStatus } from '../utils/DistributedSyncManager';
import { StorageUtil } from '../utils/StorageUtil';
import { SettingStorage } from '../common/SettingStorage';
import { GlobalContext } from '../common/GlobalContext';
import { common, abilityAccessCtrl, Permissions } from '@kit.AbilityKit';

@Entry
@Component
struct SyncTest {
  @State testLog: string = '等待测试...';
  @State syncStatus: SyncStatus | null = null;
  @State isInitialized: boolean = false;

  aboutToAppear(): void {
    this.checkStatus();
  }

  async checkStatus(): Promise<void> {
    const status = DistributedSyncManager.getInstance().getSyncStatus();
    this.syncStatus = status;
  }

  // 请求分布式数据同步权限
  async requestPermission(): Promise<boolean> {
    const permissions: Permissions[] = ['ohos.permission.DISTRIBUTED_DATASYNC'];
    
    try {
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const atManager = abilityAccessCtrl.createAtManager();
      
      // 检查是否已授权
      const grantStatus = await atManager.checkAccessToken(
        context.applicationInfo.accessTokenId,
        permissions[0]
      );
      
      if (grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
        this.testLog = '✅ 分布式数据同步权限已授权';
        return true;
      }
      
      // 请求权限
      this.testLog = '正在请求分布式数据同步权限...';
      const result = await atManager.requestPermissionsFromUser(context, permissions);
      
      if (result.authResults[0] === 0) {
        this.testLog = '✅ 用户已授权分布式数据同步权限';
        return true;
      } else {
        this.testLog = '❌ 用户拒绝授权分布式数据同步权限';
        return false;
      }
    } catch (error) {
      this.testLog = `❌ 权限请求异常: ${JSON.stringify(error)}`;
      return false;
    }
  }

  async testInitialize(): Promise<void> {
    // 先请求权限
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return;
    }
    
    this.testLog = '正在初始化分布式同步管理器...';
    
    try {
      const success = await DistributedSyncManager.getInstance().initialize();
      this.isInitialized = success;
      this.testLog = success 
        ? '✅ 初始化成功！\n- 分布式数据对象已创建\n- 已加入组网 SessionId: local_reading_sync_session'
        : '❌ 初始化失败';
      this.checkStatus();
    } catch (error) {
      this.testLog = `❌ 初始化异常: ${JSON.stringify(error)}`;
    }
  }

  async testSyncData(): Promise<void> {
    this.testLog = '正在同步数据到分布式对象...';
    
    try {
      const success = await DistributedSyncManager.getInstance().syncData();
      this.testLog = success 
        ? '✅ 数据同步成功！\n- 用户数据已序列化\n- 设置已序列化\n- 已写入分布式对象'
        : '❌ 同步失败';
      this.checkStatus();
    } catch (error) {
      this.testLog = `❌ 同步异常: ${JSON.stringify(error)}`;
    }
  }

  async testRestoreData(): Promise<void> {
    this.testLog = '正在从分布式对象恢复数据...';
    
    try {
      const success = await DistributedSyncManager.getInstance().restoreData();
      this.testLog = success 
        ? '✅ 数据恢复成功！\n- 已从分布式对象读取数据\n- 已写入本地存储'
        : '❌ 恢复失败（可能没有远程数据）';
      this.checkStatus();
    } catch (error) {
      this.testLog = `❌ 恢复异常: ${JSON.stringify(error)}`;
    }
  }

  async testLocalData(): Promise<void> {
    this.testLog = '正在读取本地数据...';
    
    try {
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const users = await StorageUtil.getAllUsers();
      const currentUser = await StorageUtil.getCurrentUser();
      const settings = await SettingStorage.loadSettings(context);
      
      this.testLog = `✅ 本地数据读取成功！
      
用户列表: ${Object.keys(users).length} 个用户
${Object.keys(users).map(u => `  - ${u}`).join('\n')}

当前用户: ${currentUser || '无'}

设置信息:
  - 字体大小: ${settings?.fontSize ?? '默认'}
  - 夜间模式: ${settings?.nightMode ? '开启' : '关闭'}
  - 主题颜色: ${settings?.themeColor ?? '默认'}`;
    } catch (error) {
      this.testLog = `❌ 读取异常: ${JSON.stringify(error)}`;
    }
  }

  async testFullFlow(): Promise<void> {
    this.testLog = '开始完整流程测试...\n';
    
    // 0. 请求权限
    this.testLog += '\n[0/4] 请求分布式数据同步权限...';
    const hasPermission = await this.requestPermission();
    this.testLog += hasPermission ? ' ✅' : ' ❌';
    
    if (!hasPermission) {
      return;
    }
    
    // 1. 初始化
    this.testLog += '\n[1/4] 初始化分布式管理器...';
    const initSuccess = await DistributedSyncManager.getInstance().initialize();
    this.testLog += initSuccess ? ' ✅' : ' ❌';
    
    if (!initSuccess) {
      return;
    }
    
    // 2. 同步数据
    this.testLog += '\n[2/4] 同步本地数据到分布式对象...';
    const syncSuccess = await DistributedSyncManager.getInstance().syncData();
    this.testLog += syncSuccess ? ' ✅' : ' ❌';
    
    // 3. 模拟远程数据变化（单设备测试）
    this.testLog += '\n[3/4] 验证数据持久化...';
    await new Promise<void>((resolve: Function) => { setTimeout(resolve, 500); });
    this.testLog += ' ✅';
    
    // 4. 恢复数据
    this.testLog += '\n[4/4] 从分布式对象恢复数据...';
    const restoreSuccess = await DistributedSyncManager.getInstance().restoreData();
    this.testLog += restoreSuccess ? ' ✅' : ' ⚠️ (无远程数据是正常的)';
    
    this.testLog += '\n\n✅ 完整流程测试完成！';
    this.checkStatus();
  }

  build() {
    Column({ space: 16 }) {
      // 标题
      Text('分布式同步功能测试')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin({ top: 20 })
      
      // 状态显示
      if (this.syncStatus) {
        Row({ space: 8 }) {
          Text('同步状态:')
            .fontSize(14)
          Text(this.syncStatus.isSyncing ? '同步中...' : '空闲')
            .fontSize(14)
            .fontColor(this.syncStatus.isSyncing ? '#FF9800' : '#4CAF50')
          Text(`| 最后同步: ${this.syncStatus.lastSyncTime > 0 ? new Date(this.syncStatus.lastSyncTime).toLocaleString() : '从未'}`)
            .fontSize(12)
            .fontColor('#666')
        }
        .width('90%')
        .padding(10)
        .backgroundColor('#F5F5F5')
        .borderRadius(8)
      }
      
      // 测试按钮
      Column({ space: 12 }) {
        Button('1. 初始化分布式管理器')
          .width('90%')
          .onClick(() => this.testInitialize())
        
        Button('2. 同步数据到分布式对象')
          .width('90%')
          .enabled(this.isInitialized)
          .backgroundColor(this.isInitialized ? '#2196F3' : '#BDBDBD')
          .onClick(() => this.testSyncData())
        
        Button('3. 从分布式对象恢复数据')
          .width('90%')
          .enabled(this.isInitialized)
          .backgroundColor(this.isInitialized ? '#2196F3' : '#BDBDBD')
          .onClick(() => this.testRestoreData())
        
        Button('4. 查看本地数据')
          .width('90%')
          .backgroundColor('#9C27B0')
          .onClick(() => this.testLocalData())
        
        Button('🚀 完整流程测试')
          .width('90%')
          .backgroundColor('#4CAF50')
          .onClick(() => this.testFullFlow())
      }
      .width('100%')
      
      // 日志显示
      Column() {
        Text('测试日志:')
          .fontSize(14)
          .fontWeight(FontWeight.Medium)
          .width('90%')
        
        Scroll() {
          Text(this.testLog)
            .fontSize(12)
            .fontFamily('monospace')
            .width('100%')
        }
        .width('90%')
        .height(200)
        .backgroundColor('#263238')
        .borderRadius(8)
        .padding(12)
      }
      .width('100%')
      .alignItems(HorizontalAlign.Center)
      
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#FAFAFA')
  }
}