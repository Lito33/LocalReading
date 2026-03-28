import preferences from '@ohos.data.preferences';
import { GlobalContext } from '../common/GlobalContext'
import { PasswordUtil, StoredUserCredential } from './PasswordUtil';

export class StorageUtil {
  // 存储键名常量
  private static readonly USER_DATA_KEY: string = 'user_data';           // 存储所有用户凭证 {账号: {hash, salt}}
  private static readonly IS_LOGGED_IN_KEY: string = 'is_logged_in';     // 登录状态
  private static readonly CURRENT_USER_KEY: string = 'current_user';     // 当前登录用户名

  // 以下为记住密码相关
  private static readonly USER_ACCOUNT_KEY: string = 'user_account';
  private static readonly USER_PASSWORD_KEY: string = 'user_password';   // 记住的密码（明文，仅本地）
  private static readonly IS_REMEMBER_KEY: string = 'is_remember';

  private static prefs: preferences.Preferences | null = null;


  private static async initPreferences(): Promise<void> {
    if (!StorageUtil.prefs) {
      try {
        const context = GlobalContext.getInstance().getContext();
        StorageUtil.prefs = await preferences.getPreferences(context, 'login_preferences');
        console.info('StorageUtil: Preferences initialized successfully');
      } catch (error) {
        console.error('StorageUtil: initPreferences failed', JSON.stringify(error));
      }
    }
  }

  // ---------- 多用户数据管理（安全存储） ----------
  /**
   * 获取所有用户凭证数据
   * 返回对象 {账号: {hash: "xxx", salt: "xxx"}}
   */
  static async getAllUsers(): Promise<Record<string, StoredUserCredential>> {
    await StorageUtil.initPreferences();
    try {
      const json = await StorageUtil.prefs?.get(StorageUtil.USER_DATA_KEY, '{}');
      const users = JSON.parse(json as string) as Record<string, StoredUserCredential>;
      return users || {};
    } catch {
      return {};
    }
  }

  /**
   * 保存所有用户凭证数据
   */
  static async saveAllUsers(users: Record<string, StoredUserCredential>): Promise<void> {
    await StorageUtil.initPreferences();
    try {
      await StorageUtil.prefs?.put(StorageUtil.USER_DATA_KEY, JSON.stringify(users));
      await StorageUtil.prefs?.flush();
    } catch (error) {
      console.error('保存用户数据失败:', error);
    }
  }

  /**
   * 添加或更新用户（注册/修改密码）
   * 使用 SHA-256 + Salt 哈希存储
   */
  static async saveUser(account: string, password: string): Promise<void> {
    //生成随机 Salt
    const salt = PasswordUtil.generateSalt();
    
    //哈希密码（同步方法修改异步）
    const hash = PasswordUtil.hashPassword(password, salt);
    
    //存储凭证
    const users = await StorageUtil.getAllUsers();
    users[account] = { hash, salt };
    await StorageUtil.saveAllUsers(users);
    
    console.info('StorageUtil: 用户密码已安全存储（SHA-256哈希）');
  }

  /**
   * 检查账号是否存在
   */
  static async userExists(account: string): Promise<boolean> {
    const users = await StorageUtil.getAllUsers();
    return users[account] !== undefined;
  }

  /**
   * 验证密码是否正确（使用了哈希比较）
   */
  static async verifyPassword(account: string, password: string): Promise<boolean> {
    const users = await StorageUtil.getAllUsers();
    const credential = users[account];
    
    if (!credential) {
      return false; // 账号不存在
    }
    
    // 使用哈希验证（同步方法）
    return PasswordUtil.verifyPassword(password, credential.hash, credential.salt);
  }

  // ---------- 登录状态管理 ----------
  /**
   * 设置登录状态（登录成功时调用）
   */
  static async setLoggedIn(account: string): Promise<void> {
    await StorageUtil.initPreferences();
    try {
      await StorageUtil.prefs?.put(StorageUtil.IS_LOGGED_IN_KEY, true);
      await StorageUtil.prefs?.put(StorageUtil.CURRENT_USER_KEY, account);
      await StorageUtil.prefs?.flush();
    } catch (error) {
      console.error('设置登录状态失败:', error);
    }
  }

  /**
   * 退出登录
   */
  static async setLoggedOut(): Promise<void> {
    await StorageUtil.initPreferences();
    try {
      // 先获取当前的记住密码状态
      const isRemember = await StorageUtil.isRememberPassword();
      const savedAccount = await StorageUtil.getUserAccount();
      
      // 清除登录状态
      await StorageUtil.prefs?.put(StorageUtil.IS_LOGGED_IN_KEY, false);
      await StorageUtil.prefs?.delete(StorageUtil.CURRENT_USER_KEY);
      
      // 如果之前没有记住密码，或者账号为空，则清除密码
      if (!isRemember || !savedAccount) {
        await StorageUtil.prefs?.delete(StorageUtil.USER_PASSWORD_KEY);
        console.info('StorageUtil: 退出登录，清除密码（未记住密码或账号为空）');
      } else {
        console.info('StorageUtil: 退出登录，保留密码（已记住密码）');
      }
      
      await StorageUtil.prefs?.flush();
      console.info('StorageUtil: 退出登录成功');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  }

  /**
   * 获取登录状态
   */
  static async isLoggedIn(): Promise<boolean> {
    await StorageUtil.initPreferences();
    try {
      const val = await StorageUtil.prefs?.get(StorageUtil.IS_LOGGED_IN_KEY, false);
      return Boolean(val);
    } catch {
      return false;
    }
  }

  /**
   * 获取当前登录用户名
   */
  static async getCurrentUser(): Promise<string> {
    await StorageUtil.initPreferences();
    try {
      const val = await StorageUtil.prefs?.get(StorageUtil.CURRENT_USER_KEY, '');
      return val as string;
    } catch {
      return '';
    }
  }

  // ---------- 记住密码相关 ----------
  /**
   * 保存用户信息（用于记住密码功能）
   * 注意：记住的密码仍为明文存储，仅用于本地便捷登录
   */
  static async saveUserInfo(account: string, password: string, isRemember: boolean): Promise<void> {
    await StorageUtil.initPreferences();
    try {
      await StorageUtil.prefs?.put(StorageUtil.USER_ACCOUNT_KEY, account);
      if (isRemember) {
        // 记住密码：本地存储明文密码（仅用于自动填充）
        await StorageUtil.prefs?.put(StorageUtil.USER_PASSWORD_KEY, password);
      } else {
        await StorageUtil.prefs?.delete(StorageUtil.USER_PASSWORD_KEY);
      }
      await StorageUtil.prefs?.put(StorageUtil.IS_REMEMBER_KEY, isRemember);
      await StorageUtil.prefs?.flush();
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }

  static async getUserAccount(): Promise<string> {
    await StorageUtil.initPreferences();
    try {
      const val = await StorageUtil.prefs?.get(StorageUtil.USER_ACCOUNT_KEY, '');
      return val as string;
    } catch {
      return '';
    }
  }

  static async getUserPassword(): Promise<string> {
    await StorageUtil.initPreferences();
    try {
      const val = await StorageUtil.prefs?.get(StorageUtil.USER_PASSWORD_KEY, '');
      return val as string;
    } catch {
      return '';
    }
  }

  static async isRememberPassword(): Promise<boolean> {
    await StorageUtil.initPreferences();
    try {
      const val = await StorageUtil.prefs?.get(StorageUtil.IS_REMEMBER_KEY, false);
      return Boolean(val);
    } catch {
      return false;
    }
  }

  /**
   * 清除所有用户信息（包含登录状态和记住密码数据）
   */
  static async clearAll(): Promise<void> {
    await StorageUtil.initPreferences();
    try {
      await StorageUtil.prefs?.clear();
      await StorageUtil.prefs?.flush();
    } catch (error) {
      console.error('清除所有数据失败:', error);
    }
  }
}