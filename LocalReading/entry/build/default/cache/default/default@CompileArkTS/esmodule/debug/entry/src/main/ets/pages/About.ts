if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface About_Params {
    eyeMode?: boolean;
    odd?: number;
    isOddPressed?: boolean;
    isSyncPressed?: boolean;
}
import promptAction from "@ohos:promptAction";
import router from "@ohos:router";
import hilog from "@ohos:hilog";
const TAG = 'About';
class About extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.__odd = new ObservedPropertySimplePU(0, this, "odd");
        this.__isOddPressed = new ObservedPropertySimplePU(false, this, "isOddPressed");
        this.__isSyncPressed = new ObservedPropertySimplePU(false, this, "isSyncPressed");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: About_Params) {
        if (params.odd !== undefined) {
            this.odd = params.odd;
        }
        if (params.isOddPressed !== undefined) {
            this.isOddPressed = params.isOddPressed;
        }
        if (params.isSyncPressed !== undefined) {
            this.isSyncPressed = params.isSyncPressed;
        }
    }
    updateStateVars(params: About_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
        this.__odd.purgeDependencyOnElmtId(rmElmtId);
        this.__isOddPressed.purgeDependencyOnElmtId(rmElmtId);
        this.__isSyncPressed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__eyeMode.aboutToBeDeleted();
        this.__odd.aboutToBeDeleted();
        this.__isOddPressed.aboutToBeDeleted();
        this.__isSyncPressed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __eyeMode: ObservedPropertyAbstractPU<boolean>;
    get eyeMode() {
        return this.__eyeMode.get();
    }
    set eyeMode(newValue: boolean) {
        this.__eyeMode.set(newValue);
    }
    private __odd: ObservedPropertySimplePU<number>;
    get odd() {
        return this.__odd.get();
    }
    set odd(newValue: number) {
        this.__odd.set(newValue);
    }
    private __isOddPressed: ObservedPropertySimplePU<boolean>;
    get isOddPressed() {
        return this.__isOddPressed.get();
    }
    set isOddPressed(newValue: boolean) {
        this.__isOddPressed.set(newValue);
    }
    private __isSyncPressed: ObservedPropertySimplePU<boolean>;
    get isSyncPressed() {
        return this.__isSyncPressed.get();
    }
    set isSyncPressed(newValue: boolean) {
        this.__isSyncPressed.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.margin({ top: 50, bottom: 50 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777277, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(25);
            Image.height(25);
            Image.margin({ left: 20 });
            Image.onClick(() => {
                router.back();
            });
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("关于本软件");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
            Text.margin({ right: 25 });
            Text.padding({ right: 15 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.margin({ bottom: 35 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777217, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(70);
            Image.height(70);
            Image.margin({ bottom: 9 });
            Image.borderRadius(10);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777222, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontSize(16);
            Text.fontColor(Color.Black);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //文字
            Column.create();
            //文字
            Column.width('80%');
            //文字
            Column.borderRadius(8);
            //文字
            Column.backgroundColor(Color.White);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.borderRadius({ topLeft: 8, topRight: 8 });
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            Row.justifyContent(FlexAlign.SpaceBetween);
            Row.backgroundColor(this.isOddPressed ? '#E0E0E0' : Color.White);
            Row.onClick(() => {
                this.odd = (this.odd + 1) % 8;
                if (this.odd == 7) {
                    promptAction.showToast({
                        message: '欢迎来到初星学院！',
                        duration: 2000
                    });
                }
            });
            Row.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    // 按下时改变状态
                    this.isOddPressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    // 松开或取消时恢复状态
                    this.isOddPressed = false;
                }
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("开发人员:");
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("张牧野");
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.margin({ right: 5 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("联系邮箱:");
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("3374382907@qq.com");
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.margin({ right: 5 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("版本号:");
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("1.0.0");
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.margin({ right: 5 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 数据同步
            Row.create();
            // 数据同步
            Row.width('100%');
            // 数据同步
            Row.height(50);
            // 数据同步
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            // 数据同步
            Row.justifyContent(FlexAlign.SpaceBetween);
            // 数据同步
            Row.backgroundColor(this.isSyncPressed ? '#E0E0E0' : Color.White);
            // 数据同步
            Row.onClick(() => {
                router.pushUrl({ url: 'pages/SyncSettings' }).catch((err: Error) => {
                    hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
                });
            });
            // 数据同步
            Row.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    this.isSyncPressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    this.isSyncPressed = false;
                }
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 7 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("数据同步");
            Text.fontSize(14);
            Text.fontColor(Color.Black);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777300, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(20);
            Image.height(20);
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777278, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.margin({ right: 5 });
            Image.width(20);
            Image.height(20);
        }, Image);
        // 数据同步
        Row.pop();
        //文字
        Column.pop();
        Column.pop();
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
        return "About";
    }
}
registerNamedRoute(() => new About(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/About", pageFullPath: "entry/src/main/ets/pages/About", integratedHsp: "false", moduleType: "followWithHap" });
