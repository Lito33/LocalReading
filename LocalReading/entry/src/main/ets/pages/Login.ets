import { promptAction, router } from '@kit.ArkUI';
import { StorageUtil } from '../utils/StorageUtil';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { DistributedSyncManager } from '../utils/DistributedSyncManager';


const TAG: string = "Login"

// 登录结果接口
interface LoginResult {
  success: boolean;
  isRegister: boolean;
}

@Entry
@Component
struct Login{

  @StorageLink('eyeMode') eyeMode: boolean = false;

  build() {
    Column() {
      Row(){
        Image($r('app.media.arrow_Left'))
          .width(25)
          .height(25)
          .margin({left: 15})
          .onClick(()=>{
            router.back();
          })
      }
      .margin({top: 25})
      .width('100%')
      .justifyContent(FlexAlign.Start)
      // Title component
      LoginTitle()
      // Bottom component
      LoginBottom()
    }
    .backgroundColor(this.eyeMode ? '#FAF9DE' : $r('app.color.page_background1'))
  }
}


@Preview
@Component
struct LoginTitle{
  build() {
    Column(){
      Image($r('app.media.appLogo'))
        .width(100)
        .height(100)
        .margin({bottom:7})
        .borderRadius(10)

      Text("登录界面")
        .fontSize(24)
        .fontWeight(FontWeight.Medium)
        .fontColor("#ff000000")
    }
    .width('100%')
    .height("40%")
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Center)
    //.backgroundColor(Color.Blue)

  }
}

@Preview
@Component
struct LoginBottom{
  @State account: string = '';
  @State password: string = '';
  @State isRememberPassword: boolean = false; // 是否记住密码

  @State isPasswordVisible: boolean = false;//控制密码是否可见
  @State passwordIconRes: Resource = $r('app.media.eye_off');//密码图标资源
  passwordController: TextInputController = new TextInputController();//密码输入框控制器

  // 组件初始化时加载已保存的用户信息
  aboutToAppear(): void {
    this.loadSavedUserInfo();
  }

  // 页面显示时重新加载用户信息（处理退出登录后重新进入的情况）
  onPageShow(): void {
    console.info('Login: onPageShow - 重新加载用户信息');
    this.loadSavedUserInfo();
  }

  // 加载已保存的用户信息
  private async loadSavedUserInfo(): Promise<void> {
    try {
      console.info('Login: 开始加载保存的用户信息');
      
      // 获取记住密码状态
      this.isRememberPassword = await StorageUtil.isRememberPassword();
      const savedAccount = await StorageUtil.getUserAccount();
      const savedPassword = await StorageUtil.getUserPassword();
      
      console.info('Login: loadSavedUserInfo - isRemember:', this.isRememberPassword);
      console.info('Login: loadSavedUserInfo - account:', savedAccount || '空');
      console.info('Login: loadSavedUserInfo - password:', savedPassword ? '***' : '空');
      
      // 加载账号（总是加载，如果有的话）
      this.account = savedAccount || '';
      
      // 加载密码（只有当记住密码且密码不为空时）
      if (this.isRememberPassword && savedPassword) {
        this.password = savedPassword;
        console.info('Login: 自动填充账号和密码');
      } else {
        this.password = '';
        console.info('Login: 只填充账号，不填充密码');
      }
      
      console.info('Login: 加载完成 - 当前账号:', this.account, '密码长度:', this.password.length);
    } catch (error) {
      console.error('Login: loadSavedUserInfo failed:', error);
    }
  }

  //登录结果
  private loginResult: LoginResult = { success: false, isRegister: false };

  //登录逻辑
  private async simulateLogin(): Promise<void> {
    const account = this.account.trim();
    const password = this.password.trim();

    
    if (!account || !password) {
      promptAction.showToast({ message: '账号和密码不能为空', duration: 2000 });
      this.loginResult = { success: false, isRegister: false };
      return;
    }

    // 检查账号是否存在
    const isUserExists = await StorageUtil.userExists(account);
    
    if (isUserExists) {
      // 账号存在，使用哈希验证密码
      const isPasswordValid = await StorageUtil.verifyPassword(account, password);
      if (isPasswordValid) {
        this.loginResult = { success: true, isRegister: false }; // 登录成功
      } else {
        promptAction.showToast({ message: '密码错误', duration: 2000 });
        this.loginResult = { success: false, isRegister: false };
      }
    } else {
      // 账号不存在，视为注册：保存新用户（自动使用哈希存储）
      await StorageUtil.saveUser(account, password);
      this.loginResult = { success: true, isRegister: true }; // 注册成功
    }
  }

  //切换密码可见性
  private togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
    this.passwordIconRes = this.isPasswordVisible ? $r('app.media.eye_on') : $r('app.media.eye_off');
  }


  build() {
    Column(){
      Column() {
        TextInput({ placeholder: $r('app.string.account'), text: this.account })
          .maxLength(11)
          .type(InputType.USER_NAME)
          .placeholderColor("#99182431")
          .height(48)
          .fontSize(16)
          .fontColor(Color.Black)
          .backgroundColor(Color.White)
          .margin({top:4})
          .padding({left:12})

          .onChange((value: string) => {
            this.account = value;
            console.info('Login: 账号输入变化:', value);
          })

        Divider()
          .color('#E5E5E5')
          .strokeWidth(1)
          .margin({left: 10, right: 10})

        //密码输入框
        Stack({ alignContent: Alignment.End }) {
          TextInput({ placeholder: $r('app.string.password'), controller: this.passwordController, text: this.password })
            .maxLength(11)
            .type(InputType.Password)
            .showPasswordIcon(false)//禁用默认图标，使用自定义图标
            .showPassword(this.isPasswordVisible)//控制密码显示状态
            .placeholderColor("#99182431")
            .height(48)
            .fontSize(16)
            .fontColor(Color.Black)
            .backgroundColor(Color.White)
            .margin({top:4})
            .padding({left:12, right: 40})
            .onChange((value: string) => {
              this.password = value;
              console.info('Login: 密码输入变化，长度:', value.length);
            })
            .width('100%')


          Image(this.passwordIconRes)
            .width(24)
            .height(24)
            .margin({right: 12})
            .align(Alignment.End)
            .onClick(() => {
              this.togglePasswordVisibility();
            })
        }
        .width('100%')
        .height(48)
      }
      .backgroundColor(Color.White)
      .borderRadius(24)

      //记住密码
      Row() {
        Checkbox({ name: 'remember', group: 'login' })
          .select(this.isRememberPassword)
          .selectedColor("#007DFF")
          .onChange((value: boolean) => {
            this.isRememberPassword = value;
            console.info('Login: 记住密码状态变化:', value);
          })

        Text("记住密码")
          .fontSize(14)
          .fontColor("#666666")
          .onClick(() => {
            this.isRememberPassword = !this.isRememberPassword;
          })
      }
      .width('80%')
      .justifyContent(FlexAlign.Start)
      .margin({ top: 20 })

      Button("登录")
        .width("80%")
        .height(40)
        .fontSize(16)
        .fontWeight(FontWeight.Medium)
        .backgroundColor("#007DFF")
        .margin({
          top: 20,
          bottom: 12
        })
        .onClick(async () => {
          console.info('Login: 点击登录按钮 - 账号:', this.account, '密码长度:', this.password.length, '记住密码:', this.isRememberPassword);

          await this.simulateLogin();
          if (this.loginResult.success) {
            // 登录/注册成功：保存记住密码相关信息
            console.info('Login: 登录成功，保存用户信息 - 账号:', this.account, '记住密码:', this.isRememberPassword);
            
            // 根据记住密码状态保存信息
            if (this.isRememberPassword) {
              // 记住密码：保存账号和密码
              await StorageUtil.saveUserInfo(this.account, this.password, true);
              console.info('Login: 已保存账号和密码');
            } else {
              // 不记住密码：只保存账号，清除密码
              await StorageUtil.saveUserInfo(this.account, '', false);
              console.info('Login: 只保存账号，清除密码');
            }
            
            // 设置登录状态
            await StorageUtil.setLoggedIn(this.account);
            hilog.info(0x0000, TAG, 'Login successful, setting login status for account: ' + this.account);
            AppStorage.setOrCreate('currentUser', this.account);
            
            // 触发数据同步到其他设备
            DistributedSyncManager.getInstance().syncData().then((success) => {
              hilog.info(0x0000, TAG, `Data sync after login: ${success ? 'success' : 'failed'}`);
            });
            
            // 根据是否为注册显示不同提示
            const message = this.loginResult.isRegister ? '注册成功' : '登录成功';
            promptAction.showToast({ message: message, duration: 1500 });
            
            // 登录成功后返回到Tab页面
            setTimeout(() => {
              router.back();
            }, 500);
          } else {
            promptAction.showToast({
              message: '用户名或密码错误！',
              duration: 3000
            });
          }
        })
        .width('80%')
        .height(40)

    }
    .padding({left:12,right:12,top:12})
    .height('60%')




  }
  pageTransition() {
    PageTransitionEnter({ duration: 0, curve: Curve.Sharp });
    PageTransitionExit({ duration: 0, curve: Curve.Sharp });
  }
}