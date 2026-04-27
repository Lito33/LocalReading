import NoteData from "../viewmodel/NoteData"
import NoteItemEdit from "../view/NoteItemEdit"
import NotePreferenceModel from "../model/NotePreferenceModel"

@Component
export struct Notes {
  @Provide("Notes") notes: Array<NoteData> = [ //定义notes数组
    {title: "1", content: "this is for test 1", createdAt: (new Date()).toString() ,updatedAt: (new Date()).toString()},
    {title: "2", content: "this is for test 2", createdAt: (new Date()).toString() ,updatedAt: (new Date()).toString()}
  ]
  @Provide("Note") note: NoteData = new NoteData();//定义note对象
  @Provide("NotesPageStack") notesPageStack: NavPathStack = new NavPathStack();
  @State deleteMode: boolean = false; //删除
  // set 是一个集合，先进先出，不会插入重复数据，数据支持类型的多样性
  @State toDeleteNotesTitles: Set<string> = new Set();
  @StorageLink('globalBgColor') bgColor: string = '#FFFFFF';
  @StorageLink('eyeMode') eyeMode: boolean = false;

  //窗口调整
  @StorageLink('windowWidth') windowWidth: number = 0;

  getColumns(): number {
    if (this.windowWidth < 600) {
      return 1;
    } else if (this.windowWidth < 840) {
      return 2;
    } else {
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
    this.notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  build() {
    Navigation(this.notesPageStack) {
      Column() {
        //标题部分
        Row() {
          this.TitleBar($r("app.string.note_page_title"))
          Text(this.deleteMode ? $r("app.string.cancel"): $r("app.string.manage"))
            .position({x: "80%", y: "40%"})
            .fontSize("20fp")
            .fontColor(this.bgColor == "#333333"?"#ff5995ee" :Color.Blue )
            .onClick(() => {
              this.toDeleteNotesTitles.clear();
              this.deleteMode = !this.deleteMode;
            })
        }
        .width("80%")
        .height("10%")
        .margin({top:20})

        //内容区
        Row() {
          Grid() {//网格布局
            ForEach(this.notes, (item: NoteData) => {
              GridItem() {
                this.NoteItem(item)
              }.margin(10)
            })
          }
          .columnsTemplate("1fr 1fr")
        }
        .height("80%")
        .width("90%")

        //底部
        Row() {
          Button(!this.deleteMode ? $r("app.string.add") : $r("app.string.delete"))
            .width(this.windowWidth > 600 ? "40%" : "60%")
            .height("60%")
            .margin({bottom:13})
            .backgroundColor(Color.White)
            .fontColor(this.deleteMode ? Color.Red : "#007DFF")
            .backgroundColor("#0D182431")
            .onClick(async () => {//对信息进行异步处理
              if (!this.deleteMode) { //如果是add
                this.note = {title: "", content: "", createdAt: (new Date()).toString(), updatedAt: (new Date()).toString()};
                this.notesPageStack.replacePath({name: "NotesPageStack"});
              } else {

                for (let title of this.toDeleteNotesTitles) {//遍历删除数组中所有的数据
                  console.log(title);
                  //重新加载
                  NotePreferenceModel.delete(title);
                  this.notes = await NotePreferenceModel.getAll();
                  //对剩余的卡片进行排序
                  this.notes.sort((a, b) => (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime())
                }
                //自动取反
                this.deleteMode = !this.deleteMode;

              }
            })
        }
        .margin({bottom:15})
        .justifyContent(FlexAlign.Center)
        .height("10%")
        .width("100%")
      }
      .backgroundColor(this.eyeMode ? '#FAF9DE' : "#F1F3F5")
      .height("100%")

    }
    .hideTitleBar(true)
    .navDestination(this.PageMap)//配置子页面
    .mode(NavigationMode.Stack)
  }

  //单独做的标题样式
  @Builder
  TitleBar(title: Resource) {
    Text(title)
      .fontSize("28fp")
      .fontWeight(FontWeight.Bold)
      .fontColor(Color.Black)
      .textAlign(TextAlign.Start)
      .width("100%")
      .height("100%")

  }
  //展示item和控制添加和删除
  @Builder
  NoteItem(noteData: NoteData) {
    Column() {
      Row() {
        Text(noteData.title)
          .fontColor("#ff545454")
          .fontSize("18fp")
          .fontWeight(FontWeight.Bold)
          .textAlign(TextAlign.Start)
          .layoutWeight(1) // 占据剩余空间，将复选框推到右侧
          .textOverflow({overflow : TextOverflow.Ellipsis})
          .maxLines(1)

        if (this.deleteMode) {//选中就改变样式
          Checkbox()
            //.position({x: "80%", y: "10%"})
            .onChange((v: boolean) => {//判断是否选中
              if (v) {//初始是false
                this.toDeleteNotesTitles.add(noteData.title);
              } else {
                this.toDeleteNotesTitles.delete(noteData.title);
              }
            })
        }

      }
      .width("100%")
      .justifyContent(FlexAlign.SpaceBetween)

      Row() {
        //也可以用自带的textoverflow.Ellipsis，但是不好控制,用substring()返回0-20索引之间的字符串
        Text(noteData.content.length > 20 ? noteData.content.substring(0, 20) + "..." : noteData.content)
          .fontSize("15fp")
          .fontWeight(FontWeight.Normal)
          .textAlign(TextAlign.Start)
          .fontColor(Color.Black)//this.getTextColor()

      }.width("100%")
      .height("60%")
    }
    .backgroundColor(Color.White)
    .height(80)
    .borderRadius("5%")
    .padding("5%")
    .onClick(() => {
      this.note = noteData;
      //使用pushPath跳转到NoteItemEdit页面
      this.notesPageStack.pushPath({name: "NoteItemEdit"});
    })
  }

  @Builder
  PageMap() {//子页面参数
    NoteItemEdit({note: this.note})
  }
  // private getTextColor(): Color {
  //   return this.bgColor === '#333333' ? Color.White : Color.Black;
  // }
}
