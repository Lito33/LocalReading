if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface LoginBottom_Params {
    account?: string;
    password?: string;
    isRememberPassword?: boolean;
    isPasswordVisible?: boolean;
    passwordIconRes?: Resource;
    passwordController?: TextInputController;
    loginResult?: LoginResult;
}
interface LoginTitle_Params {
}
interface Login_Params {
    eyeMode?: boolean;
}
import promptAction from "@ohos:promptAction";
import router from "@ohos:router";
import { StorageUtil } from "@bundle:com.example.readerkitdemo/entry/ets/utils/StorageUtil";
import hilog from "@ohos:hilog";
import { DistributedSyncManager } from "@bundle:com.example.readerkitdemo/entry/ets/utils/DistributedSyncManager";
const TAG: string = "Login";
// 登录结果接口
interface LoginResult {
    success: boolean;
    isRegister: boolean;
}
class Login extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Login_Params) {
    }
    updateStateVars(params: Login_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__eyeMode.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __eyeMode: ObservedPropertyAbstractPU<boolean>;
    get eyeMode() {
        return this.__eyeMode.get();
    }
    set eyeMode(newValue: boolean) {
        this.__eyeMode.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Login.ets(22:5)", "entry");
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : { "id": 16777304, "type": 10001, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Login.ets(23:7)", "entry");
            Row.margin({ top: 25 });
            Row.width('100%');
            Row.justifyContent(FlexAlign.Start);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777318, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/Login.ets(24:9)", "entry");
            Image.width(25);
            Image.height(25);
            Image.margin({ left: 15 });
            Image.onClick(() => {
                router.back();
            });
        }, Image);
        Row.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // Title component
                    LoginTitle(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Login.ets", line: 36, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "LoginTitle" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // Bottom component
                    LoginBottom(this, {}, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Login.ets", line: 38, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "LoginBottom" });
        }
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Login";
    }
}
class LoginTitle extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LoginTitle_Params) {
    }
    updateStateVars(params: LoginTitle_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Login.ets(49:5)", "entry");
            Column.width('100%');
            Column.height("40%");
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777216, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/Login.ets(50:7)", "entry");
            Image.width(100);
            Image.height(100);
            Image.margin({ bottom: 7 });
            Image.borderRadius(10);
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("登录界面");
            Text.debugLine("entry/src/main/ets/pages/Login.ets(56:7)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor("#ff000000");
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class LoginBottom extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__account = new ObservedPropertySimplePU('', this, "account");
        this.__password = new ObservedPropertySimplePU('', this, "password");
        this.__isRememberPassword = new ObservedPropertySimplePU(false, this, "isRememberPassword");
        this.__isPasswordVisible = new ObservedPropertySimplePU(false, this, "isPasswordVisible");
        this.__passwordIconRes = new ObservedPropertyObjectPU({ "id": 16777309, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }, this, "passwordIconRes");
        this.passwordController = new TextInputController();
        this.loginResult = { success: false, isRegister: false };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LoginBottom_Params) {
        if (params.account !== undefined) {
            this.account = params.account;
        }
        if (params.password !== undefined) {
            this.password = params.password;
        }
        if (params.isRememberPassword !== undefined) {
            this.isRememberPassword = params.isRememberPassword;
        }
        if (params.isPasswordVisible !== undefined) {
            this.isPasswordVisible = params.isPasswordVisible;
        }
        if (params.passwordIconRes !== undefined) {
            this.passwordIconRes = params.passwordIconRes;
        }
        if (params.passwordController !== undefined) {
            this.passwordController = params.passwordController;
        }
        if (params.loginResult !== undefined) {
            this.loginResult = params.loginResult;
        }
    }
    updateStateVars(params: LoginBottom_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__account.purgeDependencyOnElmtId(rmElmtId);
        this.__password.purgeDependencyOnElmtId(rmElmtId);
        this.__isRememberPassword.purgeDependencyOnElmtId(rmElmtId);
        this.__isPasswordVisible.purgeDependencyOnElmtId(rmElmtId);
        this.__passwordIconRes.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__account.aboutToBeDeleted();
        this.__password.aboutToBeDeleted();
        this.__isRememberPassword.aboutToBeDeleted();
        this.__isPasswordVisible.aboutToBeDeleted();
        this.__passwordIconRes.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __account: ObservedPropertySimplePU<string>;
    get account() {
        return this.__account.get();
    }
    set account(newValue: string) {
        this.__account.set(newValue);
    }
    private __password: ObservedPropertySimplePU<string>;
    get password() {
        return this.__password.get();
    }
    set password(newValue: string) {
        this.__password.set(newValue);
    }
    private __isRememberPassword: ObservedPropertySimplePU<boolean>; // 是否记住密码
    get isRememberPassword() {
        return this.__isRememberPassword.get();
    }
    set isRememberPassword(newValue: boolean) {
        this.__isRememberPassword.set(newValue);
    }
    private __isPasswordVisible: ObservedPropertySimplePU<boolean>; //控制密码是否可见
    get isPasswordVisible() {
        return this.__isPasswordVisible.get();
    }
    set isPasswordVisible(newValue: boolean) {
        this.__isPasswordVisible.set(newValue);
    }
    private __passwordIconRes: ObservedPropertyObjectPU<Resource>; //密码图标资源
    get passwordIconRes() {
        return this.__passwordIconRes.get();
    }
    set passwordIconRes(newValue: Resource) {
        this.__passwordIconRes.set(newValue);
    }
    private passwordController: TextInputController; //密码输入框控制器
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
            }
            else {
                this.password = '';
                console.info('Login: 只填充账号，不填充密码');
            }
            console.info('Login: 加载完成 - 当前账号:', this.account, '密码长度:', this.password.length);
        }
        catch (error) {
            console.error('Login: loadSavedUserInfo failed:', error);
        }
    }
    //登录结果
    private loginResult: LoginResult;
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
            }
            else {
                promptAction.showToast({ message: '密码错误', duration: 2000 });
                this.loginResult = { success: false, isRegister: false };
            }
        }
        else {
            // 账号不存在，视为注册：保存新用户（自动使用哈希存储）
            await StorageUtil.saveUser(account, password);
            this.loginResult = { success: true, isRegister: true }; // 注册成功
        }
    }
    //切换密码可见性
    private togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
        this.passwordIconRes = this.isPasswordVisible ? { "id": 16777314, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777309, "type": 20000, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" };
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Login.ets(166:5)", "entry");
            Column.padding({ left: 12, right: 12, top: 12 });
            Column.height('60%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Login.ets(167:7)", "entry");
            Column.backgroundColor(Color.White);
            Column.borderRadius(24);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: { "id": 16777248, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }, text: this.account });
            TextInput.debugLine("entry/src/main/ets/pages/Login.ets(168:9)", "entry");
            TextInput.maxLength(11);
            TextInput.type(InputType.USER_NAME);
            TextInput.placeholderColor("#99182431");
            TextInput.height(48);
            TextInput.fontSize(16);
            TextInput.fontColor(Color.Black);
            TextInput.backgroundColor(Color.White);
            TextInput.margin({ top: 4 });
            TextInput.padding({ left: 12 });
            TextInput.onChange((value: string) => {
                this.account = value;
                console.info('Login: 账号输入变化:', value);
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/Login.ets(184:9)", "entry");
            Divider.color('#E5E5E5');
            Divider.strokeWidth(1);
            Divider.margin({ left: 10, right: 10 });
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //密码输入框
            Stack.create({ alignContent: Alignment.End });
            Stack.debugLine("entry/src/main/ets/pages/Login.ets(190:9)", "entry");
            //密码输入框
            Stack.width('100%');
            //密码输入框
            Stack.height(48);
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: { "id": 16777261, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }, controller: this.passwordController, text: this.password });
            TextInput.debugLine("entry/src/main/ets/pages/Login.ets(191:11)", "entry");
            TextInput.maxLength(11);
            TextInput.type(InputType.Password);
            TextInput.showPasswordIcon(false);
            TextInput.showPassword(this.isPasswordVisible);
            TextInput.placeholderColor("#99182431");
            TextInput.height(48);
            TextInput.fontSize(16);
            TextInput.fontColor(Color.Black);
            TextInput.backgroundColor(Color.White);
            TextInput.margin({ top: 4 });
            TextInput.padding({ left: 12, right: 40 });
            TextInput.onChange((value: string) => {
                this.password = value;
                console.info('Login: 密码输入变化，长度:', value.length);
            });
            TextInput.width('100%');
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create(this.passwordIconRes);
            Image.debugLine("entry/src/main/ets/pages/Login.ets(210:11)", "entry");
            Image.width(24);
            Image.height(24);
            Image.margin({ right: 12 });
            Image.align(Alignment.End);
            Image.onClick(() => {
                this.togglePasswordVisibility();
            });
        }, Image);
        //密码输入框
        Stack.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //记住密码
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Login.ets(226:7)", "entry");
            //记住密码
            Row.width('80%');
            //记住密码
            Row.justifyContent(FlexAlign.Start);
            //记住密码
            Row.margin({ top: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Checkbox.create({ name: 'remember', group: 'login' });
            Checkbox.debugLine("entry/src/main/ets/pages/Login.ets(227:9)", "entry");
            Checkbox.select(this.isRememberPassword);
            Checkbox.selectedColor("#007DFF");
            Checkbox.onChange((value: boolean) => {
                this.isRememberPassword = value;
                console.info('Login: 记住密码状态变化:', value);
            });
        }, Checkbox);
        Checkbox.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("记住密码");
            Text.debugLine("entry/src/main/ets/pages/Login.ets(235:9)", "entry");
            Text.fontSize(14);
            Text.fontColor("#666666");
            Text.onClick(() => {
                this.isRememberPassword = !this.isRememberPassword;
            });
        }, Text);
        Text.pop();
        //记住密码
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("登录");
            Button.debugLine("entry/src/main/ets/pages/Login.ets(246:7)", "entry");
            Button.width("80%");
            Button.height(40);
            Button.fontSize(16);
            Button.fontWeight(FontWeight.Medium);
            Button.backgroundColor("#007DFF");
            Button.margin({
                top: 20,
                bottom: 12
            });
            Button.onClick(async () => {
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
                    }
                    else {
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
                }
                else {
                    promptAction.showToast({
                        message: '用户名或密码错误！',
                        duration: 3000
                    });
                }
            });
            Button.width('80%');
            Button.height(40);
        }, Button);
        Button.pop();
        Column.pop();
    }
    pageTransition() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransition.create();
        }, null);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransitionEnter.create({ duration: 0, curve: Curve.Sharp });
        }, null);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransitionExit.create({ duration: 0, curve: Curve.Sharp });
        }, null);
        PageTransition.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
if (getPreviewComponentFlag()) {
    storePreviewComponents(2, "LoginTitle", new LoginTitle(undefined, {}), "LoginBottom", new LoginBottom(undefined, {}));
    previewComponent();
}
else {
    registerNamedRoute(() => new Login(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/Login", pageFullPath: "entry/src/main/ets/pages/Login", integratedHsp: "false", moduleType: "followWithHap" });
}
