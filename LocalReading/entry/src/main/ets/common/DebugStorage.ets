// 存储调试页面
import { promptAction, router } from '@kit.ArkUI';
import { StorageUtil } from '../utils/StorageUtil';

@Entry
@Component
struct DebugStorage {
  @State currentAccount: string = '';
  @State currentPassword: string = '';
  @State isRemember: boolean = false;
  @State isLoggedIn: boolean = false;

  async aboutToAppear() {
    await this.loadStorageData();
  }

  async loadStorageData() {
    this.currentAccount = await StorageUtil.getUserAccount();
    this.currentPassword = await StorageUtil.getUserPassword();
    this.isRemember = await StorageUtil.isRememberPassword();
    this.isLoggedIn = await StorageUtil.isLoggedIn();
  }

  async clearStorage() {
    await StorageUtil.clearAll();
    promptAction.showToast({ message: '已清除所有存储', duration: 2000 });
    await this.loadStorageData();
  }

  build() {
    Column() {
      Text('存储调试页面')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin({ bottom: 20 })

      Text('当前存储状态：')
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
        .margin({ bottom: 10 })

      Text(`账号: ${this.currentAccount || '空'}`)
        .fontSize(14)
        .margin({ bottom: 5 })

      Text(`密码: ${this.currentPassword ? '***' : '空'}`)
        .fontSize(14)
        .margin({ bottom: 5 })

      Text(`记住密码: ${this.isRemember ? '是' : '否'}`)
        .fontSize(14)
        .margin({ bottom: 5 })

      Text(`登录状态: ${this.isLoggedIn ? '已登录' : '未登录'}`)
        .fontSize(14)
        .margin({ bottom: 20 })

      Button('刷新数据')
        .width('80%')
        .height(40)
        .margin({ bottom: 10 })
        .onClick(async () => {
          await this.loadStorageData();
          promptAction.showToast({ message: '数据已刷新', duration: 1000 });
        })

      Button('清除存储')
        .width('80%')
        .height(40)
        .margin({ bottom: 10 })
        .onClick(async () => {
          await this.clearStorage();
        })

      Button('前往登录页面测试')
        .width('80%')
        .height(40)
        .margin({ bottom: 10 })
        .onClick(() => {
          router.pushUrl({ url: 'pages/Login' });
        })

      Button('返回')
        .width('80%')
        .height(40)
        .onClick(() => {
          router.back();
        })
    }
    .width('100%')
    .height('100%')
    .padding(20)
    .justifyContent(FlexAlign.Start)
  }
}