if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Welcome_Params {
    timeId?: number;
    CoverText?: string;
}
import router from "@ohos:router";
import { WindowAbility } from "@bundle:com.example.readerkitdemo/entry/ets/entryability/WindowAbility";
class Welcome extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.timeId = -1;
        this.__CoverText = new ObservedPropertySimplePU('阅读越聪明', this, "CoverText");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Welcome_Params) {
        if (params.timeId !== undefined) {
            this.timeId = params.timeId;
        }
        if (params.CoverText !== undefined) {
            this.CoverText = params.CoverText;
        }
    }
    updateStateVars(params: Welcome_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__CoverText.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__CoverText.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    //用于存储定时器ID
    private timeId: number;
    private __CoverText: ObservedPropertySimplePU<string>;
    get CoverText() {
        return this.__CoverText.get();
    }
    set CoverText(newValue: string) {
        this.__CoverText.set(newValue);
    }
    aboutToAppear() {
        //隐藏状态栏和导航栏，实现沉浸式闪屏
        WindowAbility.getInstance().toggleWindowSystemBar([], this.getUIContext().getHostContext());
        //设置3秒后自动跳转
        this.timeId = setTimeout(() => {
            this.gotoMain();
        }, 3000);
    }
    //跳转到首页（使用replaceUrl避免返回闪屏页，可恶）
    gotoMain() {
        router.replaceUrl({ url: 'pages/MainTab' });
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 5 });
            Column.debugLine("entry/src/main/ets/pages/Welcome.ets(28:5)", "entry");
            Column.width("100%");
            Column.height("100%");
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
            Column.backgroundColor(Color.White);
            Column.onClick(() => {
                //点击立即跳转，并清除定时器
                if (this.timeId !== -1) {
                    clearTimeout(this.timeId);
                    this.timeId = -1;
                }
                this.gotoMain();
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777307, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/Welcome.ets(29:9)", "entry");
            Image.width("70%");
            Image.height("70%");
            Image.objectFit(ImageFit.Contain);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.CoverText);
            Text.debugLine("entry/src/main/ets/pages/Welcome.ets(34:9)", "entry");
            Text.fontWeight(FontWeight.Bold);
            Text.fontSize(30);
            Text.height(56);
            Text.fontColor(Color.Black);
        }, Text);
        Text.pop();
        Column.pop();
    }
    aboutToDisappear() {
        // 组件销毁时清除定时器，防止内存泄漏
        if (this.timeId !== -1) {
            clearTimeout(this.timeId);
            this.timeId = -1;
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Welcome";
    }
}
registerNamedRoute(() => new Welcome(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/Welcome", pageFullPath: "entry/src/main/ets/pages/Welcome", integratedHsp: "false", moduleType: "followWithHap" });
