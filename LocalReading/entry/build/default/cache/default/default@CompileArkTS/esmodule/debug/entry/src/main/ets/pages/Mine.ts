if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Mine_Params {
    isReadingRecordPressed?: boolean;
    isReadingSettingsPressed?: boolean;
    isEyesModePressed?: boolean;
    isClosePressed?: boolean;
    eyeMode?: boolean;
    windowWidth?: number;
    hitokoto?: string;
    source?: string;
    author?: string;
    isLoggedIn?: boolean;
    currentUser?: string;
    isRefreshing?: boolean;
    pullOffset?: number;
    refreshOpacity?: number;
    refreshScale?: number;
}
import { WindowAbility } from "@bundle:com.example.readerkitdemo/entry/ets/entryability/WindowAbility";
import hilog from "@ohos:hilog";
import router from "@ohos:router";
import type common from "@ohos:app.ability.common";
import { EyeModeStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/EyeModeStorage";
import http from "@ohos:net.http";
import { StorageUtil } from "@bundle:com.example.readerkitdemo/entry/ets/utils/StorageUtil";
import promptAction from "@ohos:promptAction";
const TAG = 'MinePage';
interface DataReception {
    hitokoto: string;
    type: string;
    source: string;
    author: string;
    length: number;
}
interface ApiResponse {
    code: number;
    msg: string;
    data: DataReception;
}
export class Mine extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__isReadingRecordPressed = new ObservedPropertySimplePU(false, this, "isReadingRecordPressed");
        this.__isReadingSettingsPressed = new ObservedPropertySimplePU(false, this, "isReadingSettingsPressed");
        this.__isEyesModePressed = new ObservedPropertySimplePU(false, this, "isEyesModePressed");
        this.__isClosePressed = new ObservedPropertySimplePU(false, this, "isClosePressed");
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.__windowWidth = this.createStorageLink('windowWidth', 360
        // 判断是否为平板（物理像素阈值：手机 720-1440，平板 1600+）
        , "windowWidth");
        this.__hitokoto = new ObservedPropertySimplePU('', this, "hitokoto");
        this.__source = new ObservedPropertySimplePU('', this, "source");
        this.__author = new ObservedPropertySimplePU('', this, "author");
        this.__isLoggedIn = new ObservedPropertySimplePU(false, this, "isLoggedIn");
        this.__currentUser = new ObservedPropertySimplePU('', this, "currentUser");
        this.__isRefreshing = new ObservedPropertySimplePU(false, this, "isRefreshing");
        this.__pullOffset = new ObservedPropertySimplePU(0, this, "pullOffset");
        this.__refreshOpacity = new ObservedPropertySimplePU(0, this, "refreshOpacity");
        this.__refreshScale = new ObservedPropertySimplePU(0.5, this, "refreshScale");
        this.setInitiallyProvidedValue(params);
        this.declareWatch("eyeMode", this.onEyeModeChange);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Mine_Params) {
        if (params.isReadingRecordPressed !== undefined) {
            this.isReadingRecordPressed = params.isReadingRecordPressed;
        }
        if (params.isReadingSettingsPressed !== undefined) {
            this.isReadingSettingsPressed = params.isReadingSettingsPressed;
        }
        if (params.isEyesModePressed !== undefined) {
            this.isEyesModePressed = params.isEyesModePressed;
        }
        if (params.isClosePressed !== undefined) {
            this.isClosePressed = params.isClosePressed;
        }
        if (params.hitokoto !== undefined) {
            this.hitokoto = params.hitokoto;
        }
        if (params.source !== undefined) {
            this.source = params.source;
        }
        if (params.author !== undefined) {
            this.author = params.author;
        }
        if (params.isLoggedIn !== undefined) {
            this.isLoggedIn = params.isLoggedIn;
        }
        if (params.currentUser !== undefined) {
            this.currentUser = params.currentUser;
        }
        if (params.isRefreshing !== undefined) {
            this.isRefreshing = params.isRefreshing;
        }
        if (params.pullOffset !== undefined) {
            this.pullOffset = params.pullOffset;
        }
        if (params.refreshOpacity !== undefined) {
            this.refreshOpacity = params.refreshOpacity;
        }
        if (params.refreshScale !== undefined) {
            this.refreshScale = params.refreshScale;
        }
    }
    updateStateVars(params: Mine_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isReadingRecordPressed.purgeDependencyOnElmtId(rmElmtId);
        this.__isReadingSettingsPressed.purgeDependencyOnElmtId(rmElmtId);
        this.__isEyesModePressed.purgeDependencyOnElmtId(rmElmtId);
        this.__isClosePressed.purgeDependencyOnElmtId(rmElmtId);
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
        this.__windowWidth.purgeDependencyOnElmtId(rmElmtId);
        this.__hitokoto.purgeDependencyOnElmtId(rmElmtId);
        this.__source.purgeDependencyOnElmtId(rmElmtId);
        this.__author.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoggedIn.purgeDependencyOnElmtId(rmElmtId);
        this.__currentUser.purgeDependencyOnElmtId(rmElmtId);
        this.__isRefreshing.purgeDependencyOnElmtId(rmElmtId);
        this.__pullOffset.purgeDependencyOnElmtId(rmElmtId);
        this.__refreshOpacity.purgeDependencyOnElmtId(rmElmtId);
        this.__refreshScale.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isReadingRecordPressed.aboutToBeDeleted();
        this.__isReadingSettingsPressed.aboutToBeDeleted();
        this.__isEyesModePressed.aboutToBeDeleted();
        this.__isClosePressed.aboutToBeDeleted();
        this.__eyeMode.aboutToBeDeleted();
        this.__windowWidth.aboutToBeDeleted();
        this.__hitokoto.aboutToBeDeleted();
        this.__source.aboutToBeDeleted();
        this.__author.aboutToBeDeleted();
        this.__isLoggedIn.aboutToBeDeleted();
        this.__currentUser.aboutToBeDeleted();
        this.__isRefreshing.aboutToBeDeleted();
        this.__pullOffset.aboutToBeDeleted();
        this.__refreshOpacity.aboutToBeDeleted();
        this.__refreshScale.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    //为每个Row创建独立的状态变量来控制点击背景颜色
    private __isReadingRecordPressed: ObservedPropertySimplePU<boolean>;
    get isReadingRecordPressed() {
        return this.__isReadingRecordPressed.get();
    }
    set isReadingRecordPressed(newValue: boolean) {
        this.__isReadingRecordPressed.set(newValue);
    }
    private __isReadingSettingsPressed: ObservedPropertySimplePU<boolean>;
    get isReadingSettingsPressed() {
        return this.__isReadingSettingsPressed.get();
    }
    set isReadingSettingsPressed(newValue: boolean) {
        this.__isReadingSettingsPressed.set(newValue);
    }
    private __isEyesModePressed: ObservedPropertySimplePU<boolean>;
    get isEyesModePressed() {
        return this.__isEyesModePressed.get();
    }
    set isEyesModePressed(newValue: boolean) {
        this.__isEyesModePressed.set(newValue);
    }
    private __isClosePressed: ObservedPropertySimplePU<boolean>;
    get isClosePressed() {
        return this.__isClosePressed.get();
    }
    set isClosePressed(newValue: boolean) {
        this.__isClosePressed.set(newValue);
    }
    //全局护眼模式状态,顺便监听
    private __eyeMode: ObservedPropertyAbstractPU<boolean>;
    get eyeMode() {
        return this.__eyeMode.get();
    }
    set eyeMode(newValue: boolean) {
        this.__eyeMode.set(newValue);
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
        return this.isTablet() ? 80 : 70;
    }
    // 计算字体大小
    private getTitleFontSize(): number {
        return this.isTablet() ? 22 : 18;
    }
    async onEyeModeChange() {
        const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
        await EyeModeStorage.saveEyeMode(context, this.eyeMode);
    }
    private __hitokoto: ObservedPropertySimplePU<string>;
    get hitokoto() {
        return this.__hitokoto.get();
    }
    set hitokoto(newValue: string) {
        this.__hitokoto.set(newValue);
    }
    private __source: ObservedPropertySimplePU<string>;
    get source() {
        return this.__source.get();
    }
    set source(newValue: string) {
        this.__source.set(newValue);
    }
    private __author: ObservedPropertySimplePU<string>;
    get author() {
        return this.__author.get();
    }
    set author(newValue: string) {
        this.__author.set(newValue);
    }
    //获取名言
    async fetchQuote() {
        //创建实例
        const httpRequest = http.createHttp();
        try {
            const response = await httpRequest.request('https://api.52vmy.cn/api/wl/yan/yiyan', {
                method: http.RequestMethod.GET,
                connectTimeout: 60000,
                readTimeout: 60000,
                header: { 'Content-Type': 'application/json' }
            });
            if (response.responseCode === 200) {
                const result = JSON.parse(response.result as string) as ApiResponse;
                if (result.code === 200) {
                    this.hitokoto = result.data.hitokoto;
                    this.source = result.data.source;
                    this.author = result.data.author;
                    hilog.info(0x0000, TAG, "source info ", this.author);
                }
                else {
                    console.error('API error:', result.msg);
                }
            }
            else {
                console.error('HTTP error:', response.responseCode);
            }
        }
        catch (error) {
            console.error('Request failed:', JSON.stringify(error));
        }
        finally {
            httpRequest.destroy();
        }
    }
    private __isLoggedIn: ObservedPropertySimplePU<boolean>;
    get isLoggedIn() {
        return this.__isLoggedIn.get();
    }
    set isLoggedIn(newValue: boolean) {
        this.__isLoggedIn.set(newValue);
    }
    private __currentUser: ObservedPropertySimplePU<string>;
    get currentUser() {
        return this.__currentUser.get();
    }
    set currentUser(newValue: string) {
        this.__currentUser.set(newValue);
    }
    private __isRefreshing: ObservedPropertySimplePU<boolean>; //刷新状态
    get isRefreshing() {
        return this.__isRefreshing.get();
    }
    set isRefreshing(newValue: boolean) {
        this.__isRefreshing.set(newValue);
    }
    private __pullOffset: ObservedPropertySimplePU<number>; //下拉偏移量
    get pullOffset() {
        return this.__pullOffset.get();
    }
    set pullOffset(newValue: number) {
        this.__pullOffset.set(newValue);
    }
    private __refreshOpacity: ObservedPropertySimplePU<number>; //图片透明度
    get refreshOpacity() {
        return this.__refreshOpacity.get();
    }
    set refreshOpacity(newValue: number) {
        this.__refreshOpacity.set(newValue);
    }
    private __refreshScale: ObservedPropertySimplePU<number>; //图片缩放
    get refreshScale() {
        return this.__refreshScale.get();
    }
    set refreshScale(newValue: number) {
        this.__refreshScale.set(newValue);
    }
    async aboutToAppear() {
        WindowAbility.getInstance().toggleWindowSystemBar(['status', 'navigation'], this.getUIContext().getHostContext());
        this.fetchQuote();
        await this.loadLoginStatus();
    }
    // 监听页面显示事件
    onPageShow() {
        hilog.info(0x0000, TAG, 'Mine page shown, loading login status');
        this.loadLoginStatus(); // 重新获取登录状态
    }
    // 下拉刷新处理
    async onRefresh() {
        if (this.isRefreshing) {
            return;
        }
        this.isRefreshing = true;
        // 开始刷新动画
        this.startRefreshAnimation();
        hilog.info(0x0000, TAG, '下拉刷新开始');
        try {
            // 重新加载登录状态
            await this.loadLoginStatus();
            // 重新获取名言
            this.fetchQuote();
            promptAction.showToast({ message: '刷新成功', duration: 1000 });
        }
        catch (error) {
            hilog.error(0x0000, TAG, '下拉刷新失败: ' + JSON.stringify(error));
            promptAction.showToast({ message: '刷新失败', duration: 1500 });
        }
        finally {
            // 模拟刷新延迟，让用户看到刷新效果
            setTimeout(() => {
                this.isRefreshing = false;
                // 结束刷新动画
                this.stopRefreshAnimation();
                hilog.info(0x0000, TAG, '下拉刷新结束');
            }, 1500);
        }
    }
    // 开始刷新动画
    startRefreshAnimation() {
        // 刷新时保持图片显示状态
        this.refreshOpacity = 1;
        this.refreshScale = 1;
        // 旋转动画
        const rotateAnimation = () => {
            if (this.isRefreshing) {
                // 刷新过程中可以添加微妙的缩放动画
                this.refreshScale = 1 + Math.sin(Date.now() / 300) * 0.05;
                setTimeout(rotateAnimation, 50);
            }
        };
        rotateAnimation();
    }
    // 停止刷新动画
    stopRefreshAnimation() {
        // 平滑淡出动画
        const fadeOutAnimation = () => {
            this.refreshOpacity -= 0.1;
            this.refreshScale -= 0.05;
            if (this.refreshOpacity > 0) {
                setTimeout(fadeOutAnimation, 30);
            }
            else {
                this.refreshOpacity = 0;
                this.refreshScale = 0.5;
                this.pullOffset = 0;
            }
        };
        fadeOutAnimation();
    }
    // 自定义下拉刷新指示器
    customRefreshIndicator(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('95%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777296, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Context.animation({
                duration: 200,
                curve: Curve.EaseOut
            });
            Image.width('90%');
            Image.height(this.pullOffset);
            Image.objectFit(ImageFit.Cover);
            Image.clip(true);
            Image.opacity(this.refreshOpacity);
            Image.scale({ x: this.refreshScale, y: this.refreshScale });
            Context.animation(null);
        }, Image);
        Column.pop();
    }
    async loadLoginStatus() {
        const loggedIn = await StorageUtil.isLoggedIn();
        hilog.info(0x0000, TAG, 'loadLoginStatus: isLoggedIn = ' + loggedIn);
        this.isLoggedIn = loggedIn;
        if (this.isLoggedIn) {
            this.currentUser = await StorageUtil.getCurrentUser();
            hilog.info(0x0000, TAG, 'loadLoginStatus: currentUser = ' + this.currentUser);
        }
        else {
            this.currentUser = '';
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
            Refresh.create({
                refreshing: this.isRefreshing
            });
            // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
            Refresh.onRefreshing(() => {
                this.onRefresh();
            });
            // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
            Refresh.onStateChange((refreshStatus: RefreshStatus) => {
                // 监听刷新状态变化
                // status = 0 ： 默认未下拉
                // status = 1、2：下拉中
                // status = 3：下拉完成，回弹中
                // status = 4：刷新结束，返回初始状态
                if (refreshStatus >= 1 && refreshStatus < 4) {
                    // 下拉过程中，平滑显示图片
                    if (this.refreshOpacity < 1) {
                        this.refreshOpacity = Math.min(this.refreshOpacity + 0.2, 1);
                    }
                    if (this.refreshScale < 1) {
                        this.refreshScale = Math.min(this.refreshScale + 0.1, 1);
                    }
                    this.pullOffset = 120; // 固定下拉距离显示图片
                }
                else if (refreshStatus === 0) {
                    // 恢复初始状态，但保持平滑过渡
                    if (this.refreshOpacity > 0) {
                        this.refreshOpacity = Math.max(this.refreshOpacity - 0.1, 0);
                    }
                    if (this.refreshScale > 0.5) {
                        this.refreshScale = Math.max(this.refreshScale - 0.05, 0.5);
                    }
                    if (this.refreshOpacity <= 0) {
                        this.pullOffset = 0;
                    }
                }
            });
            // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
            Refresh.width('100%');
            // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
            Refresh.height('100%');
            // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
            Refresh.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Refresh);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.width('100%');
            Scroll.height('100%');
            Scroll.scrollBar(BarState.Off);
            Scroll.edgeEffect(EdgeEffect.Spring);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
        }, Column);
        // 自定义下拉刷新指示器
        this.customRefreshIndicator.bind(this)();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 10 });
            Row.margin({ top: 50, bottom: 20 });
            Row.width('80%');
            Row.height(this.isTablet() ? 120 : 100);
            Row.backgroundColor(Color.White);
            Row.border({ width: 2 });
            Row.borderRadius(10);
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777303, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(this.isTablet() ? 60 : 50);
            Image.height(this.isTablet() ? 60 : 50);
            Image.margin({ left: 25 });
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 5 });
            Column.margin({ right: 25 });
            Column.justifyContent(FlexAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isLoggedIn ? this.currentUser : "未登录");
            Text.fontColor(Color.Black);
            Text.fontSize(this.getTitleFontSize());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            //如果未登录则显示"登录"，如果已经登录则显示"退出登录"
            //点击后如果未登录，则跳转到登录界面
            if (this.isLoggedIn) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel("退出登录");
                        Button.width(this.isTablet() ? 120 : 100);
                        Button.borderRadius(8);
                        Button.backgroundColor(Color.Red);
                        Button.onClick(async () => {
                            // 退出登录
                            await StorageUtil.setLoggedOut();
                            AppStorage.setOrCreate('currentUser', ''); //清除
                            this.isLoggedIn = false;
                            this.currentUser = '';
                            promptAction.showToast({ message: '已退出登录', duration: 1500 });
                        });
                    }, Button);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel("登录/注册");
                        Button.width(this.isTablet() ? 120 : 100);
                        Button.borderRadius(8);
                        Button.backgroundColor("#007DFF");
                        Button.onClick(() => {
                            router.pushUrl({ url: 'pages/Login' }).catch(() => {
                                hilog.error(0x0000, TAG, "登录路由跳转失败");
                            });
                        });
                    }, Button);
                    Button.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //阅读记录
            Row.create();
            //阅读记录
            Row.height(this.getRowHeight());
            //阅读记录
            Row.width(this.getCardWidth());
            //阅读记录
            Row.borderRadius(10);
            //阅读记录
            Row.justifyContent(FlexAlign.SpaceBetween);
            //阅读记录
            Row.backgroundColor(this.isReadingRecordPressed ? '#E0E0E0' : Color.White);
            //阅读记录
            Row.margin({ top: 40 });
            //阅读记录
            Row.onClick(() => {
                router.pushUrl({ url: 'pages/ReadingRecord' }).catch((err: Error) => {
                    hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
                });
            });
            //阅读记录
            Row.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    // 按下时改变状态
                    this.isReadingRecordPressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    // 松开或取消时恢复状态
                    this.isReadingRecordPressed = false;
                }
            });
            //阅读记录
            Row.border({ width: 2 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 7 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("阅读记录");
            Text.fontSize(this.getTitleFontSize());
            Text.fontColor(Color.Black);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ left: 10 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777295, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(23);
            Image.height(23);
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777278, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.margin({ right: 10 });
            Image.width(25);
            Image.height(25);
        }, Image);
        //阅读记录
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //关于
            Row.create();
            //关于
            Row.height(this.getRowHeight());
            //关于
            Row.width(this.getCardWidth());
            //关于
            Row.borderRadius(10);
            //关于
            Row.justifyContent(FlexAlign.SpaceBetween);
            //关于
            Row.backgroundColor(this.isReadingSettingsPressed ? '#E0E0E0' : Color.White);
            //关于
            Row.margin({ top: 15 });
            //关于
            Row.onClick(() => {
                //跳转到关于界面
                router.pushUrl({ url: 'pages/About' }).catch((err: Error) => {
                    hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
                });
            });
            //关于
            Row.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    // 按下时改变状态
                    this.isReadingSettingsPressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    // 松开或取消时恢复状态
                    this.isReadingSettingsPressed = false;
                }
            });
            //关于
            Row.border({ width: 2 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("关于");
            Text.fontSize(18);
            Text.fontColor(Color.Black);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ left: 10 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777276, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(23);
            Image.height(23);
            Image.margin({ left: 5 });
        }, Image);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777278, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.margin({ right: 10 });
            Image.width(25);
            Image.height(25);
        }, Image);
        //关于
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //护眼模式
            Row.create();
            //护眼模式
            Row.height(this.getRowHeight());
            //护眼模式
            Row.width(this.getCardWidth());
            //护眼模式
            Row.borderRadius(10);
            //护眼模式
            Row.justifyContent(FlexAlign.SpaceBetween);
            //护眼模式
            Row.backgroundColor(this.isEyesModePressed ? '#E0E0E0' : Color.White);
            //护眼模式
            Row.margin({ top: 15 });
            //护眼模式
            Row.onClick(() => {
                //改变图标样式
                this.eyeMode = !this.eyeMode;
                //改变全局背景
            });
            //护眼模式
            Row.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    // 按下时改变状态
                    this.isEyesModePressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    // 松开或取消时恢复状态
                    this.isEyesModePressed = false;
                }
            });
            //护眼模式
            Row.border({ width: 2 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("护眼模式");
            Text.fontSize(18);
            Text.fontColor(Color.Black);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ left: 10 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create(this.eyeMode == false ? { "id": 16777287, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777288, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.margin({ right: 10 });
            Image.width(25);
            Image.height(25);
        }, Image);
        //护眼模式
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //退出按钮
            Row.create();
            //退出按钮
            Row.height(this.getRowHeight());
            //退出按钮
            Row.width(this.getCardWidth());
            //退出按钮
            Row.borderRadius(10);
            //退出按钮
            Row.justifyContent(FlexAlign.SpaceBetween);
            //退出按钮
            Row.backgroundColor(this.isClosePressed ? '#E0E0E0' : Color.White);
            //退出按钮
            Row.margin({ top: 15 });
            //退出按钮
            Row.onClick(() => {
                //退出应用
                const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
                context.terminateSelf();
            });
            //退出按钮
            Row.onTouch((event: TouchEvent) => {
                if (event.type === TouchType.Down) {
                    // 按下时改变状态
                    this.isClosePressed = true;
                }
                else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
                    // 松开或取消时恢复状态
                    this.isClosePressed = false;
                }
            });
            //退出按钮
            Row.border({ width: 2 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("退出应用");
            Text.fontSize(18);
            Text.fontColor(Color.Black);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ left: 10 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777278, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.margin({ right: 10 });
            Image.width(25);
            Image.height(25);
        }, Image);
        //退出按钮
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //调用接口，显示数
            Column.create();
            //调用接口，显示数
            Column.margin({ top: 30 });
            //调用接口，显示数
            Column.width('80%');
            //调用接口，显示数
            Column.height(120);
            //调用接口，显示数
            Column.backgroundColor(Color.White);
            //调用接口，显示数
            Column.borderRadius(8);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('"' + this.hitokoto + '"');
            Text.fontFamily('HuaKangFont');
            Text.fontSize(16);
            Text.fontColor(Color.Black);
            Text.maxLines(4);
            Text.textAlign(TextAlign.Start);
            Text.padding(10);
            Text.margin({ left: 4 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('——' + this.source);
            Text.fontWeight(FontWeight.Bold);
            Text.fontSize(14);
            Text.fontColor(Color.Gray);
            Text.textAlign(TextAlign.End);
            Text.margin({ right: 10 });
            Text.width('100%');
        }, Text);
        Text.pop();
        //调用接口，显示数
        Column.pop();
        Column.pop();
        Scroll.pop();
        // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
        Refresh.pop();
    }
    //删除页面过渡动画以加快阅读器的页面访问速度
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
        return "Mine";
    }
}
registerNamedRoute(() => new Mine(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/Mine", pageFullPath: "entry/src/main/ets/pages/Mine", integratedHsp: "false", moduleType: "followWithHap" });
