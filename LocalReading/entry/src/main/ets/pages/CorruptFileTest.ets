//测试损坏文件容错
import { common } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { fileIo as fs } from '@kit.CoreFileKit';
import { CorruptFileTestUtil } from '../utils/CorruptFileTestUtil';
import {
  CorruptType,
  JsonCorruptType,
  StorageType,
  TestResult,
  TestScenario,
  TestReport,
  RecoveredDataType
} from '../common/CorruptFileTestTypes';
import { BookStorage } from '../common/BookStorage';
import { ProgressStorage, BookProgress } from '../common/ProgressStorage';
import { SettingStorage, PersistedReaderSettings } from '../common/SettingStorage';
import { BookParserInfo } from '../common/BookParserInfo';
import { GlobalContext } from '../common/GlobalContext';

const TAG = 'CorruptFileTest';

@Entry
@Component
struct CorruptFileTest {
  @State testReports: TestReport[] = [];
  @State isRunning: boolean = false;
  @State currentTest: string = '';

  private context: common.UIAbilityContext = GlobalContext.getInstance().getContext();

  // 定义所有测试场景
  private testScenarios: TestScenario[] = [
    // 书籍存储测试
    {
      id: 'book_invalid_json',
      name: '书籍存储-非法JSON',
      description: '测试书籍存储遇到非法JSON时的容错',
      corruptType: JsonCorruptType.INVALID_JSON,
      storageType: StorageType.BOOK_STORAGE
    },
    {
      id: 'book_missing_fields',
      name: '书籍存储-缺失字段',
      description: '测试书籍存储遇到缺失字段时的容错',
      corruptType: JsonCorruptType.MISSING_FIELDS,
      storageType: StorageType.BOOK_STORAGE
    },
    {
      id: 'book_null_values',
      name: '书籍存储-空值',
      description: '测试书籍存储遇到空值时的容错',
      corruptType: JsonCorruptType.NULL_VALUES,
      storageType: StorageType.BOOK_STORAGE
    },
    {
      id: 'book_empty_array',
      name: '书籍存储-空数组',
      description: '测试书籍存储为空数组时的容错',
      corruptType: JsonCorruptType.EMPTY_ARRAY,
      storageType: StorageType.BOOK_STORAGE
    },
    // 进度存储测试
    {
      id: 'progress_invalid_json',
      name: '进度存储-非法JSON',
      description: '测试进度存储遇到非法JSON时的容错',
      corruptType: JsonCorruptType.INVALID_JSON,
      storageType: StorageType.PROGRESS_STORAGE
    },
    {
      id: 'progress_wrong_types',
      name: '进度存储-类型错误',
      description: '测试进度存储遇到类型错误时的容错',
      corruptType: JsonCorruptType.WRONG_TYPES,
      storageType: StorageType.PROGRESS_STORAGE
    },
    // 设置存储测试
    {
      id: 'setting_invalid_json',
      name: '设置存储-非法JSON',
      description: '测试设置存储遇到非法JSON时的容错',
      corruptType: JsonCorruptType.INVALID_JSON,
      storageType: StorageType.SETTING_STORAGE
    },
    {
      id: 'setting_missing_fields',
      name: '设置存储-缺失字段',
      description: '测试设置存储遇到缺失字段时的容错',
      corruptType: JsonCorruptType.MISSING_FIELDS,
      storageType: StorageType.SETTING_STORAGE
    }
  ];

  aboutToAppear() {
    hilog.info(0x0000, TAG, 'CorruptFileTest page appeared');
  }

  // 执行单个测试
  private async runTest(scenario: TestScenario): Promise<TestReport> {
    const startTime = Date.now();
    this.currentTest = scenario.name;

    let result: TestResult = {
      success: false,
      errorHandled: false,
      testDuration: 0
    };

    try {
      // 根据存储类型执行不同的测试
      switch (scenario.storageType) {
        case StorageType.BOOK_STORAGE:
          result = await this.testBookStorage(scenario.corruptType as JsonCorruptType);
          break;
        case StorageType.PROGRESS_STORAGE:
          result = await this.testProgressStorage(scenario.corruptType as JsonCorruptType);
          break;
        case StorageType.SETTING_STORAGE:
          result = await this.testSettingStorage(scenario.corruptType as JsonCorruptType);
          break;
        default:
          result.errorMessage = '未知的存储类型';
      }
    } catch (error) {
      result.success = false;
      result.errorHandled = false;
      result.errorMessage = `测试异常: ${error}`;
    }

    result.testDuration = Date.now() - startTime;

    return {
      scenario: scenario,
      result: result,
      timestamp: Date.now()
    };
  }

  // 测试书籍存储容错
  private async testBookStorage(corruptType: JsonCorruptType): Promise<TestResult> {
    const result: TestResult = {
      success: false,
      errorHandled: false,
      testDuration: 0
    };

    try {
      // 1. 生成损坏数据
      const corruptData = CorruptFileTestUtil.createCorruptJsonData(corruptType);

      // 2. 写入损坏数据到Preferences
      await CorruptFileTestUtil.writeCorruptPreferences(
        this.context,
        'book_store_default',
        'imported_books',
        corruptData
      );

      // 3. 尝试加载数据（测试容错）
      const books = await BookStorage.loadBooks(this.context);

      // 4. 验证结果
      if (books && books.length >= 0) {
        result.success = true;
        result.errorHandled = true;
        result.recoveredData = books;
        hilog.info(0x0000, TAG, `BookStorage test passed, recovered ${books.length} books`);
      } else {
        result.errorMessage = '加载返回null';
      }
    } catch (error) {
      result.success = false;
      result.errorHandled = false;
      result.errorMessage = `异常: ${error}`;
      hilog.error(0x0000, TAG, `BookStorage test failed: ${error}`);
    }

    return result;
  }

  // 测试进度存储容错
  private async testProgressStorage(corruptType: JsonCorruptType): Promise<TestResult> {
    const result: TestResult = {
      success: false,
      errorHandled: false,
      testDuration: 0
    };

    try {
      // 1. 生成损坏数据
      const corruptData = CorruptFileTestUtil.createCorruptJsonData(corruptType);

      // 2. 写入损坏数据到Preferences
      await CorruptFileTestUtil.writeCorruptPreferences(
        this.context,
        'reader_progress_default',
        'book_progress',
        corruptData
      );

      // 3. 尝试加载数据（测试容错）
      const progresses = await ProgressStorage.loadAllProgresses(this.context);

      // 4. 验证结果
      if (progresses && progresses.length >= 0) {
        result.success = true;
        result.errorHandled = true;
        result.recoveredData = progresses;
        hilog.info(0x0000, TAG, `ProgressStorage test passed, recovered ${progresses.length} progresses`);
      } else {
        result.errorMessage = '加载返回null';
      }
    } catch (error) {
      result.success = false;
      result.errorHandled = false;
      result.errorMessage = `异常: ${error}`;
      hilog.error(0x0000, TAG, `ProgressStorage test failed: ${error}`);
    }

    return result;
  }

  // 测试设置存储容错
  private async testSettingStorage(corruptType: JsonCorruptType): Promise<TestResult> {
    const result: TestResult = {
      success: false,
      errorHandled: false,
      testDuration: 0
    };

    try {
      // 1. 生成损坏数据
      const corruptData = CorruptFileTestUtil.createCorruptJsonData(corruptType);

      // 2. 写入损坏数据到Preferences
      await CorruptFileTestUtil.writeCorruptPreferences(
        this.context,
        'reader_preferences',
        'reader_settings',
        corruptData
      );

      // 3. 尝试加载数据（测试容错）
      const settings = await SettingStorage.loadSettings(this.context);

      // 4. 验证结果
      if (settings !== undefined) {
        result.success = true;
        result.errorHandled = true;
        result.recoveredData = settings;
        hilog.info(0x0000, TAG, `SettingStorage test passed, recovered settings: ${settings !== null}`);
      } else {
        result.errorMessage = '加载返回undefined';
      }
    } catch (error) {
      result.success = false;
      result.errorHandled = false;
      result.errorMessage = `异常: ${error}`;
      hilog.error(0x0000, TAG, `SettingStorage test failed: ${error}`);
    }

    return result;
  }

  // 运行所有测试
  private async runAllTests() {
    this.isRunning = true;
    this.testReports = [];

    hilog.info(0x0000, TAG, 'Starting all tests...');

    for (const scenario of this.testScenarios) {
      const report = await this.runTest(scenario);
      this.testReports.push(report);

      // 每个测试之间间隔100ms
      await new Promise<void>(resolve => setTimeout(resolve, 100));
    }

    this.isRunning = false;
    this.currentTest = '';
    hilog.info(0x0000, TAG, 'All tests completed');
  }

  // 清理测试数据
  private async cleanupTestData() {
    try {
      await CorruptFileTestUtil.clearPreferences(this.context, 'book_store_default');
      await CorruptFileTestUtil.clearPreferences(this.context, 'reader_progress_default');
      await CorruptFileTestUtil.clearPreferences(this.context, 'reader_preferences');
      hilog.info(0x0000, TAG, 'Test data cleaned up');
    } catch (error) {
      hilog.error(0x0000, TAG, `Cleanup failed: ${error}`);
    }
  }

  build() {
    Column() {
      // 标题
      Text('损坏文件容错测试')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin({ top: 20, bottom: 20 })
        .fontColor(Color.Black)

      // 控制按钮
      Row() {
        Button('运行所有测试')
          .enabled(!this.isRunning)
          .onClick(() => {
            this.runAllTests();
          })
          .margin({ right: 10 });

        Button('清理测试数据')
          .enabled(!this.isRunning)
          .onClick(() => {
            this.cleanupTestData();
          })
          .margin({ right: 10 });

        Button('清空报告')
          .enabled(!this.isRunning)
          .onClick(() => {
            this.testReports = [];
          });
      }
      .margin({ bottom: 20 });

      // 当前测试提示
      if (this.isRunning && this.currentTest) {
        Row() {
          LoadingProgress()
            .width(20)
            .height(20)
            .margin({ right: 10 });
          Text(`正在执行: ${this.currentTest}`)
            .fontSize(14)
            .fontColor('#666666');
        }
        .margin({ bottom: 20 });
      }

      // 测试统计
      if (this.testReports.length > 0) {
        Row() {
          Text(`总计: ${this.testReports.length}`)
            .fontSize(14)
            .margin({ right: 20 });
          Text(`通过: ${this.testReports.filter(r => r.result.success).length}`)
            .fontSize(14)
            .fontColor('#4CAF50')
            .margin({ right: 20 });
          Text(`失败: ${this.testReports.filter(r => !r.result.success).length}`)
            .fontSize(14)
            .fontColor('#F44336');
        }
        .margin({ bottom: 20 });
      }

      // 测试报告列表
      List() {
        ForEach(this.testReports, (report: TestReport) => {
          ListItem() {
            Column() {
              Row() {
                Text(report.scenario.name)
                  .fontSize(16)
                  .fontWeight(FontWeight.Medium)
                  .layoutWeight(1);

                Text(report.result.success ? '✓ 通过' : '✗ 失败')
                  .fontSize(14)
                  .fontColor(report.result.success ? '#4CAF50' : '#F44336');
              }
              .width('100%');

              Text(report.scenario.description)
                .fontSize(12)
                .fontColor('#999999')
                .margin({ top: 5 });

              Row() {
                Text(`耗时: ${report.result.testDuration}ms`)
                  .fontSize(12)
                  .fontColor('#666666');

                Text(` | 错误已处理: ${report.result.errorHandled ? '是' : '否'}`)
                  .fontSize(12)
                  .fontColor('#666666');
              }
              .margin({ top: 5 });

              if (report.result.errorMessage) {
                Text(`信息: ${report.result.errorMessage}`)
                  .fontSize(12)
                  .fontColor('#999999')
                  .margin({ top: 5 });
              }

              // 显示恢复的数据信息
              if (report.result.recoveredData) {
                this.buildRecoveredDataInfo(report.result.recoveredData);
              }
            }
            .width('100%')
            .padding(15)
            .backgroundColor('#F5F5F5')
            .borderRadius(8)
            .margin({ bottom: 10 });
          }
        }, (report: TestReport) => report.scenario.id);
      }
      .width('100%')
      .layoutWeight(1)
      .padding({ left: 20, right: 20 });
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#FFFFFF');
  }

  // 显示恢复数据的详细信息
  @Builder
  buildRecoveredDataInfo(data: RecoveredDataType) {
    Column() {
      if (data instanceof Array) {
        if (data.length > 0 && data[0] instanceof BookParserInfo) {
          Text(`恢复书籍数量: ${data.length}`)
            .fontSize(12)
            .fontColor('#2196F3')
            .margin({ top: 5 });
        } else if (data.length > 0) {
          Text(`恢复进度数量: ${data.length}`)
            .fontSize(12)
            .fontColor('#2196F3')
            .margin({ top: 5 });
        } else {
          Text(`恢复为空数组`)
            .fontSize(12)
            .fontColor('#FF9800')
            .margin({ top: 5 });
        }
      } else if (data !== null) {
        Text(`恢复设置数据成功`)
          .fontSize(12)
          .fontColor('#2196F3')
          .margin({ top: 5 });
      } else {
        Text(`恢复为null`)
          .fontSize(12)
          .fontColor('#FF9800')
          .margin({ top: 5 });
      }
    }
  }
}