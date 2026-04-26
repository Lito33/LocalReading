import { Index } from './Index';
import { Mine } from './Mine';
import { Notes } from 'note'

@Entry
@Component
struct MainTab {
  @State currentIndex: number = 0; // 当前选择，控制图标和字体颜色
  private tabsController: TabsController = new TabsController(); // tabs的控制器控制页面切换
  @StorageLink('globalBgColor') bgColor: string = '#FFFFFF';

  build() {
    Tabs({ barPosition: BarPosition.End, controller: this.tabsController }) {
      TabContent() {
        Index() // "书库"页面
      }
      .tabBar(this.tabBarBuilder("书库", 0, $r("app.media.book_on"), $r("app.media.book_off")))

      TabContent() {
        Notes() // "笔记"页面
      }
      .tabBar(this.tabBarBuilder("笔记", 1, $r("app.media.notes_icon_on"), $r("app.media.notes_icon_off")))

      TabContent() {
        Mine() // "我的"页面
      }
      .tabBar(this.tabBarBuilder("我的", 2, $r("app.media.My_on"), $r("app.media.My_off")))
    }
    .vertical(false)
    .scrollable(false)
    .backgroundColor(this.bgColor == "#333333" ? this.bgColor : Color.White)
  }

  // 自定义tabbar样式结构
  @Builder
tabBarBuilder(title: string, targetIndex: number, selectedIcon: Resource, unselectedIcon: Resource) {
    Column() {
      Image(this.currentIndex == targetIndex ? selectedIcon : unselectedIcon)
        .height(24)
        .width(24)
      Text(title)
        .fontSize(10)
        .fontColor(this.currentIndex == targetIndex ? Color.Blue : (this.bgColor == "#333333" ? Color.White : Color.Gray))
        .fontWeight(500)
    }
    .width("100%")
    .height(40)
    .backgroundColor(this.bgColor == "#333333" ? "#ff777777" : Color.White)
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .margin({ bottom: 10 })
    .onClick(() => { // 这里不使用onChange，节省内存
      this.currentIndex = targetIndex;
      this.tabsController.changeIndex(targetIndex);
    })
  }

  // 禁用动画
  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }
}