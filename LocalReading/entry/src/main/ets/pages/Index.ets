//页面入口，用于导入书籍
import { picker } from '@kit.CoreFileKit';
import { WindowAbility } from '../entryability/WindowAbility';
import { LocalBookImporter } from '../utils/LocalBookImporter';
import { bookParser } from '@kit.ReaderKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { BookUtils } from '../utils/BookUtils';
import { common } from '@kit.AbilityKit';
import {BookStorage} from '../common/BookStorage'
import { BookParserInfo } from '../common/BookParserInfo';
import { ProgressStorage, BookProgress } from '../common/ProgressStorage';
import { image } from '@kit.ImageKit';
import { FileUtils } from '../utils/FileUtils';
import { fileIo as fs } from '@kit.CoreFileKit';
import { StorageUtil } from '../utils/StorageUtil';
import { BusinessError } from '@kit.BasicServicesKit';


const TAG: string = 'IndexPage';


@Component
export struct Index {
  //文件路径
  private filePath: string = '';

  @State bookName: string = '';
  // //页面数据信息，用于获取书籍的阅读进度,调用registerListener（）
  // @StorageLink('currentData') currentData: readerCore.PageDataInfo | null = null;

  //监听isDensityChange状态变量的变化，如果在onPageShow()方法里发现变化则重新进入阅读器
  @StorageLink('isDensityChange') isDensityChange: boolean = false;

  @StorageLink('eyeMode') eyeMode: boolean = false;

  //所有已导入书籍列表
  @State importedBooks: BookParserInfo[] = [];
  //当前选中的书籍（用于跳转）
  @State selectedBook: BookParserInfo | null = null;

  //在Index组件内添加状态变量存储所有进度
  @State progresses: BookProgress[] = [];

  @State isRefreshing: boolean = false;
  
  // 监听进度更新标志，当Reader保存进度时触发刷新
  @StorageLink('progressUpdated') @Watch('onProgressUpdated') progressUpdated: number = 0;

  async aboutToAppear() {
    hilog.info(0x0000, TAG, 'aboutToAppear');
    WindowAbility.getInstance().toggleWindowSystemBar(['status', 'navigation'], this.getUIContext().getHostContext());
    //如果 currentUser 为空，尝试从存储中恢复（作为后备）
    if (!this.currentUser) {
      const isLoggedIn = await StorageUtil.isLoggedIn();
      if (isLoggedIn) {
        this.currentUser = await StorageUtil.getCurrentUser();
      }
    }
    await this.reloadData();  //首次加载
  }


  onPageShow(): void {
    ////通过单例模式封装窗口系统栏的控制逻辑。用于控制这两个系统栏的显示或隐藏
    WindowAbility.getInstance().toggleWindowSystemBar(['status', 'navigation'], this.getUIContext().getHostContext());
    if (this.isDensityChange) {
      // 重新跳转页面
      this.jumper();
      //将全局标志 isDensityChange 重置为 false，避免每次显示页面都重复重启
      AppStorage.setOrCreate('isDensityChange', false);
    }
    hilog.info(0x0000, TAG, 'Index page onPageShow: loading progresses');

    // 重新获取最新的 currentUser（处理退出登录后返回的情况）
    const latestUser = AppStorage.get<string>('currentUser') || '';
    if (latestUser !== this.currentUser) {
      hilog.info(0x0000, TAG, `onPageShow: currentUser changed from "${this.currentUser}" to "${latestUser}"`);
      this.currentUser = latestUser;
    }

    this.reloadData();
  }

  //提取书籍封面和作者信息
  private async extractCover(bookParserInfo: BookParserInfo, context: common.UIAbilityContext) {
    try {
      const handler: bookParser.BookParserHandler = await bookParser.getDefaultHandler(bookParserInfo.getFilePath());
      const bookInfo = handler.getBookInfo();

      // 提取作者信息
      if (bookInfo?.bookCreator) {
        bookParserInfo.setBookAuthor(bookInfo.bookCreator);
      }

      if (bookInfo?.bookCoverImage) {
        const coverBuffer = handler.getResourceContent(-1, bookInfo.bookCoverImage);
        if (coverBuffer && coverBuffer.byteLength > 0) {
          //图像源创建
          const imageSource = image.createImageSource(coverBuffer);
          //将图像源解码为可操作的像素图
          const pixelMap = await imageSource.createPixelMap();
          const coverDir = context.filesDir + '/covers/';

          if (!fs.accessSync(coverDir)) {
            //创建目录
            fs.mkdirSync(coverDir);
          }
          const coverPath = await FileUtils.savePixelMapToFile(pixelMap, coverDir, bookParserInfo.getBookId());
          console.log(`书籍:${bookInfo.bookTitle}的封面路径:${coverPath}`);
          bookParserInfo.setCoverPath(coverPath);
          imageSource.release();
        }
      }
    } catch (e) {
      hilog.error(0x0000, TAG, 'extract cover failed: ' + e.message);
    }
  }


  private async loadBook() {
    try {
      let context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      
      // 初始化文件选择器
      let documentSelectOptions = new picker.DocumentSelectOptions();
      // 设置文件类型
      documentSelectOptions.fileSuffixFilters = ['.epub', '.txt', '.mobi', '.azw', '.azw3'];
      documentSelectOptions.maxSelectNumber = 10;// 可选择最大数量
      let documentPicker = new picker.DocumentViewPicker(context);
      // 通过select()方法返回Promise对象，需配合await进行异步处理
      let documentSelectResult = await documentPicker.select(documentSelectOptions);
      if (!documentSelectResult || documentSelectResult.length <= 0) {
        hilog.error(0x0000, TAG, 'loadBook failed');
        return;
      }
      // 导入数量
      let importedCount = 0;
      // 跳过数量（重复）
      let skippedCount = 0;

      for (let i = 0; i < documentSelectResult.length; i++){
        // 获取书籍路径
        let srcFile: string = decodeURI(documentSelectResult[i]);
        hilog.info(0x0000, TAG, `开始导入第 ${i+1} 本书: ${srcFile}`);

        try {
          //创建LocalBookImporter实例，调用 importLocalBookToCache 将文件复制到应用缓存目录并返回一个包含书籍元数据
          // （ID、书名、文件路径等）的 BookParserInfo 对象。
          let importer = new LocalBookImporter();
          let bookParserInfo = await importer.importLocalBookToCache(
            srcFile,
            BookUtils.getBookFileLocalBookPath(context.filesDir),
            this.importedBooks  // 传递已导入书籍列表用于重复检测
          );

          // 提取封面
          await this.extractCover(bookParserInfo, context);
          this.importedBooks = [...this.importedBooks, bookParserInfo];
          importedCount++;
        } catch (err) {
          // 处理重复导入错误
          const errObj = err as BusinessError;
          if (errObj.code === 100) {  // LOCAL_BOOK_IMPORT_DUPLICATE
            hilog.warn(0x0000, TAG, `跳过重复书籍: ${srcFile}`);
            skippedCount++;
          } else {
            // 其他错误继续抛出
            throw new Error(`导入失败: ${(err as Error).message}`);
          }
        }
      }

      // 保存更新后的书籍列表
      if (importedCount > 0) {
        await BookStorage.saveBooks(this.importedBooks, context, this.currentUser);
        // 选中最后一本导入的书籍
        this.selectBook(this.importedBooks[this.importedBooks.length - 1]);
      }

      // 显示导入结果
      let message = '';
      if (importedCount > 0 && skippedCount > 0) {
        message = `成功导入 ${importedCount} 本书，跳过 ${skippedCount} 本重复书籍`;
      } else if (importedCount > 0) {
        message = `成功导入 ${importedCount} 本书`;
      } else if (skippedCount > 0) {
        message = `全部为重复书籍，已跳过 ${skippedCount} 本`;
      } else {
        message = '没有新书被导入';
      }
      this.getUIContext().getPromptAction().showToast({
        message: message,
        duration: 2000
      });

    } catch (error) {
      hilog.error(0x0000, TAG, `loadBook failed , Code: ${error.code}, message: ${error.message}`);

      this.getUIContext().getPromptAction().showToast({
        message: `导入失败：${error.message} || 书籍文件损坏 }`,
        duration: 3000,
      });

    }




  }

  private selectBook(book: BookParserInfo) {
    hilog.info(0x0000, TAG, `selectBook: bookName=${book.getBookName()}, filePath=${book.getFilePath()}`);
    this.selectedBook = book;
    this.filePath = book.getFilePath();
    this.bookName = book.getBookName();
    hilog.info(0x0000, TAG, `selectBook: this.filePath set to ${this.filePath}`);
    // 不再操作 this.currentData
  }

  // 监听当前登录用户
  @StorageLink('currentUser') @Watch('onUserChange') currentUser: string = '';

  async onUserChange() {
    hilog.info(0x0000, TAG, 'User changed to: ' + this.currentUser);
    await this.reloadData();
  }
  
  // 进度更新监听回调
  async onProgressUpdated() {
    hilog.info(0x0000, TAG, `Progress updated detected, reloading data... (timestamp: ${this.progressUpdated})`);
    await this.reloadData();
  }

  async reloadData() {
    try {
      const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      hilog.info(0x0000, TAG, `Index reloadData: currentUser = ${this.currentUser}`);
      // 根据当前用户加载数据（如果 currentUser 为空，则加载空数据，是的没登陆也能用）
      const books = await BookStorage.loadBooks(context, this.currentUser);
      hilog.info(0x0000, TAG, `Index reloadData: loaded ${books.length} books`);
      this.progresses = await ProgressStorage.loadAllProgresses(context, this.currentUser);
      hilog.info(0x0000, TAG, `Index reloadData: loaded ${this.progresses.length} progresses`);

      // 建立 filePath 到 lastReadTime 的映射
      const progressMap = new Map<string, number>();
      this.progresses.forEach(p => {
        progressMap.set(p.filePath, p.lastReadTime);
      });

      // 按最后阅读时间降序排序（最近打开的在最上方）
      this.importedBooks = books.sort((a, b) => {
        const timeA = progressMap.get(a.getFilePath()) || 0;
        const timeB = progressMap.get(b.getFilePath()) || 0;
        return timeB - timeA; // 降序，最新的在前
      });

      // 打印所有进度和书籍的filePath用于调试
      this.progresses.forEach((p, idx) => {
        hilog.info(0x0000, TAG, `Progress[${idx}]: filePath=${p.filePath}, chapter=${p.chapterName}`);
      });
      this.importedBooks.forEach((b, idx) => {
        hilog.info(0x0000, TAG, `Book[${idx}]: filePath=${b.getFilePath()}, name=${b.getBookName()}`);
      });

      if (this.importedBooks.length > 0) {
        this.selectBook(this.importedBooks[0]);
      } else {
        this.selectedBook = null;
        this.filePath = '';
        this.bookName = '';
      }
    } catch (error) {
      hilog.error(0x0000, TAG, 'reloadData error: ' + JSON.stringify(error));
      // 重置为安全状态
      this.importedBooks = [];
      this.progresses = [];
      this.selectedBook = null;
    }
  }


  //加载进度 没用了
  private async loadProgresses() {
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    this.progresses = await ProgressStorage.loadAllProgresses(context);
  }

  //刷新列表信息
  private async handleRefresh() {
    try {
      const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
      // 重新加载书籍列表
      const books = await BookStorage.loadBooks(context,this.currentUser);
      // 重新加载进度
      this.progresses = await ProgressStorage.loadAllProgresses(context,this.currentUser);
      
      // 建立 filePath 到 lastReadTime 的映射
      const progressMap = new Map<string, number>();
      this.progresses.forEach(p => {
        progressMap.set(p.filePath, p.lastReadTime);
      });
      
      // 按最后阅读时间降序排序（最近打开的在最上方）
      this.importedBooks = books.sort((a, b) => {
        const timeA = progressMap.get(a.getFilePath()) || 0;
        const timeB = progressMap.get(b.getFilePath()) || 0;
        return timeB - timeA; // 降序，最新的在前
      });
      
      // 如果有书籍，重新选中第一本
      if (this.importedBooks.length > 0) {
        this.selectBook(this.importedBooks[0]);
      }else {
        this.selectedBook = null;
        this.filePath = '';
        this.bookName = '';
      }
      
      // 显示刷新成功提示
      this.getUIContext().getPromptAction().showToast({
        message: '刷新成功',
        duration: 1000
      });
    } catch (error) {
      hilog.error(0x0000, TAG, `刷新失败: ${error.message}`);
      this.getUIContext().getPromptAction().showToast({
        message: '刷新失败',
        duration: 1000
      });
    } finally {
      // 结束刷新状态
      this.isRefreshing = false;
    }
  }


  build() {
    RelativeContainer() {
      Column() {
        Row(){
          //大标题
          Text($r('app.string.Library'))
            .fontSize(30)
            .fontWeight(FontWeight.Bold)
            .margin({ top: 100 ,left:5})
            .height(56)
            .alignSelf(ItemAlign.Start)
            .fontColor($r('sys.color.black'))

          //导入书籍
          Row(){
            Text('导入书籍')
              .fontColor(Color.Black)
              .margin({right:4})
              .fontWeight(FontWeight.Bold)

            Image($r('app.media.PlusIcon'))
              .width('30')
              .height('30')
              .onClick(async () => {
                this.loadBook();
              })
          }
          .margin({top: 100,right:5})


        }
        .width('100%')
        .justifyContent(FlexAlign.SpaceBetween)


        //显示当前选中书籍的书名
        if (this.selectedBook) {
          Text($r('app.string.book_name'))
            .fontSize(14)
            .fontColor($r('app.color.black_60_opacity'))
            .alignSelf(ItemAlign.Start)
            .margin({ top: 28, left: 16 })
            .fontWeight(FontWeight.Bold)

          //获取书籍名称
          Text(this.selectedBook?.getBookName() ?? '未选择书籍')
            .fontSize(16)
            .fontColor($r('app.color.black_90_opacity'))
            .backgroundColor(Color.White)
            .borderRadius(16)
            .width('100%')
            .height(56)
            .margin({ top: 8 })
            .padding({ left: 16 })
        }

        //书籍列表
        if (this.importedBooks.length > 0) {
          Text($r('app.string.BookList'))
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ top: 20, left: 16 })
            .fontColor($r('sys.color.black'))
            .margin({bottom:7,top:7})

          Refresh({
            refreshing: this.isRefreshing
          }) {
            List({ space: 11 }) {
            ForEach(this.importedBooks, (book: BookParserInfo) => {
              ListItem() {
                Row(){
                  //这里使用绝对路径无法显示图片，改为协议路径就好了->file://,因为获取的路径是从/data开始的
                  Image(book.getCoverPath() ?'file://' + book.getCoverPath() : $r('app.media.default_cover'))
                    .width(60)
                    .height(80)
                    .objectFit(ImageFit.Cover)
                    .borderRadius(8)
                    .margin({ right: 12 })
                    .onError((err)=>{
                      hilog.error(0x0000, TAG, `Image load error for ${book.getCoverPath()}: ${JSON.stringify(err)}`);
                    })

                  Column(){
                    //书名
                    Text(book.getBookName())
                        .fontSize(16)
                        .maxLines(1)
                        .textOverflow({ overflow: TextOverflow.Ellipsis })
                        .layoutWeight(1)
                        .fontColor($r('sys.color.black'))
                    //当前章节
                    Text(this.getChapterDisplay(book))
                      .fontSize(14)
                      .fontColor('#666666')
                      .margin({ top: 4 })
                      .width('100%')
                  }
                  .layoutWeight(1)
                  .alignItems(HorizontalAlign.Start)
                    // 选中指示器
                      if (this.selectedBook?.getBookId() === book.getBookId()) {
                        // Text('✓').fontColor(Color.Green).margin({ right: 8 })
                        Image($r('app.media.Right'))
                          .margin({right:8})
                          .objectFit(ImageFit.Contain)
                          .width('20')
                          .height('20')

                      }
                }
                .width('100%')
                .padding(12)
                .backgroundColor(this.selectedBook?.getBookId() === book.getBookId() ? '#F0F0F0' : Color.White)
                .borderRadius(8)
                .onClick(() => this.selectBook(book))
                .gesture(
                  LongPressGesture({repeat:false,allowableMovement: 200})
                    .onAction((event:GestureEvent)=>{
                      this.showDeleteDialog(book);//触发删除确认对话框
                    })
                )


              }
              .height(100)
            })
          }
          .width('100%')
          .height(390)
          .borderRadius({topLeft:8,topRight:8})
          .edgeEffect(EdgeEffect.None)//去掉滚动到边缘的回弹效果
          }
          .onRefreshing(() => {
            this.isRefreshing = true;
            this.handleRefresh();
          })

        }
      }
      .alignRules({
        top: { anchor: '__container__', align: VerticalAlign.Top },
        start: { anchor: '__container__', align: HorizontalAlign.Start },
        bottom: { anchor: 'bottomColumn', align: VerticalAlign.Top }//底部锚定到按钮列的顶部
      })
      // 底部按钮
      Column() {

        Button(this.getButtonText())
          .width('100%')
          .height(40)
          .margin({ top: 13, bottom: 35 })
          .backgroundColor($r('app.color.blue'))
          .enabled(!!this.selectedBook)//只有在选中书籍时才可点击
          .onClick(async () => {
            if (!this.selectedBook) {
              //如果没有选中书籍，可以提示用户先导入或选择
              return;
            }
            if (!this.filePath) {//实际上 filePath 已在 selectBook 中赋值，这里可省略?
              await this.loadBook();
            }
            this.jumper();
          })
      }.alignRules({
        bottom: { anchor: '__container__', align: VerticalAlign.Bottom },
        start: { anchor: '__container__', align: HorizontalAlign.Start }
      })
      .id('bottomColumn')

    }
    .height('100%')
    .width('100%')
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))
    .padding({ left: 16, right: 16 })
  }
  //控制按钮是否继续阅读
  // 根据书籍信息查找进度（优先使用 bookIdentity，其次使用 filePath）
  private findProgress(book: BookParserInfo | null | undefined): BookProgress | undefined {
    try {
      // 参数校验：防止退出登录时 selectedBook 为 null/undefined 导致崩溃
      if (!book) {
        hilog.warn(0x0000, TAG, 'findProgress: book is null or undefined');
        return undefined;
      }
      // 检查对象方法是否存在
      if (typeof book.getFilePath !== 'function' || typeof book.getBookName !== 'function') {
        hilog.warn(0x0000, TAG, 'findProgress: book object is invalid, missing methods');
        return undefined;
      }
      // 优先使用 filePath 匹配（确保每个文件都有独立的进度记录）
      let progress = this.progresses.find(p => p.filePath === book.getFilePath());
      if (progress) {
        hilog.info(0x0000,TAG,`findProgress: found by filePath for ${book.getBookName()}, filePath=${book.getFilePath()}`);
        return progress;
      }
      // 回退到 bookIdentity 匹配（用于跨设备同步场景）
      const bookIdentity = ProgressStorage.generateBookIdentity(book.getBookName(), book.getBookAuthor());
      progress = this.progresses.find(p => p.bookIdentity && p.bookIdentity === bookIdentity);
      if (progress) {
        hilog.info(0x0000,TAG,`findProgress: found by bookIdentity for ${book.getBookName()}`);
      } else {
        hilog.info(0x0000,TAG,`findProgress: NOT FOUND for ${book.getBookName()}, filePath=${book.getFilePath()}`);
      }
      return progress;
    } catch (error) {
      hilog.error(0x0000, TAG, `findProgress error: ${error}`);
      return undefined;
    }
  }

  private getButtonText(): ResourceStr {
    try {
      if (!this.selectedBook) {
        return $r('app.string.go_to_reader');
      }
      const progress = this.findProgress(this.selectedBook);
      return progress ? $r('app.string.continue_reading') : $r('app.string.go_to_reader');
    } catch (error) {
      hilog.error(0x0000, TAG, `getButtonText error: ${error}`);
      return $r('app.string.go_to_reader');
    }
  }

  //获取章节并展示
  private getChapterDisplay(book: BookParserInfo | null | undefined): string {
    try {
      if (!book) {
        return '暂无进度';
      }
      const progress = this.findProgress(book);
      if (progress?.chapterName) {
        return `当前：${progress.chapterName}`;
      }
      return '暂无进度';
    } catch (error) {
      hilog.error(0x0000, TAG, `getChapterDisplay error: ${error}`);
      return '暂无进度';
    }
  }

  //跳转到阅读器页面
  private jumper() {
    hilog.info(0x0000, TAG, `========== jumper BEGIN ==========`);
    hilog.info(0x0000, TAG, `jumper: this.filePath = ${this.filePath}`);
    hilog.info(0x0000, TAG, `jumper: this.selectedBook = ${this.selectedBook !== null}`);

    if (!this.filePath || !this.selectedBook) {
      hilog.warn(0x0000, TAG, 'jumper: no file path or selected book');
      return;
    }
    const filePath = this.selectedBook.getFilePath();
    hilog.info(0x0000, TAG, `jumper: selectedBook.getFilePath() = ${filePath}`);
    hilog.info(0x0000, TAG, `jumper: selectedBook.getBookName() = ${this.selectedBook.getBookName()}`);
    hilog.info(0x0000, TAG, `jumper: selectedBook.getBookId() = ${this.selectedBook.getBookId()}`);

    // 验证文件是否存在
    try {
      const stat = fs.statSync(filePath);
      hilog.info(0x0000, TAG, `jumper: file exists, size=${stat.size}`);
    } catch (e) {
      hilog.error(0x0000, TAG, `jumper: file not found: ${filePath}`);
      hilog.error(0x0000, TAG, `jumper: stat error: ${JSON.stringify(e)}`);
      // 提示用户文件不存在
      AlertDialog.show({
        message: '书籍文件不存在或已被删除，请重新导入',
        autoCancel: true,
      });
      return;
    }

    const progress = this.findProgress(this.selectedBook);
    const resourceIndex = progress?.resourceIndex ?? 0;
    const domPos = progress?.startDomPos ?? '';
    const bookName = this.selectedBook.getBookName();
    const bookAuthor = this.selectedBook.getBookAuthor();

    hilog.info(0x0000, TAG, `jumper: navigating to Reader with filePath=${filePath}`);
    //将当前文件路径存入应用全局的键值存储中，这样其他组件或页面也能方便地获取该路径
    AppStorage.setOrCreate('filePath', this.filePath);
    this.getUIContext().getRouter().pushUrl({//导航到目标页面
      url: "pages/Reader", params: {
        filePath: filePath,
        resourceIndex: resourceIndex, //当前阅读资源索引
        domPos: domPos,//文件中的具体位置
        bookName: bookName, // 书名
        bookAuthor: bookAuthor // 作者
      }
    }).catch(() => {
      hilog.error(0x0000, TAG, 'pushUrl failed');
    })
  }

  private showDeleteDialog(book: BookParserInfo) {
    AlertDialog.show({
      title: '删除书籍',
      message: `确定要删除《${book.getBookName()}》吗？`,
      autoCancel: true,
      alignment: DialogAlignment.Center,
      maskRect: { x: 0, y: 0, width: '100%', height: '100%' },
      gridCount: 4,
      buttons: [
        {
          value: '取消',
          action: () => {}
        },
        {
          value: '删除',
          action: async () => {
            await this.deleteBook(book);
          }
        }
      ]
    });
  }

  private async deleteBook(book: BookParserInfo) {
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;

    hilog.info(0x0000, TAG, `deleteBook: 开始删除书籍《${book.getBookName()}》, bookId=${book.getBookId()}`);

    //从书籍列表中移除
    this.importedBooks = this.importedBooks.filter(b => b.getBookId() !== book.getBookId());
    //从进度列表中移除
    this.progresses = this.progresses.filter(p => p.filePath !== book.getFilePath());

    //如果当前选中的书籍正好是被删除的，则清空选中状态
    if (this.selectedBook?.getBookId() === book.getBookId()) {
      this.selectedBook = null;
      this.filePath = '';
      this.bookName = '';
    }

    //更新存储
    await BookStorage.saveBooks(this.importedBooks, context, this.currentUser);
    await ProgressStorage.saveAllProgresses(context, this.progresses, this.currentUser);

    // 删除后打印 Preference 中的书籍内容
    const booksAfterDelete = await BookStorage.loadBooks(context, this.currentUser);
    hilog.info(0x0000, TAG, `deleteBook: 删除后 Preference 中剩余书籍数量 = ${booksAfterDelete.length}`);
    booksAfterDelete.forEach((b, index) => {
      hilog.info(0x0000, TAG, `deleteBook: 书籍[${index}] - 书名="${b.getBookName()}", bookId=${b.getBookId()}, filePath=${b.getFilePath()}`);
    });

    //提示删除成功
    try {
      this.getUIContext().getPromptAction().showToast({ message: '删除成功', duration: 1500 });
    } catch (error) {
      // TODO: Implement error handling.
    }
  }

  //删除页面过渡动画以加快阅读器的页面访问速度
  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }
}
