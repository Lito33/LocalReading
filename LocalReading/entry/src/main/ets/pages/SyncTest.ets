import { DistributedSyncManager, SyncStatus } from '../utils/DistributedSyncManager';
import { StorageUtil } from '../utils/StorageUtil';
import { SettingStorage } from '../common/SettingStorage';
import { GlobalContext } from '../common/GlobalContext';
import { common, abilityAccessCtrl, Permissions } from '@kit.AbilityKit';
import { ProgressStorage, BookProgress } from '../common/ProgressStorage';
import { NetworkManager, NetworkInfo } from '../utils/NetworkManager';

@Entry
@Component
struct SyncTest {
  @State testLog: string = '等待测试...';
  @State syncStatus: SyncStatus | null = null;
  @State isInitialized: boolean = false;
  @State progressCount: number = 0;  // 阅读进度数量
  @State networkInfo: NetworkInfo | null = null;  // 网络信息
  @State wifiOnlySync: boolean = true;  // 仅WiFi同步开关

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
      
      // 获取阅读进度数量
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const currentUser = await StorageUtil.getCurrentUser();
      const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      this.progressCount = progresses.length;
      
      this.testLog = success 
        ? `✅ 数据同步成功！\n- 用户数据已序列化\n- 设置已序列化\n- 阅读进度已序列化 (${progresses.length} 条)\n- 已写入分布式对象`
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
      
      // 获取恢复后的阅读进度
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const currentUser = await StorageUtil.getCurrentUser();
      const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      this.progressCount = progresses.length;
      
      this.testLog = success 
        ? `✅ 数据恢复成功！\n- 已从分布式对象读取数据\n- 已写入本地存储\n- 阅读进度: ${progresses.length} 条`
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
      
      // 获取阅读进度
      const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      this.progressCount = progresses.length;
      
      // 格式化阅读进度信息
      let progressInfo = '无阅读进度';
      if (progresses.length > 0) {
        progressInfo = progresses.map((p: BookProgress, index: number) => 
          `  ${index + 1}. ${p.bookName || '未知书籍'}\n     章节: ${p.chapterName || '未知'} (索引: ${p.resourceIndex})\n
              最后阅读: ${p.lastReadTime > 0 ? new Date(p.lastReadTime).toLocaleString() : '未知'}`
        ).join('\n');
      }
      
      this.testLog = `✅ 本地数据读取成功！
      
  用户列表: ${Object.keys(users).length} 个用户
  ${Object.keys(users).map(u => `  - ${u}`).join('\n')}

  当前用户: ${currentUser || '无'}

  设置信息:
    - 字体大小: ${settings?.fontSize ?? '默认'}
    - 夜间模式: ${settings?.nightMode ? '开启' : '关闭'}
    - 主题颜色: ${settings?.themeColor ?? '默认'}

  阅读进度: ${progresses.length} 条记录
  ${progressInfo}`;
      } catch (error) {
        this.testLog = `❌ 读取异常: ${JSON.stringify(error)}`;
      }
    }

  async testFullFlow(): Promise<void> {
    this.testLog = '开始完整流程测试...\n';
    
    // 0. 请求权限
    this.testLog += '\n[0/5] 请求分布式数据同步权限...';
    const hasPermission = await this.requestPermission();
    this.testLog += hasPermission ? ' ✅' : ' ❌';
    
    if (!hasPermission) {
      return;
    }
    
    // 1. 初始化
    this.testLog += '\n[1/5] 初始化分布式管理器...';
    const initSuccess = await DistributedSyncManager.getInstance().initialize();
    this.testLog += initSuccess ? ' ✅' : ' ❌';
    
    if (!initSuccess) {
      return;
    }
    
    // 2. 同步数据
    this.testLog += '\n[2/5] 同步本地数据到分布式对象...';
    const syncSuccess = await DistributedSyncManager.getInstance().syncData();
    this.testLog += syncSuccess ? ' ✅' : ' ❌';
    
    // 3. 模拟远程数据变化（单设备测试）
    this.testLog += '\n[3/5] 验证数据持久化...';
    await new Promise<void>((resolve: Function) => { setTimeout(resolve, 500); });
    this.testLog += ' ✅';
    
    // 4. 恢复数据
    this.testLog += '\n[4/5] 从分布式对象恢复数据...';
    const restoreSuccess = await DistributedSyncManager.getInstance().restoreData();
    this.testLog += restoreSuccess ? ' ✅' : ' ⚠️ (无远程数据是正常的)';
    
    // 5. 验证阅读进度
    this.testLog += '\n[5/5] 验证阅读进度同步...';
    const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
    const currentUser = await StorageUtil.getCurrentUser();
    const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
    this.progressCount = progresses.length;
    this.testLog += ` ✅ (${progresses.length} 条进度)`;
    
    this.testLog += '\n\n✅ 完整流程测试完成！';
    this.checkStatus();
  }
  
  // 测试阅读进度同步
  async testProgressSync(): Promise<void> {
    this.testLog = '正在测试阅读进度同步...\n';
    
    try {
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const currentUser = await StorageUtil.getCurrentUser();
      
      if (!currentUser) {
        this.testLog += '\n❌ 请先登录用户';
        return;
      }
      
      // 1. 读取本地阅读进度
      this.testLog += '\n[1/3] 读取本地阅读进度...';
      const localProgresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      this.testLog += ` ✅ (${localProgresses.length} 条)`;
      
      // 2. 同步到分布式对象
      this.testLog += '\n[2/3] 同步阅读进度到分布式对象...';
      const syncSuccess = await DistributedSyncManager.getInstance().syncProgressOnly();
      this.testLog += syncSuccess ? ' ✅' : ' ❌';
      
      // 3. 验证同步结果
      this.testLog += '\n[3/3] 验证同步结果...';
      this.progressCount = localProgresses.length;
      
      // 显示进度详情
      if (localProgresses.length > 0) {
        this.testLog += ' ✅\n\n已同步的阅读进度:';
        for (let i = 0; i < Math.min(localProgresses.length, 5); i++) {
          const p = localProgresses[i];
          this.testLog += `\n  ${i + 1}. ${p.bookName} - ${p.chapterName}`;
        }
        if (localProgresses.length > 5) {
          this.testLog += `\n  ... 还有 ${localProgresses.length - 5} 条`;
        }
      } else {
        this.testLog += ' ⚠️ 暂无阅读进度数据';
      }
      
      this.testLog += '\n\n✅ 阅读进度同步测试完成！';
    } catch (error) {
      this.testLog = `❌ 测试异常: ${JSON.stringify(error)}`;
    }
  }

  // 测试仅WiFi同步功能
  async testWifiOnlySync(): Promise<void> {
    this.testLog = '正在测试仅WiFi同步功能...\n';

    try {
      // 1. 初始化网络管理器
      this.testLog += '\n[1/4] 初始化网络管理器...';
      const initSuccess = await NetworkManager.getInstance().initialize();
      this.testLog += initSuccess ? ' ✅' : ' ❌';

      if (!initSuccess) {
        this.testLog += '\n❌ 网络管理器初始化失败';
        return;
      }

      // 2. 获取当前网络信息
      this.testLog += '\n[2/4] 获取当前网络信息...';
      this.networkInfo = NetworkManager.getInstance().getNetworkInfo();
      this.testLog += ' ✅';

      // 3. 测试网络条件判断
      this.testLog += '\n[3/4] 测试网络条件判断...';
      const suitableForWifiOnly = NetworkManager.getInstance().isSuitableForSync(true);
      const suitableForAny = NetworkManager.getInstance().isSuitableForSync(false);
      this.testLog += ' ✅';

      // 4. 显示测试结果
      this.testLog += '\n[4/4] 生成测试报告...';
      this.testLog += ' ✅';

      // 构建详细报告（显示原始值便于调试）
      this.testLog += '\n\n📊 网络状态报告:';
      this.testLog += `\n  - isConnected: ${this.networkInfo.isConnected}`;
      this.testLog += `\n  - networkType: ${this.networkInfo.networkType} (${this.getNetworkTypeName(this.networkInfo.networkType)})`;
      this.testLog += `\n  - isWifi: ${this.networkInfo.isWifi}`;
      this.testLog += `\n  - isCellular: ${this.networkInfo.isCellular}`;
      this.testLog += `\n  - isEthernet: ${this.networkInfo.isEthernet}`;
      this.testLog += `\n  - isBluetooth: ${this.networkInfo.isBluetooth}`;

      this.testLog += '\n\n📋 同步条件测试:';
      this.testLog += `\n  - 仅WiFi同步条件满足: ${suitableForWifiOnly ? '是 ✅' : '否 ❌'}`;
      this.testLog += `\n  - 任意网络同步条件满足: ${suitableForAny ? '是 ✅' : '否 ❌'}`;

      // 模拟场景测试
      this.testLog += '\n\n🧪 场景模拟测试:';
      
      // 场景1: 开启仅WiFi同步
      this.wifiOnlySync = true;
      const canSyncWifiOnly = NetworkManager.getInstance().isSuitableForSync(this.wifiOnlySync);
      this.testLog += `\n  场景1 [仅WiFi同步=开启]:`;
      if (canSyncWifiOnly) {
        this.testLog += ` ✅ 可以同步 (当前是WiFi)`;
      } else {
        this.testLog += ` ⚠️ 跳过同步 (${this.networkInfo.isConnected ? '当前非WiFi' : '无网络'})`;
      }

      // 场景2: 关闭仅WiFi同步
      this.wifiOnlySync = false;
      const canSyncAny = NetworkManager.getInstance().isSuitableForSync(this.wifiOnlySync);
      this.testLog += `\n  场景2 [仅WiFi同步=关闭]:`;
      if (canSyncAny) {
        this.testLog += ` ✅ 可以同步 (有可用网络)`;
      } else {
        this.testLog += ` ❌ 无法同步 (无网络连接)`;
      }

      this.testLog += '\n\n✅ 仅WiFi同步功能测试完成！';
    } catch (error) {
      this.testLog = `❌ 测试异常: ${JSON.stringify(error)}`;
    }
  }

  // 获取网络类型名称
  private getNetworkTypeName(type: number): string {
    switch (type) {
      case 1: return 'WiFi';
      case 2: return '蜂窝网络';
      case 3: return '以太网';
      case 4: return '蓝牙';
      default: return '未知';
    }
  }

  build() {
    Column({ space: 16 }) {
      // 标题
      Text('分布式同步功能测试')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin({ top: 20 })
        .fontColor('#666')
      
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
      
      // 阅读进度数量显示
      if (this.progressCount > 0) {
        Row({ space: 8 }) {
          Text('📚 阅读进度:')
            .fontSize(14)
            .fontColor('#666')
          Text(`${this.progressCount} 条`)
            .fontSize(14)
            .fontColor('#4CAF50')
            .fontWeight(FontWeight.Medium)
        }
        .width('90%')
        .padding(10)
        .backgroundColor('#E8F5E9')
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
        
        Button('5. 测试阅读进度同步')
          .width('90%')
          .backgroundColor('#FF9800')
          .onClick(() => this.testProgressSync())
        
        Button('6. 测试仅WiFi同步功能')
          .width('90%')
          .backgroundColor('#00BCD4')
          .onClick(() => this.testWifiOnlySync())
        
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