if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DebugStorage_Params {
    currentAccount?: string;
    currentPassword?: string;
    isRemember?: boolean;
    isLoggedIn?: boolean;
}
import promptAction from "@ohos:promptAction";
import router from "@ohos:router";
import { StorageUtil } from "@bundle:com.example.reader/entry/ets/utils/StorageUtil";
class DebugStorage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__currentAccount = new ObservedPropertySimplePU('', this, "currentAccount");
        this.__currentPassword = new ObservedPropertySimplePU('', this, "currentPassword");
        this.__isRemember = new ObservedPropertySimplePU(false, this, "isRemember");
        this.__isLoggedIn = new ObservedPropertySimplePU(false, this, "isLoggedIn");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DebugStorage_Params) {
        if (params.currentAccount !== undefined) {
            this.currentAccount = params.currentAccount;
        }
        if (params.currentPassword !== undefined) {
            this.currentPassword = params.currentPassword;
        }
        if (params.isRemember !== undefined) {
            this.isRemember = params.isRemember;
        }
        if (params.isLoggedIn !== undefined) {
            this.isLoggedIn = params.isLoggedIn;
        }
    }
    updateStateVars(params: DebugStorage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__currentAccount.purgeDependencyOnElmtId(rmElmtId);
        this.__currentPassword.purgeDependencyOnElmtId(rmElmtId);
        this.__isRemember.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoggedIn.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__currentAccount.aboutToBeDeleted();
        this.__currentPassword.aboutToBeDeleted();
        this.__isRemember.aboutToBeDeleted();
        this.__isLoggedIn.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __currentAccount: ObservedPropertySimplePU<string>;
    get currentAccount() {
        return this.__currentAccount.get();
    }
    set currentAccount(newValue: string) {
        this.__currentAccount.set(newValue);
    }
    private __currentPassword: ObservedPropertySimplePU<string>;
    get currentPassword() {
        return this.__currentPassword.get();
    }
    set currentPassword(newValue: string) {
        this.__currentPassword.set(newValue);
    }
    private __isRemember: ObservedPropertySimplePU<boolean>;
    get isRemember() {
        return this.__isRemember.get();
    }
    set isRemember(newValue: boolean) {
        this.__isRemember.set(newValue);
    }
    private __isLoggedIn: ObservedPropertySimplePU<boolean>;
    get isLoggedIn() {
        return this.__isLoggedIn.get();
    }
    set isLoggedIn(newValue: boolean) {
        this.__isLoggedIn.set(newValue);
    }
    async aboutToAppear() {
        await this.loadStorageData();
    }
    async loadStorageData() {
        this.currentAccount = await StorageUtil.getUserAccount();
        this.currentPassword = await StorageUtil.getUserPassword();
        this.isRemember = await StorageUtil.isRememberPassword();
        this.isLoggedIn = await StorageUtil.isLoggedIn();
    }
    async clearStorage() {
        await StorageUtil.clearAll();
        promptAction.showToast({ message: '已清除所有存储', duration: 2000 });
        await this.loadStorageData();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.padding(20);
            Column.justifyContent(FlexAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('存储调试页面');
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ bottom: 20 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('当前存储状态：');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ bottom: 10 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`账号: ${this.currentAccount || '空'}`);
            Text.fontSize(14);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`密码: ${this.currentPassword ? '***' : '空'}`);
            Text.fontSize(14);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`记住密码: ${this.isRemember ? '是' : '否'}`);
            Text.fontSize(14);
            Text.margin({ bottom: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`登录状态: ${this.isLoggedIn ? '已登录' : '未登录'}`);
            Text.fontSize(14);
            Text.margin({ bottom: 20 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('刷新数据');
            Button.width('80%');
            Button.height(40);
            Button.margin({ bottom: 10 });
            Button.onClick(async () => {
                await this.loadStorageData();
                promptAction.showToast({ message: '数据已刷新', duration: 1000 });
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('清除存储');
            Button.width('80%');
            Button.height(40);
            Button.margin({ bottom: 10 });
            Button.onClick(async () => {
                await this.clearStorage();
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('前往登录页面测试');
            Button.width('80%');
            Button.height(40);
            Button.margin({ bottom: 10 });
            Button.onClick(() => {
                router.pushUrl({ url: 'pages/Login' });
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('返回');
            Button.width('80%');
            Button.height(40);
            Button.onClick(() => {
                router.back();
            });
        }, Button);
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "DebugStorage";
    }
}
registerNamedRoute(() => new DebugStorage(undefined, {}), "", { bundleName: "com.example.reader", moduleName: "entry", pagePath: "common/DebugStorage", pageFullPath: "entry/src/main/ets/common/DebugStorage", integratedHsp: "false", moduleType: "followWithHap" });
