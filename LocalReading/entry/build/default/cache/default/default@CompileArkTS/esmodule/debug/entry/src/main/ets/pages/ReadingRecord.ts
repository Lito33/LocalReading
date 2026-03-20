if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ReadingRecord_Params {
    eyeMode?: boolean;
    recentBooks?: BookParserInfo[];
    olderBooks?: BookParserInfo[];
    currentUser?: string;
    windowHeight?: number;
    progressMap?: Map<string, BookProgress>;
    ITEM_HEIGHT?: number;
    DEFAULT_MAX_ITEMS?: number;
}
import router from "@ohos:router";
import type common from "@ohos:app.ability.common";
import { ProgressStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
import type { BookProgress } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
import { BookStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookStorage";
import type { BookParserInfo } from '../common/BookParserInfo';
import hilog from "@ohos:hilog";
import { WindowAbility } from "@bundle:com.example.readerkitdemo/entry/ets/entryability/WindowAbility";
const TAG = 'ReadingRecord';
class ReadingRecord extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.__recentBooks = new ObservedPropertyObjectPU([], this, "recentBooks");
        this.__olderBooks = new ObservedPropertyObjectPU([], this, "olderBooks");
        this.__currentUser = this.createStorageLink('currentUser', '', "currentUser");
        this.__windowHeight = this.createStorageLink('windowHeight', 0, "windowHeight");
        this.progressMap = new Map();
        this.ITEM_HEIGHT = 88;
        this.DEFAULT_MAX_ITEMS = 4;
        this.setInitiallyProvidedValue(params);
        this.declareWatch("currentUser", this.onUserChange);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ReadingRecord_Params) {
        if (params.recentBooks !== undefined) {
            this.recentBooks = params.recentBooks;
        }
        if (params.olderBooks !== undefined) {
            this.olderBooks = params.olderBooks;
        }
        if (params.progressMap !== undefined) {
            this.progressMap = params.progressMap;
        }
        if (params.ITEM_HEIGHT !== undefined) {
            this.ITEM_HEIGHT = params.ITEM_HEIGHT;
        }
        if (params.DEFAULT_MAX_ITEMS !== undefined) {
            this.DEFAULT_MAX_ITEMS = params.DEFAULT_MAX_ITEMS;
        }
    }
    updateStateVars(params: ReadingRecord_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
        this.__recentBooks.purgeDependencyOnElmtId(rmElmtId);
        this.__olderBooks.purgeDependencyOnElmtId(rmElmtId);
        this.__currentUser.purgeDependencyOnElmtId(rmElmtId);
        this.__windowHeight.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__eyeMode.aboutToBeDeleted();
        this.__recentBooks.aboutToBeDeleted();
        this.__olderBooks.aboutToBeDeleted();
        this.__currentUser.aboutToBeDeleted();
        this.__windowHeight.aboutToBeDeleted();
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
    //最近7天的书籍
    private __recentBooks: ObservedPropertyObjectPU<BookParserInfo[]>;
    get recentBooks() {
        return this.__recentBooks.get();
    }
    set recentBooks(newValue: BookParserInfo[]) {
        this.__recentBooks.set(newValue);
    }
    //之前的书籍
    private __olderBooks: ObservedPropertyObjectPU<BookParserInfo[]>;
    get olderBooks() {
        return this.__olderBooks.get();
    }
    set olderBooks(newValue: BookParserInfo[]) {
        this.__olderBooks.set(newValue);
    }
    private __currentUser: ObservedPropertyAbstractPU<string>;
    get currentUser() {
        return this.__currentUser.get();
    }
    set currentUser(newValue: string) {
        this.__currentUser.set(newValue);
    }
    // 监听窗口高度，用于自适应布局
    private __windowHeight: ObservedPropertyAbstractPU<number>;
    get windowHeight() {
        return this.__windowHeight.get();
    }
    set windowHeight(newValue: number) {
        this.__windowHeight.set(newValue);
    }
    private progressMap: Map<string, BookProgress>; // filePath -> progress
    // ListItem的高度（包含间距）
    private readonly ITEM_HEIGHT: number; // 80(内容高度) + 8(space间距)
    // 默认最大显示项数（严格限制为4个）
    private readonly DEFAULT_MAX_ITEMS: number;
    // 计算List的最大高度（自适应不同屏幕）
    private calculateMaxListHeight(itemCount: number): number {
        // 严格限制：最多显示4个ListItem
        // 如果项数 <= 4，显示所有项
        // 如果项数 > 4，限制为4项的高度，超出部分可滚动
        const actualItemCount = Math.min(itemCount, this.DEFAULT_MAX_ITEMS);
        const calculatedHeight = actualItemCount * this.ITEM_HEIGHT;
        // 考虑屏幕高度限制（确保不会占满整个屏幕）
        const availableHeight = this.windowHeight > 0 ? this.windowHeight - 300 : 500;
        const maxByScreen = availableHeight * 0.45; // 每个List最多占可用空间的45%
        // 最终高度：取计算高度和屏幕限制的较小值
        const finalHeight = Math.min(calculatedHeight, maxByScreen);
        hilog.info(0x0000, TAG, `calculateMaxListHeight: itemCount=${itemCount}, actualItemCount=${actualItemCount}, ` +
            `calculatedHeight=${calculatedHeight}, maxByScreen=${maxByScreen}, finalHeight=${finalHeight}`);
        return finalHeight;
    }
    async aboutToAppear() {
        WindowAbility.getInstance().toggleWindowSystemBar(['status', 'navigation'], this.getUIContext().getHostContext());
        await this.loadReadingRecords();
    }
    async loadReadingRecords() {
        const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
        hilog.info(0x0000, TAG, `ReadingRecord: loading records for user: ${this.currentUser}`);
        //加载所有进度
        const progresses = await ProgressStorage.loadAllProgresses(context, this.currentUser);
        hilog.info(0x0000, TAG, `ReadingRecord: loaded ${progresses.length} progress records`);
        //加载所有书籍信息（用于获取书名、封面等）
        const allBooks = await BookStorage.loadBooks(context, this.currentUser);
        hilog.info(0x0000, TAG, `ReadingRecord: loaded ${allBooks.length} books`);
        //建立filePath到书籍信息的映射
        const bookMap = new Map<string, BookParserInfo>();
        allBooks.forEach(book => bookMap.set(book.getFilePath(), book));
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recent: BookParserInfo[] = [];
        const older: BookParserInfo[] = [];
        //按 lastReadTime 降序排序（最新的在前）
        const sortedProgresses = progresses.sort((a, b) => b.lastReadTime - a.lastReadTime);
        for (const prog of sortedProgresses) {
            const book = bookMap.get(prog.filePath);
            if (!book) {
                hilog.warn(0x0000, TAG, `ReadingRecord: book not found for filePath ${prog.filePath}`);
                continue; //书籍可能已被删除
            }
            //保存进度信息到 map，便于后续跳转时使用
            this.progressMap.set(prog.filePath, prog);
            hilog.info(0x0000, TAG, `Processing progress: filePath=${prog.filePath}, lastReadTime=${prog.lastReadTime}, chapter=${prog.chapterName}`);
            if (prog.lastReadTime >= sevenDaysAgo) {
                recent.push(book);
                hilog.info(0x0000, TAG, `Added to recent`);
            }
            else {
                older.push(book);
                hilog.info(0x0000, TAG, `Added to older`);
            }
        }
        hilog.info(0x0000, TAG, `Recent books count: ${recent.length}, Older books count: ${older.length}`);
        this.recentBooks = recent;
        this.olderBooks = older;
        hilog.info(0x0000, TAG, `ReadingRecord: recent books: ${recent.length}, older books: ${older.length}`);
    }
    //页面显示时刷新
    onPageShow() {
        this.loadReadingRecords();
    }
    //用户切换时刷新
    async onUserChange() {
        hilog.info(0x0000, TAG, `ReadingRecord: user changed to ${this.currentUser}`);
        await this.loadReadingRecords();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题栏
            Row.create();
            // 标题栏
            Row.width('100%');
            // 标题栏
            Row.margin({ top: 50, bottom: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777277, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.width(25);
            Image.height(25);
            Image.margin({ left: 20 });
            Image.onClick(() => router.back());
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('阅读记录');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
            Text.margin({ right: 15 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.layoutWeight(1);
        }, Blank);
        Blank.pop();
        // 标题栏
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.layoutWeight(1);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //最近7天
            Column.create();
            //最近7天
            Column.margin({ right: 10, left: 10 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('最近7天');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
            Text.width('100%');
            Text.padding({ left: 16, bottom: 8 });
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.recentBooks.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create({ space: 8 });
                        List.scrollBar(BarState.Off);
                        List.borderRadius(8);
                        List.width('100%');
                        List.height(this.calculateMaxListHeight(this.recentBooks.length));
                        List.backgroundColor(Color.Transparent);
                        List.margin({ right: 10 });
                    }, List);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const book = _item;
                            {
                                const itemCreation = (elmtId, isInitialRender) => {
                                    ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                                    ListItem.create(deepRenderFunction, true);
                                    if (!isInitialRender) {
                                        ListItem.pop();
                                    }
                                    ViewStackProcessor.StopGetAccessRecording();
                                };
                                const itemCreation2 = (elmtId, isInitialRender) => {
                                    ListItem.create(deepRenderFunction, true);
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.RecordItem.bind(this)(book);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.recentBooks, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('暂无最近7天的阅读记录');
                        Text.fontSize(14);
                        Text.fontColor(Color.Gray);
                        Text.width('100%');
                        Text.textAlign(TextAlign.Center);
                        Text.height(60);
                        Text.backgroundColor(Color.White);
                        Text.borderRadius(8);
                        Text.margin({ left: 16, right: 16 });
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        //最近7天
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 固定下半部分：之前
            Column.create();
            // 固定下半部分：之前
            Column.margin({ right: 10, left: 10 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('之前');
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
            Text.width('100%');
            Text.padding({ left: 16, bottom: 8 });
            Text.margin({ top: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.olderBooks.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create({ space: 8 });
                        List.scrollBar(BarState.Off);
                        List.margin({ right: 8 });
                        List.width('100%');
                        List.height(this.calculateMaxListHeight(this.olderBooks.length));
                        List.backgroundColor(Color.Transparent);
                    }, List);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const book = _item;
                            {
                                const itemCreation = (elmtId, isInitialRender) => {
                                    ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                                    ListItem.create(deepRenderFunction, true);
                                    if (!isInitialRender) {
                                        ListItem.pop();
                                    }
                                    ViewStackProcessor.StopGetAccessRecording();
                                };
                                const itemCreation2 = (elmtId, isInitialRender) => {
                                    ListItem.create(deepRenderFunction, true);
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.RecordItem.bind(this)(book);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.olderBooks, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('暂无更早的阅读记录');
                        Text.fontSize(14);
                        Text.fontColor(Color.Gray);
                        Text.width('100%');
                        Text.textAlign(TextAlign.Center);
                        Text.height(60);
                        Text.backgroundColor(Color.White);
                        Text.borderRadius(8);
                        Text.margin({ left: 16, right: 16 });
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        // 固定下半部分：之前
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 当两个列表都为空时的提示
            if (this.recentBooks.length === 0 && this.olderBooks.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('暂无阅读记录');
                        Text.fontSize(16);
                        Text.fontColor(Color.Gray);
                        Text.margin({ top: 50 });
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
        Scroll.pop();
        Column.pop();
    }
    RecordItem(book: BookParserInfo, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(80);
            Row.padding(12);
            Row.backgroundColor(Color.White);
            Row.borderRadius(8);
            Row.margin({ left: 16, right: 13 });
            Row.onClick(() => {
                // 跳转到阅读器，并恢复进度
                const progress = this.progressMap.get(book.getFilePath());
                if (progress) {
                    router.pushUrl({
                        url: 'pages/Reader',
                        params: {
                            filePath: book.getFilePath(),
                            resourceIndex: progress.resourceIndex,
                            domPos: progress.startDomPos
                        }
                    });
                }
                else { //万一没有进度？
                    router.pushUrl({
                        url: 'pages/Reader',
                        params: {
                            filePath: book.getFilePath(),
                            resourceIndex: 0,
                            domPos: ''
                        }
                    });
                }
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //封面
            Image.create(book.getCoverPath() ? 'file://' + book.getCoverPath() : { "id": 16777285, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            //封面
            Image.width(60);
            //封面
            Image.height(75);
            //封面
            Image.objectFit(ImageFit.Cover);
            //封面
            Image.borderRadius(8);
            //封面
            Image.margin({ right: 12 });
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //书名和章节
            Column.create();
            //书名和章节
            Column.layoutWeight(1);
            //书名和章节
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(book.getBookName());
            Text.fontSize(16);
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
            Text.fontColor(Color.Black);
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getChapterDisplay(book));
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.margin({ top: 4 });
            Text.width('100%');
        }, Text);
        Text.pop();
        //书名和章节
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 箭头
            Image.create({ "id": 16777278, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            // 箭头
            Image.width(20);
            // 箭头
            Image.height(20);
            // 箭头
            Image.margin({ right: 8 });
        }, Image);
        Row.pop();
    }
    private getChapterDisplay(book: BookParserInfo): string {
        const progress = this.progressMap.get(book.getFilePath());
        if (progress?.chapterName) {
            return `阅读至：${progress.chapterName}`;
        }
        return '暂无进度';
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
        return "ReadingRecord";
    }
}
registerNamedRoute(() => new ReadingRecord(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/ReadingRecord", pageFullPath: "entry/src/main/ets/pages/ReadingRecord", integratedHsp: "false", moduleType: "followWithHap" });
