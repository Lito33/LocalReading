import preferences from "@ohos:data.preferences";
import type common from "@ohos:app.ability.common";
const STORE_NAME = 'reader_preferences';
const SETTINGS_KEY = 'reader_settings';
//持久化的阅读设置接口
export interface PersistedReaderSettings {
    fontPath: string;
    fontSize: number;
    lineHeight: number;
    nightMode: boolean;
    themeColor: string;
    themeBgImg: string;
    flipMode: string;
    themeSelectIndex: number; //当前选中的主题索引
    fontColor: string; // 字体颜色
    // TTS朗读设置
    ttsVolume: number; // 音量 (0-2)
    ttsPitch: number; // 音调 (0.5-2.0)
    ttsSpeed: number; // 语速 (0.5-2.0)
}
export class SettingStorage {
    //保存阅读设置到 Preferences;  settings:要保存的设置对象
    static async saveSettings(context: common.UIAbilityContext, settings: PersistedReaderSettings): Promise<void> {
        try {
            const pref = await preferences.getPreferences(context, STORE_NAME);
            await pref.put(SETTINGS_KEY, JSON.stringify(settings));
            await pref.flush();
        }
        catch (error) {
            console.error('SettingStorage saveSettings failed:', error);
        }
    }
    //加载阅读设置
    static async loadSettings(context: common.UIAbilityContext): Promise<PersistedReaderSettings | null> {
        try {
            const pref = await preferences.getPreferences(context, STORE_NAME);
            const json = await pref.get(SETTINGS_KEY, '');
            if (!json)
                return null;
            return JSON.parse(json as string) as PersistedReaderSettings;
        }
        catch (error) {
            console.error('SettingStorage loadSettings failed:', error);
            return null;
        }
    }
}
