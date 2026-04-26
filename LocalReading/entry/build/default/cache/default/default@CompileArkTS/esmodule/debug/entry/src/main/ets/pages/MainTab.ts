if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface MainTab_Params {
    currentIndex?: number;
    tabsController?: TabsController;
    bgColor?: string;
}
import { Index } from "@bundle:com.example.reader/entry/ets/pages/Index";
import { Mine } from "@bundle:com.example.reader/entry/ets/pages/Mine";
import { Notes } from "@bundle:com.example.reader/entry@note/Index";
class MainTab extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__currentIndex = new ObservedPropertySimplePU(0, this, "currentIndex");
        this.tabsController = new TabsController();
        this.__bgColor = this.createStorageLink('globalBgColor', '#FFFFFF', "bgColor");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: MainTab_Params) {
        if (params.currentIndex !== undefined) {
            this.currentIndex = params.currentIndex;
        }
        if (params.tabsController !== undefined) {
            this.tabsController = params.tabsController;
        }
    }
    updateStateVars(params: MainTab_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__currentIndex.purgeDependencyOnElmtId(rmElmtId);
        this.__bgColor.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__currentIndex.aboutToBeDeleted();
        this.__bgColor.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __currentIndex: ObservedPropertySimplePU<number>; // 当前选择，控制图标和字体颜色
    get currentIndex() {
        return this.__currentIndex.get();
    }
    set currentIndex(newValue: number) {
        this.__currentIndex.set(newValue);
    }
    private tabsController: TabsController; // tabs的控制器控制页面切换
    private __bgColor: ObservedPropertyAbstractPU<string>;
    get bgColor() {
        return this.__bgColor.get();
    }
    set bgColor(newValue: string) {
        this.__bgColor.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Tabs.create({ barPosition: BarPosition.End, controller: this.tabsController });
            Tabs.vertical(false);
            Tabs.scrollable(false);
            Tabs.backgroundColor(this.bgColor == "#333333" ? this.bgColor : Color.White);
        }, Tabs);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new Index(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/MainTab.ets", line: 15, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "Index" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarBuilder.call(this, "书库", 0, { "id": 16777281, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" }, { "id": 16777280, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
                } });
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new Notes(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/MainTab.ets", line: 20, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "Notes" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarBuilder.call(this, "笔记", 1, { "id": 16777293, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" }, { "id": 16777292, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
                } });
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new Mine(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/MainTab.ets", line: 25, col: 9 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {};
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {});
                        }
                    }, { name: "Mine" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.tabBarBuilder.call(this, "我的", 2, { "id": 16777271, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" }, { "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.reader", "moduleName": "entry" });
                } });
        }, TabContent);
        TabContent.pop();
        Tabs.pop();
    }
    // 自定义tabbar样式结构
    tabBarBuilder(title: string, targetIndex: number, selectedIcon: Resource, unselectedIcon: Resource, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width("100%");
            Column.height(40);
            Column.backgroundColor(this.bgColor == "#333333" ? "#ff777777" : Color.White);
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
            Column.margin({ bottom: 10 });
            Column.onClick(() => {
                this.currentIndex = targetIndex;
                this.tabsController.changeIndex(targetIndex);
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create(this.currentIndex == targetIndex ? selectedIcon : unselectedIcon);
            Image.height(24);
            Image.width(24);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.fontSize(10);
            Text.fontColor(this.currentIndex == targetIndex ? Color.Blue : (this.bgColor == "#333333" ? Color.White : Color.Gray));
            Text.fontWeight(500);
        }, Text);
        Text.pop();
        Column.pop();
    }
    // 禁用动画
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
        return "MainTab";
    }
}
registerNamedRoute(() => new MainTab(undefined, {}), "", { bundleName: "com.example.reader", moduleName: "entry", pagePath: "pages/MainTab", pageFullPath: "entry/src/main/ets/pages/MainTab", integratedHsp: "false", moduleType: "followWithHap" });
