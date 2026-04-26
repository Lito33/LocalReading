if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface About_Params {
    eyeMode?: boolean;
    odd?: number;
    isOddPressed?: boolean;
    isSyncPressed?: boolean;
    windowWidth?: number;
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
        this.__windowWidth = this.createStorageLink('windowWidth', 360
        // 判断是否为平板（物理像素阈值：手机 720-1440，平板 1600+）
        , "windowWidth");
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
        this.__windowWidth.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__eyeMode.aboutToBeDeleted();
        this.__odd.aboutToBeDeleted();
        this.__isOddPressed.aboutToBeDeleted();
        this.__isSyncPressed.aboutToBeDeleted();
        this.__windowWidth.aboutToBeDeleted();
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
    // 响应式布局：监听窗口宽度
    private __windowWidth: ObservedPropertyAbstractPU<number>;
    get windowWidth() {
        return this.__windowWidth.get();
    }
    set windowWidth(newValue: number) {
        this.__windowWidth.set(newValue);
    }
    // 判断是否为平板（物理像素阈值：手机 720-1440，平板 1600+）
    private isTablet(): boolean {
        return this.windowWidth > 1600;
    }
    // 计算卡片宽度
    private getCardWidth(): string {
        return this.isTablet() ? '85%' : '80%';
    }
    // 计算行高
    private getRowHeight(): number {
        return this.isTablet() ? 60 : 50;
    }
    // 计算字体大小
    private getTitleFontSize(): number {
        return this.isTablet() ? 16 : 14;
    }
    // 计算标题字体大小
    private getHeaderFontSize(): number {
        return this.isTablet() ? 22 : 18;
    }
    // 计算图标大小
    private getIconSize(): number {
        return this.isTablet() ? 30 : 25;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/About.ets(53:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777304, "type": 10001, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(54:7)", "entry");
            Row.width('100%');
            Row.margin({ top: this.isTablet() ? 60 : 50, bottom: this.isTablet() ? 60 : 50 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777318, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/About.ets(56:9)", "entry");
            Image.width(this.getIconSize());
            Image.height(this.getIconSize());
            Image.margin({ left: 20 });
            Image.onClick(() => {
                router.back();
            });
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/About.ets(65:9)", "entry");
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("关于本软件");
            Text.debugLine("entry/src/main/ets/pages/About.ets(68:9)", "entry");
            Text.fontSize(this.getHeaderFontSize());
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
            Text.margin({ right: 25 });
            Text.padding({ right: 15 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/About.ets(75:9)", "entry");
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/About.ets(82:7)", "entry");
            Column.margin({ bottom: this.isTablet() ? 45 : 35 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777216, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/About.ets(83:9)", "entry");
            Image.width(this.isTablet() ? 90 : 70);
            Image.height(this.isTablet() ? 90 : 70);
            Image.margin({ bottom: 9 });
            Image.borderRadius(10);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777237, "type": 10003, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Text.debugLine("entry/src/main/ets/pages/About.ets(88:9)", "entry");
            Text.fontSize(this.isTablet() ? 20 : 16);
            Text.fontColor(Color.Black);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //文字
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/About.ets(95:7)", "entry");
            //文字
            Column.width(this.getCardWidth());
            //文字
            Column.borderRadius(8);
            //文字
            Column.backgroundColor(Color.White);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(97:9)", "entry");
            Row.borderRadius({ topLeft: 8, topRight: 8 });
            Row.width('100%');
            Row.height(this.getRowHeight());
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
            Text.debugLine("entry/src/main/ets/pages/About.ets(98:11)", "entry");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("张牧野");
            Text.debugLine("entry/src/main/ets/pages/About.ets(102:11)", "entry");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
            Text.margin({ right: 5 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/About.ets(133:9)", "entry");
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(139:9)", "entry");
            Row.width('100%');
            Row.height(this.getRowHeight());
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("联系邮箱:");
            Text.debugLine("entry/src/main/ets/pages/About.ets(140:11)", "entry");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("3374382907@qq.com");
            Text.debugLine("entry/src/main/ets/pages/About.ets(144:11)", "entry");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
            Text.margin({ right: 5 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/About.ets(155:9)", "entry");
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(161:9)", "entry");
            Row.width('100%');
            Row.height(this.getRowHeight());
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("版本号:");
            Text.debugLine("entry/src/main/ets/pages/About.ets(162:11)", "entry");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("1.1.0");
            Text.debugLine("entry/src/main/ets/pages/About.ets(166:11)", "entry");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
            Text.margin({ right: 5 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/About.ets(176:9)", "entry");
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 数据同步
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(182:9)", "entry");
            // 数据同步
            Row.width('100%');
            // 数据同步
            Row.height(this.getRowHeight());
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
            Row.debugLine("entry/src/main/ets/pages/About.ets(183:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("数据同步");
            Text.debugLine("entry/src/main/ets/pages/About.ets(184:13)", "entry");
            Text.fontSize(this.getTitleFontSize());
            Text.fontColor(Color.Black);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777220, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/About.ets(189:13)", "entry");
            Image.width(this.isTablet() ? 24 : 20);
            Image.height(this.isTablet() ? 24 : 20);
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777310, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/About.ets(194:11)", "entry");
            Image.margin({ right: 5 });
            Image.width(this.isTablet() ? 24 : 20);
            Image.height(this.isTablet() ? 24 : 20);
        }, Image);
        // 数据同步
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(218:9)", "entry");
            Row.width('100%');
            Row.height(50);
            Row.padding({ left: 6, right: 6, top: 6, bottom: 6 });
            Row.justifyContent(FlexAlign.SpaceBetween);
            Row.backgroundColor(this.isSyncPressed ? '#E0E0E0' : Color.White);
            Row.onClick(() => {
                router.pushUrl({ url: 'pages/SyncTest' }).catch((err: Error) => {
                    hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
                });
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 7 });
            Row.debugLine("entry/src/main/ets/pages/About.ets(219:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("数据测试");
            Text.debugLine("entry/src/main/ets/pages/About.ets(220:13)", "entry");
            Text.fontSize(14);
            Text.fontColor(Color.Black);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777220, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/About.ets(225:13)", "entry");
            Image.width(20);
            Image.height(20);
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777310, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/About.ets(230:11)", "entry");
            Image.margin({ right: 5 });
            Image.width(20);
            Image.height(20);
        }, Image);
        Row.pop();
        //文字
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 通知栏
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/About.ets(284:5)", "entry");
            // 通知栏
            Column.margin({ top: 20 });
            // 通知栏
            Column.width(this.getCardWidth());
            // 通知栏
            Column.backgroundColor(Color.White);
            // 通知栏
            Column.borderRadius(12);
            // 通知栏
            Column.shadow({
                radius: 8,
                color: 'rgba(0, 0, 0, 0.08)',
                offsetX: 0,
                offsetY: 2
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题栏
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(286:7)", "entry");
            // 标题栏
            Row.width('100%');
            // 标题栏
            Row.padding({ left: 16, right: 16, top: 12, bottom: 8 });
            // 标题栏
            Row.justifyContent(FlexAlign.Start);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📢');
            Text.debugLine("entry/src/main/ets/pages/About.ets(287:9)", "entry");
            Text.fontSize(this.isTablet() ? 22 : 18);
            Text.margin({ right: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777241, "type": 10003, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
            Text.debugLine("entry/src/main/ets/pages/About.ets(291:9)", "entry");
            Text.fontSize(this.isTablet() ? 18 : 16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
        }, Text);
        Text.pop();
        // 标题栏
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/About.ets(300:7)", "entry");
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 16, right: 16 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 通知内容
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/About.ets(306:7)", "entry");
            // 通知内容
            Column.width('100%');
            // 通知内容
            Column.padding({ left: 16, right: 16, top: 10, bottom: 12 });
            // 通知内容
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(307:9)", "entry");
            Row.width('100%');
            Row.margin({ bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('•');
            Text.debugLine("entry/src/main/ets/pages/About.ets(308:11)", "entry");
            Text.fontSize(this.isTablet() ? 16 : 14);
            Text.fontColor('#FF6B6B');
            Text.margin({ right: 6 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('若手动导入数据后请重启一次应用。');
            Text.debugLine("entry/src/main/ets/pages/About.ets(313:11)", "entry");
            Text.fontSize(this.isTablet() ? 15 : 13);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/About.ets(320:9)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('•');
            Text.debugLine("entry/src/main/ets/pages/About.ets(321:11)", "entry");
            Text.fontSize(this.isTablet() ? 16 : 14);
            Text.fontColor('#FF6B6B');
            Text.margin({ right: 6 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('导入书籍前请先阅读一本书籍在进行导入,若直接开始阅读可以进入更加深色模式哦~');
            Text.debugLine("entry/src/main/ets/pages/About.ets(326:11)", "entry");
            Text.fontSize(this.isTablet() ? 15 : 13);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        Row.pop();
        // 通知内容
        Column.pop();
        // 通知栏
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
registerNamedRoute(() => new About(undefined, {}), "", { bundleName: "com.example.reader", moduleName: "entry", pagePath: "pages/About", pageFullPath: "entry/src/main/ets/pages/About", integratedHsp: "false", moduleType: "followWithHap" });
