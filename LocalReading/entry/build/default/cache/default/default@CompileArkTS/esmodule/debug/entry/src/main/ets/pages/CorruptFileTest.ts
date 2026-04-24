if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface CorruptFileTest_Params {
    testReports?: TestReport[];
    isRunning?: boolean;
    currentTest?: string;
    context?: common.UIAbilityContext;
    testScenarios?: TestScenario[];
}
import type common from "@ohos:app.ability.common";
import hilog from "@ohos:hilog";
import { CorruptFileTestUtil } from "@bundle:com.example.readerkitdemo/entry/ets/utils/CorruptFileTestUtil";
import { JsonCorruptType, StorageType } from "@bundle:com.example.readerkitdemo/entry/ets/common/CorruptFileTestTypes";
import type { TestResult, TestScenario, TestReport, RecoveredDataType } from "@bundle:com.example.readerkitdemo/entry/ets/common/CorruptFileTestTypes";
import { BookStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookStorage";
import { ProgressStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/ProgressStorage";
import { SettingStorage } from "@bundle:com.example.readerkitdemo/entry/ets/common/SettingStorage";
import { BookParserInfo } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookParserInfo";
import { GlobalContext } from "@bundle:com.example.readerkitdemo/entry/ets/common/GlobalContext";
const TAG = 'CorruptFileTest';
class CorruptFileTest extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__testReports = new ObservedPropertyObjectPU([], this, "testReports");
        this.__isRunning = new ObservedPropertySimplePU(false, this, "isRunning");
        this.__currentTest = new ObservedPropertySimplePU('', this, "currentTest");
        this.context = GlobalContext.getInstance().getContext();
        this.testScenarios = [
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
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CorruptFileTest_Params) {
        if (params.testReports !== undefined) {
            this.testReports = params.testReports;
        }
        if (params.isRunning !== undefined) {
            this.isRunning = params.isRunning;
        }
        if (params.currentTest !== undefined) {
            this.currentTest = params.currentTest;
        }
        if (params.context !== undefined) {
            this.context = params.context;
        }
        if (params.testScenarios !== undefined) {
            this.testScenarios = params.testScenarios;
        }
    }
    updateStateVars(params: CorruptFileTest_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__testReports.purgeDependencyOnElmtId(rmElmtId);
        this.__isRunning.purgeDependencyOnElmtId(rmElmtId);
        this.__currentTest.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__testReports.aboutToBeDeleted();
        this.__isRunning.aboutToBeDeleted();
        this.__currentTest.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __testReports: ObservedPropertyObjectPU<TestReport[]>;
    get testReports() {
        return this.__testReports.get();
    }
    set testReports(newValue: TestReport[]) {
        this.__testReports.set(newValue);
    }
    private __isRunning: ObservedPropertySimplePU<boolean>;
    get isRunning() {
        return this.__isRunning.get();
    }
    set isRunning(newValue: boolean) {
        this.__isRunning.set(newValue);
    }
    private __currentTest: ObservedPropertySimplePU<string>;
    get currentTest() {
        return this.__currentTest.get();
    }
    set currentTest(newValue: string) {
        this.__currentTest.set(newValue);
    }
    private context: common.UIAbilityContext;
    // 定义所有测试场景
    private testScenarios: TestScenario[];
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
        }
        catch (error) {
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
            await CorruptFileTestUtil.writeCorruptPreferences(this.context, 'book_store_default', 'imported_books', corruptData);
            // 3. 尝试加载数据（测试容错）
            const books = await BookStorage.loadBooks(this.context);
            // 4. 验证结果
            if (books && books.length >= 0) {
                result.success = true;
                result.errorHandled = true;
                result.recoveredData = books;
                hilog.info(0x0000, TAG, `BookStorage test passed, recovered ${books.length} books`);
            }
            else {
                result.errorMessage = '加载返回null';
            }
        }
        catch (error) {
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
            await CorruptFileTestUtil.writeCorruptPreferences(this.context, 'reader_progress_default', 'book_progress', corruptData);
            // 3. 尝试加载数据（测试容错）
            const progresses = await ProgressStorage.loadAllProgresses(this.context);
            // 4. 验证结果
            if (progresses && progresses.length >= 0) {
                result.success = true;
                result.errorHandled = true;
                result.recoveredData = progresses;
                hilog.info(0x0000, TAG, `ProgressStorage test passed, recovered ${progresses.length} progresses`);
            }
            else {
                result.errorMessage = '加载返回null';
            }
        }
        catch (error) {
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
            await CorruptFileTestUtil.writeCorruptPreferences(this.context, 'reader_preferences', 'reader_settings', corruptData);
            // 3. 尝试加载数据（测试容错）
            const settings = await SettingStorage.loadSettings(this.context);
            // 4. 验证结果
            if (settings !== undefined) {
                result.success = true;
                result.errorHandled = true;
                result.recoveredData = settings;
                hilog.info(0x0000, TAG, `SettingStorage test passed, recovered settings: ${settings !== null}`);
            }
            else {
                result.errorMessage = '加载返回undefined';
            }
        }
        catch (error) {
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
        }
        catch (error) {
            hilog.error(0x0000, TAG, `Cleanup failed: ${error}`);
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#FFFFFF');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题
            Text.create('损坏文件容错测试');
            // 标题
            Text.fontSize(24);
            // 标题
            Text.fontWeight(FontWeight.Bold);
            // 标题
            Text.margin({ top: 20, bottom: 20 });
            // 标题
            Text.fontColor(Color.Black);
        }, Text);
        // 标题
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 控制按钮
            Row.create();
            // 控制按钮
            Row.margin({ bottom: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('运行所有测试');
            Button.enabled(!this.isRunning);
            Button.onClick(() => {
                this.runAllTests();
            });
            Button.margin({ right: 10 });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('清理测试数据');
            Button.enabled(!this.isRunning);
            Button.onClick(() => {
                this.cleanupTestData();
            });
            Button.margin({ right: 10 });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('清空报告');
            Button.enabled(!this.isRunning);
            Button.onClick(() => {
                this.testReports = [];
            });
        }, Button);
        Button.pop();
        // 控制按钮
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 当前测试提示
            if (this.isRunning && this.currentTest) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.margin({ bottom: 20 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.width(20);
                        LoadingProgress.height(20);
                        LoadingProgress.margin({ right: 10 });
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`正在执行: ${this.currentTest}`);
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            // 测试统计
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 测试统计
            if (this.testReports.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.margin({ bottom: 20 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`总计: ${this.testReports.length}`);
                        Text.fontSize(14);
                        Text.margin({ right: 20 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`通过: ${this.testReports.filter(r => r.result.success).length}`);
                        Text.fontSize(14);
                        Text.fontColor('#4CAF50');
                        Text.margin({ right: 20 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`失败: ${this.testReports.filter(r => !r.result.success).length}`);
                        Text.fontSize(14);
                        Text.fontColor('#F44336');
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            // 测试报告列表
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 测试报告列表
            List.create();
            // 测试报告列表
            List.width('100%');
            // 测试报告列表
            List.layoutWeight(1);
            // 测试报告列表
            List.padding({ left: 20, right: 20 });
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const report = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        ListItem.create(deepRenderFunction, true);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Column.create();
                            Column.width('100%');
                            Column.padding(15);
                            Column.backgroundColor('#F5F5F5');
                            Column.borderRadius(8);
                            Column.margin({ bottom: 10 });
                        }, Column);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.width('100%');
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(report.scenario.name);
                            Text.fontSize(16);
                            Text.fontWeight(FontWeight.Medium);
                            Text.layoutWeight(1);
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(report.result.success ? '✓ 通过' : '✗ 失败');
                            Text.fontSize(14);
                            Text.fontColor(report.result.success ? '#4CAF50' : '#F44336');
                        }, Text);
                        Text.pop();
                        Row.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(report.scenario.description);
                            Text.fontSize(12);
                            Text.fontColor('#999999');
                            Text.margin({ top: 5 });
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.margin({ top: 5 });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(`耗时: ${report.result.testDuration}ms`);
                            Text.fontSize(12);
                            Text.fontColor('#666666');
                        }, Text);
                        Text.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(` | 错误已处理: ${report.result.errorHandled ? '是' : '否'}`);
                            Text.fontSize(12);
                            Text.fontColor('#666666');
                        }, Text);
                        Text.pop();
                        Row.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            if (report.result.errorMessage) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                                        Text.create(`信息: ${report.result.errorMessage}`);
                                        Text.fontSize(12);
                                        Text.fontColor('#999999');
                                        Text.margin({ top: 5 });
                                    }, Text);
                                    Text.pop();
                                });
                            }
                            // 显示恢复的数据信息
                            else {
                                this.ifElseBranchUpdateFunction(1, () => {
                                });
                            }
                        }, If);
                        If.pop();
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            If.create();
                            // 显示恢复的数据信息
                            if (report.result.recoveredData) {
                                this.ifElseBranchUpdateFunction(0, () => {
                                    this.buildRecoveredDataInfo.bind(this)(report.result.recoveredData);
                                });
                            }
                            else {
                                this.ifElseBranchUpdateFunction(1, () => {
                                });
                            }
                        }, If);
                        If.pop();
                        Column.pop();
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, this.testReports, forEachItemGenFunction, (report: TestReport) => report.scenario.id, false, false);
        }, ForEach);
        ForEach.pop();
        // 测试报告列表
        List.pop();
        Column.pop();
    }
    // 显示恢复数据的详细信息
    buildRecoveredDataInfo(data: RecoveredDataType, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (data instanceof Array) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (data.length > 0 && data[0] instanceof BookParserInfo) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`恢复书籍数量: ${data.length}`);
                                    Text.fontSize(12);
                                    Text.fontColor('#2196F3');
                                    Text.margin({ top: 5 });
                                }, Text);
                                Text.pop();
                            });
                        }
                        else if (data.length > 0) {
                            this.ifElseBranchUpdateFunction(1, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`恢复进度数量: ${data.length}`);
                                    Text.fontSize(12);
                                    Text.fontColor('#2196F3');
                                    Text.margin({ top: 5 });
                                }, Text);
                                Text.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(2, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`恢复为空数组`);
                                    Text.fontSize(12);
                                    Text.fontColor('#FF9800');
                                    Text.margin({ top: 5 });
                                }, Text);
                                Text.pop();
                            });
                        }
                    }, If);
                    If.pop();
                });
            }
            else if (data !== null) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`恢复设置数据成功`);
                        Text.fontSize(12);
                        Text.fontColor('#2196F3');
                        Text.margin({ top: 5 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`恢复为null`);
                        Text.fontSize(12);
                        Text.fontColor('#FF9800');
                        Text.margin({ top: 5 });
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "CorruptFileTest";
    }
}
registerNamedRoute(() => new CorruptFileTest(undefined, {}), "", { bundleName: "com.example.readerkitdemo", moduleName: "entry", pagePath: "pages/CorruptFileTest", pageFullPath: "entry/src/main/ets/pages/CorruptFileTest", integratedHsp: "false", moduleType: "followWithHap" });
