//损坏类型定义

import { BookParserInfo } from './BookParserInfo';
import { BookProgress } from './ProgressStorage';
import { PersistedReaderSettings } from './SettingStorage';

// 文件损坏类型
export enum CorruptType {
  EMPTY_FILE = 'empty_file',           // 空文件
  TRUNCATED_FILE = 'truncated_file',   // 截断文件
  INVALID_FORMAT = 'invalid_format',   // 格式错误
  BINARY_CORRUPT = 'binary_corrupt',   // 二进制损坏
  ZERO_BYTE = 'zero_byte'              // 0字节文件
}

// JSON损坏类型
export enum JsonCorruptType {
  INVALID_JSON = 'invalid_json',       // 非法JSON
  MISSING_FIELDS = 'missing_fields',   // 缺失字段
  WRONG_TYPES = 'wrong_types',         // 类型错误
  NULL_VALUES = 'null_values',         // 空值
  EMPTY_ARRAY = 'empty_array'          // 空数组
}

// 存储类型
export enum StorageType {
  BOOK_STORAGE = 'book_storage',
  PROGRESS_STORAGE = 'progress_storage',
  SETTING_STORAGE = 'setting_storage'
}

// 恢复数据类型联合
export type RecoveredDataType = BookParserInfo[] | BookProgress[] | PersistedReaderSettings | null;

// 测试结果
export interface TestResult {
  success: boolean;
  errorHandled: boolean;
  errorMessage?: string;
  recoveredData?: RecoveredDataType;
  testDuration: number;
}

// 测试场景
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  corruptType: CorruptType | JsonCorruptType;
  storageType?: StorageType;
}

// 测试报告
export interface TestReport {
  scenario: TestScenario;
  result: TestResult;
  timestamp: number;
}