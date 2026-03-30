import { hilog } from '@kit.PerformanceAnalysisKit';
import { BookProgress } from '../common/ProgressStorage';
import { PersistedReaderSettings } from '../common/SettingStorage';

const TAG = 'ConflictResolver';

export interface ConflictInfo {
  dataType: string;
  localVersion: number;
  remoteVersion: number;
  localTimestamp: number;
  remoteTimestamp: number;
  conflictType: 'UPDATE_UPDATE' | 'DELETE_UPDATE';
}

export interface ResolutionStrategy {
  strategy: 'LAST_WRITE_WINS' | 'MANUAL_RESOLUTION' | 'MERGE' | 'LOCAL_WINS' | 'REMOTE_WINS';
  autoResolve?: boolean;
}

interface SyncData {
  version?: number;
  updatedAt?: number;
  username?: string;
  bookId?: string;
  fontSize?: number;
  progress?: number;
  currentPage?: number;
  id?: string;
  // 阅读设置相关字段
  fontPath?: string;
  lineHeight?: number;
  nightMode?: boolean;
  themeColor?: string;
  themeBgImg?: string;
  flipMode?: string;
  themeSelectIndex?: number;
  fontColor?: string;
  ttsVolume?: number;
  ttsPitch?: number;
  ttsSpeed?: number;
  singleHandMode?: boolean;
}

interface ConflictResolutionResult {
  conflict: boolean;
  conflictInfo: ConflictInfo;
  localData: SyncData | null;
  remoteData: SyncData | null;
}

// 阅读进度冲突结果
export interface ProgressConflictResult {
  conflict: boolean;
  conflictInfo: ConflictInfo | null;
  resolvedProgress: BookProgress | null;
  localProgress: BookProgress | null;
  remoteProgress: BookProgress | null;
}

// 阅读设置冲突结果
export interface SettingsConflictResult {
  conflict: boolean;
  conflictInfo: ConflictInfo | null;
  resolvedSettings: PersistedReaderSettings | null;
  localSettings: PersistedReaderSettings | null;
  remoteSettings: PersistedReaderSettings | null;
}


export class ConflictResolver {
  
  /**
   * 检测数据冲突
   */
  static detectConflict(localData: SyncData | null, remoteData: SyncData | null): ConflictInfo | null {
    if (!localData && remoteData) {
      // 本地删除，远程更新
      return {
        dataType: ConflictResolver.getDataType(remoteData),
        localVersion: 0,
        remoteVersion: remoteData.version || 1,
        localTimestamp: 0,
        remoteTimestamp: remoteData.updatedAt || Date.now(),
        conflictType: 'DELETE_UPDATE'
      };
    }
    
    if (localData && !remoteData) {
      // 本地更新，远程删除
      return {
        dataType: ConflictResolver.getDataType(localData),
        localVersion: localData.version || 1,
        remoteVersion: 0,
        localTimestamp: localData.updatedAt || Date.now(),
        remoteTimestamp: 0,
        conflictType: 'DELETE_UPDATE'
      };
    }
    
    if (localData && remoteData) {
      const localVersion = localData.version || 1;
      const remoteVersion = remoteData.version || 1;
      const localTimestamp = localData.updatedAt || Date.now();
      const remoteTimestamp = remoteData.updatedAt || Date.now();


      // 版本不同，两端都更新了，万一呢我是说万一呢
      if (localVersion !== remoteVersion) {
        return {
          dataType: ConflictResolver.getDataType(localData),
          localVersion,
          remoteVersion,
          localTimestamp,
          remoteTimestamp,
          conflictType: 'UPDATE_UPDATE'
        };
      }

    }
    
    return null;
  }
  
  /**
   * 解决冲突
   */
  static resolveConflict(
    localData: SyncData | null, 
    remoteData: SyncData | null, 
    strategy: ResolutionStrategy
  ): SyncData | ConflictResolutionResult {
    const conflict = ConflictResolver.detectConflict(localData, remoteData);
    
    if (!conflict) {
      // 没有冲突，返回较新的数据
      const localTimestamp = localData?.updatedAt || 0;
      const remoteTimestamp = remoteData?.updatedAt || 0;
      return remoteTimestamp > localTimestamp ? remoteData! : localData!;
    }
    
    hilog.info(0x0000, TAG, `Resolving conflict: ${conflict.conflictType}`);
    
    switch (strategy.strategy) {
      case 'LAST_WRITE_WINS':
        return ConflictResolver.lastWriteWins(localData, remoteData, conflict);
        
      case 'LOCAL_WINS':
        return localData || remoteData!;
        
      case 'REMOTE_WINS':
        return remoteData || localData!;
        
      case 'MERGE':
        return ConflictResolver.mergeData(localData, remoteData, conflict);
        
      case 'MANUAL_RESOLUTION':
        // 需要用户手动解决，返回冲突信息
        const result: ConflictResolutionResult = {
          conflict: true,
          conflictInfo: conflict,
          localData,
          remoteData
        };
        return result;
        
      default:
        return ConflictResolver.lastWriteWins(localData, remoteData, conflict);
    }
  }
  
  /**
   * 最后写入胜出策略
   */
  private static lastWriteWins(localData: SyncData | null, remoteData: SyncData | null, conflict: ConflictInfo): SyncData {
    // 空值安全检查
    if (!localData && !remoteData) {
      hilog.warn(0x0000, TAG, 'Both local and remote data are null, returning empty object');
      return { version: 1, updatedAt: Date.now() };
    }

    if (!localData) {
      hilog.info(0x0000, TAG, 'Local data is null, remote data wins');
      return remoteData!;
    }

    if (!remoteData) {
      hilog.info(0x0000, TAG, 'Remote data is null, local data wins');
      return localData;
    }

    // 正常情况：根据时间戳选择
    if (conflict.localTimestamp > conflict.remoteTimestamp) {
      hilog.info(0x0000, TAG, 'Local data wins (last write)');
      return localData;
    } else {
      hilog.info(0x0000, TAG, 'Remote data wins (last write)');
      return remoteData;
    }
  }
  
  /**
   * 合并数据策略
   */
  private static mergeData(localData: SyncData | null, remoteData: SyncData | null, conflict: ConflictInfo): SyncData {
    // 简单的字段级合并，优先使用较新的值
    const result: SyncData = {};

    const localTimestamp = conflict.localTimestamp;
    const remoteTimestamp = conflict.remoteTimestamp;

    // 字段级合并：逐字段比较，选择较新的值
    // 基础字段
    result.username = ConflictResolver.mergeField(localData?.username, remoteData?.username, localTimestamp, remoteTimestamp);
    result.bookId = ConflictResolver.mergeField(localData?.bookId, remoteData?.bookId, localTimestamp, remoteTimestamp);
    result.id = ConflictResolver.mergeField(localData?.id, remoteData?.id, localTimestamp, remoteTimestamp);

    // 数值字段
    result.fontSize = ConflictResolver.mergeField(localData?.fontSize, remoteData?.fontSize, localTimestamp, remoteTimestamp);
    result.progress = ConflictResolver.mergeField(localData?.progress, remoteData?.progress, localTimestamp, remoteTimestamp);
    result.currentPage = ConflictResolver.mergeField(localData?.currentPage, remoteData?.currentPage, localTimestamp, remoteTimestamp);

    // 阅读设置相关字段
    result.fontPath = ConflictResolver.mergeField(localData?.fontPath, remoteData?.fontPath, localTimestamp, remoteTimestamp);
    result.lineHeight = ConflictResolver.mergeField(localData?.lineHeight, remoteData?.lineHeight, localTimestamp, remoteTimestamp);
    result.nightMode = ConflictResolver.mergeField(localData?.nightMode, remoteData?.nightMode, localTimestamp, remoteTimestamp);
    result.themeColor = ConflictResolver.mergeField(localData?.themeColor, remoteData?.themeColor, localTimestamp, remoteTimestamp);
    result.themeBgImg = ConflictResolver.mergeField(localData?.themeBgImg, remoteData?.themeBgImg, localTimestamp, remoteTimestamp);
    result.flipMode = ConflictResolver.mergeField(localData?.flipMode, remoteData?.flipMode, localTimestamp, remoteTimestamp);
    result.themeSelectIndex = ConflictResolver.mergeField(localData?.themeSelectIndex, remoteData?.themeSelectIndex, localTimestamp, remoteTimestamp);
    result.fontColor = ConflictResolver.mergeField(localData?.fontColor, remoteData?.fontColor, localTimestamp, remoteTimestamp);
    result.ttsVolume = ConflictResolver.mergeField(localData?.ttsVolume, remoteData?.ttsVolume, localTimestamp, remoteTimestamp);
    result.ttsPitch = ConflictResolver.mergeField(localData?.ttsPitch, remoteData?.ttsPitch, localTimestamp, remoteTimestamp);
    result.ttsSpeed = ConflictResolver.mergeField(localData?.ttsSpeed, remoteData?.ttsSpeed, localTimestamp, remoteTimestamp);
    result.singleHandMode = ConflictResolver.mergeField(localData?.singleHandMode, remoteData?.singleHandMode, localTimestamp, remoteTimestamp);

    // 处理特定类型的合并逻辑（覆盖默认逻辑）
    if (conflict.dataType === 'reading_progress') {
      // 阅读进度合并：取较大的进度值（用户阅读越多越好）
      result.progress = Math.max(localData?.progress || 0, remoteData?.progress || 0);
      result.currentPage = Math.max(localData?.currentPage || 0, remoteData?.currentPage || 0);
    } else if (conflict.dataType === 'reader_settings') {
      // 阅读设置合并：对于数值型设置取平均值
      if (localData?.fontSize !== undefined && remoteData?.fontSize !== undefined) {
        result.fontSize = Math.round((localData.fontSize + remoteData.fontSize) / 2);
      }
    }

    // 更新版本和时间戳
    result.version = Math.max(conflict.localVersion, conflict.remoteVersion) + 1;
    result.updatedAt = Date.now();

    hilog.info(0x0000, TAG, 'Data merged successfully');
    return result;
  }

  /**
   * 合并数据
   */
  private static mergeField<T>(
    localValue: T | undefined,
    remoteValue: T | undefined,
    localTimestamp: number,
    remoteTimestamp: number
  ): T | undefined {
    if (localValue === undefined && remoteValue === undefined) return undefined;
    if (localValue === undefined) return remoteValue;
    if (remoteValue === undefined) return localValue;
    return remoteTimestamp > localTimestamp ? remoteValue : localValue;
  }


  
  /**
   * 批量解决冲突
   */
  static resolveBatchConflicts(
    localDataList: SyncData[], 
    remoteDataList: SyncData[], 
    strategy: ResolutionStrategy,
  ): SyncData[] {
    const result: SyncData[] = [];
    const localMap = new Map<string, SyncData>();
    const remoteMap = new Map<string, SyncData>();
    
    // 构建映射表
    localDataList.forEach(item => {
      if (item.id) {
        localMap.set(item.id, item);
      }
    });
    
    remoteDataList.forEach(item => {
      if (item.id) {
        remoteMap.set(item.id, item);
      }
    });
    
    // 合并所有键
    const allKeys = new Set<string>();
    localMap.forEach((value, key) => allKeys.add(key));
    remoteMap.forEach((value, key) => allKeys.add(key));
    
    allKeys.forEach(key => {
      const localData = localMap.get(key);
      const remoteData = remoteMap.get(key);
      
      const resolvedData = ConflictResolver.resolveConflict(localData || null, remoteData || null, strategy);
      
      const resolutionResult = resolvedData as ConflictResolutionResult;
      if (resolvedData && !resolutionResult.conflict) {
        result.push(resolvedData as SyncData);
      }
    });
    
    return result;
  }
  
  /**
   * 获取数据类型
   */
  private static getDataType(data: SyncData): string {
    if (data.username) return 'user';
    if (data.bookId) return 'reading_progress';
    if (data.fontSize) return 'reader_settings';
    return 'unknown';
  }
  
  /**
   * 检查是否需要手动解决冲突
   */
  static needsManualResolution(conflictResult: SyncData | ConflictResolutionResult): boolean {
    const result = conflictResult as ConflictResolutionResult;
    return result && result.conflict === true;
  }
  
  /**
   * 获取默认解决策略
   */
  static getDefaultStrategy(): ResolutionStrategy {
    return {
      strategy: 'LAST_WRITE_WINS',
      autoResolve: true
    };
  }
  


  /**
   * 解决阅读进度冲突
   */
  static resolveProgressConflict(
    localProgress: BookProgress | null,
    remoteProgress: BookProgress | null,
    strategy: ResolutionStrategy = ConflictResolver.getDefaultStrategy()
  ): ProgressConflictResult {
    const localData = localProgress ? ConflictResolver.convertProgressToSyncData(localProgress) : null;
    const remoteData = remoteProgress ? ConflictResolver.convertProgressToSyncData(remoteProgress) : null;
    
    const conflict = ConflictResolver.detectConflict(localData, remoteData);
    
    if (!conflict) {
      // 没有冲突，返回较新的数据
      const localTimestamp = localProgress?.lastReadTime || 0;
      const remoteTimestamp = remoteProgress?.lastReadTime || 0;
      const resolvedProgress = remoteTimestamp > localTimestamp ? remoteProgress : localProgress;
      
      return {
        conflict: false,
        conflictInfo: null,
        resolvedProgress,
        localProgress,
        remoteProgress
      };
    }
    
    hilog.info(0x0000, TAG, `Resolving progress conflict: ${conflict.conflictType}`);
    
    switch (strategy.strategy) {
      case 'LAST_WRITE_WINS':
        const lastWriteResult = ConflictResolver.lastWriteWins(localData, remoteData, conflict);
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedProgress: ConflictResolver.convertSyncDataToProgress(lastWriteResult, localProgress, remoteProgress),
          localProgress,
          remoteProgress
        };
        
      case 'LOCAL_WINS':
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedProgress: localProgress,
          localProgress,
          remoteProgress
        };
        
      case 'REMOTE_WINS':
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedProgress: remoteProgress,
          localProgress,
          remoteProgress
        };
        
      case 'MERGE':
        const mergedData = ConflictResolver.mergeData(localData, remoteData, conflict);
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedProgress: ConflictResolver.convertSyncDataToProgress(mergedData, localProgress, remoteProgress),
          localProgress,
          remoteProgress
        };
        
      case 'MANUAL_RESOLUTION':
        // 需要用户手动解决，返回冲突信息
        return {
          conflict: true,  // 只有手动解决模式才返回 true
          conflictInfo: conflict,
          resolvedProgress: null,
          localProgress,
          remoteProgress
        };
        
      default:
        const defaultResult = ConflictResolver.lastWriteWins(localData, remoteData, conflict);
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedProgress: ConflictResolver.convertSyncDataToProgress(defaultResult, localProgress, remoteProgress),
          localProgress,
          remoteProgress
        };
    }
  }

  /**
   * 解决阅读设置冲突
   */
  static resolveSettingsConflict(
    localSettings: PersistedReaderSettings | null,
    remoteSettings: PersistedReaderSettings | null,
    strategy: ResolutionStrategy = ConflictResolver.getDefaultStrategy()
  ): SettingsConflictResult {
    const localData = localSettings ? ConflictResolver.convertSettingsToSyncData(localSettings) : null;
    const remoteData = remoteSettings ? ConflictResolver.convertSettingsToSyncData(remoteSettings) : null;
    
    const conflict = ConflictResolver.detectConflict(localData, remoteData);
    
    if (!conflict) {
      // 没有冲突，返回较新的数据
      const localTimestamp = localData?.updatedAt || 0;
      const remoteTimestamp = remoteData?.updatedAt || 0;
      const resolvedSettings = remoteTimestamp > localTimestamp ? remoteSettings : localSettings;
      
      return {
        conflict: false,
        conflictInfo: null,
        resolvedSettings,
        localSettings,
        remoteSettings
      };
    }
    
    hilog.info(0x0000, TAG, `Resolving settings conflict: ${conflict.conflictType}`);
    
    switch (strategy.strategy) {
      case 'LAST_WRITE_WINS':
        const lastWriteResult = ConflictResolver.lastWriteWins(localData, remoteData, conflict);
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedSettings: ConflictResolver.convertSyncDataToSettings(lastWriteResult, localSettings, remoteSettings),
          localSettings,
          remoteSettings
        };
        
      case 'LOCAL_WINS':
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedSettings: localSettings,
          localSettings,
          remoteSettings
        };
        
      case 'REMOTE_WINS':
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedSettings: remoteSettings,
          localSettings,
          remoteSettings
        };
        
      case 'MERGE':
        const mergedData = ConflictResolver.mergeData(localData, remoteData, conflict);
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedSettings: ConflictResolver.convertSyncDataToSettings(mergedData, localSettings, remoteSettings),
          localSettings,
          remoteSettings
        };
        
      case 'MANUAL_RESOLUTION':
        // 需要用户手动解决，返回冲突信息
        return {
          conflict: true,  // 只有手动解决模式才返回 true
          conflictInfo: conflict,
          resolvedSettings: null,
          localSettings,
          remoteSettings
        };
        
      default:
        const defaultResult = ConflictResolver.lastWriteWins(localData, remoteData, conflict);
        return {
          conflict: false,  // 冲突已自动解决
          conflictInfo: conflict,
          resolvedSettings: ConflictResolver.convertSyncDataToSettings(defaultResult, localSettings, remoteSettings),
          localSettings,
          remoteSettings
        };
    }
  }

  /**
   * 批量解决阅读进度冲突
   */
  static resolveBatchProgressConflicts(
    localProgresses: BookProgress[],
    remoteProgresses: BookProgress[],
    strategy: ResolutionStrategy = ConflictResolver.getDefaultStrategy()
  ): BookProgress[] {
    const result: BookProgress[] = [];
    const localMap = new Map<string, BookProgress>();
    const remoteMap = new Map<string, BookProgress>();
    
    // 构建映射表
    localProgresses.forEach(progress => {
      if (progress.bookIdentity) {
        localMap.set(progress.bookIdentity, progress);
      }
    });
    
    remoteProgresses.forEach(progress => {
      if (progress.bookIdentity) {
        remoteMap.set(progress.bookIdentity, progress);
      }
    });
    
    // 合并所有键
    const allKeys = new Set<string>();
    localMap.forEach((value, key) => allKeys.add(key));
    remoteMap.forEach((value, key) => allKeys.add(key));
    
    allKeys.forEach(key => {
      const localProgress = localMap.get(key);
      const remoteProgress = remoteMap.get(key);
      
      const conflictResult = ConflictResolver.resolveProgressConflict(localProgress || null, remoteProgress || null, strategy);
      
      if (conflictResult.resolvedProgress) {
        result.push(conflictResult.resolvedProgress);
      }
    });
    
    return result;
  }

  /**
   * 将 BookProgress 转换为 SyncData
   */
  private static convertProgressToSyncData(progress: BookProgress): SyncData {
    return {
      id: progress.bookIdentity,
      updatedAt: progress.lastReadTime,
      version: 1, // 阅读进度通常没有版本概念，使用1作为默认值
      bookId: progress.bookIdentity,
      progress: progress.resourceIndex, // 使用章节索引作为进度
      currentPage: progress.resourceIndex // 使用章节索引作为当前页
    };
  }

  /**
   * 将 SyncData 转换回 BookProgress
   */
  private static convertSyncDataToProgress(
    syncData: SyncData,
    localProgress?: BookProgress | null,
    remoteProgress?: BookProgress | null
  ): BookProgress | null {
    if (!syncData.id) return null;
    
    // 优先使用本地或远程进度中的完整信息
    const sourceProgress = localProgress || remoteProgress;
    
    if (!sourceProgress) {
      return null;
    }
    
    return {
      bookIdentity: syncData.id,
      filePath: sourceProgress.filePath,
      bookName: sourceProgress.bookName,
      author: sourceProgress.author,
      resourceIndex: syncData.progress || sourceProgress.resourceIndex,
      startDomPos: sourceProgress.startDomPos,
      chapterName: sourceProgress.chapterName,
      lastReadTime: syncData.updatedAt || sourceProgress.lastReadTime
    };
  }

  /**
   * 将 PersistedReaderSettings 转换为 SyncData
   */
  private static convertSettingsToSyncData(settings: PersistedReaderSettings): SyncData {
    return {
      id: 'reader_settings',
      updatedAt: Date.now(),
      version: 1,
      // 保存所有设置字段
      fontPath: settings.fontPath,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      nightMode: settings.nightMode,
      themeColor: settings.themeColor,
      themeBgImg: settings.themeBgImg,
      flipMode: settings.flipMode,
      themeSelectIndex: settings.themeSelectIndex,
      fontColor: settings.fontColor,
      ttsVolume: settings.ttsVolume,
      ttsPitch: settings.ttsPitch,
      ttsSpeed: settings.ttsSpeed,
      singleHandMode: settings.singleHandMode
    };
  }

  /**
   * 将 SyncData 转换回 PersistedReaderSettings
   */
  private static convertSyncDataToSettings(
    syncData: SyncData,
    localSettings?: PersistedReaderSettings | null,
    remoteSettings?: PersistedReaderSettings | null
  ): PersistedReaderSettings | null {
    // 优先使用本地或远程设置中的完整信息作为基础
    const sourceSettings = localSettings || remoteSettings;
    
    if (!sourceSettings) {
      return null;
    }
    
    // 从 SyncData 恢复所有设置字段，优先使用 syncData 中的值
    return {
      fontPath: syncData.fontPath ?? sourceSettings.fontPath,
      fontSize: syncData.fontSize ?? sourceSettings.fontSize,
      lineHeight: syncData.lineHeight ?? sourceSettings.lineHeight,
      nightMode: syncData.nightMode ?? sourceSettings.nightMode,
      themeColor: syncData.themeColor ?? sourceSettings.themeColor,
      themeBgImg: syncData.themeBgImg ?? sourceSettings.themeBgImg,
      flipMode: syncData.flipMode ?? sourceSettings.flipMode,
      themeSelectIndex: syncData.themeSelectIndex ?? sourceSettings.themeSelectIndex,
      fontColor: syncData.fontColor ?? sourceSettings.fontColor,
      ttsVolume: syncData.ttsVolume ?? sourceSettings.ttsVolume,
      ttsPitch: syncData.ttsPitch ?? sourceSettings.ttsPitch,
      ttsSpeed: syncData.ttsSpeed ?? sourceSettings.ttsSpeed,
      singleHandMode: syncData.singleHandMode ?? sourceSettings.singleHandMode
    };
  }
}