//阅读页
import { WindowAbility } from '../entryability/WindowAbility';
import { display } from '@kit.ArkUI';
import { fileIo as fs } from '@kit.CoreFileKit';
import { image } from '@kit.ImageKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { FontFileInfo } from '../common/FontFileInfo';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { ReadPageComponent, readerCore, bookParser } from '@kit.ReaderKit';
import { common, ConfigurationConstant } from '@kit.AbilityKit';
import { BookUtils } from '../utils/BookUtils';
import { SettingStorage, PersistedReaderSettings } from '../common/SettingStorage';
import { ProgressStorage, BookProgress} from '../common/ProgressStorage';
import { emitter } from '@kit.BasicServicesKit';
import { Speaker } from '../utils/Speaker'
import { util } from '@kit.ArkTS';
import { DistributedSyncManager } from '../utils/DistributedSyncManager';

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

// 章节项
interface ChapterItem {
  index: number;        // spine索引
  name: string;         // 章节名称
  href: string;         // 章节路径
}

const TAG: string = 'ReaderPage';



@Entry
@Component
struct Reader {
  //监听窗口的数值
  @StorageLink('windowWidth') windowWidth: number = 0;
  @StorageLink('windowHeight') windowHeight: number = 0;
  //监听colorMode字段的变化。如果颜色变化，则触发对应主题色的变更。
  @StorageLink('colorMode') @Watch('colorModeChange') colorMode: ConfigurationConstant.ColorMode =
    ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET;
  @State isUpdatePressed: boolean = false;
  @StorageLink('eyeMode') eyeMode: boolean = false;
  /**
   * 显示底部菜单,废弃
   */
  //@State showModalBanner: boolean = false;
  /**
   * 菜单类型index, 0 : catalog list, 1 : setting, 1 : close dialog
   */
  @State currentIndex: number = -1;
  //章节列表元素
  @State catalogItemList: bookParser.CatalogItem[] = [];
  // 完整章节列表（基于spine，包含所有章节）
  @State fullChapterList: ChapterItem[] = [];
  //readerCore.PageDataInfo包含当前页内容、页码、章节信息等关键数据
  private currentData: readerCore.PageDataInfo | null = null;
  //书籍解析器处理器
  private defaultHandler: bookParser.BookParserHandler | null = null;
  //阅读控制器:例如翻页、跳转章节、获取当前阅读进度等
  private readerComponentController: readerCore.ReaderComponentController = new readerCore.ReaderComponentController();
  // 章节显示相关状态
  @State currentChapter: number = 1;  // 当前章节（从1开始）
  @State totalChapters: number = 0;  // 总章节数
  @State bookCover: PixelMap | null = null;
  @State bookTitle: string = '';
  @State author: string = '';
  @State loadError: string = ''; // 加载错误信息
  @State fontSize: number = 18;  // 字体大小 (12-32)
  @State lineHeight: number = 1.9;  // 行间距 (1.0-3.0)
  //初始化字体列表
  private fontList: Array<FontFileInfo> =
    //BookUtils.getString(context,name)根据资源名称从应用的资源管理器中获取对应的本地化字符串。
    //FontFileInfo 类包括alias：字体的显示名称（如“系统字体”）。path：字体文件的路径。
    [new FontFileInfo(BookUtils.getString(this.getUIContext().getHostContext(), 'system_font'),
      'rawfile/simsun.ttc'),
      new FontFileInfo(BookUtils.getString(this.getUIContext().getHostContext(), 'source_hua_kang_font'),
        'rawfile/HuaKang.TTC')];

  @State selectFontPath: string = '';
  //自定义背景,下面4个
  @State themeList: string[] = [
    'white',
    'yellow',
    'pink',
    'green',
    'dark',
    'whiteSky',
    'darkSky'
  ];
  private THEME_BUTTON_BACKGROUND: Record<string, Resource> = {
    'white': $r('app.color.ic_white_theme_button_background'),
    'yellow': $r('app.color.ic_yellow_theme_button_background'),
    'pink': $r('app.color.ic_pink_theme_button_background'),
    'green': $r('app.color.ic_green_theme_button_background'),
    'dark': $r('app.color.ic_dark_theme_button_background'),
    'whiteSky': $r('app.color.ic_white_theme_button_background'),
    'darkSky': $r('app.color.ic_dark_theme_button_background')
  }
  private THEME_PAGE_COLOR: Record<string, string> = {
    'white': '#FFFFFF',
    'yellow': '#BD9063',
    'pink': '#FFE4E5',
    'green': '#C5E7CE',
    'dark': '#202224',
    'whiteSky': '#FFFFFF',
    'darkSky': '#202224'
  }
  private themeBorderColor: Record<number, Resource> = {
    0: $r('app.color.ic_border_select_white'),
    1: $r('app.color.ic_border_select_yellow'),
    2: $r('app.color.ic_border_select_pink'),
    3: $r('app.color.ic_border_select_green'),
    4: $r('app.color.ic_border_select_white'),
    5: $r('app.color.ic_border_select_white'),
    6: $r('app.color.ic_border_select_white')
  }
  //主题
  @State themeSelectIndex: number = 0;
  // 单手模式：点击屏幕左右两侧都翻到下一页
  @State singleHandMode: boolean = false;
  //阅读相关设置
  private readerSetting: readerCore.ReaderSetting = {
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
  //自定义的回调函数，用作屏幕变化事件的处理器
  private screenDensityCallBack: Callback<number> | null = null;
  @State isLoading: boolean = false;

  private bookFilePath: string = '';

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
        this.selectFontPath = saved.fontPath  ?? '';
        this.fontSize = saved.fontSize ?? 18;
        this.lineHeight = saved.lineHeight ?? 1.9;

        // 优先使用保存的字体颜色和主题模式设置
        // 如果保存的设置中有有效的 fontColor（非空字符串），直接使用
       // themeList: ['white', 'yellow', 'pink', 'green', 'dark', 'whiteSky', 'darkSky']
        //index 4 (dark), 6 (darkSky) 需要白色字体
        if (saved.fontColor && saved.fontColor.length > 0) {
          this.readerSetting.fontColor = saved.fontColor;
          this.readerSetting.nightMode = saved.nightMode;
          hilog.info(0x0000, TAG, `Using saved fontColor: ${saved.fontColor}, nightMode: ${saved.nightMode}`);
        } else {
          // 兼容旧数据：根据主题索引推断字体颜色
          hilog.info(0x0000, TAG, `No valid fontColor saved, inferring from themeSelectIndex: ${saved.themeSelectIndex}`);
          if (saved.themeSelectIndex === 4 || saved.themeSelectIndex === 6){
            // 深色主题（dark 或 darkSky）：使用白色字体
            this.readerSetting.fontColor = '#ffffff';
            this.readerSetting.nightMode = true;
          }else {
            // 浅色主题：根据系统颜色模式决定
            if (this.colorMode === ConfigurationConstant.ColorMode.COLOR_MODE_DARK) {
              this.readerSetting.fontColor = '#ffffff';
              this.readerSetting.nightMode = true;
            } else {
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
        } else {
          this.ttsVolume = 1.0;
        }
        if (saved.ttsPitch !== undefined) {
          this.ttsPitch = saved.ttsPitch;
          this.speaker.setPitch(this.ttsPitch);
        } else {
          this.ttsPitch = 1.0;
        }
        if (saved.ttsSpeed !== undefined) {
          this.ttsSpeed = saved.ttsSpeed;
          this.speaker.setSpeed(this.ttsSpeed);
        } else {
          this.ttsSpeed = 1.0;
        }

        // 加载单手模式设置
        if (saved.singleHandMode !== undefined) {
          this.singleHandMode = saved.singleHandMode;
        }

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
      } catch (err) {
        hilog.error(0x0000, TAG, `aboutToAppear startPlay failed：${err}`);
        this.loadError = '打开书籍失败';
      }

    }catch (error){
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
    try {//scaledDensity屏幕的密度缩放因子，  1.获取默认显示器的同步信息，2.返回1
      return display.getDefaultDisplaySync().scaledDensity > 0 ? display.getDefaultDisplaySync().scaledDensity : 1;
    } catch (error) {
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
    } else {
      this.readerSetting.nightMode = false;
      this.readerSetting.fontColor = '#000000';
      this.readerSetting.themeColor = '#FFFFFF';
    }
    try {
      this.readerComponentController.setPageConfig(this.readerSetting);
    } catch (error) {
      hilog.error(0x0000, TAG,
        `colorModeChange setPageConfig failed, error code: ${error.code}, message: ${error.message}.`);
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
      } catch (error) {
        hilog.error(0x0000, TAG,
          `registerScreenDensityChange getDefaultDisplaySync failed, error code: ${error.code}, message: ${error.message}.`);
      }
    }
    display.on('change', this.screenDensityCallBack);
  }

  //资源请求回调。字体文件和主题背景图像可以存储在resources/rawfile目录或应用沙盒路径中。
  //前面这一坨表示一个接收字符串参数（文件路径）并返回 ArrayBuffer 的回调。处理书籍内的图片、字体
  private resourceRequest: bookParser.CallbackRes<string, ArrayBuffer> = (filePath: string): ArrayBuffer => {
    hilog.info(0x0000, TAG,
      'resourceRequest : filePath = ' + filePath + ', this.selectFontPath = ' + this.selectFontPath);
    if (filePath.length === 0) {//参数校验
      return new ArrayBuffer(0);
    }
    //字体路径处理
    let resourcePath = filePath;
    if (this.isFont(filePath)) {
      resourcePath = this.selectFontPath;
    }

    try {//优先从应用资源管理器加载
      let context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      //获取当前 UIAbility 的上下文，通过 resourceManager.getRawFileContentSync 同步读取应用 rawfile 目录下的文件内容
      let value: Uint8Array = context.resourceManager.getRawFileContentSync(resourcePath);
      hilog.info(0x0000, TAG, 'resourceRequest : get other resource succeeded ');
      return value.buffer as ArrayBuffer;
    } catch (error) {
      let code = (error as BusinessError).code;
      let message = (error as BusinessError).message;
      hilog.error(0x0000, TAG,
        `resourceRequest : get resource failed, error code: ${code}, message: ${message}.`);
    }
    // 从沙箱路径加载
    //当从资源管理器加载失败后，调用 this.loadFileFromPath(resourcePath)
    // 从应用的沙箱文件系统（即应用私有目录）中加载文件
    return this.loadFileFromPath(resourcePath);
  }




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
      const catalogItem = catalogList.find(item =>
        item.href === spineItem.href ||
        item.href === spineItem.idRef ||
        (spineItem.href && item.href && spineItem.href.includes(item.href)) ||
        (spineItem.idRef && item.href && spineItem.idRef.includes(item.href))
      );

      if (catalogItem) {
        chapterName = catalogItem.catalogName;
      } else {
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
        } catch (error) {
          hilog.error(0x0000, TAG,
            `onWindowSizeChange failed, Code: ${error.code}, message: ${error.message}`);
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
          const catalogItem = catalogList.find(item =>
            item.href === spineItem.href ||
            item.href === spineItem.idRef ||
            (spineItem.href && item.href && spineItem.href.includes(item.href))
          );
          chapterName = catalogItem?.catalogName || spineItem.idRef || '章节' + (data.resourceIndex + 1);
        }
      }
      hilog.info(0x0000, TAG, `saveCurrentProgress: chapterName = ${chapterName}, resourceIndex = ${data.resourceIndex}`);
    } catch (e) {
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
    
    //  通知Index页面进度已更新，触发刷新
    AppStorage.setOrCreate('progressUpdated', Date.now());

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
      } catch (e) {
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
      let result: [bookParser.BookParserHandler | null, void] = await Promise.all([defaultHandler, initPromise]);

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
      } catch (e) {
        hilog.error(0x0000, TAG, `startPlay: getCatalogList failed: ${e}`);
      }

      //启动阅读，跳转到指定章节并定位到domPos指定的文档位置。
      try {
        await this.readerComponentController.startPlay(resourceIndex || 0, domPos);
        hilog.info(0x0000, TAG, 'startPlay: readerComponentController.startPlay completed');
        // 在startPlay完成后生成完整章节列表（此时书籍已完全加载，spine列表完整）
        this.buildFullChapterList();
      } catch (err) {
        hilog.error(0x0000, TAG, `startPlay: readerComponentController.startPlay failed: ${err}`);
      }
      // 立即加载当前页文本（因为 startPlay 可能不会触发 pageShow 立即更新）
      await this.loadCurrentPageText(resourceIndex || 0);

      // 加载成功，清除错误状态
      this.loadError = '';

    } catch (error) {
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
        } catch (coverError) {
          hilog.warn(0x0000, TAG, `getBookInfo: cover load failed, but continue: ${coverError.message}`);
        }
      }
      hilog.info(0x0000, TAG, `getBookInfo: bookTitle=${this.bookTitle}, author=${this.author}`);
    } catch (error) {
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
  @State isClicked :boolean = false;
  private speaker: Speaker = new Speaker();
  private currentPageText: string = '';// 存储当前页文本

  // TTS朗读设置状态变量
  @State ttsVolume: number = 1.0;    // 音量 (0-2)
  @State ttsPitch: number = 1.0;     // 音调 (0.5-2.0)
  @State ttsSpeed: number = 1.0;     // 语速 (0.5-2.0)

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
      if (spineItem.href) possiblePaths.push(spineItem.href);
      if (spineItem.idRef) possiblePaths.push(spineItem.idRef);
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

    } catch (e) {
      hilog.error(0x0000, TAG, `[loadCurrentPageText] error: ${e.message}`);
      await this.tryLoadFullBook();
    }
  }


  //辅助函数：清理HTML标签，保留基本标点
  private cleanHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ') // 替换标签为空格，避免词语粘连
      .replace(/\s+/g, ' ')      // 合并多个空白字符
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
    } catch (e) {
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
    } else {
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
    } catch (error) {
      hilog.error(0x0000, TAG, `readTextFromFile failed: ${error.message}`);
      return '';
    }
  }


  aboutToDisappear(): void {
    try {
      display.off('change', this.screenDensityCallBack);
    } catch (error) {
      hilog.error(0x0000, TAG, `aboutToDisappear display.off failed, Code: ${error.code}, message: ${error.message}`);
    }
    this.readerComponentController.off('pageShow');
    this.readerComponentController.off('resourceRequest');

    this.readerComponentController.releaseBook();
    // 只停止朗读，不关闭引擎（引擎可以复用）
    this.speaker?.stopSpeak();
  }

  @Builder
  private buildCatalogItemList() {
    Column() {
      Row() {
        Stack() {//用层叠布局
          //通过 SymbolGlyph 组件可将图标嵌入界面，并支持多色渲染、动态效果等特性
          SymbolGlyph($r('sys.symbol.xmark'))
            .fontColor(this.eyeMode ? [$r('app.color.ic_border_select_white')] :
              [$r('app.color.ohos_id_color_primary_light')])
            .width(18)
            .fontSize(18)
            .fontWeight(600)
            .renderingStrategy(SymbolRenderingStrategy.SINGLE)
            .effectStrategy(SymbolEffectStrategy.NONE)
        }
        .borderRadius('50%')
        .backgroundColor("#0d777777")
        .align(Alignment.Center)
        .width(40)
        .height(40)
        .margin({ top: 8, left: 16, right: 16 })
        .onClick(() => {
          this.closeModal();
        })
      }
      .width('100%')
      .height(56)
      .alignItems(VerticalAlign.Center)
      .justifyContent(FlexAlign.End)

      Row() {
        Stack({ alignContent: Alignment.Top }) {//图片样式
          Image(this.bookCover)
            .draggable(false)
            .width(42)
            .aspectRatio(3 / 4)
            .borderRadius(2)
            .zIndex(1)
            .alt($r('app.media.default_cover'))
            .backgroundColor($r('sys.color.ohos_id_color_background'))

          Image($r('app.media.spines'))
            .draggable(false)
            .aspectRatio(3 / 4)
            .width(42)
            .borderRadius(2)
            .zIndex(2)
            .position({ x: 0, y: 0 })

          Image($r('app.media.cover_shadow'))
            .draggable(false)
            .width(42)
            .opacity(0.7)
            .aspectRatio(3)
            .position({ x: 0, y: 42 / 3 / 4 - 42 / 9 })
            .zIndex(0)
        }
        .width(42)
        .shadow({ radius: 18, color: "#4D000000" })
        .borderRadius(2)
        .aspectRatio(3 / 4)
        .visibility(this.bookTitle ? Visibility.Visible : Visibility.None)

        Text(this.bookTitle)
          .fontSize($r('sys.float.ohos_id_text_size_body1'))
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .fontColor(this.eyeMode ? Color.White : $r('app.color.black_90_opacity'))
          .maxLines(1)
          .margin({ right: 12, left: 12 })
          .fontWeight(FontWeight.Bold)
          .flexShrink(1)
          .height(40)
          .visibility(this.bookTitle ? Visibility.Visible : Visibility.None)
      }
      .padding({
        left: 16,
        right: 16
      })
      .width('100%')
      .margin({ bottom: 20 })
      .alignSelf(ItemAlign.Start)

      List() {
        ForEach(this.fullChapterList, (item: ChapterItem) => {
          ListItem() {
            Column() {
              Row() {
                Row() {
                  Text(' · ')
                    .fontSize(14)
                    .fontColor(this.isCurrentChapterByIndex(item.index) ? $r('app.color.blue') :
                      (this.eyeMode ? Color.White : $r('app.color.black_90_opacity')))
                  Text(item.name)
                    .fontSize(14)
                    .fontColor(this.isCurrentChapterByIndex(item.index) ? $r('app.color.blue') :
                      (this.eyeMode ? Color.White : $r('app.color.black_90_opacity')))
                    .fontWeight(this.isCurrentChapterByIndex(item.index) ? FontWeight.Bold : FontWeight.Normal)
                    .textOverflow({ overflow: TextOverflow.Ellipsis })
                    .padding({ top: 8, bottom: 8 })
                    .maxLines(2)
                    .layoutWeight(1)
                }
              }
              .width('100%')
              .height(48)
              .justifyContent(FlexAlign.Center)
              .alignItems(VerticalAlign.Center)

              Divider()
            }
            .padding({
              left: 16,
              right: 16,
              top: 6,
              bottom: 6
            })
            .onClick(async () => {
              this.jumpToChapter(item.index);
            })
          }
        }, (item: ChapterItem) => item.index.toString())
      }
      .scrollBar(BarState.Off)
      .width('100%')
      .layoutWeight(1)  // 使用layoutWeight占据剩余空间，避免被顶部固定高度元素挤压
      .edgeEffect(EdgeEffect.None)//去掉滚动到边缘的回弹效果
    }
    .height('100%')
    .width('100%')
    .borderRadius({ topRight: 32, topLeft: 32 })
    .visibility(this.currentIndex === 0 ? Visibility.Visible : Visibility.None)
    .backgroundColor(this.eyeMode ? $r('app.color.page_Reader_back') : $r('app.color.page_background1'))
    .zIndex(3)
  }

  @Builder
  private buildSetting() {
    Scroll() {
      Column() {
        //适配不同UI
        GridRow({
        columns: {
          xs: 4,
          sm: 4,
          md: 9,
          lg: 12
        },
        gutter: { x: 8, y: 8 },
        breakpoints: { value: ['0vp', '520vp', '840vp'] },
        direction: GridRowDirection.Row
      }) {
        //字体
        ForEach(this.fontList, (data: FontFileInfo) => {
          GridCol({
            span: {
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4
            },
            offset: 0,
            order: 0
          }) {
            Column() {
              Text(data.getAlias())
                .fontSize(14)
                .borderRadius(12)
                .borderWidth(1.5)
                .width('100%')
                .height(48)
                .fontColor(this.selectFontPath !== data.getPath() ? Color.Black :
                  Color.Red)
                .textAlign(TextAlign.Center)
                .backgroundColor(this.selectFontPath !== data.getPath() ? $r('app.color.ic_bg_grey') :
                  $r('app.color.ic_bg_font_selected'))
                .borderColor(this.selectFontPath !== data.getPath() ? $r('app.color.color_transparent') :
                  $r('app.color.ic_border_select_white'))
            }
            .width('100%')
            .onClick(async () => {//切换字体
              const currentResourceIndex = this.currentData?.resourceIndex ?? 0;
              const currentDomPos = this.currentData?.startDomPos ?? '';

              this.selectFontPath = data.getPath();
              this.readerSetting.fontName = data.getAlias();
              this.readerSetting.fontPath = data.getPath();
              try {
                this.readerComponentController.setPageConfig(this.readerSetting);
                await this.readerComponentController.startPlay(currentResourceIndex, currentDomPos);
                //保存设定
                this.saveCurrentSettings()
              } catch (error) {
                hilog.info(0x0000, TAG, `setFont failed, Code: ${error.code}, message: ${error.message}`);
              }
              hilog.info(0x0000, TAG, 'getAlias: = ' + data.getAlias() + " , getPath = " + data.getPath());
            })
            .id(TAG + '_Stack_' + data.getAlias())
            .onAppear(() => {
              focusControl.requestFocus(TAG + '_Stack_' + data.getAlias());
            })
          }
        });
      }.margin({ top: 24, left: 16, right: 16 })

      Text()
        .width('92%')
        .height(1)
        .margin({ left: 16, top: 12, right: 16 })
        .backgroundColor(this.eyeMode ? $r('app.color.ic_bg_black') : $r('app.color.ic_bg_grey'))

      //翻页组件
      Row({ space: 20 }) {

        Text($r('app.string.PageMode'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(15)
          .width(65)
          .margin({left:5})

        Radio({
          value: 'flipMode', group: 'radioGroup'
        })
          .height(20)
          .width(20)
          .checked(true)
          .radioStyle({
            checkedBackgroundColor: $r('app.color.blue2'),
          })
          .onClick(async () => {//仿真翻页组件,翻页方式代码
            const currentResourceIndex = this.currentData?.resourceIndex ?? 0;
            const currentDomPos = this.currentData?.startDomPos ?? '';

            this.readerSetting.flipMode = '0';
            try {
              this.readerComponentController.setPageConfig(this.readerSetting);
              await this.readerComponentController.startPlay(currentResourceIndex, currentDomPos);
              this.saveCurrentSettings()
            } catch (error) {
              hilog.info(0x0000, TAG, `setflipMode failed, Code: ${error.code}, message: ${error.message}`);
            }
          })
        Text($r('app.string.emulation_page'))
          .fontSize(16)
          .lineHeight(21)
          .fontColor(this.eyeMode ? Color.White : Color.Black)

        Radio({
          value: 'flipMode', group: 'radioGroup'
        })
          .height(20)
          .width(20)
          .checked(false)
          .radioStyle({
            checkedBackgroundColor: $r('app.color.blue2'),
          })
          .onClick(() => {//横滑翻页组件
            this.readerSetting.flipMode = '1';
            try {
              this.readerComponentController.setPageConfig(this.readerSetting);
              this.saveCurrentSettings()
            } catch (error) {
              hilog.info(0x0000, TAG, `setflipMode failed, Code: ${error.code}, message: ${error.message}`);
            }
          })
        Text($r('app.string.transversal_slip_page'))
          .fontSize(16)
          .lineHeight(21)
          .fontColor(this.eyeMode ? Color.White : Color.Black)
      }
      .width('100%')
      .margin({ left: 16, top: 16, right: 16 })

      Text()
        .width('92%')
        .height(1)
        .margin({ left: 16, top: 12, right: 16 })
        .backgroundColor(this.eyeMode ? $r('app.color.ic_bg_black') : $r('app.color.ic_bg_grey'))

      // 单手模式开关
      Row() {
        Text($r('app.string.SingleMode'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(15)
          .fontWeight(FontWeight.Bold)
          .width(65)
          .margin({ left: 5 ,right: 5 })

        Toggle({ type: ToggleType.Switch, isOn: this.singleHandMode })
          .selectedColor($r('app.color.blue2'))
          .onChange((isOn: boolean) => {
            this.singleHandMode = isOn;
            this.saveCurrentSettings();
            hilog.info(0x0000, TAG, `Single hand mode changed to: ${isOn}`);
          })

        Text($r('app.string.SingleModeDescription'))
          .fontSize(14)
          .fontColor(this.eyeMode ? '#ff7c7c7c' : '#666666')
          .margin({ left: 8 })
      }
      .width('100%')
      .margin({ left: 16, top: 16, right: 16 })

      Text()
        .width('92%')
        .height(1)
        .margin({ left: 16, top: 12, right: 16 })
        .backgroundColor(this.eyeMode ? $r('app.color.ic_bg_black') : $r('app.color.ic_bg_grey'))

      Scroll() {
        Row({ space: 12 }) {
          //背景颜色
          ForEach(this.themeList, (item: string, index: number) => {
            Stack() {
              Row()
                .width('100%')
                .height(40)
                .borderWidth(this.themeSelectIndex !== index ? 1 : 2)
                .borderColor(this.themeSelectIndex !== index ? $r('app.color.ic_border_unselect') :
                  this.themeBorderColor[this.themeSelectIndex])
                .backgroundImage(this.getBackgroundImage(item))
                .backgroundColor(this.THEME_BUTTON_BACKGROUND[item.toString()])
                .backgroundImagePosition(Alignment.BottomEnd)
                .backgroundImageSize(ImageSize.Cover)
                .borderRadius(20)
                .id(TAG + '_Row_' + index)
            }
            .width(`calc((100% - ${(this.themeList.length - 1) * 12}vp) / ${this.themeList.length})`)
            .constraintSize({
              minWidth: 60
            })
            .borderRadius(30)
            .borderStyle(BorderStyle.Solid)
            .onClick(async () => {
              const currentResourceIndex = this.currentData?.resourceIndex ?? 0;
              const currentDomPos = this.currentData?.startDomPos ?? '';

              this.themeSelectIndex = index;
              this.readerSetting.themeColor = this.THEME_PAGE_COLOR[item];
              this.readerSetting.nightMode = false;
              if (index === 5) {
                this.readerSetting.themeBgImg = 'white_sky_first.jpg';
                this.readerSetting.fontColor = '#000000';
              } else if (index === 6) {
                this.readerSetting.themeBgImg = 'dark_sky_first.jpg';
                this.readerSetting.fontColor = '#ffffff';
                this.readerSetting.nightMode = true;
              } else if (index === 4) {
                this.readerSetting.themeBgImg = '';
                this.readerSetting.nightMode = true;
                this.readerSetting.fontColor = '#ffffff';
              } else {
                this.readerSetting.themeBgImg = '';
                this.readerSetting.fontColor = '#000000';
              }
              try {
                this.readerSetting.scaledDensity = display.getDefaultDisplaySync().scaledDensity;
                this.readerComponentController.setPageConfig(this.readerSetting);
                await this.readerComponentController.startPlay(currentResourceIndex, currentDomPos);
                this.saveCurrentSettings()
              } catch (error) {
                hilog.info(0x0000, TAG, `setTheme failed, Code: ${error.code}, message: ${error.message}`);
              }
            })
            .id(TAG + '_Stack_' + index)
            .onAppear(() => {
              focusControl.requestFocus(TAG + '_Stack_' + index);
            })
          })
        }
        .constraintSize({
          minWidth: '100%'
        })
        .id(TAG + '_Row_1')
        .padding({
          left: 12,
          right: 12,
          top: 12,
          bottom: 12
        })
      }
      .margin({ top: 8 })
      .scrollable(ScrollDirection.Horizontal)
      .scrollBar(BarState.Off)
      .edgeEffect(EdgeEffect.Spring)

      Text()
        .width('92%')
        .height(1)
        .margin({ left: 16, top: 12, right: 16 })
        .backgroundColor(this.eyeMode ? $r('app.color.ic_bg_black') : $r('app.color.ic_bg_grey'))

      //控制播放音量
      Row(){
        Text($r('app.string.SpeechVolume'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(16)
          .width(50)
          .margin({left:5})

        Slider({value:this.ttsVolume,min:0,max:2,step:0.5,style:SliderStyle.InSet})
          .blockColor('#191970')
          .trackColor('#ADD8E6')
          .selectedColor($r('app.color.blue2'))
          .showSteps(true)// 显示刻度点
          .showTips(true)
          .width('60%')
          .onChange((value: number, mode: SliderChangeMode) => {
            this.ttsVolume = Math.round(value * 2) / 2;  // 四舍五入到0.5的倍数
            this.speaker.setVolume(this.ttsVolume);
            this.saveTTSSettings();
            hilog.info(0x0000, TAG, `TTS Volume changed to: ${this.ttsVolume}`);
          })

        Text(`${this.ttsVolume.toFixed(1)}`)
          .fontColor(this.eyeMode ? Color.White : $r('app.color.page_Reader_font'))
          .fontSize(14)
          .width(30)
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding({left:10, right:10,bottom: 7 })

      //控制播放音调
      Row(){
        Text($r('app.string.SpeechPitch'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(16)
          .width(50)
          .margin({left:5})

        Slider({value:this.ttsPitch,min:0.5,max:2.0,step:0.25,style:SliderStyle.InSet})
          .blockColor('#191970')
          .trackColor('#ADD8E6')
          .selectedColor($r('app.color.blue2'))
          .showSteps(true)// 显示刻度点
          .showTips(true)
          .width('60%')
          .onChange((value: number, mode: SliderChangeMode) => {
            this.ttsPitch = Math.round(value * 4) / 4;  // 四舍五入到0.25的倍数
            this.speaker.setPitch(this.ttsPitch);
            this.saveTTSSettings();
            hilog.info(0x0000, TAG, `TTS Pitch changed to: ${this.ttsPitch}`);
          })

        Text(`${this.ttsPitch.toFixed(2)}`)
          .fontColor(this.eyeMode ? Color.White : $r('app.color.page_Reader_font'))
          .fontSize(14)
          .width(40)
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding({left:10, right:10, bottom: 7})


      //控制播放语速
      Row(){
        Text($r('app.string.SpeechRate'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(16)
          .width(50)
          .margin({left:5})

        Slider({value:this.ttsSpeed,min:0.5,max:2.0,step:0.25,style:SliderStyle.InSet})
          .blockColor('#191970')
          .trackColor('#ADD8E6')
          .selectedColor($r('app.color.blue2'))
          .showSteps(true)// 显示刻度点
          .showTips(true)
          .width('60%')
          .onChange((value: number, mode: SliderChangeMode) => {
            this.ttsSpeed = Math.round(value * 4) / 4;  // 四舍五入到0.25的倍数
            this.speaker.setSpeed(this.ttsSpeed);
            this.saveTTSSettings();
            hilog.info(0x0000, TAG, `TTS Speed changed to: ${this.ttsSpeed}`);
          })

        Text(`${this.ttsSpeed.toFixed(2)}x`)
          .fontColor(this.eyeMode ? Color.White : $r('app.color.page_Reader_font'))
          .fontSize(14)
          .width(40)
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding({left:10, right:10})

      Text()
        .width('92%')
        .height(1)
        .margin({ left: 16, top: 12, right: 16 })
        .backgroundColor(this.eyeMode ? $r('app.color.ic_bg_black') : $r('app.color.ic_bg_grey'))

      //字体大小
      Row(){
        Text($r('app.string.FontSize'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(14)
          .width(50)
          .margin({left:5})

        Slider({value: this.fontSize, min: 12, max: 32, step: 1, style: SliderStyle.InSet})
          .blockColor('#191970')
          .trackColor('#ADD8E6')
          .selectedColor($r('app.color.blue2'))
          .showSteps(true)
          .showTips(true)
          .width('60%')
          .onChange((value: number, mode: SliderChangeMode) => {
            this.fontSize = Math.round(value);
            this.readerSetting.fontSize = this.fontSize;
            this.readerComponentController.setPageConfig(this.readerSetting);
            this.saveCurrentSettings();
            hilog.info(0x0000, TAG, `FontSize changed to: ${this.fontSize}`);
          })

        Text(`${this.fontSize}`)
          .fontColor(this.eyeMode ? Color.White : $r('app.color.page_Reader_font'))
          .fontSize(14)
          .width(30)
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding({left:10, right:10,top: 5})


      //行间距
      Row(){
        Text($r('app.string.LineHeight'))
          .fontColor(this.eyeMode ? Color.White : Color.Black)
          .fontSize(16)
          .width(50)
          .margin({left:5})

        Slider({value: this.lineHeight, min: 1.0, max: 3.0, step: 0.1, style: SliderStyle.InSet})
          .blockColor('#191970')
          .trackColor('#ADD8E6')
          .selectedColor($r('app.color.blue2'))
          .showSteps(true)
          .showTips(true)
          .width('60%')
          .onChange((value: number, mode: SliderChangeMode) => {
            this.lineHeight = Math.round(value * 10) / 10;
            this.readerSetting.lineHeight = this.lineHeight;
            this.readerComponentController.setPageConfig(this.readerSetting);
            this.saveCurrentSettings();
            hilog.info(0x0000, TAG, `LineHeight changed to: ${this.lineHeight}`);
          })

        Text(`${this.lineHeight.toFixed(1)}`)
          .fontColor(this.eyeMode ? Color.White : $r('app.color.page_Reader_font'))
          .fontSize(14)
          .width(40)
          .textAlign(TextAlign.Center)
      }
      .width('100%')
      .padding({left:10, right:10})
      .margin({bottom: 10 })

        Blank()
          .height(20)

      }
      .width('100%')
      .alignItems(HorizontalAlign.Start)
    }
    .scrollBar(BarState.Off)
    .edgeEffect(EdgeEffect.None)
    .width('100%')
    .height('100%')
    .visibility(this.currentIndex === 1 ? Visibility.Visible : Visibility.None)
    .backgroundColor(this.eyeMode ? $r('app.color.page_Reader_back') : $r('app.color.page_background1'))
    .borderRadius({ topRight: 32, topLeft: 32 })
    .zIndex(3)
  }

  build() {
    Stack() {
      // 加载错误提示（放在最外层，覆盖所有内容）
      if (this.loadError) {
        Column() {
          Text('无法打开书籍')
            .fontSize(20)
            .fontColor('#FF0000')
            .margin({ bottom: 16 })
          Text(this.loadError)
            .fontSize(16)
            .fontColor('#666666')
            .margin({ bottom: 24 })
          Button('返回书架')
            .onClick(() => {
              this.getUIContext().getRouter().back();
            })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .backgroundColor(Color.White)
        .zIndex(10) // 确保在最上层
      } else {
      //阅读内容展示,交互场景化组件
      Stack() {
        ReadPageComponent({
          controller: this.readerComponentController,
          readerCallback: (err: BusinessError, data: readerCore.ReaderComponentController) => {
            this.readerComponentController = data;//使得父组件可以持有并后续使用这个控制器来操作阅读器
            if (err) {
              hilog.info(0x0000, TAG, `ReadPageComponent init failed, Code: ${err.code}, message: ${err.message}`);
            }
          }
        })

        // 单手模式：左右两侧触摸区域，点击都翻到下一页
        if (this.singleHandMode) {
          // 左侧触摸区域
          Column()
            .width('30%')
            .height('100%')
            .position({ x: 0, y: 0 })
            .backgroundColor(Color.Transparent)
            .onClick(() => {
              hilog.info(0x0000, TAG, 'SingleHandMode: left area clicked, flip to next page');
              this.readerComponentController.flipPage(true);
            })

          // 右侧触摸区域
          Column()
            .width('30%')
            .height('100%')
            .position({ x: '70%', y: 0 })
            .backgroundColor(Color.Transparent)
            .onClick(() => {
              hilog.info(0x0000, TAG, 'SingleHandMode: right area clicked, flip to next page');
              this.readerComponentController.flipPage(true);
            })
        }
      }
      .width('100%')
      .height('100%')
      .zIndex(1)
      //播放图标
      Row(){
        Image(this.isClicked ? $r('app.media.VideoPlay_on') : $r('app.media.VideoPlay_off'))
          .width(40)
          .height(40)
          .onClick(async () => {
            hilog.info(0x0000, TAG, 'currentPageText: ' + this.currentPageText);
            if (!this.currentPageText) {
              hilog.warn(0x0000, TAG, 'No text to speak');

              this.getUIContext().getPromptAction().showToast({ message: '当前页面无文本', duration: 1000 });
              return;
            }
            // const newState = !this.isClicked;
            // this.isClicked = newState; // 先切换状态，让按钮图标变化

            this.isClicked = !this.isClicked ;
            if (this.isClicked  === true) {
              try {
                this.speaker.startSpeak(this.currentPageText)
              } catch (error) {
                this.getUIContext().getPromptAction().showToast({ message: '朗读失败', duration: 1000 });
              }
            } else {
              this.isClicked = false; // 朗读失败时恢复状态
              this.speaker.stopSpeak()
            }

          })
      }
      .position({ top: 30, right: 20 })
      .zIndex(4)
      .visibility(this.currentIndex >= 0 ? Visibility.Visible : Visibility.None)
      .animation({duration: 300, curve: Curve.EaseInOut})

      // 章节显示
      Text(`${this.currentChapter}/${this.totalChapters}`)
        .fontSize(14)
        .fontColor('#666666')
        .padding({ left: 8, right: 8, top: 4, bottom: 4 })
        .borderRadius(12)
        .position({ bottom: 20, right: 20 })
        .zIndex(2)

      //menu bar
      if (this.currentIndex >= 0) {

        //外层遮罩：全屏，半透明背景，点击关闭
        Column() {
          //内部菜单容器：实际内容：目录/设置 + 底部按钮
          Column() {
            //内容区域：目录和设置
            Column() {
              if (this.currentIndex === 0) {
                this.buildCatalogItemList()
              } else {
                this.buildSetting()
              }
            }
            .layoutWeight(1)//撑起来
            .width('100%')
            .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))
            .borderRadius({ topRight: 32, topLeft: 32 })

            // 底部按钮栏
            Row() {
              Text($r('app.string.catalog_list'))
                .width('50%')
                .height('100%')
                .onClick(() => this.jumpToCatalogList())
                .textAlign(TextAlign.Center)
                .fontColor(this.currentIndex === 0 ? Color.Red :
                  this.eyeMode ? $r('app.color.page_Reader_font') : Color.Black)
              Text($r('app.string.setting'))
                .width('50%')
                .height('100%')
                .onClick(() => this.jumpToSetting())
                .textAlign(TextAlign.Center)
                .fontColor(this.currentIndex === 1 ? Color.Red :
                  this.eyeMode ? $r('app.color.page_Reader_font') : Color.Black)
            }
            .width('100%')
            .height(80)
            .backgroundColor(this.eyeMode ? "#ff4f4f4f" : Color.White)
          }
          .width('100%')
          .height('65%')

        }
        .width('100%')
        .height('100%')
        .backgroundColor(this.currentIndex === 0 ? '#0d626262' : Color.Transparent)//遮罩背景
        .justifyContent(FlexAlign.End)//将内部菜单推到屏幕底部
        .onClick(() => this.closeModal())//点击遮罩关闭菜单
        .transition(TransitionEffect.translate({ y: '100%' }).animation({ duration: 300, curve: Curve.EaseInOut }))
        .zIndex(2)

      }
      }

      // 加载指示器（仅在加载时显示）
      if (this.isLoading) {
        Column() {
          LoadingProgress()
            .width(50)
            .height(50)
            .color($r('app.color.blue'))
          Text('正在加载书籍...')
            .fontSize(16)
            .fontColor('#666666')
            .margin({ top: 16 })
        }
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .backgroundColor(Color.White)
        .zIndex(5)
      }
    }
    .width('100%').height('100%').onClick(() => {
      this.showModal();
    })
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
    try {//获取目录列表
      //通过书籍解析器处理器（defaultHandler）调用 getCatalogList() 获取书籍的目录列表，通过 || [] 兜底，保证 catalogItemList 始终是一个数组
      this.catalogItemList = this.defaultHandler?.getCatalogList() || [];
      // 生成完整章节列表
      this.buildFullChapterList();
    } catch (error) {
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
    } catch (err) {
      hilog.error(0x0000, TAG, `jumpToChapter failed: ${err}`);
    }
    this.closeModal();
  }



  //获取背景图片
  getBackgroundImage(themeType: string): Resource | string {
    if (themeType === 'whiteSky') {
      return $r('app.media.white_sky_icon');
    } else if (themeType === 'darkSky') {
      return $r('app.media.dark_sky_icon');
    }
    return '';
  }

  //判断是否为字体文件
  private isFont(filePath: string): boolean {
    let options = [".ttf", ".woff2", ".otf"];
    let path = filePath.toLowerCase();//将字符串中的所有字母字符转换为小写。
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
    } catch (error) {
      hilog.error(0x0000, TAG, `loadFileFromPath failed, Code: ${error.code}, message: ${error.message}`);
      return new ArrayBuffer(0);
    }
  }


  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }
}
