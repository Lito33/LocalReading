if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Notes_Params {
    notes?: Array<NoteData>;
    note?: NoteData;
    notesPageStack?: NavPathStack;
    deleteMode?: boolean;
    toDeleteNotesTitles?: Set<string>;
    bgColor?: string;
    eyeMode?: boolean;
    windowWidth?: number;
}
import NoteData from "@bundle:com.example.readerkitdemo/entry@note/ets/viewmodel/NoteData";
import NoteItemEdit from "@bundle:com.example.readerkitdemo/entry@note/ets/view/NoteItemEdit";
import NotePreferenceModel from "@bundle:com.example.readerkitdemo/entry@note/ets/model/NotePreferenceModel";
export class Notes extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__notes = new ObservedPropertyObjectPU([
            { title: "1", content: "this is for test 1", createdAt: (new Date()).toString(), updatedAt: (new Date()).toString() },
            { title: "2", content: "this is for test 2", createdAt: (new Date()).toString(), updatedAt: (new Date()).toString() }
        ], this, "notes");
        this.addProvidedVar("Notes", this.__notes, false);
        this.addProvidedVar("notes", this.__notes, false);
        this.__note = new ObservedPropertyObjectPU(new NoteData(), this, "note");
        this.addProvidedVar("Note", this.__note, false);
        this.addProvidedVar("note", this.__note, false);
        this.__notesPageStack = new ObservedPropertyObjectPU(new NavPathStack(), this, "notesPageStack");
        this.addProvidedVar("NotesPageStack", this.__notesPageStack, false);
        this.addProvidedVar("notesPageStack", this.__notesPageStack, false);
        this.__deleteMode = new ObservedPropertySimplePU(false, this, "deleteMode");
        this.__toDeleteNotesTitles = new ObservedPropertyObjectPU(new Set(), this, "toDeleteNotesTitles");
        this.__bgColor = this.createStorageLink('globalBgColor', '#FFFFFF', "bgColor");
        this.__eyeMode = this.createStorageLink('eyeMode', false, "eyeMode");
        this.__windowWidth = this.createStorageLink('windowWidth', 0, "windowWidth");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Notes_Params) {
        if (params.notes !== undefined) {
            this.notes = params.notes;
        }
        if (params.note !== undefined) {
            this.note = params.note;
        }
        if (params.notesPageStack !== undefined) {
            this.notesPageStack = params.notesPageStack;
        }
        if (params.deleteMode !== undefined) {
            this.deleteMode = params.deleteMode;
        }
        if (params.toDeleteNotesTitles !== undefined) {
            this.toDeleteNotesTitles = params.toDeleteNotesTitles;
        }
    }
    updateStateVars(params: Notes_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__notes.purgeDependencyOnElmtId(rmElmtId);
        this.__note.purgeDependencyOnElmtId(rmElmtId);
        this.__notesPageStack.purgeDependencyOnElmtId(rmElmtId);
        this.__deleteMode.purgeDependencyOnElmtId(rmElmtId);
        this.__toDeleteNotesTitles.purgeDependencyOnElmtId(rmElmtId);
        this.__bgColor.purgeDependencyOnElmtId(rmElmtId);
        this.__eyeMode.purgeDependencyOnElmtId(rmElmtId);
        this.__windowWidth.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__notes.aboutToBeDeleted();
        this.__note.aboutToBeDeleted();
        this.__notesPageStack.aboutToBeDeleted();
        this.__deleteMode.aboutToBeDeleted();
        this.__toDeleteNotesTitles.aboutToBeDeleted();
        this.__bgColor.aboutToBeDeleted();
        this.__eyeMode.aboutToBeDeleted();
        this.__windowWidth.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __notes: ObservedPropertyObjectPU<Array<NoteData>>;
    get notes() {
        return this.__notes.get();
    }
    set notes(newValue: Array<NoteData>) {
        this.__notes.set(newValue);
    }
    private __note: ObservedPropertyObjectPU<NoteData>; //定义note对象
    get note() {
        return this.__note.get();
    }
    set note(newValue: NoteData) {
        this.__note.set(newValue);
    }
    private __notesPageStack: ObservedPropertyObjectPU<NavPathStack>;
    get notesPageStack() {
        return this.__notesPageStack.get();
    }
    set notesPageStack(newValue: NavPathStack) {
        this.__notesPageStack.set(newValue);
    }
    private __deleteMode: ObservedPropertySimplePU<boolean>; //删除
    get deleteMode() {
        return this.__deleteMode.get();
    }
    set deleteMode(newValue: boolean) {
        this.__deleteMode.set(newValue);
    }
    // set 是一个集合，先进先出，不会插入重复数据，数据支持类型的多样性
    private __toDeleteNotesTitles: ObservedPropertyObjectPU<Set<string>>;
    get toDeleteNotesTitles() {
        return this.__toDeleteNotesTitles.get();
    }
    set toDeleteNotesTitles(newValue: Set<string>) {
        this.__toDeleteNotesTitles.set(newValue);
    }
    private __bgColor: ObservedPropertyAbstractPU<string>;
    get bgColor() {
        return this.__bgColor.get();
    }
    set bgColor(newValue: string) {
        this.__bgColor.set(newValue);
    }
    private __eyeMode: ObservedPropertyAbstractPU<boolean>;
    get eyeMode() {
        return this.__eyeMode.get();
    }
    set eyeMode(newValue: boolean) {
        this.__eyeMode.set(newValue);
    }
    //窗口调整
    private __windowWidth: ObservedPropertyAbstractPU<number>;
    get windowWidth() {
        return this.__windowWidth.get();
    }
    set windowWidth(newValue: number) {
        this.__windowWidth.set(newValue);
    }
    getColumns(): number {
        if (this.windowWidth < 600) {
            return 1;
        }
        else if (this.windowWidth < 840) {
            return 2;
        }
        else {
            return 4;
        }
    }
    getColumnsTemplate(): string {
        return Array(this.getColumns()).fill('1fr').join(' ');
    }
    async aboutToAppear(): Promise<void> {
        //将所有的信息推给notes
        this.notes = await NotePreferenceModel.getAll();
        //根据两个时间的差值进行排序，需要重新定义不然不会改变
        this.notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Navigation.create(this.notesPageStack, { moduleName: "entry", pagePath: "exfeature/note/src/main/ets/components/Notes", isUserCreateStack: true });
            Navigation.debugLine("exfeature/note/src/main/ets/components/Notes.ets(44:5)", "note");
            Navigation.hideTitleBar(true);
            Navigation.navDestination({ builder: this.PageMap.bind(this) });
            Navigation.mode(NavigationMode.Stack);
        }, Navigation);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("exfeature/note/src/main/ets/components/Notes.ets(45:7)", "note");
            Column.backgroundColor(this.eyeMode ? '#FAF9DE' : "#F1F3F5");
            Column.height("100%");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //标题部分
            Row.create();
            Row.debugLine("exfeature/note/src/main/ets/components/Notes.ets(47:9)", "note");
            //标题部分
            Row.width("80%");
            //标题部分
            Row.height("10%");
            //标题部分
            Row.margin({ top: 20 });
        }, Row);
        this.TitleBar.bind(this)({ "id": 16777326, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.deleteMode ? { "id": 16777321, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777325, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Text.debugLine("exfeature/note/src/main/ets/components/Notes.ets(49:11)", "note");
            Text.position({ x: "80%", y: "40%" });
            Text.fontSize("20fp");
            Text.fontColor(this.bgColor == "#333333" ? "#ff5995ee" : Color.Blue);
            Text.onClick(() => {
                this.toDeleteNotesTitles.clear();
                this.deleteMode = !this.deleteMode;
            });
        }, Text);
        Text.pop();
        //标题部分
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //内容区
            Row.create();
            Row.debugLine("exfeature/note/src/main/ets/components/Notes.ets(63:9)", "note");
            //内容区
            Row.height("80%");
            //内容区
            Row.width("90%");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Grid.create();
            Grid.debugLine("exfeature/note/src/main/ets/components/Notes.ets(64:11)", "note");
            Grid.columnsTemplate("1fr 1fr");
        }, Grid);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        GridItem.create(() => { }, false);
                        GridItem.margin(10);
                        GridItem.debugLine("exfeature/note/src/main/ets/components/Notes.ets(66:15)", "note");
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, GridItem);
                        this.NoteItem.bind(this)(item);
                        GridItem.pop();
                    };
                    observedDeepRender();
                }
            };
            this.forEachUpdateFunction(elmtId, this.notes, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Grid.pop();
        //内容区
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //底部
            Row.create();
            Row.debugLine("exfeature/note/src/main/ets/components/Notes.ets(77:9)", "note");
            //底部
            Row.margin({ bottom: 15 });
            //底部
            Row.justifyContent(FlexAlign.Center);
            //底部
            Row.height("10%");
            //底部
            Row.width("100%");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(!this.deleteMode ? { "id": 16777320, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" } : { "id": 16777324, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
            Button.debugLine("exfeature/note/src/main/ets/components/Notes.ets(78:11)", "note");
            Button.width(this.windowWidth > 600 ? "40%" : "60%");
            Button.height("60%");
            Button.margin({ bottom: 13 });
            Button.backgroundColor(Color.White);
            Button.fontColor(this.deleteMode ? Color.Red : "#007DFF");
            Button.backgroundColor("#0D182431");
            Button.onClick(async () => {
                if (!this.deleteMode) { //如果是add
                    this.note = { title: "", content: "", createdAt: (new Date()).toString(), updatedAt: (new Date()).toString() };
                    this.notesPageStack.replacePath({ name: "NotesPageStack" });
                }
                else {
                    for (let title of this.toDeleteNotesTitles) { //遍历删除数组中所有的数据
                        console.log(title);
                        //重新加载
                        NotePreferenceModel.delete(title);
                        this.notes = await NotePreferenceModel.getAll();
                        //对剩余的卡片进行排序
                        this.notes.sort((a, b) => (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime());
                    }
                    //自动取反
                    this.deleteMode = !this.deleteMode;
                }
            });
        }, Button);
        Button.pop();
        //底部
        Row.pop();
        Column.pop();
        Navigation.pop();
    }
    //单独做的标题样式
    TitleBar(title: Resource, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.debugLine("exfeature/note/src/main/ets/components/Notes.ets(122:5)", "note");
            Text.fontSize("28fp");
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(Color.Black);
            Text.textAlign(TextAlign.Start);
            Text.width("100%");
            Text.height("100%");
        }, Text);
        Text.pop();
    }
    //展示item和控制添加和删除
    NoteItem(noteData: NoteData, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("exfeature/note/src/main/ets/components/Notes.ets(133:5)", "note");
            Column.backgroundColor(Color.White);
            Column.height(80);
            Column.borderRadius("5%");
            Column.padding("5%");
            Column.onClick(() => {
                this.note = noteData;
                //使用pushPath跳转到NoteItemEdit页面
                this.notesPageStack.pushPath({ name: "NoteItemEdit" });
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("exfeature/note/src/main/ets/components/Notes.ets(134:7)", "note");
            Row.width("100%");
            Row.justifyContent(FlexAlign.SpaceBetween);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(noteData.title);
            Text.debugLine("exfeature/note/src/main/ets/components/Notes.ets(135:9)", "note");
            Text.fontColor(Color.Black);
            Text.fontSize("20fp");
            Text.fontWeight(FontWeight.Bold);
            Text.textAlign(TextAlign.Start);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.deleteMode) { //选中就改变样式
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Checkbox.create();
                        Checkbox.debugLine("exfeature/note/src/main/ets/components/Notes.ets(143:11)", "note");
                        Checkbox.onChange((v: boolean) => {
                            if (v) { //初始是false
                                this.toDeleteNotesTitles.add(noteData.title);
                            }
                            else {
                                this.toDeleteNotesTitles.delete(noteData.title);
                            }
                        });
                    }, Checkbox);
                    Checkbox.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("exfeature/note/src/main/ets/components/Notes.ets(159:7)", "note");
            Row.width("100%");
            Row.height("60%");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
            Text.create(noteData.content.length > 20 ? noteData.content.substring(0, 20) + "..." : noteData.content);
            Text.debugLine("exfeature/note/src/main/ets/components/Notes.ets(161:9)", "note");
            //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
            Text.fontSize("15fp");
            //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
            Text.fontWeight(FontWeight.Normal);
            //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
            Text.textAlign(TextAlign.Start);
            //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
            Text.fontColor(Color.Black);
        }, Text);
        //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
        Text.pop();
        Row.pop();
        Column.pop();
    }
    PageMap(parent = null) {
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new NoteItemEdit(this, { note: this.note }, undefined, elmtId, () => { }, { page: "exfeature/note/src/main/ets/components/Notes.ets", line: 183, col: 5 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            note: this.note
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        note: this.note
                    });
                }
            }, { name: "NoteItemEdit" });
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
}
