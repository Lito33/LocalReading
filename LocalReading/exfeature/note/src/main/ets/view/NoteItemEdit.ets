import NoteData from "../viewmodel/NoteData"
import NotePreferenceModel from "../model/NotePreferenceModel"
import { router } from "@kit.ArkUI";

//编辑note的页面
@Component
export default struct NoteItemEdit {
  @StorageLink('eyeMode') eyeMode: boolean = false;
  @Consume("Notes") notes: Array<NoteData>
  @Consume("NotesPageStack") notesPageStack: NavPathStack;
  @Prop note: NoteData;//单向接收note的值
  //存储修改后的数据
  @State m_title: string = "";
  @State m_content: string = "";

  aboutToAppear(): void {
    this.m_title = this.note.title;
    this.m_content = this.note.content;
  }

  //在自定义组件即将析构销毁时执行
  async aboutToDisappear(): Promise<void> {
    if (this.m_title != this.note.title || this.m_content != this.note.content) {//检查是否修改
      NotePreferenceModel.delete(this.note.title);//把原来的删了
      if (this.note.title == "" && this.note.content == "") {//如果是空的就只设置时间
        this.note.createdAt = (new Date()).toString();
      }
      await NotePreferenceModel.put({title: this.m_title, content: this.m_content, createdAt: this.note.createdAt, updatedAt: (new Date()).toString()})
      //获取后重新排序
      this.notes = await NotePreferenceModel.getAll();
      this.notes.sort((a, b) => (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime())
      //遍历输出
      this.notes.forEach((item) => {
        console.log(item.title, item.content, item.createdAt, item.updatedAt)
      })
    }
  }

  build() {
    NavDestination() {
      Column() {
        Row(){
          Image($r('app.media.arrow_Left'))
            .width(25)
            .height(25)
            .margin({left:20,top: 20})
            .onClick(() => {
                this.notesPageStack.pop();
            })

          Blank()
            .layoutWeight(0.8)

          Column(){
            Row() {
              Text($r("app.string.create_at"))
                .fontColor(Color.Black)
              Text((new Date(this.note.createdAt)).toLocaleString())
                .fontColor(Color.Black)
            }
            .height("3%")
            .margin({top:40})
            Row() {
              Text($r("app.string.updated_at"))
                .fontColor(Color.Black)
              Text((new Date(this.note.updatedAt)).toLocaleString())
                .fontColor(Color.Black)
            }
            .height("3%")
            .margin("1%")
          }
          Blank()
            .layoutWeight(1)
        }
         .width('100%')
        TextInput({placeholder: $r("app.string.title_input_tip"), text: this.m_title})
          .onChange((v: string) => {
            this.m_title = v;
          })
          .fontColor(Color.Black)
          .placeholderColor('#ff3e3e3e')
          .margin("2%")
          .height("6%")
          .borderStyle(BorderStyle.Solid)
          .borderWidth(1)
          .borderColor('#ff515151')
        TextArea({placeholder: $r("app.string.content_input_tip"), text: this.m_content})
          .onChange((v: string) => {
            this.m_content = v;
          })
          .fontColor(Color.Black)
          .placeholderColor('#ff3e3e3e')
          .height("80%")
          .borderStyle(BorderStyle.Solid)
          .borderWidth(1)
          .borderColor('#ff515151')
          .width('95%')
      }
      .backgroundColor(this.eyeMode === true ? '#FAF9DE' : "#F1F3F5")
      .width("100%")
      .height("100%")

    }
    .hideTitleBar(true)

  }

}