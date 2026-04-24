import { fileIo as fs } from '@kit.CoreFileKit';
import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { CorruptType, JsonCorruptType } from '../common/CorruptFileTestTypes';

const TAG = 'CorruptFileTestUtil';

export class CorruptFileTestUtil {

  /**
   * 创建损坏的测试文件
   */
  static async createCorruptFile(
    filePath: string,
    corruptType: CorruptType
  ): Promise<void> {
    try {
      const file = fs.openSync(filePath, fs.OpenMode.CREATE | fs.OpenMode.WRITE_ONLY);

      switch (corruptType) {
        case CorruptType.EMPTY_FILE:
          // 空文件 - 不写入任何内容
          break;

        case CorruptType.ZERO_BYTE:
          // 0字节文件 - 确保文件大小为0
          fs.truncateSync(file.fd, 0);
          break;

        case CorruptType.TRUNCATED_FILE:
          // 截断文件 - 写入部分内容后截断
          const content = 'This is a truncated file test';
          fs.writeSync(file.fd, content);
          fs.truncateSync(file.fd, 10); // 截断到10字节
          break;

        case CorruptType.INVALID_FORMAT:
          // 格式错误 - 写入错误格式的内容
          const invalidContent = '<<<INVALID_FORMAT>>>';
          fs.writeSync(file.fd, invalidContent);
          break;

        case CorruptType.BINARY_CORRUPT:
          // 二进制损坏 - 写入随机二进制数据
          const corruptData = new Uint8Array([0xFF, 0xFE, 0x00, 0x01, 0x02]);
          fs.writeSync(file.fd, corruptData.buffer);
          break;
      }

      fs.closeSync(file);
      hilog.info(0x0000, TAG, `Created corrupt file: ${filePath}, type: ${corruptType}`);
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to create corrupt file: ${error}`);
      throw new Error(error);
    }
  }

  /**
   * 生成损坏的JSON数据
   */
  static createCorruptJsonData(corruptType: JsonCorruptType): string {
    switch (corruptType) {
      case JsonCorruptType.INVALID_JSON:
        return '{invalid json data <<<';

      case JsonCorruptType.MISSING_FIELDS:
        return JSON.stringify({ bookId: 'test' }); // 缺少必要字段

      case JsonCorruptType.WRONG_TYPES:
        return JSON.stringify({
          bookId: 12345, // 应该是string
          bookName: true, // 应该是string
          filePath: null
        });

      case JsonCorruptType.NULL_VALUES:
        return JSON.stringify({
          bookId: null,
          bookName: null,
          filePath: null
        });

      case JsonCorruptType.EMPTY_ARRAY:
        return '[]';

      default:
        return '';
    }
  }

  /**
   * 写入损坏数据到Preferences
   */
  static async writeCorruptPreferences(
    context: common.UIAbilityContext,
    storeName: string,
    key: string,
    corruptData: string
  ): Promise<void> {
    try {
      const pref = await preferences.getPreferences(context, storeName);
      await pref.put(key, corruptData);
      await pref.flush();
      hilog.info(0x0000, TAG, `Written corrupt data to Preferences: ${storeName}/${key}`);
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to write corrupt Preferences: ${error}`);
      throw new Error(error);
    }
  }

  /**
   * 清空Preferences存储
   */
  static async clearPreferences(
    context: common.UIAbilityContext,
    storeName: string
  ): Promise<void> {
    try {
      const pref = await preferences.getPreferences(context, storeName);
      await pref.clear();
      await pref.flush();
      hilog.info(0x0000, TAG, `Cleared Preferences: ${storeName}`);
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to clear Preferences: ${error}`);
      throw new Error(error);
    }
  }

  /**
   * 检查文件是否存在
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = fs.statSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 删除文件
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      fs.unlinkSync(filePath);
      hilog.info(0x0000, TAG, `Deleted file: ${filePath}`);
    } catch (error) {
      hilog.error(0x0000, TAG, `Failed to delete file: ${error}`);
      throw new Error(error);
    }
  }
}