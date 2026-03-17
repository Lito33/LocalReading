if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface SyncSettings_Params {
    syncStatus?: SyncStatus;
    lastSyncTime?: string;
    syncError?: string;
    autoSyncEnabled?: boolean;
    wifiOnlySync?: boolean;
    syncProgress?: number;
    showImportDialog?: boolean;
    eyeMode?: boolean;
    context?: common.UIAbilityContext;
    syncManager?: DistributedSyncManager;
    statusMonitorTimer?: number;
}
import { DistributedSyncManager } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedSyncManager";
import type { SyncStatus } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedSyncManager";
import { SyncManager } from "@bundle:com.example.readerkitdemo/entry/ets/utils/SyncManager";
import { GlobalContext } from "@bundle:com.example.readerkitdemo/entry/ets/common/GlobalContext";
import type common from "@ohos:app.ability.common";
import abilityAccessCtrl from "@ohos:abilityAccessCtrl";
import type { Permissions } from "@ohos:abilityAccessCtrl";
import hilog from "@ohos:hilog";
import promptAction from "@ohos:promptAction";
import preferences from "@ohos:data.preferences";
const TAG: string = 'SyncSettings';
class SyncSettings extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__syncStatus = new ObservedPropertyObjectPU({
            isSyncing: false,
            lastSyncTime: 0
        }, this, "syncStatus");
        this.__lastSyncTime = new ObservedPropertySimplePU('从未同步', this, "lastSyncTime");
        this.__syncError = new ObservedPropertySimplePU('', this, "syncError");
        this.__autoSyncEnabled = new ObservedPropertySimplePU(false, this, "autoSyncEnabled");
        this.__wifiOnlySync = new ObservedPropertySimplePU(true, this, "wifiOnlySync");
        this.__syncProgress = new ObservedPropertySimplePU(0, this, "syncProgress");
        this.__showImportDialog = new ObservedPropertySimplePU(false // 是否显示导入对话框
        , this, "showImportDialog");
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
        this.syncManager = DistributedSyncManager.getInstance();
        this.statusMonitorTimer = -1 // 状态监控定时器ID
        ;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: SyncSettings_Params) {
        if (params.syncStatus !== undefined) {
            this.syncStatus = params.syncStatus;
        }
        if (params.lastSyncTime !== undefined) {
            this.lastSyncTime = params.lastSyncTime;
        }
        if (params.syncError !== undefined) {
            this.syncError = params.syncError;
        }
        if (params.autoSyncEnabled !== undefined) {
            this.autoSyncEnabled = params.autoSyncEnabled;
        }
        if (params.wifiOnlySync !== undefined) {
            this.wifiOnlySync = params.wifiOnlySync;
        }
        if (params.syncProgress !== undefined) {
            this.syncProgress = params.syncProgress;
        }
        if (params.showImportDialog !== undefined) {
            this.showImportDialog = params.showImportDialog;
        }
        if (params.context !== undefined) {
            this.context = params.context;
        }
        if (params.syncManager !== undefined) {
            this.syncManager = params.syncManager;
        }
        if (params.statusMonitorTimer !== undefined) {
            this.statusMonitorTimer = params.statusMonitorTimer;
        }
    }
    updateStateVars(params: SyncSettings_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__syncStatus.purgeDependencyOnElmtId(rmElmtId);
        this.__lastSyncTime.purgeDependencyOnElmtId(rmElmtId);
        this.__syncError.purgeDependencyOnElmtId(rmElmtId);
        this.__autoSyncEnabled.purgeDependencyOnElmtId(rmElmtId);
        this.__wifiOnlySync.purgeDependencyOnElmtId(rmElmtId);
        this.__syncProgress.purgeDependencyOnElmtId(rmElmtId);
        this.__showImportDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__syncStatus.aboutToBeDeleted();
        this.__lastSyncTime.aboutToBeDeleted();
        this.__syncError.aboutToBeDeleted();
        this.__autoSyncEnabled.aboutToBeDeleted();
        this.__wifiOnlySync.aboutToBeDeleted();
        this.__syncProgress.aboutToBeDeleted();
        this.__showImportDialog.aboutToBeDeleted();
        this.__eyeMode.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __syncStatus: ObservedPropertyObjectPU<SyncStatus>;
    get syncStatus() {
        return this.__syncStatus.get();
    }
    set syncStatus(newValue: SyncStatus) {
        this.__syncStatus.set(newValue);
    }
    private __lastSyncTime: ObservedPropertySimplePU<string>;
    get lastSyncTime() {
        return this.__lastSyncTime.get();
    }
    set lastSyncTime(newValue: string) {
        this.__lastSyncTime.set(newValue);
    }
    private __syncError: ObservedPropertySimplePU<string>;
    get syncError() {
        return this.__syncError.get();
    }
    set syncError(newValue: string) {
        this.__syncError.set(newValue);
    }
    private __autoSyncEnabled: ObservedPropertySimplePU<boolean>;
    get autoSyncEnabled() {
        return this.__autoSyncEnabled.get();
    }
    set autoSyncEnabled(newValue: boolean) {
        this.__autoSyncEnabled.set(newValue);
    }
    private __wifiOnlySync: ObservedPropertySimplePU<boolean>;
    get wifiOnlySync() {
        return this.__wifiOnlySync.get();
    }
    set wifiOnlySync(newValue: boolean) {
        this.__wifiOnlySync.set(newValue);
    }
    private __syncProgress: ObservedPropertySimplePU<number>;
    get syncProgress() {
        return this.__syncProgress.get();
    }
    set syncProgress(newValue: number) {
        this.__syncProgress.set(newValue);
    }
    private __showImportDialog: ObservedPropertySimplePU<boolean>; // 是否显示导入对话框
    get showImportDialog() {
        return this.__showImportDialog.get();
    }
    set showImportDialog(newValue: boolean) {
        this.__showImportDialog.set(newValue);
    }
    private __eyeMode: ObservedPropertyAbstractPU<boolean>;
    get eyeMode() {
        return this.__eyeMode.get();
    }
    set eyeMode(newValue: boolean) {
        this.__eyeMode.set(newValue);
    }
    private context: common.UIAbilityContext;
    private syncManager: DistributedSyncManager;
    private statusMonitorTimer: number; // 状态监控定时器ID
    aboutToAppear() {
        this.loadSyncStatus();
        this.startSyncStatusMonitoring();
    }
    aboutToDisappear() {
        this.stopSyncStatusMonitoring();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.padding(20);
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题
            Text.create('数据同步设置');
            // 标题
            Text.fontColor(Color.Black);
            // 标题
            Text.fontSize(24);
            // 标题
            Text.fontWeight(FontWeight.Bold);
            // 标题
            Text.margin({ top: 30, bottom: 30 });
        }, Text);
        // 标题
        Text.pop();
        // 同步状态卡片
        this.buildStatusCard.bind(this)();
        // 设备列表
        this.buildDeviceList.bind(this)();
        // 同步设置
        this.buildSyncSettings.bind(this)();
        // 操作按钮
        this.buildActionButtons.bind(this)();
        // 手动导入导出
        this.buildManualOperations.bind(this)();
        Column.pop();
    }
    buildStatusCard(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor(Color.White);
            Column.borderRadius(8);
            Column.shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 });
            Column.margin({ bottom: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 状态指示器
            Circle.create({ width: 12, height: 12 });
            // 状态指示器
            Circle.fill(this.syncStatus.lastSyncTime > 0 ? '#52C41A' : '#FF4D4F');
            // 状态指示器
            Circle.margin({ right: 8 });
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备同步');
            Text.fontSize(16);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.syncStatus.isSyncing ? '同步中...' : '就绪');
            Text.fontSize(14);
            Text.fontColor(this.syncStatus.isSyncing ? '#1890FF' : '#52C41A');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('最后同步时间：');
            Text.fontSize(14);
            Text.fontColor('#666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.lastSyncTime);
            Text.fontSize(14);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 同步进度条
            if (this.syncStatus.isSyncing) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Progress.create({ value: this.syncProgress, total: 100, type: ProgressType.Linear });
                        Progress.width('100%');
                        Progress.height(4);
                        Progress.color('#1890FF');
                        Progress.backgroundColor('#E8E8E8');
                        Progress.margin({ top: 8 });
                    }, Progress);
                });
            }
            // 错误信息
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 错误信息
            if (this.syncStatus.syncError) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.syncStatus.syncError);
                        Text.fontSize(12);
                        Text.fontColor('#FF4D4F');
                        Text.margin({ top: 8 });
                        Text.width('100%');
                        Text.textAlign(TextAlign.Center);
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    buildDeviceList(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor(Color.White);
            Column.borderRadius(8);
            Column.shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 });
            Column.margin({ bottom: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('跨设备同步');
            Text.fontColor(Color.Black);
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('自动同步');
            Text.fontSize(14);
            Text.fontColor('#666');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor('#F8F9FA');
            Column.borderRadius(8);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('同步用户数据');
            Text.fontSize(16);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('账号、设置');
            Text.fontSize(12);
            Text.fontColor('#999');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('同步设置');
            Text.fontSize(16);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('字体、主题、亮度');
            Text.fontSize(12);
            Text.fontColor('#999');
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    buildSyncSettings(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor(Color.White);
            Column.borderRadius(8);
            Column.shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 });
            Column.margin({ bottom: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('同步设置');
            Text.fontColor(Color.Black);
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 自动同步开关
            Row.create();
            // 自动同步开关
            Row.width('100%');
            // 自动同步开关
            Row.margin({ bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('自动同步');
            Text.fontSize(16);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.autoSyncEnabled });
            Toggle.onChange((value: boolean) => {
                this.autoSyncEnabled = value;
                this.saveSyncSettings();
            });
        }, Toggle);
        Toggle.pop();
        // 自动同步开关
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // WiFi同步开关
            Row.create();
            // WiFi同步开关
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('仅WiFi同步');
            Text.fontSize(16);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.wifiOnlySync });
            Toggle.onChange((value: boolean) => {
                this.wifiOnlySync = value;
                this.saveSyncSettings();
            });
        }, Toggle);
        Toggle.pop();
        // WiFi同步开关
        Row.pop();
        Column.pop();
    }
    buildActionButtons(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 立即同步按钮
            Button.createWithLabel('立即同步', { type: ButtonType.Normal });
            // 立即同步按钮
            Button.width('45%');
            // 立即同步按钮
            Button.height(44);
            // 立即同步按钮
            Button.backgroundColor('#1890FF');
            // 立即同步按钮
            Button.fontColor(Color.White);
            // 立即同步按钮
            Button.fontSize(16);
            // 立即同步按钮
            Button.borderRadius(6);
            // 立即同步按钮
            Button.enabled(!this.syncStatus.isSyncing);
            // 立即同步按钮
            Button.onClick(() => {
                this.startSync();
            });
        }, Button);
        // 立即同步按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 恢复数据按钮
            Button.createWithLabel('恢复数据', { type: ButtonType.Normal });
            // 恢复数据按钮
            Button.width('45%');
            // 恢复数据按钮
            Button.height(44);
            // 恢复数据按钮
            Button.backgroundColor('#FAAD14');
            // 恢复数据按钮
            Button.fontColor(Color.White);
            // 恢复数据按钮
            Button.fontSize(16);
            // 恢复数据按钮
            Button.borderRadius(6);
            // 恢复数据按钮
            Button.enabled(!this.syncStatus.isSyncing);
            // 恢复数据按钮
            Button.onClick(() => {
                this.restoreData();
            });
        }, Button);
        // 恢复数据按钮
        Button.pop();
        Row.pop();
    }
    buildManualOperations(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor({ "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Column.borderRadius(8);
            Column.shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('手动操作');
            Text.fontColor(Color.Black);
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('导出数据', { type: ButtonType.Normal });
            Button.width('45%');
            Button.height(44);
            Button.backgroundColor('#FAAD14');
            Button.fontColor(Color.White);
            Button.fontSize(16);
            Button.borderRadius(6);
            Button.onClick(() => {
                this.exportData();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('导入数据', { type: ButtonType.Normal });
            Button.width('45%');
            Button.height(44);
            Button.backgroundColor('#722ED1');
            Button.fontColor(Color.White);
            Button.fontSize(16);
            Button.borderRadius(6);
            Button.onClick(() => {
                this.importData();
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    // 加载同步状态
    private async loadSyncStatus() {
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
        }
        catch (error) {
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
            const grantStatus = await atManager.checkAccessToken(this.context.applicationInfo.accessTokenId, permissions[0]);
            if (grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
                return true;
            }
            // 请求权限
            const result = await atManager.requestPermissionsFromUser(this.context, permissions);
            if (result.authResults[0] === 0) {
                return true;
            }
            else {
                promptAction.showToast({
                    message: '需要分布式数据同步权限才能使用此功能',
                    duration: 2000
                });
                return false;
            }
        }
        catch (error) {
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
        this.syncStatus.isSyncing = true;
        this.syncStatus.syncError = '';
        this.syncProgress = 0;
        try {
            // 模拟进度更新
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
            }
            else {
                this.syncStatus.syncError = '同步失败';
                promptAction.showToast({
                    message: '同步失败',
                    duration: 2000
                });
            }
        }
        catch (error) {
            this.syncStatus.syncError = '同步过程中发生错误';
            hilog.error(0x0000, TAG, `Sync failed: ${error.message}`);
        }
        finally {
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
            }
            else {
                promptAction.showToast({
                    message: '没有可恢复的数据',
                    duration: 2000
                });
            }
        }
        catch (error) {
            this.syncStatus.syncError = '恢复数据失败';
            hilog.error(0x0000, TAG, `Restore failed: ${error.message}`);
        }
        finally {
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
            }
            else {
                hilog.error(0x0000, TAG, '导出失败：无数据可导出');
                promptAction.showToast({
                    message: '无数据可导出',
                    duration: 2000
                });
            }
        }
        catch (error) {
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
                            }
                            else {
                                // 用户取消选择不显示错误提示
                                if (result.message !== '用户取消选择') {
                                    hilog.error(0x0000, TAG, `数据导入失败: ${result.message}`);
                                    promptAction.showToast({
                                        message: result.message,
                                        duration: 2000
                                    });
                                }
                            }
                        }
                        catch (importError) {
                            hilog.error(0x0000, TAG, `导入过程出错: ${importError}`);
                            promptAction.showToast({
                                message: '导入过程出错',
                                duration: 2000
                            });
                        }
                    }
                }
            });
        }
        catch (error) {
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
            hilog.info(0x0000, TAG, '同步设置加载成功');
        }
        catch (error) {
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
        }
        catch (error) {
            hilog.error(0x0000, TAG, `保存同步设置失败: ${error.message}`);
        }
    }
    // 格式化时间
    private formatTime(timestamp: number): string {
        if (timestamp === 0) {
            return '从未同步';
        }
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - timestamp;
        if (diff < 60000) { // 1分钟内
            return '刚刚';
        }
        else if (diff < 3600000) { // 1小时内
            return Math.floor(diff / 60000) + '分钟前';
        }
        else if (diff < 86400000) { // 1天内
            return Math.floor(diff / 3600000) + '小时前';
        }
        else {
            return date.toLocaleDateString();
        }
    }
    pageTransition() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransition.create();
        }, null);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransitionEnter.create({ duration: 0, curve: Curve.Sharp });
        }, null);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransitionExit.create({ duration: 0, curve: Curve.Sharp });
        }, null);
        PageTransition.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "SyncSettings";
    }
}
registerNamedRoute(() => new SyncSettings(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/SyncSettings", pageFullPath: "entry/src/main/ets/pages/SyncSettings", integratedHsp: "false", moduleType: "followWithHap" });
