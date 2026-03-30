if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Reader_Params {
    windowWidth?: number;
    windowHeight?: number;
    colorMode?: ConfigurationConstant.ColorMode;
    isUpdatePressed?: boolean;
    eyeMode?: boolean;
    currentIndex?: number;
    catalogItemList?: bookParser.CatalogItem[];
    fullChapterList?: ChapterItem[];
    currentData?: readerCore.PageDataInfo | null;
    defaultHandler?: bookParser.BookParserHandler | null;
    readerComponentController?: readerCore.ReaderComponentController;
    currentChapter?: number;
    totalChapters?: number;
    bookCover?: PixelMap | null;
    bookTitle?: string;
    author?: string;
    loadError?: string;
    fontSize?: number;
    lineHeight?: number;
    fontList?: Array<FontFileInfo>;
    selectFontPath?: string;
    themeList?: string[];
    THEME_BUTTON_BACKGROUND?: Record<string, Resource>;
    THEME_PAGE_COLOR?: Record<string, string>;
    themeBorderColor?: Record<number, Resource>;
    themeSelectIndex?: number;
    singleHandMode?: boolean;
    readerSetting?: readerCore.ReaderSetting;
    screenDensityCallBack?: Callback<number> | null;
    isLoading?: boolean;
    bookFilePath?: string;
    resourceRequest?: bookParser.CallbackRes<string, ArrayBuffer>;
    isClicked?: boolean;
    speaker?: Speaker;
    currentPageText?: string;
    ttsVolume?: number;
    ttsPitch?: number;
    ttsSpeed?: number;
}
import { WindowAbility } from "@bundle:com.example.readerkitdemo/entry/ets/entryability/WindowAbility";
import display from "@ohos:display";
import fs from "@ohos:file.fs";
import image from "@ohos:multimedia.image";
import type { BusinessError } from "@ohos:base";
import { FontFileInfo } from "@bundle:com.example.readerkitdemo/entry/ets/common/FontFileInfo";
import hilog from "@ohos:hilog";
import { ReadPageComponent } from "@hms:core.readerservice.readerComponent";
import { readerCore } from "@hms:core.readerservice.readerComponent";
import { bookParser } from "@hms:core.readerservice.bookParser";
import type common from "@ohos:app.ability.common";
import ConfigurationConstant from "@ohos:app.ability.ConfigurationConstant";
import { BookUtils } from "@bundle:com.example.readerkitdemo/entry/ets/utils/BookUtils";
import { SettingStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import type { PersistedReaderSettings } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import { ProgressStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
import type { BookProgress } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
import emitter from "@ohos:events.emitter";
import { Speaker } from "@bundle:com.example.readerkitdemo/entry/ets/utils/Speaker";
import util from "@ohos:util";
import { DistributedSyncManager } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedSyncManager";
interface paramType {
    filePath: string;
    resourceIndex: number;
    domPos: string;
    bookName?: string;
    bookAuthor?: string;
}
interface AttemptParams {
    index: number;
    path: string;
}
// 章节项（用于目录显示）
interface ChapterItem {
    index: number; // spine索引
    name: string; // 章节名称
    href: string; // 章节路径
}
const TAG: string = 'ReaderPage';
class Reader extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__windowWidth = this.createStorageLink('windowWidth', 0, "windowWidth");
        this.__windowHeight = this.createStorageLink('windowHeight', 0, "windowHeight");
        this.__colorMode = this.createStorageLink('colorMode', ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET, "colorMode");
        this.__isUpdatePressed = new ObservedPropertySimplePU(false, this, "isUpdatePressed");
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.__currentIndex = new ObservedPropertySimplePU(-1, this, "currentIndex");
        this.__catalogItemList = new ObservedPropertyObjectPU([], this, "catalogItemList");
        this.__fullChapterList = new ObservedPropertyObjectPU([], this, "fullChapterList");
        this.currentData = null;
        this.defaultHandler = null;
        this.readerComponentController = new readerCore.ReaderComponentController();
        this.__currentChapter = new ObservedPropertySimplePU(1, this, "currentChapter");
        this.__totalChapters = new ObservedPropertySimplePU(0, this, "totalChapters");
        this.__bookCover = new ObservedPropertyObjectPU(null, this, "bookCover");
        this.__bookTitle = new ObservedPropertySimplePU('', this, "bookTitle");
        this.__author = new ObservedPropertySimplePU('', this, "author");
        this.__loadError = new ObservedPropertySimplePU('', this, "loadError");
        this.__fontSize = new ObservedPropertySimplePU(18, this, "fontSize");
        this.__lineHeight = new ObservedPropertySimplePU(1.9, this, "lineHeight");
        this.fontList = 
        //BookUtils.getString(context,name)根据资源名称从应用的资源管理器中获取对应的本地化字符串。
        //FontFileInfo 类包括alias：字体的显示名称（如“系统字体”）。path：字体文件的路径。
        [new FontFileInfo(BookUtils.getString(this.getUIContext().getHostContext(), 'system_font'), 'rawfile/simsun.ttc'),
            new FontFileInfo(BookUtils.getString(this.getUIContext().getHostContext(), 'source_hua_kang_font'), 'rawfile/HuaKang.TTC')];
        this.__selectFontPath = new ObservedPropertySimplePU('', this, "selectFontPath");
        this.__themeList = new ObservedPropertyObjectPU([
            'white',
            'yellow',
            'pink',
            'green',
            'dark',
            'whiteSky',
            'darkSky'
        ], this, "themeList");
        this.THEME_BUTTON_BACKGROUND = {
            'white': { "id": 16777260, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            'yellow': { "id": 16777261, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            'pink': { "id": 16777258, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            'green': { "id": 16777257, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            'dark': { "id": 16777256, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            'whiteSky': { "id": 16777260, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            'darkSky': { "id": 16777256, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }
        };
        this.THEME_PAGE_COLOR = {
            'white': '#FFFFFF',
            'yellow': '#BD9063',
            'pink': '#FFE4E5',
            'green': '#C5E7CE',
            'dark': '#202224',
            'whiteSky': '#FFFFFF',
            'darkSky': '#202224'
        };
        this.themeBorderColor = {
            0: { "id": 16777253, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            1: { "id": 16777254, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            2: { "id": 16777252, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            3: { "id": 16777251, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            4: { "id": 16777253, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            5: { "id": 16777253, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" },
            6: { "id": 16777253, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }
        };
        this.__themeSelectIndex = new ObservedPropertySimplePU(0, this, "themeSelectIndex");
        this.__singleHandMode = new ObservedPropertySimplePU(false, this, "singleHandMode");
        this.readerSetting = {
            fontName: BookUtils.getString(this.getUIContext().getHostContext(), 'system_font'),
            fontPath: '',
            fontSize: this.fontSize,
            fontColor: '#000000',
            fontWeight: 400,
            lineHeight: this.lineHeight,
            nightMode: false,
            themeColor: 'rgba(248, 249, 250, 1)',
            themeBgImg: '',
            flipMode: '0',
            scaledDensity: this.getDefaultScaledDensity(),
            viewPortWidth: this.windowWidth,
            viewPortHeight: this.windowHeight
        };
        this.screenDensityCallBack = null;
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.bookFilePath = '';
        this.resourceRequest = (filePath: string): ArrayBuffer => {
            hilog.info(0x0000, TAG, 'resourceRequest : filePath = ' + filePath + ', this.selectFontPath = ' + this.selectFontPath);
            if (filePath.length === 0) { //参数校验
                return new ArrayBuffer(0);
            }
            //字体路径处理
            let resourcePath = filePath;
            if (this.isFont(filePath)) {
                resourcePath = this.selectFontPath;
            }
            try { //优先从应用资源管理器加载
                let context = this.getUIContext().getHostContext() as common.UIAbilityContext;
                //获取当前 UIAbility 的上下文，通过 resourceManager.getRawFileContentSync 同步读取应用 rawfile 目录下的文件内容
                let value: Uint8Array = context.resourceManager.getRawFileContentSync(resourcePath);
                hilog.info(0x0000, TAG, 'resourceRequest : get other resource succeeded ');
                return value.buffer as ArrayBuffer;
            }
            catch (error) {
                let code = (error as BusinessError).code;
                let message = (error as BusinessError).message;
                hilog.error(0x0000, TAG, `resourceRequest : get resource failed, error code: ${code}, message: ${message}.`);
            }
            // 从沙箱路径加载
            //当从资源管理器加载失败后，调用 this.loadFileFromPath(resourcePath)
            // 从应用的沙箱文件系统（即应用私有目录）中加载文件
            return this.loadFileFromPath(resourcePath);
        };
        this.__isClicked = new ObservedPropertySimplePU(false, this, "isClicked");
        this.speaker = new Speaker();
        this.currentPageText = '';
        this.__ttsVolume = new ObservedPropertySimplePU(1.0, this, "ttsVolume");
        this.__ttsPitch = new ObservedPropertySimplePU(1.0, this, "ttsPitch");
        this.__ttsSpeed = new ObservedPropertySimplePU(1.0, this, "ttsSpeed");
        this.setInitiallyProvidedValue(params);
        this.declareWatch("colorMode", this.colorModeChange);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Reader_Params) {
        if (params.isUpdatePressed !== undefined) {
            this.isUpdatePressed = params.isUpdatePressed;
        }
        if (params.currentIndex !== undefined) {
            this.currentIndex = params.currentIndex;
        }
        if (params.catalogItemList !== undefined) {
            this.catalogItemList = params.catalogItemList;
        }
        if (params.fullChapterList !== undefined) {
            this.fullChapterList = params.fullChapterList;
        }
        if (params.currentData !== undefined) {
            this.currentData = params.currentData;
        }
        if (params.defaultHandler !== undefined) {
            this.defaultHandler = params.defaultHandler;
        }
        if (params.readerComponentController !== undefined) {
            this.readerComponentController = params.readerComponentController;
        }
        if (params.currentChapter !== undefined) {
            this.currentChapter = params.currentChapter;
        }
        if (params.totalChapters !== undefined) {
            this.totalChapters = params.totalChapters;
        }
        if (params.bookCover !== undefined) {
            this.bookCover = params.bookCover;
        }
        if (params.bookTitle !== undefined) {
            this.bookTitle = params.bookTitle;
        }
        if (params.author !== undefined) {
            this.author = params.author;
        }
        if (params.loadError !== undefined) {
            this.loadError = params.loadError;
        }
        if (params.fontSize !== undefined) {
            this.fontSize = params.fontSize;
        }
        if (params.lineHeight !== undefined) {
            this.lineHeight = params.lineHeight;
        }
        if (params.fontList !== undefined) {
            this.fontList = params.fontList;
        }
        if (params.selectFontPath !== undefined) {
            this.selectFontPath = params.selectFontPath;
        }
        if (params.themeList !== undefined) {
            this.themeList = params.themeList;
        }
        if (params.THEME_BUTTON_BACKGROUND !== undefined) {
            this.THEME_BUTTON_BACKGROUND = params.THEME_BUTTON_BACKGROUND;
        }
        if (params.THEME_PAGE_COLOR !== undefined) {
            this.THEME_PAGE_COLOR = params.THEME_PAGE_COLOR;
        }
        if (params.themeBorderColor !== undefined) {
            this.themeBorderColor = params.themeBorderColor;
        }
        if (params.themeSelectIndex !== undefined) {
            this.themeSelectIndex = params.themeSelectIndex;
        }
        if (params.singleHandMode !== undefined) {
            this.singleHandMode = params.singleHandMode;
        }
        if (params.readerSetting !== undefined) {
            this.readerSetting = params.readerSetting;
        }
        if (params.screenDensityCallBack !== undefined) {
            this.screenDensityCallBack = params.screenDensityCallBack;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.bookFilePath !== undefined) {
            this.bookFilePath = params.bookFilePath;
        }
        if (params.resourceRequest !== undefined) {
            this.resourceRequest = params.resourceRequest;
        }
        if (params.isClicked !== undefined) {
            this.isClicked = params.isClicked;
        }
        if (params.speaker !== undefined) {
            this.speaker = params.speaker;
        }
        if (params.currentPageText !== undefined) {
            this.currentPageText = params.currentPageText;
        }
        if (params.ttsVolume !== undefined) {
            this.ttsVolume = params.ttsVolume;
        }
        if (params.ttsPitch !== undefined) {
            this.ttsPitch = params.ttsPitch;
        }
        if (params.ttsSpeed !== undefined) {
            this.ttsSpeed = params.ttsSpeed;
        }
    }
    updateStateVars(params: Reader_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__windowWidth.purgeDependencyOnElmtId(rmElmtId);
        this.__windowHeight.purgeDependencyOnElmtId(rmElmtId);
        this.__colorMode.purgeDependencyOnElmtId(rmElmtId);
        this.__isUpdatePressed.purgeDependencyOnElmtId(rmElmtId);
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
        this.__currentIndex.purgeDependencyOnElmtId(rmElmtId);
        this.__catalogItemList.purgeDependencyOnElmtId(rmElmtId);
        this.__fullChapterList.purgeDependencyOnElmtId(rmElmtId);
        this.__currentChapter.purgeDependencyOnElmtId(rmElmtId);
        this.__totalChapters.purgeDependencyOnElmtId(rmElmtId);
        this.__bookCover.purgeDependencyOnElmtId(rmElmtId);
        this.__bookTitle.purgeDependencyOnElmtId(rmElmtId);
        this.__author.purgeDependencyOnElmtId(rmElmtId);
        this.__loadError.purgeDependencyOnElmtId(rmElmtId);
        this.__fontSize.purgeDependencyOnElmtId(rmElmtId);
        this.__lineHeight.purgeDependencyOnElmtId(rmElmtId);
        this.__selectFontPath.purgeDependencyOnElmtId(rmElmtId);
        this.__themeList.purgeDependencyOnElmtId(rmElmtId);
        this.__themeSelectIndex.purgeDependencyOnElmtId(rmElmtId);
        this.__singleHandMode.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isClicked.purgeDependencyOnElmtId(rmElmtId);
        this.__ttsVolume.purgeDependencyOnElmtId(rmElmtId);
        this.__ttsPitch.purgeDependencyOnElmtId(rmElmtId);
        this.__ttsSpeed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__windowWidth.aboutToBeDeleted();
        this.__windowHeight.aboutToBeDeleted();
        this.__colorMode.aboutToBeDeleted();
        this.__isUpdatePressed.aboutToBeDeleted();
        this.__eyeMode.aboutToBeDeleted();
        this.__currentIndex.aboutToBeDeleted();
        this.__catalogItemList.aboutToBeDeleted();
        this.__fullChapterList.aboutToBeDeleted();
        this.__currentChapter.aboutToBeDeleted();
        this.__totalChapters.aboutToBeDeleted();
        this.__bookCover.aboutToBeDeleted();
        this.__bookTitle.aboutToBeDeleted();
        this.__author.aboutToBeDeleted();
        this.__loadError.aboutToBeDeleted();
        this.__fontSize.aboutToBeDeleted();
        this.__lineHeight.aboutToBeDeleted();
        this.__selectFontPath.aboutToBeDeleted();
        this.__themeList.aboutToBeDeleted();
        this.__themeSelectIndex.aboutToBeDeleted();
        this.__singleHandMode.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isClicked.aboutToBeDeleted();
        this.__ttsVolume.aboutToBeDeleted();
        this.__ttsPitch.aboutToBeDeleted();
        this.__ttsSpeed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    //监听窗口的数值
    private __windowWidth: ObservedPropertyAbstractPU<number>;
    get windowWidth() {
        return this.__windowWidth.get();
    }
    set windowWidth(newValue: number) {
        this.__windowWidth.set(newValue);
    }
    private __windowHeight: ObservedPropertyAbstractPU<number>;
    get windowHeight() {
        return this.__windowHeight.get();
    }
    set windowHeight(newValue: number) {
        this.__windowHeight.set(newValue);
    }
    //监听colorMode字段的变化。如果颜色变化，则触发对应主题色的变更。
    private __colorMode: ObservedPropertyAbstractPU<ConfigurationConstant.ColorMode>;
    get colorMode() {
        return this.__colorMode.get();
    }
    set colorMode(newValue: ConfigurationConstant.ColorMode) {
        this.__colorMode.set(newValue);
    }
    private __isUpdatePressed: ObservedPropertySimplePU<boolean>;
    get isUpdatePressed() {
        return this.__isUpdatePressed.get();
    }
    set isUpdatePressed(newValue: boolean) {
        this.__isUpdatePressed.set(newValue);
    }
    private __eyeMode: ObservedPropertyAbstractPU<boolean>;
    get eyeMode() {
        return this.__eyeMode.get();
    }
    set eyeMode(newValue: boolean) {
        this.__eyeMode.set(newValue);
    }
    /**
     * 显示底部菜单,废弃
     */
    //@State showModalBanner: boolean = false;
    /**
     * 菜单类型index, 0 : catalog list, 1 : setting, 1 : close dialog
     */
    private __currentIndex: ObservedPropertySimplePU<number>;
    get currentIndex() {
        return this.__currentIndex.get();
    }
    set currentIndex(newValue: number) {
        this.__currentIndex.set(newValue);
    }
    //章节列表元素
    private __catalogItemList: ObservedPropertyObjectPU<bookParser.CatalogItem[]>;
    get catalogItemList() {
        return this.__catalogItemList.get();
    }
    set catalogItemList(newValue: bookParser.CatalogItem[]) {
        this.__catalogItemList.set(newValue);
    }
    // 完整章节列表（基于spine，包含所有章节）
    private __fullChapterList: ObservedPropertyObjectPU<ChapterItem[]>;
    get fullChapterList() {
        return this.__fullChapterList.get();
    }
    set fullChapterList(newValue: ChapterItem[]) {
        this.__fullChapterList.set(newValue);
    }
    //readerCore.PageDataInfo包含当前页内容、页码、章节信息等关键数据
    private currentData: readerCore.PageDataInfo | null;
    //书籍解析器处理器
    private defaultHandler: bookParser.BookParserHandler | null;
    //阅读控制器:例如翻页、跳转章节、获取当前阅读进度等
    private readerComponentController: readerCore.ReaderComponentController;
    // 章节显示相关状态
    private __currentChapter: ObservedPropertySimplePU<number>; // 当前章节（从1开始）
    get currentChapter() {
        return this.__currentChapter.get();
    }
    set currentChapter(newValue: number) {
        this.__currentChapter.set(newValue);
    }
    private __totalChapters: ObservedPropertySimplePU<number>; // 总章节数
    get totalChapters() {
        return this.__totalChapters.get();
    }
    set totalChapters(newValue: number) {
        this.__totalChapters.set(newValue);
    }
    private __bookCover: ObservedPropertyObjectPU<PixelMap | null>;
    get bookCover() {
        return this.__bookCover.get();
    }
    set bookCover(newValue: PixelMap | null) {
        this.__bookCover.set(newValue);
    }
    private __bookTitle: ObservedPropertySimplePU<string>;
    get bookTitle() {
        return this.__bookTitle.get();
    }
    set bookTitle(newValue: string) {
        this.__bookTitle.set(newValue);
    }
    private __author: ObservedPropertySimplePU<string>;
    get author() {
        return this.__author.get();
    }
    set author(newValue: string) {
        this.__author.set(newValue);
    }
    private __loadError: ObservedPropertySimplePU<string>; // 加载错误信息
    get loadError() {
        return this.__loadError.get();
    }
    set loadError(newValue: string) {
        this.__loadError.set(newValue);
    }
    private __fontSize: ObservedPropertySimplePU<number>; // 字体大小 (12-32)
    get fontSize() {
        return this.__fontSize.get();
    }
    set fontSize(newValue: number) {
        this.__fontSize.set(newValue);
    }
    private __lineHeight: ObservedPropertySimplePU<number>; // 行间距 (1.0-3.0)
    get lineHeight() {
        return this.__lineHeight.get();
    }
    set lineHeight(newValue: number) {
        this.__lineHeight.set(newValue);
    }
    //初始化字体列表
    private fontList: Array<FontFileInfo>;
    private __selectFontPath: ObservedPropertySimplePU<string>;
    get selectFontPath() {
        return this.__selectFontPath.get();
    }
    set selectFontPath(newValue: string) {
        this.__selectFontPath.set(newValue);
    }
    //自定义背景,下面4个
    private __themeList: ObservedPropertyObjectPU<string[]>;
    get themeList() {
        return this.__themeList.get();
    }
    set themeList(newValue: string[]) {
        this.__themeList.set(newValue);
    }
    private THEME_BUTTON_BACKGROUND: Record<string, Resource>;
    private THEME_PAGE_COLOR: Record<string, string>;
    private themeBorderColor: Record<number, Resource>;
    //主题
    private __themeSelectIndex: ObservedPropertySimplePU<number>;
    get themeSelectIndex() {
        return this.__themeSelectIndex.get();
    }
    set themeSelectIndex(newValue: number) {
        this.__themeSelectIndex.set(newValue);
    }
    // 单手模式：点击屏幕左右两侧都翻到下一页
    private __singleHandMode: ObservedPropertySimplePU<boolean>;
    get singleHandMode() {
        return this.__singleHandMode.get();
    }
    set singleHandMode(newValue: boolean) {
        this.__singleHandMode.set(newValue);
    }
    //阅读相关设置
    private readerSetting: readerCore.ReaderSetting;
    //自定义的回调函数，用作屏幕变化事件的处理器
    private screenDensityCallBack: Callback<number> | null;
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private bookFilePath: string;
    async aboutToAppear(): Promise<void> {
        hilog.info(0x0000, TAG, 'aboutToAppear Start');
        this.registerScreenDensityChange();
        this.registerListener();
        WindowAbility.getInstance().toggleWindowSystemBar([], this.getUIContext().getHostContext());
        // 等待窗口尺寸初始化完成（最多等待500ms）
        const maxWaitTime = 500;
        const startTime = Date.now();
        while ((this.windowWidth === 0 || this.windowHeight === 0) && (Date.now() - startTime) < maxWaitTime) {
            await new Promise<void>(resolve => setTimeout(resolve, 50));
        }
        hilog.info(0x0000, TAG, `aboutToAppear: windowSize = ${this.windowWidth}x${this.windowHeight}`);
        // 更新readerSetting的视口尺寸
        if (this.windowWidth > 0 && this.windowHeight > 0) {
            this.readerSetting.viewPortWidth = this.windowWidth;
            this.readerSetting.viewPortHeight = this.windowHeight;
        }
        //加载保存的设置
        hilog.info(0x0000, TAG, 'aboutToAppear: loading settings...');
        const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
        const saved = await SettingStorage.loadSettings(context);
        hilog.info(0x0000, TAG, `aboutToAppear: settings loaded, saved=${saved !== null}`);
        //************************************************
        // 检查 UIContext
        const uiContext = this.getUIContext();
        if (!uiContext) {
            hilog.error(0x0000, TAG, 'aboutToAppear: getUIContext is null');
            this.loadError = 'UI上下文异常';
            return;
        }
        const router = uiContext.getRouter();
        if (!router) {
            hilog.error(0x0000, TAG, 'aboutToAppear: router is null');
            this.loadError = '路由异常';
            return;
        }
        //************************************************
        try {
            if (saved) {
                // 更新阅读器配置
                this.readerSetting.fontPath = saved.fontPath ?? '';
                this.readerSetting.fontSize = saved.fontSize ?? 18;
                this.readerSetting.lineHeight = saved.lineHeight ?? 1.9;
                this.readerSetting.nightMode = saved.nightMode ?? false;
                this.readerSetting.themeColor = saved.themeColor ?? 'rgba(248, 249, 250, 1)';
                this.readerSetting.themeBgImg = saved.themeBgImg ?? '';
                this.readerSetting.flipMode = saved.flipMode ?? '0';
                this.themeSelectIndex = saved.themeSelectIndex ?? 0;
                // 更新 UI 状态变量
                this.selectFontPath = saved.fontPath ?? '';
                this.fontSize = saved.fontSize ?? 18;
                this.lineHeight = saved.lineHeight ?? 1.9;
                // 优先使用保存的字体颜色和夜间模式设置
                // 如果保存的设置中有有效的 fontColor（非空字符串），直接使用
                // themeList: ['white', 'yellow', 'pink', 'green', 'dark', 'whiteSky', 'darkSky']
                // index 4 (dark), 6 (darkSky) 需要白色字体
                if (saved.fontColor && saved.fontColor.length > 0) {
                    this.readerSetting.fontColor = saved.fontColor;
                    this.readerSetting.nightMode = saved.nightMode;
                    hilog.info(0x0000, TAG, `Using saved fontColor: ${saved.fontColor}, nightMode: ${saved.nightMode}`);
                }
                else {
                    // 兼容旧数据：根据主题索引推断字体颜色
                    hilog.info(0x0000, TAG, `No valid fontColor saved, inferring from themeSelectIndex: ${saved.themeSelectIndex}`);
                    if (saved.themeSelectIndex === 4 || saved.themeSelectIndex === 6) {
                        // 深色主题（dark 或 darkSky）：使用白色字体
                        this.readerSetting.fontColor = '#ffffff';
                        this.readerSetting.nightMode = true;
                    }
                    else {
                        // 浅色主题：根据系统颜色模式决定
                        if (this.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_DARK) {
                            this.readerSetting.fontColor = '#ffffff';
                            this.readerSetting.nightMode = true;
                        }
                        else {
                            this.readerSetting.fontColor = '#000000';
                            this.readerSetting.nightMode = false;
                        }
                    }
                    hilog.info(0x0000, TAG, `Inferred fontColor: ${this.readerSetting.fontColor}, nightMode: ${this.readerSetting.nightMode}`);
                }
                // 加载TTS朗读设置
                if (saved.ttsVolume !== undefined) {
                    this.ttsVolume = saved.ttsVolume;
                    this.speaker.setVolume(this.ttsVolume);
                }
                else {
                    this.ttsVolume = 1.0;
                }
                if (saved.ttsPitch !== undefined) {
                    this.ttsPitch = saved.ttsPitch;
                    this.speaker.setPitch(this.ttsPitch);
                }
                else {
                    this.ttsPitch = 1.0;
                }
                if (saved.ttsSpeed !== undefined) {
                    this.ttsSpeed = saved.ttsSpeed;
                    this.speaker.setSpeed(this.ttsSpeed);
                }
                else {
                    this.ttsSpeed = 1.0;
                }
                // 加载单手模式设置
                if (saved.singleHandMode !== undefined) {
                    this.singleHandMode = saved.singleHandMode;
                }
                // 如果保存的字体路径在字体列表中，可能需要高亮（字体选择按钮已经通过 selectFontPath 处理）
            }
            //获取路由参数启动阅读器！
            hilog.info(0x0000, TAG, `========== aboutToAppear: Getting Router Params ==========`);
            hilog.info(0x0000, TAG, 'aboutToAppear: before getRouterParams');
            let param = this.getUIContext().getRouter().getParams() as paramType;
            hilog.info(0x0000, TAG, `aboutToAppear: param exists = ${param !== null && param !== undefined}`);
            let filePath = param?.filePath ?? '';
            let resourceIndex = param?.resourceIndex ?? 0;
            let domPos = param?.domPos ?? '';
            hilog.info(0x0000, TAG, `aboutToAppear: filePath=${filePath}`);
            hilog.info(0x0000, TAG, `aboutToAppear: filePath length=${filePath?.length}`);
            hilog.info(0x0000, TAG, `aboutToAppear: resourceIndex=${resourceIndex}, domPos=${domPos}`);
            // 优先使用从参数传递的书籍信息（解决TXT文件bookIdentity都是"_"的问题）
            if (param.bookName) {
                this.bookTitle = param.bookName;
                hilog.info(0x0000, TAG, `aboutToAppear: using bookName from params: ${param.bookName}`);
            }
            if (param.bookAuthor) {
                this.author = param.bookAuthor;
                hilog.info(0x0000, TAG, `aboutToAppear: using bookAuthor from params: ${param.bookAuthor}`);
            }
            this.bookFilePath = param.filePath; // 先保存文件路径，startPlay 中会用到
            hilog.info(0x0000, TAG, `aboutToAppear: bookFilePath set to ${this.bookFilePath}`);
            try {
                await this.startPlay(filePath, resourceIndex, domPos);
                hilog.info(0x0000, TAG, 'aboutToAppear: startPlay completed successfully');
            }
            catch (err) {
                hilog.error(0x0000, TAG, `aboutToAppear startPlay failed：${err}`);
                this.loadError = '打开书籍失败';
            }
        }
        catch (error) {
            hilog.error(0x0000, TAG, `aboutToAppear: error - ${error}`);
            this.loadError = `加载失败: ${error.message || '未知错误'}`;
        }
        //预加载
        emitter.on("eventId", () => {
            this.isClicked = false;
        });
    }
    //获取当前设备屏幕缩放密度
    getDefaultScaledDensity() {
        try { //scaledDensity屏幕的密度缩放因子，  1.获取默认显示器的同步信息，2.返回1
            return display.getDefaultDisplaySync().scaledDensity > 0 ? display.getDefaultDisplaySync().scaledDensity : 1;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `getDefaultScaledDensity failed, error code: ${error.code}, message: ${error.message}.`);
        }
        return 1;
    }
    //系统颜色改变
    colorModeChange() {
        // 移除用户手动选择主题的判断，确保主题切换时字体颜色能够正确更新
        if (this.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_DARK) {
            this.readerSetting.nightMode = true;
            this.readerSetting.fontColor = '#ffffff';
            this.readerSetting.themeColor = '#202224';
        }
        else {
            this.readerSetting.nightMode = false;
            this.readerSetting.fontColor = '#000000';
            this.readerSetting.themeColor = '#FFFFFF';
        }
        try {
            this.readerComponentController.setPageConfig(this.readerSetting);
        }
        catch (error) {
            hilog.error(0x0000, TAG, `colorModeChange setPageConfig failed, error code: ${error.code}, message: ${error.message}.`);
        }
    }
    //监听“文本缩放因子”Display.scaledDensity的变化。在变化时触发相应的页面退出行为，以确保阅读器能够重新适配新的密度设置
    registerScreenDensityChange() {
        this.screenDensityCallBack = () => {
            try {
                //获取当前设备默认屏幕的显示信息对象
                let displaySync = display.getDefaultDisplaySync();
                //取出 scaledDensity 属性
                let scaledDensity = displaySync.scaledDensity;
                if (scaledDensity !== this.readerSetting.scaledDensity) {
                    //设置一个全局标志，表示密度已变化，后续重新进入阅读器时可据此应用新配置。
                    AppStorage.setOrCreate('isDensityChange', true);
                    //关闭当前的阅读器页面，当用户再次打开阅读器时，会重新初始化并应用新的密度设置，避免界面显示异常。
                    this.getUIContext().getRouter().back();
                }
            }
            catch (error) {
                hilog.error(0x0000, TAG, `registerScreenDensityChange getDefaultDisplaySync failed, error code: ${error.code}, message: ${error.message}.`);
            }
        };
        display.on('change', this.screenDensityCallBack);
    }
    //资源请求回调。字体文件和主题背景图像可以存储在resources/rawfile目录或应用沙盒路径中。
    //前面这一坨表示一个接收字符串参数（文件路径）并返回 ArrayBuffer 的回调。
    private resourceRequest: bookParser.CallbackRes<string, ArrayBuffer>;
    // 更新章节信息
    private updateChapterInfo(data: readerCore.PageDataInfo): void {
        if (!data || data.resourceIndex < 0) {
            return;
        }
        const spineList = this.defaultHandler?.getSpineList() || [];
        if (spineList.length === 0) {
            return;
        }
        // 当前章节 = resourceIndex + 1（resourceIndex从0开始）
        this.currentChapter = data.resourceIndex + 1;
        this.totalChapters = spineList.length;
        hilog.info(0x0000, TAG, `Chapter: ${this.currentChapter}/${this.totalChapters}`);
    }
    // 生成完整章节列表（基于spine）
    private buildFullChapterList(): void {
        const spineList = this.defaultHandler?.getSpineList() || [];
        const catalogList = this.defaultHandler?.getCatalogList() || [];
        if (spineList.length === 0) {
            return;
        }
        this.fullChapterList = [];
        for (let i = 0; i < spineList.length; i++) {
            const spineItem = spineList[i];
            // 尝试从目录中匹配章节名称
            let chapterName = '';
            const catalogItem = catalogList.find(item => item.href === spineItem.href ||
                item.href === spineItem.idRef ||
                (spineItem.href && item.href && spineItem.href.includes(item.href)) ||
                (spineItem.idRef && item.href && spineItem.idRef.includes(item.href)));
            if (catalogItem) {
                chapterName = catalogItem.catalogName;
            }
            else {
                // 如果目录中没有，使用spine的idRef或生成默认名称
                chapterName = spineItem.idRef || `章节 ${i + 1}`;
            }
            this.fullChapterList.push({
                index: i,
                name: chapterName,
                href: spineItem.href || spineItem.idRef || ''
            });
        }
        hilog.info(0x0000, TAG, `buildFullChapterList: spineList.length=${spineList.length}, catalogList.length=${catalogList.length}, total chapters = ${this.fullChapterList.length}`);
    }
    private registerListener(): void {
        //资源请求监听
        this.readerComponentController.on('resourceRequest', this.resourceRequest);
        //页面显示状态监听
        this.readerComponentController.on('pageShow', async (data: readerCore.PageDataInfo): Promise<void> => {
            hilog.info(0x0000, TAG, 'pageShow event triggered: state = ' + data.state + ', resourceIndex = ' + data.resourceIndex);
            this.currentData = data;
            // 保存页面数据
            AppStorage.setOrCreate('currentData', this.currentData);
            // 更新章节信息
            this.updateChapterInfo(data);
            // 只要页面状态变化就保存进度，不仅仅是 PAGE_ON_SHOW
            if (data.state === readerCore.PageState.PAGE_ON_SHOW ||
                data.state === readerCore.PageState.PAGE_LOADING) {
                this.isLoading = false;
                //保存阅读进度
                await this.saveCurrentProgress(data);
                //获取当前页面文本（例如通过资源索引获取章节内容）
                await this.loadCurrentPageText(data.resourceIndex);
            }
        });
        //窗口尺寸变化监听
        WindowAbility.getInstance().onWindowSizeChange(() => {
            //检测窗口尺寸是否与阅读器设置中的视口一致
            if (this.readerSetting.viewPortWidth != this.windowWidth ||
                this.readerSetting.viewPortHeight != this.windowHeight) {
                hilog.info(0x0000, TAG, 'onWindowSizeChange is changed, update page config');
                //更新阅读器配置中的视口尺寸
                this.readerSetting.viewPortWidth = this.windowWidth;
                this.readerSetting.viewPortHeight = this.windowHeight;
                try {
                    //将新配置应用到阅读器控制器，重新排版页面
                    this.readerComponentController.setPageConfig(this.readerSetting);
                }
                catch (error) {
                    hilog.error(0x0000, TAG, `onWindowSizeChange failed, Code: ${error.code}, message: ${error.message}`);
                }
            }
        });
    }
    //保存当前阅读进度
    private async saveCurrentProgress(data: readerCore.PageDataInfo) {
        const param = this.getUIContext().getRouter().getParams() as paramType;
        const filePath = param.filePath;
        if (!filePath) {
            hilog.error(0x0000, TAG, 'saveCurrentProgress: filePath is null or undefined');
            return;
        }
        //获取当前登录用户
        const currentUser = AppStorage.get<string>('currentUser') || '';
        // 获取当前章节名称
        let chapterName = '未知章节';
        try {
            // 通过 resourceIndex 获取对应的 SpineItem，再匹配目录项得到章节名
            const spineList = this.defaultHandler?.getSpineList() || [];
            const catalogList = this.defaultHandler?.getCatalogList() || [];
            if (data.resourceIndex >= 0 && data.resourceIndex < spineList.length) {
                const spineItem = spineList[data.resourceIndex];
                if (spineItem) {
                    // 尝试多种匹配方式
                    const catalogItem = catalogList.find(item => item.href === spineItem.href ||
                        item.href === spineItem.idRef ||
                        (spineItem.href && item.href && spineItem.href.includes(item.href)));
                    chapterName = catalogItem?.catalogName || spineItem.idRef || '章节' + (data.resourceIndex + 1);
                }
            }
            hilog.info(0x0000, TAG, `saveCurrentProgress: chapterName = ${chapterName}, resourceIndex = ${data.resourceIndex}`);
        }
        catch (e) {
            hilog.error(0x0000, TAG, 'get chapterName failed: ' + (e as Error).message);
            chapterName = '章节' + (data.resourceIndex + 1);
        }
        const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
        const bookIdentity = ProgressStorage.generateBookIdentity(this.bookTitle, this.author);
        const progress: BookProgress = {
            bookIdentity: bookIdentity,
            filePath: filePath,
            bookName: this.bookTitle,
            author: this.author,
            resourceIndex: data.resourceIndex,
            startDomPos: data.startDomPos || '',
            chapterName: chapterName,
            lastReadTime: Date.now()
        };
        hilog.info(0x0000, TAG, `saveCurrentProgress: saving progress for ${filePath}, bookIdentity=${bookIdentity}`);
        await ProgressStorage.saveProgress(context, progress, currentUser);
        hilog.info(0x0000, TAG, 'saveCurrentProgress: progress saved successfully');
        //保存后自动同步-每次翻页后
        await DistributedSyncManager.getInstance().syncProgressOnly();
    }
    //以指定阅读进度打开书籍，初始化阅读器页面。阅读器启动的统一入口
    private async startPlay(path: string, resourceIndex: number, domPos: string) {
        hilog.info(0x0000, TAG, `========== startPlay BEGIN ==========`);
        hilog.info(0x0000, TAG, `startPlay: path=${path}`);
        hilog.info(0x0000, TAG, `startPlay: path length=${path?.length}, path type=${typeof path}`);
        hilog.info(0x0000, TAG, `startPlay: resourceIndex=${resourceIndex}, domPos=${domPos}`);
        try {
            // 验证文件路径
            if (!path || path.length === 0) {
                hilog.error(0x0000, TAG, 'startPlay: filePath is empty');
                this.loadError = '文件路径无效';
                return;
            }
            // 验证文件是否存在
            try {
                const stat = fs.statSync(path);
                hilog.info(0x0000, TAG, `startPlay: file exists, size=${stat.size}`);
            }
            catch (e) {
                hilog.error(0x0000, TAG, `startPlay: file not found: ${path}`);
                hilog.error(0x0000, TAG, `startPlay: stat error: ${JSON.stringify(e)}`);
                this.loadError = '书籍文件不存在或已被删除';
                return;
            }
            let context = this.getUIContext().getHostContext() as common.UIAbilityContext;
            hilog.info(0x0000, TAG, `startPlay: context obtained, path=${path}`);
            //调用阅读器控制器的初始化方法，传入上下文，准备阅读环境。
            let initPromise: Promise<void> = this.readerComponentController.init(context).catch((err: BusinessError) => {
                hilog.error(0x0000, TAG, `startPlay: readerComponentController.init failed: ${err?.message}`);
            });
            //通过书籍解析器工厂（bookParser.getDefaultHandler）根据文件路径获取对应的解析器处理器（例如针对TXT、EPUB等不同格式的解析器）
            let defaultHandler: Promise<bookParser.BookParserHandler | null> = bookParser.getDefaultHandler(path)
                .then((handler) => {
                hilog.info(0x0000, TAG, `startPlay: getDefaultHandler success, handler=${handler !== null}`);
                return handler;
            })
                .catch((err: BusinessError) => {
                hilog.error(0x0000, TAG, `startPlay: getDefaultHandler failed, Code: ${err?.code}, message: ${err?.message}`);
                return null;
            });
            //Promise.all同时执行两个异步任务，提高效率.result[0]为解析器处理器，result[1]为init完成信号（void）。
            let result: [
                bookParser.BookParserHandler | null,
                void
            ] = await Promise.all([defaultHandler, initPromise]);
            //将获取到的解析器处理器保存到实例变量，供后续使用
            this.defaultHandler = result[0];
            // 验证解析器是否成功获取
            if (!this.defaultHandler) {
                hilog.error(0x0000, TAG, 'startPlay: defaultHandler is null, cannot continue');
                this.loadError = '无法解析书籍文件，请检查文件格式是否正确';
                return;
            }
            //将解析器注册到阅读器控制器，这样控制器就能通过解析器获取书籍章节内容。
            this.readerComponentController.registerBookParser(this.defaultHandler);
            hilog.info(0x0000, TAG, 'startPlay: registerBookParser completed');
            // 确保视口尺寸正确后再设置页面配置
            if (this.windowWidth > 0 && this.windowHeight > 0) {
                this.readerSetting.viewPortWidth = this.windowWidth;
                this.readerSetting.viewPortHeight = this.windowHeight;
            }
            hilog.info(0x0000, TAG, `startPlay: readerSetting viewPort=${this.readerSetting.viewPortWidth}x${this.readerSetting.viewPortHeight}`);
            this.readerComponentController.setPageConfig(this.readerSetting);
            // 获取书籍信息（标题、作者、封面）- 必须在startPlay之前调用
            await this.getBookInfo();
            // 预加载目录列表（避免点击目录时才加载导致延迟）
            try {
                this.catalogItemList = this.defaultHandler?.getCatalogList() || [];
                hilog.info(0x0000, TAG, `startPlay: catalogItemList loaded, length=${this.catalogItemList.length}`);
            }
            catch (e) {
                hilog.error(0x0000, TAG, `startPlay: getCatalogList failed: ${e}`);
            }
            //启动阅读，跳转到指定章节并定位到domPos指定的文档位置。
            try {
                await this.readerComponentController.startPlay(resourceIndex || 0, domPos);
                hilog.info(0x0000, TAG, 'startPlay: readerComponentController.startPlay completed');
                // 在startPlay完成后生成完整章节列表（此时书籍已完全加载，spine列表完整）
                this.buildFullChapterList();
            }
            catch (err) {
                hilog.error(0x0000, TAG, `startPlay: readerComponentController.startPlay failed: ${err}`);
            }
            // 立即加载当前页文本（因为 startPlay 可能不会触发 pageShow 立即更新）
            await this.loadCurrentPageText(resourceIndex || 0);
            // 加载成功，清除错误状态
            this.loadError = '';
        }
        catch (error) {
            hilog.error(0x0000, TAG, `startPlay failed, Code: ${error.code}, message: ${error.message}`);
            this.loadError = `加载失败: ${error.message || '未知错误'}`;
        }
    }
    //获取书籍信息//从书籍解析器处理器中获取并解析书籍的元信息（书名、作者）和封面图片
    private async getBookInfo() {
        try {
            hilog.info(0x0000, TAG, `getBookInfo: defaultHandler exists = ${this.defaultHandler !== null}`);
            //通过 defaultHandler（书籍解析器）调用 getBookInfo() 获得一个包含书名、作者、封面资源标识等信息的 BookInfo 对象
            let bookInfo: bookParser.BookInfo | undefined = this.defaultHandler?.getBookInfo();
            hilog.info(0x0000, TAG, `getBookInfo: bookInfo exists = ${bookInfo !== undefined}`);
            if (bookInfo) {
                hilog.info(0x0000, TAG, `getBookInfo: bookInfo.bookTitle=${bookInfo.bookTitle}, bookInfo.bookCreator=${bookInfo.bookCreator}`);
                // 只有当bookTitle和author为空时，才从bookInfo中获取（避免覆盖从参数传递的值）
                if (!this.bookTitle && bookInfo.bookTitle) {
                    this.bookTitle = bookInfo.bookTitle;
                }
                if (!this.author && bookInfo?.bookCreator) {
                    this.author = bookInfo.bookCreator;
                }
                //获取并解码封面图片（封面加载失败不影响其他功能）
                try {
                    //调用解析器的 getResourceContent 方法，传入-1封面资源的标识（如路径），获得封面图片的二进制数据
                    let buffer = this.defaultHandler?.getResourceContent(-1, bookInfo.bookCoverImage);
                    if (buffer && buffer.byteLength > 0) {
                        //将二进制数据转换为 ImageSource 对象
                        let imageSource: image.ImageSource = image.createImageSource(buffer);
                        //从 ImageSource 创建可用于 UI 显示的 PixelMap（像素图），并保存到组件变量 this.bookCover 中。
                        this.bookCover = await imageSource.createPixelMap();
                        imageSource.release();
                    }
                }
                catch (coverError) {
                    hilog.warn(0x0000, TAG, `getBookInfo: cover load failed, but continue: ${coverError.message}`);
                }
            }
            hilog.info(0x0000, TAG, `getBookInfo: bookTitle=${this.bookTitle}, author=${this.author}`);
        }
        catch (error) {
            hilog.error(0x0000, TAG, `getBookInfo failed, Code: ${error.code}, message: ${error.message}`);
        }
    }
    //获取设置修改的信息
    private async saveCurrentSettings() {
        const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
        const settings: PersistedReaderSettings = {
            fontPath: this.readerSetting.fontPath,
            fontSize: this.readerSetting.fontSize,
            lineHeight: this.readerSetting.lineHeight,
            nightMode: this.readerSetting.nightMode,
            themeColor: this.readerSetting.themeColor,
            themeBgImg: this.readerSetting.themeBgImg,
            flipMode: this.readerSetting.flipMode,
            themeSelectIndex: this.themeSelectIndex,
            fontColor: this.readerSetting.fontColor,
            ttsVolume: this.ttsVolume,
            ttsPitch: this.ttsPitch,
            ttsSpeed: this.ttsSpeed,
            singleHandMode: this.singleHandMode,
        };
        await SettingStorage.saveSettings(context, settings);
        // 触发数据同步
        DistributedSyncManager.getInstance().syncData();
    }
    // 保存TTS朗读设置
    private async saveTTSSettings(): Promise<void> {
        const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
        // 先加载现有设置，再更新TTS部分
        const saved = await SettingStorage.loadSettings(context);
        const settings: PersistedReaderSettings = {
            fontPath: saved?.fontPath ?? this.readerSetting.fontPath,
            fontSize: saved?.fontSize ?? this.readerSetting.fontSize,
            lineHeight: saved?.lineHeight ?? this.readerSetting.lineHeight,
            nightMode: saved?.nightMode ?? this.readerSetting.nightMode,
            themeColor: saved?.themeColor ?? this.readerSetting.themeColor,
            themeBgImg: saved?.themeBgImg ?? this.readerSetting.themeBgImg,
            flipMode: saved?.flipMode ?? this.readerSetting.flipMode,
            themeSelectIndex: saved?.themeSelectIndex ?? this.themeSelectIndex,
            fontColor: saved?.fontColor ?? this.readerSetting.fontColor,
            ttsVolume: this.ttsVolume,
            ttsPitch: this.ttsPitch,
            ttsSpeed: this.ttsSpeed,
            singleHandMode: saved?.singleHandMode ?? this.singleHandMode,
        };
        await SettingStorage.saveSettings(context, settings);
        // 触发数据同步
        DistributedSyncManager.getInstance().syncData();
    }
    //创建朗读实例
    private __isClicked: ObservedPropertySimplePU<boolean>;
    get isClicked() {
        return this.__isClicked.get();
    }
    set isClicked(newValue: boolean) {
        this.__isClicked.set(newValue);
    }
    private speaker: Speaker;
    private currentPageText: string; // 存储当前页文本
    // TTS朗读设置状态变量
    private __ttsVolume: ObservedPropertySimplePU<number>; // 音量 (0-2)
    get ttsVolume() {
        return this.__ttsVolume.get();
    }
    set ttsVolume(newValue: number) {
        this.__ttsVolume.set(newValue);
    }
    private __ttsPitch: ObservedPropertySimplePU<number>; // 音调 (0.5-2.0)
    get ttsPitch() {
        return this.__ttsPitch.get();
    }
    set ttsPitch(newValue: number) {
        this.__ttsPitch.set(newValue);
    }
    private __ttsSpeed: ObservedPropertySimplePU<number>; // 语速 (0.5-2.0)
    get ttsSpeed() {
        return this.__ttsSpeed.get();
    }
    set ttsSpeed(newValue: number) {
        this.__ttsSpeed.set(newValue);
    }
    //加载当前章节文本用于朗读
    private async loadCurrentPageText(resourceIndex: number) {
        hilog.info(0x0000, TAG, `[loadCurrentPageText] start for index: ${resourceIndex}`);
        if (!this.defaultHandler) {
            hilog.error(0x0000, TAG, '[loadCurrentPageText] defaultHandler is null');
            return;
        }
        try {
            const spineList = this.defaultHandler.getSpineList();
            hilog.info(0x0000, TAG, `[loadCurrentPageText] spineList length: ${spineList?.length}`);
            // 情况1: spineList 为空 -> 尝试加载整本书
            if (!spineList || spineList.length === 0) {
                await this.tryLoadFullBook();
                return;
            }
            const spineItem = spineList[resourceIndex];
            if (!spineItem) {
                hilog.error(0x0000, TAG, `[loadCurrentPageText] spineItem not found for index ${resourceIndex}, trying full book`);
                await this.tryLoadFullBook();
                return;
            }
            // 准备多个可能的资源路径
            const possiblePaths: string[] = [];
            if (spineItem.href)
                possiblePaths.push(spineItem.href);
            if (spineItem.idRef)
                possiblePaths.push(spineItem.idRef);
            // 如果 href 包含路径，有时需要去掉目录部分只取文件名？但不确定，先保持原样
            // 尝试不同的参数组合
            const attempts: AttemptParams[] = [];
            for (const path of possiblePaths) {
                const attempt1: AttemptParams = { index: resourceIndex, path: path };
                const attempt2: AttemptParams = { index: -1, path: path };
                attempts.push(attempt1); // 使用原索引
                attempts.push(attempt2); // 使用 -1 全局查找
            }
            for (const attempt of attempts) {
                hilog.info(0x0000, TAG, `[loadCurrentPageText] trying: index=${attempt.index}, path=${attempt.path}`);
                const buffer = this.defaultHandler.getResourceContent(attempt.index, attempt.path);
                if (buffer && buffer.byteLength > 0) {
                    hilog.info(0x0000, TAG, `[loadCurrentPageText] success with index=${attempt.index}, path=${attempt.path}, size=${buffer.byteLength}`);
                    const decoder = util.TextDecoder.create('utf-8');
                    const rawText = decoder.decodeToString(new Uint8Array(buffer)) || '';
                    this.currentPageText = this.cleanHtmlTags(rawText);
                    hilog.info(0x0000, TAG, `[loadCurrentPageText] plainText length: ${this.currentPageText.length}`);
                    return; // 成功获取后返回
                }
            }
            // 所有尝试失败，回退到整本书
            hilog.warn(0x0000, TAG, '[loadCurrentPageText] all attempts failed, trying full book');
            await this.tryLoadFullBook();
        }
        catch (e) {
            hilog.error(0x0000, TAG, `[loadCurrentPageText] error: ${e.message}`);
            await this.tryLoadFullBook();
        }
    }
    //辅助函数：清理HTML标签，保留基本标点
    private cleanHtmlTags(html: string): string {
        return html
            .replace(/<[^>]*>/g, ' ') // 替换标签为空格，避免词语粘连
            .replace(/\s+/g, ' ') // 合并多个空白字符
            .trim();
    }
    //尝试加载整本书内容
    private async tryLoadFullBook() {
        let content = '';
        // 尝试1：通过解析器获取整本书内容
        try {
            const fullBookBuffer = this.defaultHandler?.getResourceContent(-1, '');
            if (fullBookBuffer && fullBookBuffer.byteLength > 0) {
                const decoder = util.TextDecoder.create('utf-8');
                content = decoder.decodeToString(new Uint8Array(fullBookBuffer)) || '';
                hilog.info(0x0000, TAG, `[tryLoadFullBook] loaded via parser, length: ${content.length}`);
            }
        }
        catch (e) {
            hilog.warn(0x0000, TAG, `[tryLoadFullBook] parser failed: ${e.message}`);
        }
        // 尝试2：如果解析器失败或无内容，直接读取文件
        if (!content && this.bookFilePath) {
            hilog.info(0x0000, TAG, `[tryLoadFullBook] trying direct file read: ${this.bookFilePath}`);
            content = await this.readTextFromFile(this.bookFilePath);
            if (content) {
                hilog.info(0x0000, TAG, `[tryLoadFullBook] direct file read succeeded, length: ${content.length}`);
            }
        }
        if (content) {
            this.currentPageText = this.cleanHtmlTags(content);
        }
        else {
            hilog.error(0x0000, TAG, '[tryLoadFullBook] all attempts failed');
            this.currentPageText = '';
        }
    }
    /**
     * 直接从文件路径读取文本内容（用于 TXT 等纯文本文件）
     * @param filePath 文件路径
     * @returns 文件内容字符串，失败返回空字符串
     */
    private async readTextFromFile(filePath: string): Promise<string> {
        try {
            // 检查文件是否存在
            if (!fs.accessSync(filePath)) {
                hilog.error(0x0000, TAG, `File not exists: ${filePath}`);
                return '';
            }
            // 同步读取文件（或使用异步 fs.readText，根据 API 版本）
            // 鸿蒙提供 fs.readTextSync 或 fs.readText都可以
            const text = await fs.readText(filePath);
            return text || '';
        }
        catch (error) {
            hilog.error(0x0000, TAG, `readTextFromFile failed: ${error.message}`);
            return '';
        }
    }
    aboutToDisappear(): void {
        try {
            display.off('change', this.screenDensityCallBack);
        }
        catch (error) {
            hilog.error(0x0000, TAG, `aboutToDisappear display.off failed, Code: ${error.code}, message: ${error.message}`);
        }
        this.readerComponentController.off('pageShow');
        this.readerComponentController.off('resourceRequest');
        //获取Index页面传入的“书籍文件路径”及“阅读进度”信息，并调用startPlay()接口打开书籍。
        this.readerComponentController.releaseBook();
        // 只停止朗读，不关闭引擎（引擎可以复用）
        this.speaker?.stopSpeak();
    }
    private buildCatalogItemList(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.height('100%');
            Column.width('100%');
            Column.borderRadius({ topRight: 32, topLeft: 32 });
            Column.visibility(this.currentIndex === 0 ? Visibility.Visible : Visibility.None);
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Column.zIndex(3);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.height(56);
            Row.alignItems(VerticalAlign.Center);
            Row.justifyContent(FlexAlign.End);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.borderRadius('50%');
            Stack.backgroundColor("#0d777777");
            Stack.align(Alignment.Center);
            Stack.width(40);
            Stack.height(40);
            Stack.margin({ top: 8, left: 16, right: 16 });
            Stack.onClick(() => {
                this.closeModal();
            });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.create({ "id": 125831487, "type": 40000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.fontColor([{ "id": 16777262, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }]);
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.width(18);
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.fontSize(18);
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.fontWeight(600);
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.renderingStrategy(SymbolRenderingStrategy.SINGLE);
            //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
            SymbolGlyph.effectStrategy(SymbolEffectStrategy.NONE);
        }, SymbolGlyph);
        Stack.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.padding({
                left: 16,
                right: 16
            });
            Row.width('100%');
            Row.margin({ bottom: 20 });
            Row.alignSelf(ItemAlign.Start);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.Top });
            Stack.width(42);
            Stack.shadow({ radius: 18, color: "#4D000000" });
            Stack.borderRadius(2);
            Stack.aspectRatio(3 / 4);
            Stack.visibility(this.bookTitle ? Visibility.Visible : Visibility.None);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create(this.bookCover);
            Image.draggable(false);
            Image.width(42);
            Image.aspectRatio(3 / 4);
            Image.borderRadius(2);
            Image.zIndex(1);
            Image.alt({ "id": 16777285, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.backgroundColor({ "id": 125829129, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777298, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.draggable(false);
            Image.aspectRatio(3 / 4);
            Image.width(42);
            Image.borderRadius(2);
            Image.zIndex(2);
            Image.position({ x: 0, y: 0 });
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777283, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.draggable(false);
            Image.width(42);
            Image.opacity(0.7);
            Image.aspectRatio(3);
            Image.position({ x: 0, y: 42 / 3 / 4 - 42 / 9 });
            Image.zIndex(0);
        }, Image);
        Stack.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.bookTitle);
            Text.fontSize({ "id": 125829684, "type": 10002, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
            Text.fontColor({ "id": 16777245, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.maxLines(1);
            Text.margin({ right: 12, left: 12 });
            Text.fontWeight(FontWeight.Bold);
            Text.flexShrink(1);
            Text.height(40);
            Text.visibility(this.bookTitle ? Visibility.Visible : Visibility.None);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
            List.scrollBar(BarState.Off);
            List.width('100%');
            List.layoutWeight(1);
            List.edgeEffect(EdgeEffect.None);
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
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
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Column.create();
                            Column.padding({
                                left: 16,
                                right: 16,
                                top: 6,
                                bottom: 6
                            });
                            Column.onClick(async () => {
                                this.jumpToChapter(item.index);
                            });
                        }, Column);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                            Row.height(48);
                            Row.justifyContent(FlexAlign.Center);
                            Row.alignItems(VerticalAlign.Center);
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(' · ');
                            Text.fontSize(14);
                            Text.fontColor(this.isCurrentChapterByIndex(item.index) ? { "id": 16777246, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777245, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item.name);
                            Text.fontSize(14);
                            Text.fontColor(this.isCurrentChapterByIndex(item.index) ? { "id": 16777246, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777245, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                            Text.fontWeight(this.isCurrentChapterByIndex(item.index) ? FontWeight.Bold : FontWeight.Normal);
                            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
                            Text.padding({ top: 8, bottom: 8 });
                            Text.maxLines(2);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        Row.pop();
                        Row.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Divider.create();
                        }, Divider);
                        Column.pop();
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, this.fullChapterList, forEachItemGenFunction, (item: ChapterItem) => item.index.toString(), false, false);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
    }
    private buildSetting(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.scrollBar(BarState.Auto);
            Scroll.edgeEffect(EdgeEffect.None);
            Scroll.width('100%');
            Scroll.height('100%');
            Scroll.visibility(this.currentIndex === 1 ? Visibility.Visible : Visibility.None);
            Scroll.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Scroll.borderRadius({ topRight: 32, topLeft: 32 });
            Scroll.zIndex(3);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //适配不同UI
            GridRow.create({
                columns: {
                    xs: 4,
                    sm: 4,
                    md: 9,
                    lg: 12
                },
                gutter: { x: 8, y: 8 },
                breakpoints: { value: ['0vp', '520vp', '840vp'] },
                direction: GridRowDirection.Row
            });
            //适配不同UI
            GridRow.margin({ top: 24, left: 16, right: 16 });
        }, GridRow);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //字体
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const data = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    GridCol.create({
                        span: {
                            xs: 1,
                            sm: 2,
                            md: 3,
                            lg: 4
                        },
                        offset: 0,
                        order: 0
                    });
                }, GridCol);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create();
                    Column.width('100%');
                    Column.onClick(async () => {
                        const currentResourceIndex = this.currentData?.resourceIndex ?? 0;
                        const currentDomPos = this.currentData?.startDomPos ?? '';
                        this.selectFontPath = data.getPath();
                        this.readerSetting.fontName = data.getAlias();
                        this.readerSetting.fontPath = data.getPath();
                        try {
                            this.readerComponentController.setPageConfig(this.readerSetting);
                            await this.readerComponentController.startPlay(currentResourceIndex, currentDomPos);
                            //保存设定
                            this.saveCurrentSettings();
                        }
                        catch (error) {
                            hilog.info(0x0000, TAG, `setFont failed, Code: ${error.code}, message: ${error.message}`);
                        }
                        hilog.info(0x0000, TAG, 'getAlias: = ' + data.getAlias() + " , getPath = " + data.getPath());
                    });
                    Column.id(TAG + '_Stack_' + data.getAlias());
                    Column.onAppear(() => {
                        focusControl.requestFocus(TAG + '_Stack_' + data.getAlias());
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(data.getAlias());
                    Text.fontSize(14);
                    Text.borderRadius(12);
                    Text.borderWidth(1.5);
                    Text.width('100%');
                    Text.height(48);
                    Text.fontColor(this.selectFontPath !== data.getPath() ? Color.Black :
                        Color.Red);
                    Text.textAlign(TextAlign.Center);
                    Text.backgroundColor(this.selectFontPath !== data.getPath() ? { "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777248, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                    Text.borderColor(this.selectFontPath !== data.getPath() ? { "id": 16777247, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777253, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                }, Text);
                Text.pop();
                Column.pop();
                GridCol.pop();
            };
            this.forEachUpdateFunction(elmtId, this.fontList, forEachItemGenFunction);
        }, ForEach);
        //字体
        ForEach.pop();
        //适配不同UI
        GridRow.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //翻页组件
            Row.create({ space: 20 });
            //翻页组件
            Row.width('100%');
            //翻页组件
            Row.margin({ left: 16, top: 16, right: 16 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777322, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontColor(Color.Black);
            Text.fontSize(15);
            Text.width(65);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({
                value: 'flipMode', group: 'radioGroup'
            });
            Radio.height(20);
            Radio.width(20);
            Radio.checked(true);
            Radio.radioStyle({
                checkedBackgroundColor: Color.Blue,
            });
            Radio.onClick(async () => {
                const currentResourceIndex = this.currentData?.resourceIndex ?? 0;
                const currentDomPos = this.currentData?.startDomPos ?? '';
                this.readerSetting.flipMode = '0';
                try {
                    this.readerComponentController.setPageConfig(this.readerSetting);
                    await this.readerComponentController.startPlay(currentResourceIndex, currentDomPos);
                    this.saveCurrentSettings();
                }
                catch (error) {
                    hilog.info(0x0000, TAG, `setflipMode failed, Code: ${error.code}, message: ${error.message}`);
                }
            });
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777230, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontSize(16);
            Text.lineHeight(21);
            Text.fontColor(Color.Black);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({
                value: 'flipMode', group: 'radioGroup'
            });
            Radio.height(20);
            Radio.width(20);
            Radio.checked(false);
            Radio.radioStyle({
                checkedBackgroundColor: Color.Blue,
            });
            Radio.onClick(() => {
                this.readerSetting.flipMode = '1';
                try {
                    this.readerComponentController.setPageConfig(this.readerSetting);
                    this.saveCurrentSettings();
                }
                catch (error) {
                    hilog.info(0x0000, TAG, `setflipMode failed, Code: ${error.code}, message: ${error.message}`);
                }
            });
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777241, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontSize(16);
            Text.lineHeight(21);
            Text.fontColor(Color.Black);
        }, Text);
        Text.pop();
        //翻页组件
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 单手模式开关
            Row.create();
            // 单手模式开关
            Row.width('100%');
            // 单手模式开关
            Row.margin({ left: 16, top: 16, right: 16 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('单手模式');
            Text.fontColor(Color.Black);
            Text.fontSize(15);
            Text.width(65);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: this.singleHandMode });
            Toggle.selectedColor(Color.Blue);
            Toggle.onChange((isOn: boolean) => {
                this.singleHandMode = isOn;
                this.saveCurrentSettings();
                hilog.info(0x0000, TAG, `Single hand mode changed to: ${isOn}`);
            });
        }, Toggle);
        Toggle.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('点击左右侧都翻下一页');
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        // 单手模式开关
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.margin({ top: 8 });
            Scroll.scrollable(ScrollDirection.Horizontal);
            Scroll.scrollBar(BarState.Off);
            Scroll.edgeEffect(EdgeEffect.Spring);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 12 });
            Row.constraintSize({
                minWidth: '100%'
            });
            Row.id(TAG + '_Row_1');
            Row.padding({
                left: 12,
                right: 12,
                top: 12,
                bottom: 12
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //背景颜色
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Stack.create();
                    Stack.width(`calc((100% - ${(this.themeList.length - 1) * 12}vp) / ${this.themeList.length})`);
                    Stack.constraintSize({
                        minWidth: 60
                    });
                    Stack.borderRadius(30);
                    Stack.borderStyle(BorderStyle.Solid);
                    Stack.onClick(async () => {
                        const currentResourceIndex = this.currentData?.resourceIndex ?? 0;
                        const currentDomPos = this.currentData?.startDomPos ?? '';
                        this.themeSelectIndex = index;
                        this.readerSetting.themeColor = this.THEME_PAGE_COLOR[item];
                        this.readerSetting.nightMode = false;
                        if (index === 5) {
                            this.readerSetting.themeBgImg = 'white_sky_first.jpg';
                            this.readerSetting.fontColor = '#000000';
                        }
                        else if (index === 6) {
                            this.readerSetting.themeBgImg = 'dark_sky_first.jpg';
                            this.readerSetting.fontColor = '#ffffff';
                            this.readerSetting.nightMode = true;
                        }
                        else if (index == 4) {
                            this.readerSetting.themeBgImg = '';
                            this.readerSetting.nightMode = true;
                            this.readerSetting.fontColor = '#ffffff';
                        }
                        else {
                            this.readerSetting.themeBgImg = '';
                            this.readerSetting.fontColor = '#000000';
                        }
                        try {
                            this.readerSetting.scaledDensity = display.getDefaultDisplaySync().scaledDensity;
                            this.readerComponentController.setPageConfig(this.readerSetting);
                            await this.readerComponentController.startPlay(currentResourceIndex, currentDomPos);
                            this.saveCurrentSettings();
                        }
                        catch (error) {
                            hilog.info(0x0000, TAG, `setTheme failed, Code: ${error.code}, message: ${error.message}`);
                        }
                    });
                    Stack.id(TAG + '_Stack_' + index);
                    Stack.onAppear(() => {
                        focusControl.requestFocus(TAG + '_Stack_' + index);
                    });
                }, Stack);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.width('100%');
                    Row.height(40);
                    Row.borderWidth(this.themeSelectIndex !== index ? 1 : 2);
                    Row.borderColor(this.themeSelectIndex !== index ? { "id": 16777255, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } :
                        this.themeBorderColor[this.themeSelectIndex]);
                    Row.backgroundImage(this.getBackgroundImage(item));
                    Row.backgroundColor(this.THEME_BUTTON_BACKGROUND[item.toString()]);
                    Row.backgroundImagePosition(Alignment.BottomEnd);
                    Row.backgroundImageSize(ImageSize.Cover);
                    Row.borderRadius(20);
                    Row.id(TAG + '_Row_' + index);
                }, Row);
                Row.pop();
                Stack.pop();
            };
            this.forEachUpdateFunction(elmtId, this.themeList, forEachItemGenFunction, undefined, true, false);
        }, ForEach);
        //背景颜色
        ForEach.pop();
        Row.pop();
        Scroll.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //控制播放音量
            Row.create();
            //控制播放音量
            Row.width('100%');
            //控制播放音量
            Row.padding({ left: 10, right: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777320, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontColor(Color.Black);
            Text.fontSize(16);
            Text.width(50);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.ttsVolume, min: 0, max: 2, step: 0.5, style: SliderStyle.InSet });
            Slider.blockColor('#191970');
            Slider.trackColor('#ADD8E6');
            Slider.selectedColor('#4169E1');
            Slider.showSteps(true);
            Slider.showTips(true);
            Slider.width('60%');
            Slider.onChange((value: number, mode: SliderChangeMode) => {
                this.ttsVolume = Math.round(value * 2) / 2; // 四舍五入到0.5的倍数
                this.speaker.setVolume(this.ttsVolume);
                this.saveTTSSettings();
                hilog.info(0x0000, TAG, `TTS Volume changed to: ${this.ttsVolume}`);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.ttsVolume.toFixed(1)}`);
            Text.fontSize(14);
            Text.width(30);
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        //控制播放音量
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //控制播放音调
            Row.create();
            //控制播放音调
            Row.width('100%');
            //控制播放音调
            Row.padding({ left: 10, right: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777323, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontColor(Color.Black);
            Text.fontSize(16);
            Text.width(50);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.ttsPitch, min: 0.5, max: 2.0, step: 0.25, style: SliderStyle.InSet });
            Slider.blockColor('#191970');
            Slider.trackColor('#ADD8E6');
            Slider.selectedColor('#4169E1');
            Slider.showSteps(true);
            Slider.showTips(true);
            Slider.width('60%');
            Slider.onChange((value: number, mode: SliderChangeMode) => {
                this.ttsPitch = Math.round(value * 4) / 4; // 四舍五入到0.25的倍数
                this.speaker.setPitch(this.ttsPitch);
                this.saveTTSSettings();
                hilog.info(0x0000, TAG, `TTS Pitch changed to: ${this.ttsPitch}`);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.ttsPitch.toFixed(2)}`);
            Text.fontSize(14);
            Text.width(40);
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        //控制播放音调
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //控制播放语速
            Row.create();
            //控制播放语速
            Row.width('100%');
            //控制播放语速
            Row.padding({ left: 10, right: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777324, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontColor(Color.Black);
            Text.fontSize(16);
            Text.width(50);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.ttsSpeed, min: 0.5, max: 2.0, step: 0.25, style: SliderStyle.InSet });
            Slider.blockColor('#191970');
            Slider.trackColor('#ADD8E6');
            Slider.selectedColor('#4169E1');
            Slider.showSteps(true);
            Slider.showTips(true);
            Slider.width('60%');
            Slider.onChange((value: number, mode: SliderChangeMode) => {
                this.ttsSpeed = Math.round(value * 4) / 4; // 四舍五入到0.25的倍数
                this.speaker.setSpeed(this.ttsSpeed);
                this.saveTTSSettings();
                hilog.info(0x0000, TAG, `TTS Speed changed to: ${this.ttsSpeed}`);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.ttsSpeed.toFixed(2)}x`);
            Text.fontSize(14);
            Text.width(40);
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        //控制播放语速
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create();
            Text.width('92%');
            Text.height(1);
            Text.margin({ left: 16, top: 12, right: 16 });
            Text.backgroundColor({ "id": 16777249, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //字体大小
            Row.create();
            //字体大小
            Row.width('100%');
            //字体大小
            Row.padding({ left: 10, right: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777318, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontColor(Color.Black);
            Text.fontSize(16);
            Text.width(50);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.fontSize, min: 12, max: 32, step: 1, style: SliderStyle.InSet });
            Slider.blockColor('#191970');
            Slider.trackColor('#ADD8E6');
            Slider.selectedColor('#4169E1');
            Slider.showSteps(true);
            Slider.showTips(true);
            Slider.width('60%');
            Slider.onChange((value: number, mode: SliderChangeMode) => {
                this.fontSize = Math.round(value);
                this.readerSetting.fontSize = this.fontSize;
                this.readerComponentController.setPageConfig(this.readerSetting);
                this.saveCurrentSettings();
                hilog.info(0x0000, TAG, `FontSize changed to: ${this.fontSize}`);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.fontSize}`);
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.width(30);
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        //字体大小
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //行间距
            Row.create();
            //行间距
            Row.width('100%');
            //行间距
            Row.padding({ left: 10, right: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777319, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.fontColor(Color.Black);
            Text.fontSize(16);
            Text.width(50);
            Text.margin({ left: 5 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Slider.create({ value: this.lineHeight, min: 1.0, max: 3.0, step: 0.1, style: SliderStyle.InSet });
            Slider.blockColor('#191970');
            Slider.trackColor('#ADD8E6');
            Slider.selectedColor('#4169E1');
            Slider.showSteps(true);
            Slider.showTips(true);
            Slider.width('60%');
            Slider.onChange((value: number, mode: SliderChangeMode) => {
                this.lineHeight = Math.round(value * 10) / 10;
                this.readerSetting.lineHeight = this.lineHeight;
                this.readerComponentController.setPageConfig(this.readerSetting);
                this.saveCurrentSettings();
                hilog.info(0x0000, TAG, `LineHeight changed to: ${this.lineHeight}`);
            });
        }, Slider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.lineHeight.toFixed(1)}`);
            Text.fontColor(Color.Black);
            Text.fontSize(14);
            Text.width(40);
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        //行间距
        Row.pop();
        Column.pop();
        Scroll.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.width('100%');
            Stack.height('100%');
            Stack.onClick(() => {
                this.showModal();
            });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 加载错误提示（放在最外层，覆盖所有内容）
            if (this.loadError) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor(Color.White);
                        Column.zIndex(10);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('无法打开书籍');
                        Text.fontSize(20);
                        Text.fontColor('#FF0000');
                        Text.margin({ bottom: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.loadError);
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ bottom: 24 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('返回书架');
                        Button.onClick(() => {
                            this.getUIContext().getRouter().back();
                        });
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        //阅读内容展示,交互场景化组件
                        Stack.create();
                        //阅读内容展示,交互场景化组件
                        Stack.width('100%');
                        //阅读内容展示,交互场景化组件
                        Stack.height('100%');
                        //阅读内容展示,交互场景化组件
                        Stack.zIndex(1);
                    }, Stack);
                    {
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            if (isInitialRender) {
                                let componentCall = new ReadPageComponent(this, {
                                    controller: this.readerComponentController,
                                    readerCallback: (err: BusinessError, data: readerCore.ReaderComponentController) => {
                                        this.readerComponentController = data; //使得父组件可以持有并后续使用这个控制器来操作阅读器
                                        if (err) {
                                            hilog.info(0x0000, TAG, `ReadPageComponent init failed, Code: ${err.code}, message: ${err.message}`);
                                        }
                                    }
                                }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Reader.ets", line: 1515, col: 9 });
                                ViewPU.create(componentCall);
                                let paramsLambda = () => {
                                    return {
                                        controller: this.readerComponentController,
                                        readerCallback: (err: BusinessError, data: readerCore.ReaderComponentController) => {
                                            this.readerComponentController = data; //使得父组件可以持有并后续使用这个控制器来操作阅读器
                                            if (err) {
                                                hilog.info(0x0000, TAG, `ReadPageComponent init failed, Code: ${err.code}, message: ${err.message}`);
                                            }
                                        }
                                    };
                                };
                                componentCall.paramsGenerator_ = paramsLambda;
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "ReadPageComponent" });
                    }
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        // 单手模式：左右两侧触摸区域，点击都翻到下一页
                        if (this.singleHandMode) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    // 左侧触摸区域
                                    Column.create();
                                    // 左侧触摸区域
                                    Column.width('30%');
                                    // 左侧触摸区域
                                    Column.height('100%');
                                    // 左侧触摸区域
                                    Column.position({ x: 0, y: 0 });
                                    // 左侧触摸区域
                                    Column.backgroundColor(Color.Transparent);
                                    // 左侧触摸区域
                                    Column.onClick(() => {
                                        hilog.info(0x0000, TAG, 'SingleHandMode: left area clicked, flip to next page');
                                        this.readerComponentController.flipPage(true);
                                    });
                                }, Column);
                                // 左侧触摸区域
                                Column.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    // 右侧触摸区域
                                    Column.create();
                                    // 右侧触摸区域
                                    Column.width('30%');
                                    // 右侧触摸区域
                                    Column.height('100%');
                                    // 右侧触摸区域
                                    Column.position({ x: '70%', y: 0 });
                                    // 右侧触摸区域
                                    Column.backgroundColor(Color.Transparent);
                                    // 右侧触摸区域
                                    Column.onClick(() => {
                                        hilog.info(0x0000, TAG, 'SingleHandMode: right area clicked, flip to next page');
                                        this.readerComponentController.flipPage(true);
                                    });
                                }, Column);
                                // 右侧触摸区域
                                Column.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    //阅读内容展示,交互场景化组件
                    Stack.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        //播放图标
                        Row.create();
                        Context.animation({ duration: 300, curve: Curve.EaseInOut });
                        //播放图标
                        Row.position({ top: 30, right: 20 });
                        //播放图标
                        Row.zIndex(4);
                        //播放图标
                        Row.visibility(this.currentIndex >= 0 ? Visibility.Visible : Visibility.None);
                        Context.animation(null);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create(this.isClicked ? { "id": 16777275, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777274, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                        Image.width(40);
                        Image.height(40);
                        Image.onClick(async () => {
                            hilog.info(0x0000, TAG, 'currentPageText: ' + this.currentPageText);
                            if (!this.currentPageText) {
                                hilog.warn(0x0000, TAG, 'No text to speak');
                                this.getUIContext().getPromptAction().showToast({ message: '当前页面无文本', duration: 1000 });
                                return;
                            }
                            const newState = !this.isClicked;
                            this.isClicked = newState; // 先切换状态，让按钮图标变化
                            if (newState) {
                                try {
                                    await this.speaker.startSpeak(this.currentPageText);
                                }
                                catch (error) {
                                    hilog.error(0x0000, TAG, `startSpeak error: ${error}`);
                                    this.isClicked = false; // 朗读失败时恢复状态
                                    this.getUIContext().getPromptAction().showToast({ message: '朗读失败', duration: 1000 });
                                }
                            }
                            else {
                                this.speaker.stopSpeak();
                            }
                        });
                    }, Image);
                    //播放图标
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 章节显示
                        Text.create(`${this.currentChapter}/${this.totalChapters}`);
                        // 章节显示
                        Text.fontSize(14);
                        // 章节显示
                        Text.fontColor('#666666');
                        // 章节显示
                        Text.padding({ left: 8, right: 8, top: 4, bottom: 4 });
                        // 章节显示
                        Text.borderRadius(12);
                        // 章节显示
                        Text.position({ bottom: 20, right: 20 });
                        // 章节显示
                        Text.zIndex(2);
                    }, Text);
                    // 章节显示
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        //menu bar
                        if (this.currentIndex >= 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.create();
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.width('100%');
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.height('100%');
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.backgroundColor(this.currentIndex === 0 ? '#0d626262' : Color.Transparent);
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.justifyContent(FlexAlign.End);
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.onClick(() => this.closeModal());
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.transition(TransitionEffect.translate({ y: '100%' }).animation({ duration: 300, curve: Curve.EaseInOut }));
                                    //外层遮罩：全屏，半透明背景，点击关闭
                                    Column.zIndex(2);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    //内部菜单容器：实际内容：目录/设置 + 底部按钮
                                    Column.create();
                                    //内部菜单容器：实际内容：目录/设置 + 底部按钮
                                    Column.width('100%');
                                    //内部菜单容器：实际内容：目录/设置 + 底部按钮
                                    Column.height('65%');
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    //内容区域：目录和设置
                                    Column.create();
                                    //内容区域：目录和设置
                                    Column.layoutWeight(1);
                                    //内容区域：目录和设置
                                    Column.width('100%');
                                    //内容区域：目录和设置
                                    Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777263, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                                    //内容区域：目录和设置
                                    Column.borderRadius({ topRight: 32, topLeft: 32 });
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    If.create();
                                    if (this.currentIndex === 0) {
                                        this.ifElseBranchUpdateFunction(0, () => {
                                            this.buildCatalogItemList.bind(this)();
                                        });
                                    }
                                    else {
                                        this.ifElseBranchUpdateFunction(1, () => {
                                            this.buildSetting.bind(this)();
                                        });
                                    }
                                }, If);
                                If.pop();
                                //内容区域：目录和设置
                                Column.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    // 底部按钮栏
                                    Row.create();
                                    // 底部按钮栏
                                    Row.width('100%');
                                    // 底部按钮栏
                                    Row.height(80);
                                    // 底部按钮栏
                                    Row.backgroundColor(Color.White);
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create({ "id": 16777226, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                                    Text.width('50%');
                                    Text.height('100%');
                                    Text.onClick(() => this.jumpToCatalogList());
                                    Text.textAlign(TextAlign.Center);
                                    Text.fontColor(this.currentIndex === 0 ? Color.Red : Color.Black);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create({ "id": 16777238, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                                    Text.width('50%');
                                    Text.height('100%');
                                    Text.onClick(() => this.jumpToSetting());
                                    Text.textAlign(TextAlign.Center);
                                    Text.fontColor(this.currentIndex === 1 ? Color.Red : Color.Black);
                                }, Text);
                                Text.pop();
                                // 底部按钮栏
                                Row.pop();
                                //内部菜单容器：实际内容：目录/设置 + 底部按钮
                                Column.pop();
                                //外层遮罩：全屏，半透明背景，点击关闭
                                Column.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 加载指示器（仅在加载时显示）
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor(Color.White);
                        Column.zIndex(5);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.width(50);
                        LoadingProgress.height(50);
                        LoadingProgress.color({ "id": 16777246, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('正在加载书籍...');
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
    }
    //开启目录栏
    private showModal() {
        //this.showModalBanner = true;
        if (this.currentIndex < 0) {
            this.currentIndex = 0; // 默认显示目录
            this.jumpToCatalogList();
        }
    }
    //关闭目录栏
    private closeModal() {
        //this.showModalBanner = false;
        this.currentIndex = -1;
    }
    //跳转到“目录列表页面”方法，并获取“目录节点列表”及“书籍信息”。
    private jumpToCatalogList() {
        //重置当前索引确保打开目录时默认定位到开头
        this.currentIndex = 0;
        try { //获取目录列表
            //通过书籍解析器处理器（defaultHandler）调用 getCatalogList() 获取书籍的目录列表，通过 || [] 兜底，保证 catalogItemList 始终是一个数组
            this.catalogItemList = this.defaultHandler?.getCatalogList() || [];
            // 生成完整章节列表
            this.buildFullChapterList();
        }
        catch (error) {
            hilog.info(0x0000, TAG, `getCatalogList failed, Code: ${error.code}, message: ${error.message}`);
        }
        //触发获取书籍基本信息
        this.getBookInfo();
        hilog.info(0x0000, TAG, 'catalog list length: ' + this.catalogItemList.length + ', full chapter list length: ' + this.fullChapterList.length);
    }
    //跳转到设置
    private jumpToSetting() {
        this.currentIndex = 1;
    }
    //跳转到指定目录章节
    private async jumpToCatalogItem(catalogItem: bookParser.CatalogItem) {
        //获取文档位置，根据目录项信息计算出在文档中的精确位置（例如章节开头的元素ID或字符偏移量），用于实现定位。
        const domPos = await this.getDomPos(catalogItem);
        //获取资源索引，将目录项映射到对应的资源索引（ps章节号），以便阅读器知道加载哪个资源块。
        const resourceIndex = this.getResourceItemByCatalog(catalogItem).index;
        //调用阅读器控制器的 startPlay 方法，传入资源索引和位置信息，让阅读器跳转到指定章节并定位到 domPos 位置。
        this.readerComponentController.startPlay(resourceIndex, domPos).catch(() => {
            hilog.info(0x0000, TAG, `startPlay failed`);
        });
        this.closeModal();
    }
    // 根据传入的目录项获取该章节在书籍文档中的具体定位标识
    private async getDomPos(catalogItem: bookParser.CatalogItem): Promise<string> {
        try {
            // 通过 this.defaultHandler（书籍解析器处理器）调用 getDomPosByCatalogHref 方法，
            // 并传入目录项的 href 属性（通常指向章节在文档中的唯一标识，如文件名或元素ID）
            const domPos: string = this.defaultHandler?.getDomPosByCatalogHref(catalogItem.href || '') || '';
            return domPos;
        }
        catch (error) {
            hilog.info(0x0000, TAG, `getDomPos failed, Code: ${error.code}, message: ${error.message}`);
        }
        return Promise.reject();
    }
    // 判断某个目录项是否是当前所在章节
    private isCurrentChapter(catalogItem: bookParser.CatalogItem): boolean {
        if (!this.currentData || this.currentData.resourceIndex < 0) {
            return false;
        }
        const resourceItem = this.getResourceItemByCatalog(catalogItem);
        return resourceItem.index === this.currentData.resourceIndex;
    }
    // 根据章节索引判断是否为当前章节
    private isCurrentChapterByIndex(chapterIndex: number): boolean {
        if (!this.currentData || this.currentData.resourceIndex < 0) {
            return false;
        }
        return chapterIndex === this.currentData.resourceIndex;
    }
    // 跳转到指定章节（通过spine索引）
    private async jumpToChapter(chapterIndex: number): Promise<void> {
        if (chapterIndex < 0) {
            return;
        }
        try {
            await this.readerComponentController.startPlay(chapterIndex, '');
            hilog.info(0x0000, TAG, `jumpToChapter: jumped to chapter ${chapterIndex}`);
        }
        catch (err) {
            hilog.error(0x0000, TAG, `jumpToChapter failed: ${err}`);
        }
        this.closeModal();
    }
    // 更具传入的目录项查找并返回对应的资源项，用于定位和加载内容
    private getResourceItemByCatalog(catalogItem: bookParser.CatalogItem): bookParser.SpineItem {
        // 获取目标资源文件名
        let resourceFile = catalogItem.resourceFile || '';
        try {
            // 获取整个 Spine 列表
            let spineList: bookParser.SpineItem[] = this.defaultHandler?.getSpineList() || [];
            //按文件名匹配资源项
            let resourceItemArr = spineList.filter(item => item.href === resourceFile);
            if (resourceItemArr.length > 0) { // 返回匹配项或默认项
                hilog.info(0x0000, TAG, 'getResourceItemByCatalog get resource ', resourceItemArr[0]);
                let resourceItem = resourceItemArr[0];
                return resourceItem;
            }
            else if (spineList.length > 0) {
                hilog.info(0x0000, TAG, 'getResourceItemByCatalog get resource in resourceList', spineList[0]);
                return spineList[0];
            }
        }
        catch (error) {
            hilog.info(0x0000, TAG, `getSpineList failed, Code: ${error.code}, message: ${error.message}`);
        }
        hilog.info(0x0000, TAG, 'getResourceItemByCatalog get resource in escape');
        return {
            idRef: '',
            index: 0,
            href: '',
            properties: ''
        };
    }
    //获取背景图片
    getBackgroundImage(themeType: string): Resource | string {
        if (themeType === 'whiteSky') {
            return { "id": 16777305, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
        }
        else if (themeType === 'darkSky') {
            return { "id": 16777284, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
        }
        return '';
    }
    //判断是否为字体文件
    private isFont(filePath: string): boolean {
        let options = [".ttf", ".woff2", ".otf"];
        let path = filePath.toLowerCase(); //将字符串中的所有字母字符转换为小写。
        let result = path.indexOf(options[0]) != -1 || path.indexOf(options[1]) != -1 || path.indexOf(options[2]) != -1;
        hilog.info(0x0000, TAG, 'isFont = ' + result);
        return result;
    }
    //从应用的沙箱文件系统中同步读取一个文件的内容，并将其以 ArrayBuffer 的形式返回
    private loadFileFromPath(filePath: string): ArrayBuffer {
        try {
            //同步获取指定路径的文件状态信息（stats 对象），其中包含文件大小等重要属性
            let stats = fs.statSync(filePath);
            //以只读模式同步打开文件
            let file = fs.openSync(filePath, fs.OpenMode.READ_ONLY);
            //根据文件大小创建一个固定长度的 ArrayBuffer，用于存放即将读取的文件数据
            let buffer = new ArrayBuffer(stats.size);
            //同步读取文件内容，将数据从文件描述符填充到之前分配的 buffer 中
            fs.readSync(file.fd, buffer);
            //同步关闭文件，释放文件描述符
            fs.closeSync(file);
            return buffer;
        }
        catch (error) {
            hilog.error(0x0000, TAG, `loadFileFromPath failed, Code: ${error.code}, message: ${error.message}`);
            return new ArrayBuffer(0);
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
        return "Reader";
    }
}
registerNamedRoute(() => new Reader(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/Reader", pageFullPath: "entry/src/main/ets/pages/Reader", integratedHsp: "false", moduleType: "followWithHap" });
