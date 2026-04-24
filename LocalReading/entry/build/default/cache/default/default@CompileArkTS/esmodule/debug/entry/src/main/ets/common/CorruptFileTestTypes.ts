import type { BookParserInfo } from './BookParserInfo';
import type { BookProgress } from './ProgressStorage';
import type { PersistedReaderSettings } from './SettingStorage';
// 文件损坏类型
export enum CorruptType {
    EMPTY_FILE = "empty_file",
    TRUNCATED_FILE = "truncated_file",
    INVALID_FORMAT = "invalid_format",
    BINARY_CORRUPT = "binary_corrupt",
    ZERO_BYTE = "zero_byte" // 0字节文件
}
// JSON损坏类型
export enum JsonCorruptType {
    INVALID_JSON = "invalid_json",
    MISSING_FIELDS = "missing_fields",
    WRONG_TYPES = "wrong_types",
    NULL_VALUES = "null_values",
    EMPTY_ARRAY = "empty_array" // 空数组
}
// 存储类型
export enum StorageType {
    BOOK_STORAGE = "book_storage",
    PROGRESS_STORAGE = "progress_storage",
    SETTING_STORAGE = "setting_storage"
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
