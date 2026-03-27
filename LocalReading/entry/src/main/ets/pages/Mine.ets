// pages/Mine.ets
import { WindowAbility } from '../entryability/WindowAbility'
import { hilog } from '@kit.PerformanceAnalysisKit';
import router from '@ohos.router'
import { url } from '@kit.ArkTS';
import { common } from '@kit.AbilityKit';
import { EyeModeStorage } from '../common/EyeModeStorage';
import { http } from '@kit.NetworkKit';
import { StorageUtil } from '../utils/StorageUtil';
import { promptAction } from '@kit.ArkUI';

const TAG = 'MinePage';

interface DataReception {
  hitokoto: string;
  type: string;
  source: string;
  author: string;
  length: number;
}

interface ApiResponse{
  code: number;
  msg: string;
  data: DataReception;
}


@Entry
@Component
export struct Mine {

  //为每个Row创建独立的状态变量来控制点击背景颜色
  @State isReadingRecordPressed: boolean = false;
  @State isReadingSettingsPressed: boolean = false;
  @State isEyesModePressed: boolean = false;
  @State isClosePressed: boolean = false;

  //全局护眼模式状态,顺便监听
  @StorageLink('eyeMode') @Watch('onEyeModeChange') eyeMode: boolean = false;
  
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
    return this.isTablet() ? 80 : 70;
  }

  // 计算字体大小
  private getTitleFontSize(): number {
    return this.isTablet() ? 22 : 18;
  }

  async onEyeModeChange() {
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    await EyeModeStorage.saveEyeMode(context, this.eyeMode);
  }

  @State hitokoto: string = '';
  @State source: string = '';
  @State author: string = '';

  //获取名言
  async fetchQuote() {
    //创建实例
    const httpRequest = http.createHttp();
    try {
      const response = await httpRequest.request('https://api.52vmy.cn/api/wl/yan/yiyan', {
        method: http.RequestMethod.GET,
        connectTimeout: 60000,
        readTimeout: 60000,
        header: { 'Content-Type': 'application/json' }
      });
      if (response.responseCode === 200) {
        const result = JSON.parse(response.result as string) as ApiResponse;
        if (result.code === 200) {
          this.hitokoto = result.data.hitokoto;
          this.source = result.data.source;
          this.author = result.data.author;
          hilog.info(0x0000,TAG,"source info ",this.author)
        } else {
          console.error('API error:', result.msg);
        }
      } else {
        console.error('HTTP error:', response.responseCode);
      }
    } catch (error) {
      console.error('Request failed:', JSON.stringify(error));
    } finally {
      httpRequest.destroy();
    }
  }

  @State isLoggedIn: boolean = false;
  @State currentUser: string = '';
  @State isRefreshing: boolean = false; //刷新状态
  @State pullOffset: number = 0; //下拉偏移量
  @State refreshOpacity: number = 0; //图片透明度
  @State refreshScale: number = 0.5; //图片缩放

  async aboutToAppear() {
    WindowAbility.getInstance().toggleWindowSystemBar(['status', 'navigation'], this.getUIContext().getHostContext());
    this.fetchQuote();
    await this.loadLoginStatus();
  }

  // 监听页面显示事件
  onPageShow() {
    hilog.info(0x0000, TAG, 'Mine page shown, loading login status');
    this.loadLoginStatus(); // 重新获取登录状态
  }

  // 下拉刷新处理
  async onRefresh() {
    if (this.isRefreshing) {
      return;
    }
    
    this.isRefreshing = true;
    // 开始刷新动画
    this.startRefreshAnimation();
    hilog.info(0x0000, TAG, '下拉刷新开始');
    
    try {
      // 重新加载登录状态
      await this.loadLoginStatus();
      // 重新获取名言
      this.fetchQuote();
      
      promptAction.showToast({ message: '刷新成功', duration: 1000 });
    } catch (error) {
      hilog.error(0x0000, TAG, '下拉刷新失败: ' + JSON.stringify(error));
      promptAction.showToast({ message: '刷新失败', duration: 1500 });
    } finally {
      // 模拟刷新延迟，让用户看到刷新效果
      setTimeout(() => {
        this.isRefreshing = false;
        // 结束刷新动画
        this.stopRefreshAnimation();
        
        hilog.info(0x0000, TAG, '下拉刷新结束');
      }, 1500);
    }
  }

  // 开始刷新动画
  startRefreshAnimation() {
    // 刷新时保持图片显示状态
    this.refreshOpacity = 1;
    this.refreshScale = 1;
    
    // 旋转动画
    const rotateAnimation = () => {
      if (this.isRefreshing) {
        // 刷新过程中可以添加微妙的缩放动画
        this.refreshScale = 1 + Math.sin(Date.now() / 300) * 0.05;
        setTimeout(rotateAnimation, 50);
      }
    };
    
    rotateAnimation();
  }

  // 停止刷新动画
  stopRefreshAnimation() {
    // 平滑淡出动画
    const fadeOutAnimation = () => {
      this.refreshOpacity -= 0.1;
      this.refreshScale -= 0.05;
      
      if (this.refreshOpacity > 0) {
        setTimeout(fadeOutAnimation, 30);
      } else {
        this.refreshOpacity = 0;
        this.refreshScale = 0.5;
        this.pullOffset = 0;
      }
    };
    
    fadeOutAnimation();
  }

  // 自定义下拉刷新指示器
  @Builder
  customRefreshIndicator() {
    Column() {
      Image($r('app.media.shaonvgeju'))
        .width('90%')
        .height(this.pullOffset)
        .objectFit(ImageFit.Cover)
        .clip(true)
        .opacity(this.refreshOpacity)
        .scale({ x: this.refreshScale, y: this.refreshScale })
        .animation({
          duration: 200,
          curve: Curve.EaseOut
        })
    }
    .width('95%')
  }

  async loadLoginStatus() {
    const loggedIn = await StorageUtil.isLoggedIn();
    hilog.info(0x0000, TAG, 'loadLoginStatus: isLoggedIn = ' + loggedIn);
    
    this.isLoggedIn = loggedIn;
    if (this.isLoggedIn) {
      this.currentUser = await StorageUtil.getCurrentUser();
      hilog.info(0x0000, TAG, 'loadLoginStatus: currentUser = ' + this.currentUser);
    } else {
      this.currentUser = '';
    }
  }

  build() {
    // 使用Refresh组件包裹整个内容，并添加自定义下拉效果
    Refresh({
      refreshing: this.isRefreshing
    }) {
      Scroll() {
        Column() {
          // 自定义下拉刷新指示器 - 只有图片，没有文字
          this.customRefreshIndicator()
          
          Row({space:10}){//登录卡片
            Image($r('app.media.userIcon'))//默认头像
              .width(this.isTablet() ? 60 : 50)
              .height(this.isTablet() ? 60 : 50)
              .margin({left:25})

            Column({space:5}){
              Text(this.isLoggedIn ? this.currentUser : "未登录")//显示用户名
                .fontColor(Color.Black)
                .fontSize(this.getTitleFontSize())
              //如果未登录则显示"登录"，如果已经登录则显示"退出登录"
              //点击后如果未登录，则跳转到登录界面
              if (this.isLoggedIn) {
                Button("退出登录")
                  .width(this.isTablet() ? 120 : 100)
                  .borderRadius(8)
                  .backgroundColor(Color.Red)
                  .onClick(async () => {
                    // 退出登录
                    await StorageUtil.setLoggedOut();
                    AppStorage.setOrCreate('currentUser', '');//清除
                    this.isLoggedIn = false;
                    this.currentUser = '';
                    promptAction.showToast({ message: '已退出登录', duration: 1500 });
                  })
              } else {
                Button("登录/注册")
                  .width(this.isTablet() ? 120 : 100)
                  .borderRadius(8)
                  .backgroundColor("#007DFF")
                  .onClick(() => {
                    router.pushUrl({ url: 'pages/Login' }).catch(() => {
                      hilog.error(0x0000, TAG, "登录路由跳转失败");
                    });
                  })
              }
            }
            .margin({right:25})
            .justifyContent(FlexAlign.Start)
            //.alignItems(HorizontalAlign.Start)
          }
          .margin({top:50,bottom:20})
          .width('80%')
          .height(this.isTablet() ? 120 : 100)
          .backgroundColor(Color.White)
          .border({width:2})
          .borderRadius(10)
          .justifyContent(FlexAlign.SpaceBetween)

        //阅读记录
        Row(){
          Row({space:7}){
            Text("阅读记录")
              .fontSize(this.getTitleFontSize())
              .fontColor(Color.Black)
              .fontWeight(FontWeight.Bold)
              .margin({left:10})

            Image($r('app.media.readingRecord'))
              .width(23)
              .height(23)
          }

          Image($r('app.media.arrow_Right'))
            .margin({right:10})
            .width(25)
            .height(25)

        }
        .height(this.getRowHeight())
        .width(this.getCardWidth())
        .borderRadius(10)
        .justifyContent(FlexAlign.SpaceBetween)
        .backgroundColor(this.isReadingRecordPressed ? '#E0E0E0' : Color.White)
        .margin({top:40})
        .onClick(()=>{
          router.pushUrl({ url: 'pages/ReadingRecord' }).catch((err:Error) => {
            hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
          });
        })
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            // 按下时改变状态
            this.isReadingRecordPressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            // 松开或取消时恢复状态
            this.isReadingRecordPressed = false;
          }
        })
        .border({width:2})



        //关于
        Row(){
          Row(){
            Text("关于")
              .fontSize(18)
              .fontColor(Color.Black)
              .fontWeight(FontWeight.Bold)
              .margin({left:10})

            Image($r('app.media.aboutIcon'))
              .width(23)
              .height(23)
              .margin({left:5})
          }


          Image($r('app.media.arrow_Right'))
            .margin({right:10})
            .width(25)
            .height(25)

        }
        .height(this.getRowHeight())
        .width(this.getCardWidth())
        .borderRadius(10)
        .justifyContent(FlexAlign.SpaceBetween)
        .backgroundColor(this.isReadingSettingsPressed ? '#E0E0E0' : Color.White)
        .margin({top:15})
        .onClick(()=>{
          //跳转到关于界面
          router.pushUrl({ url: 'pages/About' }).catch((err:Error) => {
            hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
          });
        })
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            // 按下时改变状态
            this.isReadingSettingsPressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            // 松开或取消时恢复状态
            this.isReadingSettingsPressed = false;
          }
        })
        .border({width:2})


        //护眼模式
        Row(){

          Text("护眼模式")
            .fontSize(18)
            .fontColor(Color.Black)
            .fontWeight(FontWeight.Bold)
            .margin({left:10})

          Image(this.eyeMode == false ? $r('app.media.eye_off') : $r('app.media.eye_on'))
            .margin({right:10})
            .width(25)
            .height(25)

        }
        .height(this.getRowHeight())
        .width(this.getCardWidth())
        .borderRadius(10)
        .justifyContent(FlexAlign.SpaceBetween)
        .backgroundColor(this.isEyesModePressed ? '#E0E0E0' : Color.White)
        .margin({top:15})
        .onClick(()=>{
          //改变图标样式
          this.eyeMode = !this.eyeMode
          //改变全局背景

        })
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            // 按下时改变状态
            this.isEyesModePressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            // 松开或取消时恢复状态
            this.isEyesModePressed = false;
          }
        })
        .border({width:2})

        //退出按钮
        Row(){
          Text("退出应用")
            .fontSize(18)
            .fontColor(Color.Black)
            .fontWeight(FontWeight.Bold)
            .margin({left:10})

          Image($r('app.media.arrow_Right'))
            .margin({right:10})
            .width(25)
            .height(25)

        }
        .height(this.getRowHeight())
        .width(this.getCardWidth())
        .borderRadius(10)
        .justifyContent(FlexAlign.SpaceBetween)
        .backgroundColor(this.isClosePressed ? '#E0E0E0' : Color.White)
        .margin({top:15})
        .onClick(()=>{
          //退出应用
          const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
          context.terminateSelf();
        })
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            // 按下时改变状态
            this.isClosePressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            // 松开或取消时恢复状态
            this.isClosePressed = false;
          }
        })
        .border({width:2})


        //调用接口，显示数
        Column(){

          Text('"' + this.hitokoto + '"')
            .fontFamily('HuaKangFont')
            .fontSize(16)
            .fontColor(Color.Black)
            .maxLines(4)
            .textAlign(TextAlign.Start)
            .padding(10)
            .margin({left:4})


          Text('——'+this.source)
            .fontWeight(FontWeight.Bold)
            .fontSize(14)
            .fontColor(Color.Gray)
            .textAlign(TextAlign.End)
            .margin({right:10})
            .width('100%')


        }
        .margin({top:30})
        .width('80%')
        .height(120)
        .backgroundColor(Color.White)
        .borderRadius(8)

      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .scrollBar(BarState.Off)
    .edgeEffect(EdgeEffect.Spring)
    }
    .onRefreshing(() => {
      this.onRefresh();
    })
    .onStateChange((refreshStatus: RefreshStatus) => {
      // 监听刷新状态变化
      // status = 0 ： 默认未下拉
      // status = 1、2：下拉中
      // status = 3：下拉完成，回弹中
      // status = 4：刷新结束，返回初始状态
      
      if (refreshStatus >= 1 && refreshStatus < 4) {
        // 下拉过程中，平滑显示图片
        if (this.refreshOpacity < 1) {
          this.refreshOpacity = Math.min(this.refreshOpacity + 0.2, 1);
        }
        if (this.refreshScale < 1) {
          this.refreshScale = Math.min(this.refreshScale + 0.1, 1);
        }
        this.pullOffset = 120; // 固定下拉距离显示图片
      } else if (refreshStatus === 0) {
        // 恢复初始状态，但保持平滑过渡
        if (this.refreshOpacity > 0) {
          this.refreshOpacity = Math.max(this.refreshOpacity - 0.1, 0);
        }
        if (this.refreshScale > 0.5) {
          this.refreshScale = Math.max(this.refreshScale - 0.05, 0.5);
        }
        if (this.refreshOpacity <= 0) {
          this.pullOffset = 0;
        }
      }
    })
    .width('100%')
    .height('100%')
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))
  }


  //删除页面过渡动画以加快阅读器的页面访问速度
  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }

}