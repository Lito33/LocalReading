import { hilog } from '@kit.PerformanceAnalysisKit';

const TAG = 'ConflictResolver';

export interface ConflictInfo {
  dataType: string;
  localVersion: number;
  remoteVersion: number;
  localTimestamp: number;
  remoteTimestamp: number;
  conflictType: 'UPDATE_UPDATE' | 'DELETE_UPDATE' | 'CREATE_CREATE';
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
}

interface ConflictResolutionResult {
  conflict: boolean;
  conflictInfo: ConflictInfo;
  localData: SyncData | null;
  remoteData: SyncData | null;
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
    if (conflict.localTimestamp > conflict.remoteTimestamp) {
      hilog.info(0x0000, TAG, 'Local data wins (last write)');
      return localData!;
    } else {
      hilog.info(0x0000, TAG, 'Remote data wins (last write)');
      return remoteData!;
    }
  }
  
  /**
   * 合并数据策略
   */
  private static mergeData(localData: SyncData | null, remoteData: SyncData | null, conflict: ConflictInfo): SyncData {
    // 简单的字段级合并，优先使用较新的值
    const result: SyncData = {};
    
    // 复制本地数据
    if (localData) {
      if (localData.version) result.version = localData.version;
      if (localData.updatedAt) result.updatedAt = localData.updatedAt;
      if (localData.username) result.username = localData.username;
      if (localData.bookId) result.bookId = localData.bookId;
      if (localData.fontSize) result.fontSize = localData.fontSize;
      if (localData.progress) result.progress = localData.progress;
      if (localData.currentPage) result.currentPage = localData.currentPage;
      if (localData.id) result.id = localData.id;
    }
    
    // 复制远程数据（覆盖本地数据）
    if (remoteData) {
      if (remoteData.version) result.version = remoteData.version;
      if (remoteData.updatedAt) result.updatedAt = remoteData.updatedAt;
      if (remoteData.username) result.username = remoteData.username;
      if (remoteData.bookId) result.bookId = remoteData.bookId;
      if (remoteData.fontSize) result.fontSize = remoteData.fontSize;
      if (remoteData.progress) result.progress = remoteData.progress;
      if (remoteData.currentPage) result.currentPage = remoteData.currentPage;
      if (remoteData.id) result.id = remoteData.id;
    }
    
    // 更新版本和时间戳
    result.version = Math.max(conflict.localVersion, conflict.remoteVersion) + 1;
    result.updatedAt = Date.now();
    
    // 处理特定类型的合并逻辑
    if (conflict.dataType === 'reading_progress') {
      // 阅读进度合并：取较大的进度值
      result.progress = Math.max(localData?.progress || 0, remoteData?.progress || 0);
      result.currentPage = Math.max(localData?.currentPage || 0, remoteData?.currentPage || 0);
    }
    
    hilog.info(0x0000, TAG, 'Data merged successfully');
    return result;
  }
  
  /**
   * 批量解决冲突
   */
  static resolveBatchConflicts(
    localDataList: SyncData[], 
    remoteDataList: SyncData[], 
    strategy: ResolutionStrategy,
    keyField: string = 'id'
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
   * 获取用户偏好策略
   */
  static getUserPreferenceStrategy(): ResolutionStrategy {
    // 这里可以从用户设置中获取策略偏好
    // 暂时返回默认策略
    return ConflictResolver.getDefaultStrategy();
  }
}