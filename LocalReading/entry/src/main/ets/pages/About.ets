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

  // 响应式布局：监听窗口宽度
  @StorageLink('windowWidth') windowWidth: number = 360

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
    return this.isTablet() ? 60 : 50;
  }

  // 计算字体大小
  private getTitleFontSize(): number {
    return this.isTablet() ? 16 : 14;
  }

  // 计算标题字体大小
  private getHeaderFontSize(): number {
    return this.isTablet() ? 22 : 18;
  }

  // 计算图标大小
  private getIconSize(): number {
    return this.isTablet() ? 30 : 25;
  }



  build() {

    Column(){
      Row(){

        Image($r('app.media.arrow_Left'))
          .width(this.getIconSize())
          .height(this.getIconSize())
          .margin({left:20})
          .onClick(() => {
            router.back();
          })


        Blank()
          .layoutWeight(1)

        Text("关于本软件")
          .fontSize(this.getHeaderFontSize())
          .fontWeight(FontWeight.Bold)
          .fontColor(Color.Black)
          .margin({right:25})
          .padding({right:15})

        Blank()
          .layoutWeight(1)
      }
      .width('100%')
      .margin({top:this.isTablet() ? 60 : 50, bottom:this.isTablet() ? 60 : 50})


      Column(){
        Image($r('app.media.appLogo'))
          .width(this.isTablet() ? 90 : 70)
          .height(this.isTablet() ? 90 : 70)
          .margin({bottom:9})
          .borderRadius(10)
        Text($r('app.string.EntryAbility_label'))
          .fontSize(this.isTablet() ? 20 : 16)
          .fontColor(Color.Black)
      }
      .margin({bottom:this.isTablet() ? 45 : 35})

      //文字
      Column(){

        Row(){
          Text("开发人员:")
            .fontColor(Color.Black)
            .fontSize(this.getTitleFontSize())
            .margin({left:5})
          Text("张牧野")
            .fontColor(Color.Black)
            .fontSize(this.getTitleFontSize())
            .margin({right:5})
        }
        .borderRadius({topLeft:8,topRight:8})
        .width('100%')
        .height(this.getRowHeight())
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
            .fontSize(this.getTitleFontSize())
            .margin({left:5})
          Text("3374382907@qq.com")
            .fontColor(Color.Black)
            .fontSize(this.getTitleFontSize())
            .margin({right:5})
        }
        .width('100%')
        .height(this.getRowHeight())
        .padding({left:6,right:6,top:6,bottom:6})
        .justifyContent(FlexAlign.SpaceBetween)


        Divider()
          .color('#E5E5E5')
          .strokeWidth(1)
          .margin({left: 10, right: 10})


        Row(){
          Text("版本号:")
            .fontColor(Color.Black)
            .fontSize(this.getTitleFontSize())
            .margin({left:5})
          Text("1.1.0")
            .fontColor(Color.Black)
            .fontSize(this.getTitleFontSize())
            .margin({right:5})
        }
        .width('100%')
        .height(this.getRowHeight())
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
              .fontSize(this.getTitleFontSize())
              .fontColor(Color.Black)
              .margin({left:5})

            Image($r('app.media.sync_icon'))
              .width(this.isTablet() ? 24 : 20)
              .height(this.isTablet() ? 24 : 20)
          }

          Image($r('app.media.arrow_Right'))
            .margin({right:5})
            .width(this.isTablet() ? 24 : 20)
            .height(this.isTablet() ? 24 : 20)

        }
        .width('100%')
        .height(this.getRowHeight())
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

        Row(){
          Row({space:7}){
            Text("数据测试")
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
          router.pushUrl({ url: 'pages/SyncTest' }).catch((err:Error) => {
            hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
          });
        })

        // Row(){
        //   Row({space:7}){
        //     Text("损坏文件测试")
        //       .fontSize(14)
        //       .fontColor(Color.Black)
        //       .margin({left:5})
        //
        //     Image($r('app.media.sync_icon'))
        //       .width(20)
        //       .height(20)
        //   }
        //
        //   Image($r('app.media.arrow_Right'))
        //     .margin({right:5})
        //     .width(20)
        //     .height(20)
        //
        // }
        // .width('100%')
        // .height(50)
        // .padding({left:6,right:6,top:6,bottom:6})
        // .justifyContent(FlexAlign.SpaceBetween)
        // .backgroundColor(this.isSyncPressed ? '#E0E0E0' : Color.White)
        // .onClick(()=>{
        //   router.pushUrl({ url: 'pages/CorruptFileTest' }).catch((err:Error) => {
        //     hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
        //   });
        // })


      }
      .width(this.getCardWidth())
      .borderRadius(8)
      .backgroundColor(Color.White)



    // 通知栏
    Column() {
      // 标题栏
      Row() {
        Text('📢')
          .fontSize(this.isTablet() ? 22 : 18)
          .margin({ right: 8 })
        
        Text($r('app.string.Notice'))
          .fontSize(this.isTablet() ? 18 : 16)
          .fontWeight(FontWeight.Bold)
          .fontColor(Color.Black)
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 8 })
      .justifyContent(FlexAlign.Start)
      
      Divider()
        .color('#E5E5E5')
        .strokeWidth(1)
        .margin({ left: 16, right: 16 })
      
      // 通知内容
      Column() {
        Row() {
          Text('•')
            .fontSize(this.isTablet() ? 16 : 14)
            .fontColor('#FF6B6B')
            .margin({ right: 6 })
          
          Text('若手动导入数据后请重启一次应用。')
            .fontSize(this.isTablet() ? 15 : 13)
            .fontColor('#333333')
        }
        .width('100%')
        .margin({ bottom: 8 })
        
        Row() {
          Text('•')
            .fontSize(this.isTablet() ? 16 : 14)
            .fontColor('#FF6B6B')
            .margin({ right: 6 })
          
          Text('导入书籍前请先阅读一本书籍在进行导入,若直接开始阅读可以进入更加深色模式哦~')
            .fontSize(this.isTablet() ? 15 : 13)
            .fontColor('#333333')
        }
        .width('100%')
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 10, bottom: 12 })
      .alignItems(HorizontalAlign.Start)
    }
    .margin({ top: 20 })
    .width(this.getCardWidth())
    .backgroundColor(Color.White)
    .borderRadius(12)
    .shadow({
      radius: 8,
      color: 'rgba(0, 0, 0, 0.08)',
      offsetX: 0,
      offsetY: 2
    })



    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))





  }

  pageTransition(){
    PageTransitionEnter({ duration: 200, curve: Curve.Sharp });
    PageTransitionExit({ duration: 200, curve: Curve.Sharp }).slide(SlideEffect.Right);
  }


}