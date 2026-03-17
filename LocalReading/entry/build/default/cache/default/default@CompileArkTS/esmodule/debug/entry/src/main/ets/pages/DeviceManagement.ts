if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DeviceManagement_Params {
    isScanning?: boolean;
    syncStatus?: SyncStatus;
    eyeMode?: boolean;
    context?: common.UIAbilityContext;
    syncManager?: DistributedSyncManager;
}
import { DistributedSyncManager } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedSyncManager";
import type { SyncStatus } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedSyncManager";
import { GlobalContext } from "@bundle:com.example.readerkitdemo/entry/ets/common/GlobalContext";
import type common from "@ohos:app.ability.common";
import hilog from "@ohos:hilog";
import promptAction from "@ohos:promptAction";
class DeviceManagement extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__isScanning = new ObservedPropertySimplePU(false, this, "isScanning");
        this.__syncStatus = new ObservedPropertyObjectPU({
            isSyncing: false,
            lastSyncTime: 0
        }, this, "syncStatus");
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
        this.syncManager = DistributedSyncManager.getInstance();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DeviceManagement_Params) {
        if (params.isScanning !== undefined) {
            this.isScanning = params.isScanning;
        }
        if (params.syncStatus !== undefined) {
            this.syncStatus = params.syncStatus;
        }
        if (params.context !== undefined) {
            this.context = params.context;
        }
        if (params.syncManager !== undefined) {
            this.syncManager = params.syncManager;
        }
    }
    updateStateVars(params: DeviceManagement_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isScanning.purgeDependencyOnElmtId(rmElmtId);
        this.__syncStatus.purgeDependencyOnElmtId(rmElmtId);
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isScanning.aboutToBeDeleted();
        this.__syncStatus.aboutToBeDeleted();
        this.__eyeMode.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __isScanning: ObservedPropertySimplePU<boolean>;
    get isScanning() {
        return this.__isScanning.get();
    }
    set isScanning(newValue: boolean) {
        this.__isScanning.set(newValue);
    }
    private __syncStatus: ObservedPropertyObjectPU<SyncStatus>;
    get syncStatus() {
        return this.__syncStatus.get();
    }
    set syncStatus(newValue: SyncStatus) {
        this.__syncStatus.set(newValue);
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
    aboutToAppear() {
        this.loadSyncStatus();
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
            Text.create('跨设备同步');
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
        // 同步控制
        this.buildSyncControl.bind(this)();
        // 同步状态
        this.buildSyncStatus.bind(this)();
        // 同步信息
        this.buildSyncInfo.bind(this)();
        Column.pop();
    }
    buildSyncControl(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('立即同步', { type: ButtonType.Normal });
            Button.width('45%');
            Button.height(44);
            Button.backgroundColor('#1890FF');
            Button.fontColor(Color.White);
            Button.fontSize(16);
            Button.borderRadius(6);
            Button.enabled(!this.syncStatus.isSyncing);
            Button.onClick(() => {
                this.syncData();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('恢复数据', { type: ButtonType.Normal });
            Button.width('45%');
            Button.height(44);
            Button.backgroundColor('#FAAD14');
            Button.fontColor(Color.White);
            Button.fontSize(16);
            Button.borderRadius(6);
            Button.enabled(!this.syncStatus.isSyncing);
            Button.onClick(() => {
                this.restoreData();
            });
        }, Button);
        Button.pop();
        Row.pop();
    }
    buildSyncInfo(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.margin({ bottom: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('同步说明');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 12 });
            Column.width('100%');
            Column.padding(20);
            Column.backgroundColor(Color.White);
            Column.borderRadius(8);
            Column.shadow({ radius: 4, color: '#00000010', offsetX: 0, offsetY: 2 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 8, height: 8 });
            Circle.fill('#1890FF');
            Circle.margin({ right: 8 });
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('跨设备自动同步用户数据');
            Text.fontSize(14);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 8, height: 8 });
            Circle.fill('#1890FF');
            Circle.margin({ right: 8 });
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('同步阅读设置和进度');
            Text.fontSize(14);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 8, height: 8 });
            Circle.fill('#1890FF');
            Circle.margin({ right: 8 });
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('需要设备在同一网络下');
            Text.fontSize(14);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create({ width: 8, height: 8 });
            Circle.fill('#1890FF');
            Circle.margin({ right: 8 });
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('数据实时同步，无需手动操作');
            Text.fontSize(14);
            Text.fontColor('#333');
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        Column.pop();
    }
    buildSyncStatus(parent = null) {
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
            Text.create('同步状态');
            Text.fontSize(18);
            Text.fontColor(Color.Black);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('最后同步时间:');
            Text.fontSize(14);
            Text.fontColor('#666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatTime(this.syncStatus.lastSyncTime || 0));
            Text.fontSize(14);
            Text.fontColor('#333');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('同步状态:');
            Text.fontSize(14);
            Text.fontColor('#666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.syncStatus.isSyncing ? '同步中...' : '空闲');
            Text.fontSize(14);
            Text.fontColor(this.syncStatus.isSyncing ? '#1890FF' : '#52C41A');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.syncStatus.syncError) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`错误: ${this.syncStatus.syncError}`);
                        Text.fontSize(12);
                        Text.fontColor('#FF4D4F');
                        Text.width('100%');
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
    // 加载同步状态
    private async loadSyncStatus() {
        try {
            const initialized = await this.syncManager.initialize();
            if (!initialized) {
                this.syncStatus.syncError = '同步服务初始化失败';
                return;
            }
            this.syncStatus = this.syncManager.getSyncStatus();
        }
        catch (error) {
            hilog.error(0x0000, 'DeviceManagement', `Load sync status failed: ${error.message}`);
            this.syncStatus.syncError = '加载同步状态失败';
        }
    }
    // 同步数据
    private async syncData() {
        this.syncStatus.isSyncing = true;
        this.syncStatus.syncError = '';
        try {
            const success = await this.syncManager.syncData();
            if (success) {
                this.syncStatus.lastSyncTime = Date.now();
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
            hilog.error(0x0000, 'DeviceManagement', `Sync failed: ${error.message}`);
        }
        finally {
            this.syncStatus.isSyncing = false;
        }
    }
    // 恢复数据
    private async restoreData() {
        this.syncStatus.isSyncing = true;
        this.syncStatus.syncError = '';
        try {
            const success = await this.syncManager.restoreData();
            if (success) {
                promptAction.showToast({
                    message: '数据恢复成功',
                    duration: 2000
                });
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
            hilog.error(0x0000, 'DeviceManagement', `Restore failed: ${error.message}`);
        }
        finally {
            this.syncStatus.isSyncing = false;
        }
    }
    // 获取设备图标
    private getDeviceIcon(deviceType: number): ResourceStr {
        switch (deviceType) {
            case 0: return { "id": 16777294, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
            case 1: return { "id": 16777301, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
            case 2: return { "id": 16777302, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
            case 3: return { "id": 16777282, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
            case 4: return { "id": 16777304, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
            default: return { "id": 16777286, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
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
        return "DeviceManagement";
    }
}
registerNamedRoute(() => new DeviceManagement(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/DeviceManagement", pageFullPath: "entry/src/main/ets/pages/DeviceManagement", integratedHsp: "false", moduleType: "followWithHap" });
