import { promptAction, router } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { media } from '@kit.MediaKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { resourceManager } from '@kit.LocalizationKit';
import { common } from '@kit.AbilityKit';

const TAG = 'About';


@Entry
@Component
struct About{


  @StorageLink('eyeMode') eyeMode: boolean = false;
  @State  odd : number = 0;
  @State audio : number = 0;
  @State isOddPressed :boolean = false;
  @State isSyncPressed: boolean = false;
  @State isAudioPressed: boolean = false;

  // 音频播放器实例
  private avPlayer: media.AVPlayer | null = null;
  private isPlayerInitialized: boolean = false;
  private shouldAutoPlay: boolean = false;



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

  // 初始化并播放音频
  private async playAudio(): Promise<void> {
    try {
      // 如果播放器未初始化，则创建并设置
      if (!this.avPlayer) {
        this.avPlayer = await media.createAVPlayer();
        this.shouldAutoPlay = true; // 设置自动播放标志
        
        // 监听状态变化
        this.avPlayer.on('stateChange', async (state: media.AVPlayerState, reason: media.StateChangeReason) => {
          hilog.info(0x0000, TAG, `Audio player state changed: ${state}, reason: ${reason}`);
          
          switch (state) {
            case 'initialized':
              // 进入initialized状态后调用prepare
              try {
                await this.avPlayer!.prepare();
                hilog.info(0x0000, TAG, 'Audio player prepared');
              } catch (error) {
                hilog.error(0x0000, TAG, `Failed to prepare audio player: ${error}`);
                this.shouldAutoPlay = false; // 准备失败，清除自动播放标志
              }
              break;
              
            case 'prepared':
              // 进入prepared状态后，如果shouldAutoPlay为true则播放
              if (this.shouldAutoPlay) {
                try {
                  await this.avPlayer!.play();
                  hilog.info(0x0000, TAG, 'Audio started playing');
                  this.shouldAutoPlay = false; // 播放后清除标志
                } catch (error) {
                  hilog.error(0x0000, TAG, `Failed to play audio: ${error}`);
                  this.shouldAutoPlay = false;
                }
              }
              break;
              
            case 'playing':
              hilog.info(0x0000, TAG, 'Audio is now playing');
              break;
              
            case 'completed':
              hilog.info(0x0000, TAG, 'Audio playback completed');
              // 播放完成后自动停止
              try {
                await this.avPlayer!.stop();
                hilog.info(0x0000, TAG, 'Audio stopped after completion');
              } catch (error) {
                hilog.error(0x0000, TAG, `Failed to stop audio after completion: ${error}`);
              }
              break;
              
            case 'stopped':
              hilog.info(0x0000, TAG, 'Audio stopped');
              // 停止后重置到idle状态，以便下次重新准备
              try {
                await this.avPlayer!.reset();
                hilog.info(0x0000, TAG, 'Audio player reset to idle');
              } catch (error) {
                hilog.error(0x0000, TAG, `Failed to reset audio player: ${error}`);
              }
              break;
              
            case 'error':
              hilog.error(0x0000, TAG, 'Audio player entered error state');
              this.shouldAutoPlay = false; // 错误状态清除自动播放标志
              break;
              
            case 'released':
              hilog.info(0x0000, TAG, 'Audio player released');
              this.shouldAutoPlay = false;
              break;
          }
        });
        
        // 监听错误
        this.avPlayer.on('error', (error: BusinessError) => {
          hilog.error(0x0000, TAG, `Audio playback error: ${error.code}, ${error.message}`);
          this.shouldAutoPlay = false;
        });
        
        // 设置音频源（resources/rawfile/hacimi.wav）
        // 使用resourceManager获取rawfile文件描述符，然后设置fdSrc
        try {
          const context = getContext(this) as common.UIAbilityContext;
          const fileDescriptor = await context.resourceManager.getRawFd('hacimi.wav');
          const avFileDescriptor: media.AVFileDescriptor = {
            fd: fileDescriptor.fd,
            offset: fileDescriptor.offset,
            length: fileDescriptor.length
          };
          this.avPlayer.fdSrc = avFileDescriptor;
          hilog.info(0x0000, TAG, 'Audio source set via fdSrc, player should move to initialized state');
        } catch (error) {
          hilog.error(0x0000, TAG, `Failed to get raw file descriptor: ${error}`);
          this.shouldAutoPlay = false;
          return;
        }
      } else {
        // 如果播放器已存在，检查当前状态
        const currentState = this.avPlayer.state;
        hilog.info(0x0000, TAG, `Current player state: ${currentState}`);
        
        // 根据当前状态决定操作
        if (currentState === 'prepared' || currentState === 'paused' || currentState === 'completed') {
          // 在prepared、paused、completed状态下可以播放
          try {
            await this.avPlayer.play();
            hilog.info(0x0000, TAG, 'Audio resumed playing');
          } catch (error) {
            hilog.error(0x0000, TAG, `Failed to resume audio: ${error}`);
          }
        } else if (currentState === 'stopped') {
          // 在stopped状态下需要先reset到idle，然后重新设置url
          try {
            await this.avPlayer.reset();
            hilog.info(0x0000, TAG, 'Audio player reset to idle');
            // 重置后重新设置fdSrc
            const context = getContext(this) as common.UIAbilityContext;
            const fileDescriptor = await context.resourceManager.getRawFd('hacimi.wav');
            const avFileDescriptor: media.AVFileDescriptor = {
              fd: fileDescriptor.fd,
              offset: fileDescriptor.offset,
              length: fileDescriptor.length
            };
            this.avPlayer.fdSrc = avFileDescriptor;
            this.shouldAutoPlay = true; // 设置自动播放标志
            hilog.info(0x0000, TAG, 'Audio source reset via fdSrc, player should move to initialized state');
          } catch (error) {
            hilog.error(0x0000, TAG, `Failed to reset audio player: ${error}`);
          }
        } else if (currentState === 'idle') { // 空闲状态
          // 在idle状态下需要重新设置fdSrc
          try {
            const context = getContext(this) as common.UIAbilityContext;
            // 要用getRawFd获取资源
            const fileDescriptor = await context.resourceManager.getRawFd('hacimi.wav');
            const avFileDescriptor: media.AVFileDescriptor = {
              fd: fileDescriptor.fd,
              offset: fileDescriptor.offset,
              length: fileDescriptor.length
            };
            this.avPlayer.fdSrc = avFileDescriptor;
            this.shouldAutoPlay = true; // 设置自动播放标志
            hilog.info(0x0000, TAG, 'Audio source reset via fdSrc, player should move to initialized state');
          } catch (error) {
            hilog.error(0x0000, TAG, `Failed to get raw file descriptor in idle state: ${error}`);
            this.shouldAutoPlay = false;
          }
        } else if (currentState === 'playing') {
          // 已经在播放中，无需操作
          hilog.info(0x0000, TAG, 'Audio is already playing');
        } else if (currentState === 'initialized') {
          // 在initialized状态下调用prepare
          try {
            await this.avPlayer.prepare();
            hilog.info(0x0000, TAG, 'Audio player prepared from initialized state');
          } catch (error) {
            hilog.error(0x0000, TAG, `Failed to prepare audio from initialized state: ${error}`);
          }
        }
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to play audio: ${error}`);
      this.shouldAutoPlay = false;
    }
  }

  // 停止音频播放器
  private async stopAudio(): Promise<void> {
    try {
      if (this.avPlayer) {
        const currentState = this.avPlayer.state;
        hilog.info(0x0000, TAG, `Current player state before stop: ${currentState}`);
        
        // 只有在prepared、playing、paused、completed状态下才能调用stop
        if (currentState === 'prepared' || currentState === 'playing' || 
            currentState === 'paused' || currentState === 'completed') {
          await this.avPlayer.stop();
          hilog.info(0x0000, TAG, 'Audio stopped successfully');
        } else if (currentState === 'stopped' || currentState === 'idle' || currentState === 'released') {
          // 已经在停止状态或已释放，无需操作
          hilog.info(0x0000, TAG, `Audio already in ${currentState} state`);
        } else {
          hilog.warn(0x0000, TAG, `Cannot stop audio from state: ${currentState}`);
        }
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to stop audio: ${error}`);
    }
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
        .backgroundColor(this.isAudioPressed ? '#E0E0E0' : Color.White)
        .onTouch((event: TouchEvent) => {
          if (event.type === TouchType.Down) {
            // 按下时改变状态
            this.isAudioPressed = true;
          } else if (event.type === TouchType.Up || event.type === TouchType.Cancel) {
            // 松开或取消时恢复状态
            this.isAudioPressed = false;
          }
        })
        .onClick(async ()=>{
          this.audio = (this.audio + 1)%8
          if(this.audio == 7){// 点击7下播放
            promptAction.showToast({
              message: '诗歌剧为您演唱',
              duration: 2000
            });
            await this.playAudio();
          }
          if(this.audio == 0){// 第8下暂停播放
            promptAction.showToast({
              message: '(〒︿〒)',
              duration: 2000
            });
            await this.stopAudio();
          }
        })

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
        //
        // Row(){
        //   Row({space:7}){
        //     Text("数据测试")
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
        //   router.pushUrl({ url: 'pages/SyncTest' }).catch((err:Error) => {
        //     hilog.error(0x0000, TAG, `pushUrl failed: ${err.message}`);
        //   });
        // })

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

  // 释放音频播放器资源
  private async releaseAudio(): Promise<void> {
    try {
      if (this.avPlayer) {
        const currentState = this.avPlayer.state;
        hilog.info(0x0000, TAG, `Current player state before release: ${currentState}`);
        
        // 根据当前状态决定操作
        if (currentState === 'prepared' || currentState === 'playing' || 
            currentState === 'paused' || currentState === 'completed') {
          // 先停止播放
          try {
            await this.avPlayer.stop();
            hilog.info(0x0000, TAG, 'Audio stopped before release');
            // 停止后等待状态变为stopped
            await new Promise<void>(resolve => setTimeout(resolve, 100));
          } catch (error) {
            hilog.error(0x0000, TAG, `Failed to stop audio before release: ${error}`);
          }
        }
        
        // 如果状态不是idle，先reset到idle状态
        if (currentState !== 'idle' && currentState !== 'released') {
          try {
            await this.avPlayer.reset();
            hilog.info(0x0000, TAG, 'Audio player reset to idle');
            await new Promise<void>(resolve => setTimeout(resolve, 100));
          } catch (error) {
            hilog.error(0x0000, TAG, `Failed to reset audio player: ${error}`);
          }
        }
        
        // 释放资源（应该在idle状态调用release）
        await this.avPlayer.release();
        this.avPlayer = null;
        this.isPlayerInitialized = false;
        this.shouldAutoPlay = false;
        hilog.info(0x0000, TAG, 'Audio player released');
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to release audio player: ${error}`);
    }
  }

  // 组件销毁时释放音频资源
  aboutToDisappear(): void {
    // 异步释放资源，但不等待
    this.releaseAudio().then(() => {
      hilog.info(0x0000, TAG, 'Audio player released in aboutToDisappear');
    }).catch((error:Error) => {
      hilog.error(0x0000, TAG, `Failed to release audio player in aboutToDisappear: ${error}`);
    });
  }

}