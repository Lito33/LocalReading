//闪屏页
import { router } from '@kit.ArkUI';
import { WindowAbility } from '../entryability/WindowAbility';

@Entry
@Component
struct Welcome{
  //用于存储定时器ID
  private timeId: number = -1;
  @State CoverText: string = `\u9605\u8bfb\u8d8a\u806a\u660e`;

  aboutToAppear() {
    //隐藏状态栏和导航栏，实现沉浸式闪屏
    WindowAbility.getInstance().toggleWindowSystemBar([], this.getUIContext().getHostContext());
    //设置3秒后自动跳转
    this.timeId = setTimeout(() => {
      this.gotoMain();
    }, 3000);
  }

  //跳转到首页（使用replaceUrl避免返回闪屏页，可恶）
  gotoMain() {
    router.replaceUrl({ url: 'pages/MainTab' });
  }


  build() {
    Column({space:5}){
        Image($r('app.media.KTN1'))
          .width("70%")
          .height("70%")
          .objectFit(ImageFit.Contain)

        Text(this.CoverText)
          .fontWeight(FontWeight.Bold)
          .fontSize(30)
          .height(56)
          .fontColor(Color.Black)
    }
    .width("100%")
    .height("100%")
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    .backgroundColor(Color.White)
    .onClick(() => {
      //点击立即跳转，并清除定时器
      if (this.timeId !== -1) {
        clearTimeout(this.timeId);
        this.timeId = -1;
      }
      this.gotoMain();
    })

  }

  aboutToDisappear() {
    // 组件销毁时清除定时器，防止内存泄漏
    if (this.timeId !== -1) {
      clearTimeout(this.timeId);
      this.timeId = -1;
    }
  }

}