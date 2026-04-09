if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface NoteItemEdit_Params {
    bgColor?: string;
    notes?: Array<NoteData>;
    notesPageStack?: NavPathStack;
    note?: NoteData;
    m_title?: string;
    m_content?: string;
}
import type NoteData from "../viewmodel/NoteData";
import NotePreferenceModel from "@bundle:com.example.readerkitdemo/entry@note/ets/model/NotePreferenceModel";
export default class NoteItemEdit extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__bgColor = this.createStorageLink('globalBgColor', '#FFFFFF', "bgColor");
        this.__notes = this.initializeConsume("Notes", "notes");
        this.__notesPageStack = this.initializeConsume("NotesPageStack", "notesPageStack");
        this.__note = new SynchedPropertyObjectOneWayPU(params.note, this, "note");
        this.__m_title = new ObservedPropertySimplePU("", this, "m_title");
        this.__m_content = new ObservedPropertySimplePU("", this, "m_content");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: NoteItemEdit_Params) {
        if (params.m_title !== undefined) {
            this.m_title = params.m_title;
        }
        if (params.m_content !== undefined) {
            this.m_content = params.m_content;
        }
    }
    updateStateVars(params: NoteItemEdit_Params) {
        this.__note.reset(params.note);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__bgColor.purgeDependencyOnElmtId(rmElmtId);
        this.__notes.purgeDependencyOnElmtId(rmElmtId);
        this.__notesPageStack.purgeDependencyOnElmtId(rmElmtId);
        this.__note.purgeDependencyOnElmtId(rmElmtId);
        this.__m_title.purgeDependencyOnElmtId(rmElmtId);
        this.__m_content.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__bgColor.aboutToBeDeleted();
        this.__notes.aboutToBeDeleted();
        this.__notesPageStack.aboutToBeDeleted();
        this.__note.aboutToBeDeleted();
        this.__m_title.aboutToBeDeleted();
        this.__m_content.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __bgColor: ObservedPropertyAbstractPU<string>;
    get bgColor() {
        return this.__bgColor.get();
    }
    set bgColor(newValue: string) {
        this.__bgColor.set(newValue);
    }
    private __notes: ObservedPropertyAbstractPU<Array<NoteData>>;
    get notes() {
        return this.__notes.get();
    }
    set notes(newValue: Array<NoteData>) {
        this.__notes.set(newValue);
    }
    private __notesPageStack: ObservedPropertyAbstractPU<NavPathStack>;
    get notesPageStack() {
        return this.__notesPageStack.get();
    }
    set notesPageStack(newValue: NavPathStack) {
        this.__notesPageStack.set(newValue);
    }
    private __note: SynchedPropertySimpleOneWayPU<NoteData>; //单向接收note的值
    get note() {
        return this.__note.get();
    }
    set note(newValue: NoteData) {
        this.__note.set(newValue);
    }
    //存储修改后的数据
    private __m_title: ObservedPropertySimplePU<string>;
    get m_title() {
        return this.__m_title.get();
    }
    set m_title(newValue: string) {
        this.__m_title.set(newValue);
    }
    private __m_content: ObservedPropertySimplePU<string>;
    get m_content() {
        return this.__m_content.get();
    }
    set m_content(newValue: string) {
        this.__m_content.set(newValue);
    }
    aboutToAppear(): void {
        this.m_title = this.note.title;
        this.m_content = this.note.content;
    }
    //在自定义组件即将析构销毁时执行
    async aboutToDisappear(): Promise<void> {
        if (this.m_title != this.note.title || this.m_content != this.note.content) { //检查是否修改
            NotePreferenceModel.delete(this.note.title); //把原来的删了
            if (this.note.title == "" && this.note.content == "") { //如果是空的就只设置时间
                this.note.createdAt = (new Date()).toString();
            }
            await NotePreferenceModel.put({ title: this.m_title, content: this.m_content, createdAt: this.note.createdAt, updatedAt: (new Date()).toString() });
            //获取后重新排序
            this.notes = await NotePreferenceModel.getAll();
            this.notes.sort((a, b) => (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime());
            //遍历输出
            this.notes.forEach((item) => {
                console.log(item.title, item.content, item.createdAt, item.updatedAt);
            });
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            NavDestination.create(() => {
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create();
                    Column.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(40:7)", "note");
                    Column.backgroundColor(this.bgColor);
                    Column.width("100%");
                    Column.height("100%");
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(41:9)", "note");
                    Row.height("3%");
                    Row.margin({ top: 40 });
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create({ "id": 16777323, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                    Text.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(42:11)", "note");
                    Text.fontColor(this.getTextColor());
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((new Date(this.note.createdAt)).toLocaleString());
                    Text.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(44:11)", "note");
                    Text.fontColor(this.getTextColor());
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Row.create();
                    Row.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(49:9)", "note");
                    Row.height("3%");
                    Row.margin("1%");
                }, Row);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create({ "id": 16777329, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" });
                    Text.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(50:11)", "note");
                    Text.fontColor(this.getTextColor());
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create((new Date(this.note.updatedAt)).toLocaleString());
                    Text.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(52:11)", "note");
                    Text.fontColor(this.getTextColor());
                }, Text);
                Text.pop();
                Row.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    TextInput.create({ placeholder: { "id": 16777328, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }, text: this.m_title });
                    TextInput.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(57:9)", "note");
                    TextInput.onChange((v: string) => {
                        this.m_title = v;
                    });
                    TextInput.fontColor(this.getTextColor());
                    TextInput.placeholderColor(this.getTextColor());
                    TextInput.margin("2%");
                    TextInput.height("6%");
                }, TextInput);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    TextArea.create({ placeholder: { "id": 16777322, "type": 10003, params: [], "bundleName": "com.example.readerkitdemo", "moduleName": "entry" }, text: this.m_content });
                    TextArea.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(65:9)", "note");
                    TextArea.onChange((v: string) => {
                        this.m_content = v;
                    });
                    TextArea.fontColor(this.getTextColor());
                    TextArea.placeholderColor(this.getTextColor());
                    TextArea.height("80%");
                }, TextArea);
                Column.pop();
            }, { moduleName: "entry", pagePath: "exfeature/note/src/main/ets/view/NoteItemEdit" });
            NavDestination.hideTitleBar(true);
            NavDestination.debugLine("exfeature/note/src/main/ets/view/NoteItemEdit.ets(39:5)", "note");
        }, NavDestination);
        NavDestination.pop();
    }
    private getTextColor(): Color {
        return this.bgColor === '#333333' ? Color.White : Color.Black;
    }
    rerender() {
        this.updateDirtyElements();
    }
}
