import { router } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { ProgressStorage, BookProgress } from '../common/ProgressStorage';
import { BookStorage } from '../common/BookStorage';
import { BookParserInfo } from '../common/BookParserInfo';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { WindowAbility } from '../entryability/WindowAbility';

const TAG = 'ReadingRecord';

@Entry
@Component
struct ReadingRecord {
  @StorageLink('eyeMode') eyeMode: boolean = false;
  //最近7天的书籍
  @State recentBooks: BookParserInfo[] = [];
  //之前的书籍
  @State olderBooks: BookParserInfo[] = [];

  @StorageLink('currentUser')@Watch('onUserChange') currentUser: string = '';
  
  // 监听窗口高度，用于自适应布局
  @StorageLink('windowHeight') windowHeight: number = 0;

  // 使用@State装饰，确保进度更新时UI能够响应式刷新
  @State progressMap: Map<string, BookProgress> = new Map(); // filePath -> progress
  
  // ListItem的高度（包含间距）
  private readonly ITEM_HEIGHT: number = 88; // 80(内容高度) + 8(space间距)
  // 默认最大显示项数（严格限制为4个）
  private readonly DEFAULT_MAX_ITEMS: number = 4;
  
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
    
    hilog.info(0x0000, TAG, 
      `calculateMaxListHeight: itemCount=${itemCount}, actualItemCount=${actualItemCount}, ` +
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
      } else {
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

  build() {
    Column() {
      // 标题栏
      Row() {
        Image($r('app.media.arrow_Left'))
          .width(25)
          .height(25)
          .margin({ left: 20 })
          .onClick(() => router.back())
        Blank().layoutWeight(1)
        Text('阅读记录')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor(Color.Black)
          .margin({right:15})
        Blank().layoutWeight(1)
      }
      .width('100%')
      .margin({ top: 50, bottom: 8 })

      Scroll() {
        Column() {
          //最近7天
          Column() {
            Text('最近7天')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(Color.Black)
              .width('100%')
              .padding({ left: 16, bottom: 8 })
              .margin({ top: 8 })

            if (this.recentBooks.length > 0) {
              List({ space: 8 }) {
                ForEach(this.recentBooks, (book: BookParserInfo) => {
                  ListItem() {
                    this.RecordItem(book)
                  }
                })
              }
              .scrollBar(BarState.Off)
              .borderRadius(8)
              .width('100%')
              .height(this.calculateMaxListHeight(this.recentBooks.length))
              .backgroundColor(Color.Transparent)
              .margin({right:10})
            } else {
              Text('暂无最近7天的阅读记录')
                .fontSize(14)
                .fontColor(Color.Gray)
                .width('100%')
                .textAlign(TextAlign.Center)
                .height(60)
                .backgroundColor(Color.White)
                .borderRadius(8)
                .margin({ left: 16, right: 16 })
            }
          }
          .margin({right:10,left:10})

          // 固定下半部分：之前
          Column() {
            Text('之前')
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor(Color.Black)
              .width('100%')
              .padding({ left: 16, bottom: 8 })
              .margin({ top: 16 })

            if (this.olderBooks.length > 0) {
              List({ space: 8 }) {
                ForEach(this.olderBooks, (book: BookParserInfo) => {
                  ListItem() {
                    this.RecordItem(book)
                  }
                })
              }
              .scrollBar(BarState.Off)
              .margin({right:8})
              .width('100%')
              .height(this.calculateMaxListHeight(this.olderBooks.length))
              .backgroundColor(Color.Transparent)
            } else {
              Text('暂无更早的阅读记录')
                .fontSize(14)
                .fontColor(Color.Gray)
                .width('100%')
                .textAlign(TextAlign.Center)
                .height(60)
                .backgroundColor(Color.White)
                .borderRadius(8)
                .margin({ left: 16, right: 16 })
            }
          }
          .margin({right:10,left:10})

          // 当两个列表都为空时的提示
          if (this.recentBooks.length === 0 && this.olderBooks.length === 0) {
            Text('暂无阅读记录')
              .fontSize(16)
              .fontColor(Color.Gray)
              .margin({ top: 50 })
          }
        }
        .width('100%')
        .height('100%')
      }
      .layoutWeight(1)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))
  }

  @Builder
  RecordItem(book: BookParserInfo) {
    Row() {
      //封面
      Image(book.getCoverPath() ? 'file://' + book.getCoverPath() : $r('app.media.default_cover'))
        .width(60)
        .height(75)
        .objectFit(ImageFit.Cover)
        .borderRadius(8)
        .margin({ right: 12 })

      //书名和章节
      Column() {
        Text(book.getBookName())
          .fontSize(16)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .fontColor(Color.Black)
          .width('100%')
        Text(this.getChapterDisplay(book))
          .fontSize(14)
          .fontColor('#666666')
          .margin({ top: 4 })
          .width('100%')
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)

      // 箭头
      Image($r('app.media.arrow_Right'))
        .width(20)
        .height(20)
        .margin({ right: 8 })
    }
    .width('100%')
    .height(80)
    .padding(12)
    .backgroundColor(Color.White)
    .borderRadius(8)
    .margin({ left: 16, right: 13 })
    .onClick(() => {
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
      } else {//万一没有进度？
        router.pushUrl({
          url: 'pages/Reader',
          params: {
            filePath: book.getFilePath(),
            resourceIndex: 0,
            domPos: ''
          }
        });
      }
    })
  }

  private getChapterDisplay(book: BookParserInfo): string {
    const progress = this.progressMap.get(book.getFilePath());
    if (progress?.chapterName) {
      return `阅读至：${progress.chapterName}`;
    }
    return '暂无进度';
  }

  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }
}