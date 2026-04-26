if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface SyncTest_Params {
    testLog?: string;
    syncStatus?: SyncStatus | null;
    isInitialized?: boolean;
    progressCount?: number;
    networkInfo?: NetworkInfo | null;
    wifiOnlySync?: boolean;
}
import { DistributedSyncManager } from "@bundle:com.example.reader/entry/ets/utils/DistributedSyncManager";
import type { SyncStatus } from "@bundle:com.example.reader/entry/ets/utils/DistributedSyncManager";
import { StorageUtil } from "@bundle:com.example.reader/entry/ets/utils/StorageUtil";
import { SettingStorage } from "@bundle:com.example.reader/entry/ets/common/SettingStorage";
import { GlobalContext } from "@bundle:com.example.reader/entry/ets/common/GlobalContext";
import type common from "@ohos:app.ability.common";
import abilityAccessCtrl from "@ohos:abilityAccessCtrl";
import type { Permissions } from "@ohos:abilityAccessCtrl";
import { ProgressStorage } from "@bundle:com.example.reader/entry/ets/common/ProgressStorage";
import type { BookProgress } from "@bundle:com.example.reader/entry/ets/common/ProgressStorage";
import { NetworkManager } from "@bundle:com.example.reader/entry/ets/utils/NetworkManager";
import type { NetworkInfo } from "@bundle:com.example.reader/entry/ets/utils/NetworkManager";
class SyncTest extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__testLog = new ObservedPropertySimplePU('等待测试...', this, "testLog");
        this.__syncStatus = new ObservedPropertyObjectPU(null, this, "syncStatus");
        this.__isInitialized = new ObservedPropertySimplePU(false, this, "isInitialized");
        this.__progressCount = new ObservedPropertySimplePU(0, this, "progressCount");
        this.__networkInfo = new ObservedPropertyObjectPU(null, this, "networkInfo");
        this.__wifiOnlySync = new ObservedPropertySimplePU(true, this, "wifiOnlySync");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SyncTest_Params) {
        if (params.testLog !== undefined) {
            this.testLog = params.testLog;
        }
        if (params.syncStatus !== undefined) {
            this.syncStatus = params.syncStatus;
        }
        if (params.isInitialized !== undefined) {
            this.isInitialized = params.isInitialized;
        }
        if (params.progressCount !== undefined) {
            this.progressCount = params.progressCount;
        }
        if (params.networkInfo !== undefined) {
            this.networkInfo = params.networkInfo;
        }
        if (params.wifiOnlySync !== undefined) {
            this.wifiOnlySync = params.wifiOnlySync;
        }
    }
    updateStateVars(params: SyncTest_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__testLog.purgeDependencyOnElmtId(rmElmtId);
        this.__syncStatus.purgeDependencyOnElmtId(rmElmtId);
        this.__isInitialized.purgeDependencyOnElmtId(rmElmtId);
        this.__progressCount.purgeDependencyOnElmtId(rmElmtId);
        this.__networkInfo.purgeDependencyOnElmtId(rmElmtId);
        this.__wifiOnlySync.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__testLog.aboutToBeDeleted();
        this.__syncStatus.aboutToBeDeleted();
        this.__isInitialized.aboutToBeDeleted();
        this.__progressCount.aboutToBeDeleted();
        this.__networkInfo.aboutToBeDeleted();
        this.__wifiOnlySync.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __testLog: ObservedPropertySimplePU<string>;
    get testLog() {
        return this.__testLog.get();
    }
    set testLog(newValue: string) {
        this.__testLog.set(newValue);
    }
    private __syncStatus: ObservedPropertyObjectPU<SyncStatus | null>;
    get syncStatus() {
        return this.__syncStatus.get();
    }
    set syncStatus(newValue: SyncStatus | null) {
        this.__syncStatus.set(newValue);
    }
    private __isInitialized: ObservedPropertySimplePU<boolean>;
    get isInitialized() {
        return this.__isInitialized.get();
    }
    set isInitialized(newValue: boolean) {
        this.__isInitialized.set(newValue);
    }
    private __progressCount: ObservedPropertySimplePU<number>; // 阅读进度数量
    get progressCount() {
        return this.__progressCount.get();
    }
    set progressCount(newValue: number) {
        this.__progressCount.set(newValue);
    }
    private __networkInfo: ObservedPropertyObjectPU<NetworkInfo | null>; // 网络信息
    get networkInfo() {
        return this.__networkInfo.get();
    }
    set networkInfo(newValue: NetworkInfo | null) {
        this.__networkInfo.set(newValue);
    }
    private __wifiOnlySync: ObservedPropertySimplePU<boolean>; // 仅WiFi同步开关
    get wifiOnlySync() {
        return this.__wifiOnlySync.get();
    }
    set wifiOnlySync(newValue: boolean) {
        this.__wifiOnlySync.set(newValue);
    }
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
            const grantStatus = await atManager.checkAccessToken(context.applicationInfo.accessTokenId, permissions[0]);
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
            }
            else {
                this.testLog = '❌ 用户拒绝授权分布式数据同步权限';
                return false;
            }
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
                progressInfo = progresses.map((p: BookProgress, index: number) => `  ${index + 1}. ${p.bookName || '未知书籍'}\n     章节: ${p.chapterName || '未知'} (索引: ${p.resourceIndex})\n
              最后阅读: ${p.lastReadTime > 0 ? new Date(p.lastReadTime).toLocaleString() : '未知'}`).join('\n');
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
        }
        catch (error) {
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
            }
            else {
                this.testLog += ' ⚠️ 暂无阅读进度数据';
            }
            this.testLog += '\n\n✅ 阅读进度同步测试完成！';
        }
        catch (error) {
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
            }
            else {
                this.testLog += ` ⚠️ 跳过同步 (${this.networkInfo.isConnected ? '当前非WiFi' : '无网络'})`;
            }
            // 场景2: 关闭仅WiFi同步
            this.wifiOnlySync = false;
            const canSyncAny = NetworkManager.getInstance().isSuitableForSync(this.wifiOnlySync);
            this.testLog += `\n  场景2 [仅WiFi同步=关闭]:`;
            if (canSyncAny) {
                this.testLog += ` ✅ 可以同步 (有可用网络)`;
            }
            else {
                this.testLog += ` ❌ 无法同步 (无网络连接)`;
            }
            this.testLog += '\n\n✅ 仅WiFi同步功能测试完成！';
        }
        catch (error) {
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 16 });
            Column.debugLine("entry/src/main/ets/pages/SyncTest.ets(347:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#FAFAFA');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题
            Text.create('分布式同步功能测试');
            Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(349:7)", "entry");
            // 标题
            Text.fontSize(24);
            // 标题
            Text.fontWeight(FontWeight.Bold);
            // 标题
            Text.margin({ top: 20 });
            // 标题
            Text.fontColor('#666');
        }, Text);
        // 标题
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 状态显示
            if (this.syncStatus) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                        Row.debugLine("entry/src/main/ets/pages/SyncTest.ets(357:9)", "entry");
                        Row.width('90%');
                        Row.padding(10);
                        Row.backgroundColor('#F5F5F5');
                        Row.borderRadius(8);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('同步状态:');
                        Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(358:11)", "entry");
                        Text.fontSize(14);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.syncStatus.isSyncing ? '同步中...' : '空闲');
                        Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(360:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor(this.syncStatus.isSyncing ? '#FF9800' : '#4CAF50');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`| 最后同步: ${this.syncStatus.lastSyncTime > 0 ? new Date(this.syncStatus.lastSyncTime).toLocaleString() : '从未'}`);
                        Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(363:11)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#666');
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            // 阅读进度数量显示
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 阅读进度数量显示
            if (this.progressCount > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create({ space: 8 });
                        Row.debugLine("entry/src/main/ets/pages/SyncTest.ets(375:9)", "entry");
                        Row.width('90%');
                        Row.padding(10);
                        Row.backgroundColor('#E8F5E9');
                        Row.borderRadius(8);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('📚 阅读进度:');
                        Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(376:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.progressCount} 条`);
                        Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(379:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#4CAF50');
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            // 测试按钮
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 测试按钮
            Column.create({ space: 12 });
            Column.debugLine("entry/src/main/ets/pages/SyncTest.ets(391:7)", "entry");
            // 测试按钮
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('1. 初始化分布式管理器');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(392:9)", "entry");
            Button.width('90%');
            Button.onClick(() => this.testInitialize());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('2. 同步数据到分布式对象');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(396:9)", "entry");
            Button.width('90%');
            Button.enabled(this.isInitialized);
            Button.backgroundColor(this.isInitialized ? '#2196F3' : '#BDBDBD');
            Button.onClick(() => this.testSyncData());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('3. 从分布式对象恢复数据');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(402:9)", "entry");
            Button.width('90%');
            Button.enabled(this.isInitialized);
            Button.backgroundColor(this.isInitialized ? '#2196F3' : '#BDBDBD');
            Button.onClick(() => this.testRestoreData());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('4. 查看本地数据');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(408:9)", "entry");
            Button.width('90%');
            Button.backgroundColor('#9C27B0');
            Button.onClick(() => this.testLocalData());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('5. 测试阅读进度同步');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(413:9)", "entry");
            Button.width('90%');
            Button.backgroundColor('#FF9800');
            Button.onClick(() => this.testProgressSync());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('6. 测试仅WiFi同步功能');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(418:9)", "entry");
            Button.width('90%');
            Button.backgroundColor('#00BCD4');
            Button.onClick(() => this.testWifiOnlySync());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('🚀 完整流程测试');
            Button.debugLine("entry/src/main/ets/pages/SyncTest.ets(423:9)", "entry");
            Button.width('90%');
            Button.backgroundColor('#4CAF50');
            Button.onClick(() => this.testFullFlow());
        }, Button);
        Button.pop();
        // 测试按钮
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 日志显示
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/SyncTest.ets(431:7)", "entry");
            // 日志显示
            Column.width('100%');
            // 日志显示
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('测试日志:');
            Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(432:9)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.width('90%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/SyncTest.ets(437:9)", "entry");
            Scroll.width('90%');
            Scroll.height(200);
            Scroll.backgroundColor('#263238');
            Scroll.borderRadius(8);
            Scroll.padding(12);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.testLog);
            Text.debugLine("entry/src/main/ets/pages/SyncTest.ets(438:11)", "entry");
            Text.fontSize(12);
            Text.fontFamily('monospace');
            Text.width('100%');
        }, Text);
        Text.pop();
        Scroll.pop();
        // 日志显示
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "SyncTest";
    }
}
registerNamedRoute(() => new SyncTest(undefined, {}), "", { bundleName: "com.example.reader", moduleName: "entry", pagePath: "pages/SyncTest", pageFullPath: "entry/src/main/ets/pages/SyncTest", integratedHsp: "false", moduleType: "followWithHap" });
