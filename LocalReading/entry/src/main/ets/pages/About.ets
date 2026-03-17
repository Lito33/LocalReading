import { promptAction, router } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';

const TAG = 'About';

@Entry
@Component
struct About{


  @StorageLink('eyeMode') eyeMode: boolean = false;
  @State  odd : number = 0;
  @State isOddPressed :boolean = false;
  @State isSyncPressed: boolean = false;



  build() {

    Column(){
      Row(){

        Image($r('app.media.arrow_Left'))
          .width(25)
          .height(25)
          .margin({left:20})
          .onClick(() => {
            router.back();
          })


        Blank()
          .layoutWeight(1)

        Text("关于本软件")
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor(Color.Black)
          .margin({right:25})
          .padding({right:15})

        Blank()
          .layoutWeight(1)
      }
      .width('100%')
      .margin({top:50,bottom:50})


      Column(){
        Image($r('app.media.appLogo'))
          .width(70)
          .height(70)
          .margin({bottom:9})
          .borderRadius(10)
        Text($r('app.string.EntryAbility_label'))
          .fontSize(16)
          .fontColor(Color.Black)
      }
      .margin({bottom:35})

      //文字
      Column(){

        Row(){
          Text("开发人员:")
            .fontColor(Color.Black)
            .fontSize(14)
            .margin({left:5})
          Text("张牧野")
            .fontColor(Color.Black)
            .fontSize(14)
            .margin({right:5})
        }
        .borderRadius({topLeft:8,topRight:8})
        .width('100%')
        .height(50)
        .padding({left:6,right:6,top:6,bottom:6})
        .justifyContent(FlexAlign.SpaceBetween)
        .backgroundColor(this.isOddPressed ? '#E0E0E0' : Color.White)
        .onClick(()=>{
          this.odd = (this.odd + 1)%8
          if(this.odd == 7){
            promptAction.showToast({
              message: '欢迎来到初星学院！',
              duration: 2000
            });
          }
        })
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            // 按下时改变状态
            this.isOddPressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            // 松开或取消时恢复状态
            this.isOddPressed = false;
          }
        })


        Divider()
          .color('#E5E5E5')
          .strokeWidth(1)
          .margin({left: 10, right: 10})


        Row(){
          Text("联系邮箱:")
            .fontColor(Color.Black)
            .fontSize(14)
            .margin({left:5})
          Text("3374382907@qq.com")
            .fontColor(Color.Black)
            .fontSize(14)
            .margin({right:5})
        }
        .width('100%')
        .height(50)
        .padding({left:6,right:6,top:6,bottom:6})
        .justifyContent(FlexAlign.SpaceBetween)


        Divider()
          .color('#E5E5E5')
          .strokeWidth(1)
          .margin({left: 10, right: 10})


        Row(){
          Text("版本号:")
            .fontColor(Color.Black)
            .fontSize(14)
            .margin({left:5})
          Text("1.0.0")
            .fontColor(Color.Black)
            .fontSize(14)
            .margin({right:5})
        }
        .width('100%')
        .height(50)
        .padding({left:6,right:6,top:6,bottom:6})
        .justifyContent(FlexAlign.SpaceBetween)

        Divider()
          .color('#E5E5E5')
          .strokeWidth(1)
          .margin({left: 10, right: 10})

        // 数据同步
        Row(){
          Row({space:7}){
            Text("数据同步")
              .fontSize(14)
              .fontColor(Color.Black)
              .margin({left:5})

            Image($r('app.media.sync_icon'))
              .width(20)
              .height(20)
          }

          Image($r('app.media.arrow_Right'))
            .margin({right:5})
            .width(20)
            .height(20)

        }
        .width('100%')
        .height(50)
        .padding({left:6,right:6,top:6,bottom:6})
        .justifyContent(FlexAlign.SpaceBetween)
        .backgroundColor(this.isSyncPressed ? '#E0E0E0' : Color.White)
        .onClick(()=>{
          router.pushUrl({ url: 'pages/SyncSettings' }).catch((err:Error) => {
            hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
          });
        })
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            this.isSyncPressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            this.isSyncPressed = false;
          }
        })

      }
      .width('80%')
      .borderRadius(8)
      .backgroundColor(Color.White)





    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))


  }

  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }

}