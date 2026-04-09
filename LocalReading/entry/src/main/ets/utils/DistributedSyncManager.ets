import { distributedDataObject } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { BusinessError } from '@ohos.base';
import { StorageUtil } from './StorageUtil';
import { SettingStorage, PersistedReaderSettings } from '../common/SettingStorage';
import { GlobalContext } from '../common/GlobalContext';
import { StoredUserCredential } from './PasswordUtil';
import { ProgressStorage, BookProgress } from '../common/ProgressStorage';
import { ConflictResolver, ResolutionStrategy } from './ConflictResolver';
import { BookStorage } from '../common/BookStorage';
import { BookParserInfo } from '../common/BookParserInfo';

const TAG = 'DistributedSyncManager';
const SESSION_ID = 'local_reading_sync_v2'; // 固定sessionId，同账号设备自动同步

// 书籍同步数据接口
interface SyncBookData {
  bookId: string;
  bookName: string;
  bookAuthor: string;
  filePath: string;
  coverPath: string;
  bookSourceType: number;
  localHash: string;
}

// 同步数据结构
class SyncDataObject {
  version: string = '1.0';
  timestamp: number = 0;
  usersJson: string = '{}';           // Record<string, StoredUserCredential> 的 JSON
  currentUser: string = '';
  settingsJson: string = '';        // PersistedReaderSettings 的 JSON
  progressesJson: string = '[]';    // BookProgress[] 的 JSON（阅读进度）
  booksJson: string = '[]';         // BookParserInfo[] 的 JSON（书籍列表）
}

// 同步状态
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number;
  syncError?: string;
}


export class DistributedSyncManager {
  private static instance: DistributedSyncManager;
  private dataObject: distributedDataObject.DataObject | null = null;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: 0
  };
  private onDataChanged: (() => void) | null = null;

  // 冲突解决策略，默认为 MERGE
  private conflictStrategy: ResolutionStrategy = { strategy: 'MERGE', autoResolve: true };

  public static getInstance(): DistributedSyncManager {
    if (!DistributedSyncManager.instance) {
      DistributedSyncManager.instance = new DistributedSyncManager();
    }
    return DistributedSyncManager.instance;
  }

  /**
   * 初始化分布式数据对象
   */
  async initialize(): Promise<boolean> {
    try {
      // 如果已存在数据对象，先断开之前的连接
      if (this.dataObject) {
        try {
          await this.dataObject.setSessionId('');
          hilog.info(0x0000, TAG, 'Previous session disconnected');
        } catch (e) {
          hilog.warn(0x0000, TAG, 'Failed to disconnect previous session');
        }
        this.dataObject = null;
      }
      
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      
      // 创建初始数据对象
      const sourceData = new SyncDataObject();
      
      // 创建分布式数据对象
      this.dataObject = distributedDataObject.create(context, sourceData);
      
      // 设置sessionId加入分布式组网
      await this.dataObject.setSessionId(SESSION_ID);
      
      // 监听数据变化
      this.setupChangeListener();
      
      hilog.info(0x0000, TAG, 'Distributed sync manager initialized successfully');
      return true;
      
    } catch (error) {
      const err = error as BusinessError;
      hilog.error(0x0000, TAG, `Initialize failed: ${err.message}`);
      return false;
    }
  }

  /**
   * 设置数据变化监听器
   */
  private setupChangeListener(): void {
    if (!this.dataObject) return;
    
    this.dataObject.on('change', (sessionId: string, fields: Array<string>) => {
      hilog.info(0x0000, TAG, `Data changed from session: ${sessionId}, fields: ${fields.join(',')}`);
      
      // 如果是远程设备的数据变化，需要应用到本地
      if (fields.includes('timestamp')) {
        this.applyRemoteData();
      }
    });
  }

  /**
   * 应用远程数据到本地
   */
  private async applyRemoteData(): Promise<void> {
    if (!this.dataObject) return;
    
    try {
      // 使用索引访问分布式数据对象的属性
      const remoteTimestamp = this.dataObject['timestamp'] as number;
      if (!remoteTimestamp || remoteTimestamp <= this.syncStatus.lastSyncTime) {
        return;
      }
      
      hilog.info(0x0000, TAG, 'Applying remote data to local storage');
      
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      
      // 恢复用户数据
      const remoteUsersJson = this.dataObject['usersJson'] as string;
      if (remoteUsersJson) {
        const users: Record<string, StoredUserCredential> = JSON.parse(remoteUsersJson);
        await StorageUtil.saveAllUsers(users);
      }
      
      // 恢复设置（使用 ConflictResolver 处理冲突）
      const remoteSettingsJson = this.dataObject['settingsJson'] as string;
      if (remoteSettingsJson) {
        const remoteSettings: PersistedReaderSettings = JSON.parse(remoteSettingsJson);
        const localSettings = await SettingStorage.loadSettings(context);
        
        // 使用 ConflictResolver 解决设置冲突
        const conflictResult = ConflictResolver.resolveSettingsConflict(
          localSettings,
          remoteSettings,
          this.conflictStrategy
        );
        
        if (conflictResult.resolvedSettings) {
          await SettingStorage.saveSettings(context, conflictResult.resolvedSettings);
          
          if (conflictResult.conflict) {
            hilog.info(0x0000, TAG, `Settings conflict resolved: ${conflictResult.conflictInfo?.conflictType}`);
          } else {
            hilog.info(0x0000, TAG, 'Settings applied without conflict');
          }
        }
      }
      
      // 恢复阅读进度
      const remoteProgressesJson = this.dataObject['progressesJson'] as string;
      if (remoteProgressesJson) {
        const remoteProgresses: BookProgress[] = JSON.parse(remoteProgressesJson);
        await this.mergeReadingProgresses(context, remoteProgresses);
      }

      // 恢复书籍列表
      const remoteBooksJson = this.dataObject['booksJson'] as string;
      if (remoteBooksJson) {
        const remoteBooks: SyncBookData[] = JSON.parse(remoteBooksJson);
        await this.mergeBooks(context, remoteBooks);
      }
      
      // 设置当前用户
      const remoteCurrentUser = this.dataObject['currentUser'] as string;
      if (remoteCurrentUser) {
        await StorageUtil.setLoggedIn(remoteCurrentUser);
        AppStorage.setOrCreate('currentUser', remoteCurrentUser);
      }
      
      this.syncStatus.lastSyncTime = remoteTimestamp;
      
      // 通知UI更新
      if (this.onDataChanged) {
        this.onDataChanged();
      }
      
      hilog.info(0x0000, TAG, 'Remote data applied successfully');
      
    } catch (error) {
      const err = error as BusinessError;
      hilog.error(0x0000, TAG, `Apply remote data failed: ${err.message}`);
    }
  }
  
  /**
   * 合并远程阅读进度到本地
   * 使用 ConflictResolver 处理冲突
   */
  private async mergeReadingProgresses(
    context: common.UIAbilityContext,
    remoteProgresses: BookProgress[]
  ): Promise<void> {
    try {
      const currentUser = await StorageUtil.getCurrentUser();
      const localProgresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      
      hilog.info(0x0000, TAG, `Merging progresses: local=${localProgresses.length}, remote=${remoteProgresses.length}`);
      
      // 使用 ConflictResolver 批量解决冲突
      const mergedProgresses = ConflictResolver.resolveBatchProgressConflicts(
        localProgresses,
        remoteProgresses,
        this.conflictStrategy
      );
      
      // 保存合并后的进度
      await ProgressStorage.saveAllProgresses(context, mergedProgresses, currentUser);
      
      hilog.info(0x0000, TAG, `Progresses merged: ${mergedProgresses.length} records after conflict resolution`);
      
    } catch (error) {
      const err = error as BusinessError;
      hilog.error(0x0000, TAG, `Merge reading progresses failed: ${err.message}`);
    }
  }

  /**
   * 合并远程书籍列表到本地
   */
  private async mergeBooks(
    context: common.UIAbilityContext,
    remoteBooks: SyncBookData[]
  ): Promise<void> {
    try {
      const currentUser = await StorageUtil.getCurrentUser();
      const localBooks = await BookStorage.loadBooks(context, currentUser);
      
      hilog.info(0x0000, TAG, `Merging books: local=${localBooks.length}, remote=${remoteBooks.length}`);
      
      // 将远程书籍数据转换为 BookParserInfo 实例
      const remoteBookInstances: BookParserInfo[] = remoteBooks.map((obj: SyncBookData) => {
        const book = new BookParserInfo();
        book.setBookId(obj.bookId ?? '')
          .setBookName(obj.bookName ?? '')
          .setBookAuthor(obj.bookAuthor ?? '')
          .setFilePath(obj.filePath ?? '')
          .setCoverPath(obj.coverPath ?? '')
          .setBookSourceType(obj.bookSourceType ?? -1)
          .setLocalHash(obj.localHash ?? '');
        return book;
      });
      
      // 合并书籍列表：以 remoteBooks 为主，补充 localBooks 中不存在的书籍
      const remoteBookIds = new Set(remoteBookInstances.map(b => b.getBookId()));
      const mergedBooks = [...remoteBookInstances];
      
      for (const localBook of localBooks) {
        if (!remoteBookIds.has(localBook.getBookId())) {
          mergedBooks.push(localBook);
        }
      }
      
      // 保存合并后的书籍列表
      await BookStorage.saveBooks(mergedBooks, context, currentUser);
      
      hilog.info(0x0000, TAG, `Books merged: ${mergedBooks.length} records after merge`);
      
    } catch (error) {
      const err = error as BusinessError;
      hilog.error(0x0000, TAG, `Merge books failed: ${err.message}`);
    }
  }

  /**
   * 同步本地数据到分布式对象
   */
  async syncData(): Promise<boolean> {
    if (!this.dataObject) {
      hilog.warn(0x0000, TAG, 'Data object not initialized');
      return false;
    }
    
    this.syncStatus.isSyncing = true;
    
    try {
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      
      // 获取本地数据
      const users = await StorageUtil.getAllUsers();
      const currentUser = await StorageUtil.getCurrentUser();
      const settings = await SettingStorage.loadSettings(context);
      const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      const books = await BookStorage.loadBooks(context, currentUser);
      
      // 将 BookParserInfo 对象序列化为可传输的格式
      const booksForSync: SyncBookData[] = books.map((book: BookParserInfo): SyncBookData => {
        return {
          bookId: book.getBookId(),
          bookName: book.getBookName(),
          bookAuthor: book.getBookAuthor(),
          filePath: book.getFilePath(),
          coverPath: book.getCoverPath(),
          bookSourceType: book.getBookSourceType(),
          localHash: book.getLocalHash()
        } as SyncBookData;
      });
      
      const now = Date.now();
      
      // 更新分布式对象属性
      this.dataObject['version'] = '1.0';
      this.dataObject['timestamp'] = now;
      this.dataObject['usersJson'] = JSON.stringify(users);
      this.dataObject['currentUser'] = currentUser;
      this.dataObject['settingsJson'] = settings ? JSON.stringify(settings) : '';
      this.dataObject['progressesJson'] = JSON.stringify(progresses);
      this.dataObject['booksJson'] = JSON.stringify(booksForSync);
      
      // 保存到本地持久化（"local" 表示本地设备）
      await this.dataObject.save('local');
      
      this.syncStatus.lastSyncTime = now;
      this.syncStatus.isSyncing = false;
      this.syncStatus.syncError = undefined;
      
      hilog.info(0x0000, TAG, `Data synced successfully, including ${progresses.length} progresses and ${books.length} books`);
      return true;
      
    } catch (error) {
      const err = error as BusinessError;
      this.syncStatus.isSyncing = false;
      this.syncStatus.syncError = err.message;
      hilog.error(0x0000, TAG, `Sync failed: ${err.message}`);
      return false;
    }
  }
  
  /**
   * 仅同步阅读进度（轻量级同步，用于阅读过程中实时同步）
   */
  async syncProgressOnly(): Promise<boolean> {
    if (!this.dataObject) {
      hilog.warn(0x0000, TAG, 'Data object not initialized');
      return false;
    }
    
    try {
      const context = GlobalContext.getInstance().getContext() as common.UIAbilityContext;
      const currentUser = await StorageUtil.getCurrentUser();
      const progresses = await ProgressStorage.loadAllProgresses(context, currentUser);
      // 标记本次同步时间
      const now = Date.now();
      
      // 仅更新进度相关属性
      this.dataObject['timestamp'] = now;
      this.dataObject['progressesJson'] = JSON.stringify(progresses);
      
      await this.dataObject.save('local');
      
      this.syncStatus.lastSyncTime = now;
      hilog.info(0x0000, TAG, `Progress synced: ${progresses.length} records`);
      return true;
      
    } catch (error) {
      const err = error as BusinessError;
      hilog.error(0x0000, TAG, `Progress sync failed: ${err.message}`);
      return false;
    }
  }

  /**
   * 从分布式对象恢复数据
   */
  async restoreData(): Promise<boolean> {
    if (!this.dataObject) return false;
    
    try {
      // 检查是否有远程数据
      const remoteTimestamp = this.dataObject['timestamp'] as number;
      if (!remoteTimestamp || remoteTimestamp === 0) {
        hilog.info(0x0000, TAG, 'No remote data to restore');
        return false;
      }
      
      await this.applyRemoteData();
      return true;
      
    } catch (error) {
      const err = error as BusinessError;
      hilog.error(0x0000, TAG, `Restore failed: ${err.message}`);
      return false;
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return {
      isSyncing: this.syncStatus.isSyncing,
      lastSyncTime: this.syncStatus.lastSyncTime,
      syncError: this.syncStatus.syncError
    };
  }

  /**
   * 设置数据变化回调
   */
  setDataChangedCallback(callback: () => void): void {
    this.onDataChanged = callback;
  }

  /**
   * 退出分布式组网
   */
  async disconnect(): Promise<void> {
    if (this.dataObject) {
      try {
        await this.dataObject.setSessionId('');
        hilog.info(0x0000, TAG, 'Disconnected from distributed network');
      } catch (error) {
        const err = error as BusinessError;
        hilog.error(0x0000, TAG, `Disconnect failed: ${err.message}`);
      }
    }
  }
}