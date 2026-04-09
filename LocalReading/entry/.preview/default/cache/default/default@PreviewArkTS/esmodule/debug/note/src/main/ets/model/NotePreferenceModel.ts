import preferences from "@ohos:data.preferences";
import type NoteData from "../viewmodel/NoteData";
const NOTE_PREFERENCE_NAME = "notes";
let context: Context = getContext(this);
let preference: preferences.Preferences; //定义持久化接口
class NotePreferenceModel {
    async put(noteData: NoteData) {
        preference = await preferences.getPreferences(context, NOTE_PREFERENCE_NAME);
        // TODO : handle when the title is empty
        if (noteData.title != "") {
            await preference.put(noteData.title, JSON.stringify(noteData)); //导入本地
        }
        await preference.flush(); //flush只能异步处理存储的数据写入磁盘，确保当崩溃时可以保存数据
    }
    async getAll() {
        preference = await preferences.getPreferences(context, NOTE_PREFERENCE_NAME); //获取实例
        let tmp_obj = await preference.getAll(); //获取全部数据
        let ret: Array<NoteData> = [];
        Object.values(tmp_obj).forEach((v: string) => {
            try {
                let t: NoteData = JSON.parse(v);
                ret.push(t); //把遍历到的全部push进去
            }
            catch (e) {
                console.log("getAllPreference error:", e);
            }
        });
        return ret; //返回一个NoteData的数组
    }
    async delete(title: string) {
        preference = await preferences.getPreferences(context, NOTE_PREFERENCE_NAME);
        await preference.delete(title); //因为是检测title，所以title删除就消失
        await preference.flush();
    }
    async deleteAll() {
        await preferences.deletePreferences(context, NOTE_PREFERENCE_NAME);
        await preference.flush();
    }
}
export default new NotePreferenceModel();
