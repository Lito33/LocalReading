//程序入口类
import { AbilityConstant, Configuration, Permissions, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { WindowAbility } from './WindowAbility';
import { deviceInfo } from '@kit.BasicServicesKit';
import { EyeModeStorage } from '../common/EyeModeStorage';
import { GlobalContext } from '../common/GlobalContext'
import {StorageUtil} from '../utils/StorageUtil'
import { DistributedSyncManager } from '../utils/DistributedSyncManager'
import { common } from '@kit.MDMKit';

const TAG: string = 'EntryAbility';

export default class EntryAbility extends UIAbility {
  private windowStage: window.WindowStage | null = null;

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam) {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onCreate');
    WindowAbility.getInstance().initContext(this.context)
    GlobalContext.getInstance().setContext(this.context);
    //初始化护眼模式
    this.initEyeMode();
    //初始化分布式数据同步
    this.initDistributedSync();

  }

  private async initEyeMode() {
    const eyeMode = await EyeModeStorage.loadEyeMode(this.context);
    AppStorage.setOrCreate('eyeMode', eyeMode);
  }

  private async initDistributedSync() {
    try {
      const syncManager = DistributedSyncManager.getInstance();
      const initialized = await syncManager.initialize();
      AppStorage.setOrCreate('syncServiceAvailable', initialized);
      hilog.info(0x0000, TAG, `Distributed sync service initialized: ${initialized}`);
      
      // 尝试从分布式对象恢复数据（如果有其他设备同步过来的数据）
      if (initialized) {
        const restored = await syncManager.restoreData();
        if (restored) {
          hilog.info(0x0000, TAG, 'Data restored from distributed sync');
        }
      }
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to initialize distributed sync service: ${error.message}`);
      AppStorage.setOrCreate('syncServiceAvailable', false);
    }
  }


  onDestroy() {
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onDestroy');
  }

  //在进入前台之前，系统会创建一个WindowStage,然后进入这个回调，可以进行UI加载、WindowStage的事件订阅。
  async onWindowStageCreate(windowStage: window.WindowStage) {
    //主窗口创建，设置主页面功能
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageCreate');
    WindowAbility.getInstance().setWindowStage(windowStage);
    this.initWindowProcess(windowStage);

    // 在加载页面之前，先恢复用户登录状态
    try {
      const isLoggedIn = await StorageUtil.isLoggedIn();
      if (isLoggedIn) {
        const currentUser = await StorageUtil.getCurrentUser();
        AppStorage.setOrCreate('currentUser', currentUser);
        hilog.info(0x0000, TAG, 'Restored currentUser: ' + currentUser);
      } else {
        AppStorage.setOrCreate('currentUser', '');
      }
    } catch (error) {
      hilog.error(0x0000, TAG, 'Failed to restore login state: ' + JSON.stringify(error));
      AppStorage.setOrCreate('currentUser', '');
    }

    //pages/MainTab，页面加载 SyncTest
    windowStage.loadContent('pages/Welcome', (err, data) => {
      if (err.code !== 0) {
        hilog.error(0x0000, TAG, `Failed to load the content. Code: ${err.code}, message: ${err.message}`);
        return;
      }

      hilog.info(0x0000, TAG, 'Succeeded in loading the content. Data: %{public}s', JSON.stringify(data) ?? '');

      //注册自定义字体
      // 1. 获取 UIContext
      const uiContext = windowStage.getMainWindowSync().getUIContext();
      // 2. 通过 UIContext 获取 Font 对象并注册
      uiContext.getFont().registerFont({
        familyName: 'HuaKangFont',//自定义字体名称，供后续引用
        familySrc: $rawfile('HuaKang.TTC')//字体文件
      });

    });

  }
  //添加“系统配置变更”回调，在回调里通过AppStorage保存当前colorMode值。
  onConfigurationUpdate(newConfig: Configuration): void {
    AppStorage.setOrCreate('colorMode', newConfig.colorMode);
  }

  initWindowProcess(windowStage: window.WindowStage): void {
    windowStage.getMainWindow((err, windowClass: window.Window) => {
      if (err.code) {
        hilog.error(0x0000, TAG, 'getMainWindow failed.');
        return;
      }
      WindowAbility.getInstance().initAvoidArea(windowClass);
      let systemBarProperties: window.SystemBarProperties = {
        statusBarContentColor: this.context.config.colorMode ? '#000000' : '#FFFFFF'
      };
      windowClass.setWindowSystemBarProperties(systemBarProperties).catch(() => {
        hilog.error(0x0000, TAG, 'setWindowSystemBarProperties failed.');
      });
    });
    WindowAbility.getInstance().setWindowLayoutFullScreen(true);
    if (deviceInfo.deviceType === 'tablet') {
      WindowAbility.getInstance().setOrientation(windowStage, window.Orientation.AUTO_ROTATION_RESTRICTED);
    }
    WindowAbility.getInstance().initWindowSize();
  }


  onWindowStageDestroy() {
    // Main window is destroyed, release UI related resources
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground() {
    // Ability has brought to foreground
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onForeground');
    if (this.windowStage) {
      WindowAbility.getInstance().setWindowStage(this.windowStage);
    }
  }

  onBackground() {
    // Ability has back to background
    hilog.info(0x0000, TAG, '%{public}s', 'Ability onBackground');
  }




}
