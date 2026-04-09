import preferences from "@ohos:data.preferences";
import type common from "@ohos:app.ability.common";
const STORE_NAME = 'reader_preferences';
const SETTINGS_KEY = 'reader_settings';
//持久化的阅读设置接口
export interface PersistedReaderSettings {
    fontPath: string;
    fontSize: number;
    lineHeight: number;
    nightMode: boolean; //万一呢
    themeColor: string;
    themeBgImg: string;
    flipMode: string;
    themeSelectIndex: number; //当前选中的主题索引
    fontColor: string; // 字体颜色
    // TTS朗读设置
    ttsVolume: number; // 音量 (0-2)
    ttsPitch: number; // 音调 (0.5-2.0)
    ttsSpeed: number; // 语速 (0.5-2.0)
    // 单手模式设置
    singleHandMode: boolean; // 单手模式：点击屏幕左右两侧都翻到下一页
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
    //默认设置
    private static getDefaultSettings(): PersistedReaderSettings {
        return {
            fontPath: '',
            fontSize: 18,
            lineHeight: 1.9,
            nightMode: false,
            themeColor: 'rgba(248, 249, 250, 1)',
            themeBgImg: '',
            flipMode: '0',
            themeSelectIndex: 0,
            fontColor: '',
            ttsVolume: 1.0,
            ttsPitch: 1.0,
            ttsSpeed: 1.0,
            singleHandMode: false
        };
    }
    //合并设置，用默认值填充缺失字段
    private static mergeWithDefaults(loaded: Record<string, Object>): PersistedReaderSettings {
        const defaults = SettingStorage.getDefaultSettings();
        return {
            fontPath: loaded['fontPath'] as string ?? defaults.fontPath,
            fontSize: loaded['fontSize'] as number ?? defaults.fontSize,
            lineHeight: loaded['lineHeight'] as number ?? defaults.lineHeight,
            nightMode: loaded['nightMode'] as boolean ?? defaults.nightMode,
            themeColor: loaded['themeColor'] as string ?? defaults.themeColor,
            themeBgImg: loaded['themeBgImg'] as string ?? defaults.themeBgImg,
            flipMode: loaded['flipMode'] as string ?? defaults.flipMode,
            themeSelectIndex: loaded['themeSelectIndex'] as number ?? defaults.themeSelectIndex,
            fontColor: loaded['fontColor'] as string ?? defaults.fontColor,
            ttsVolume: loaded['ttsVolume'] as number ?? defaults.ttsVolume,
            ttsPitch: loaded['ttsPitch'] as number ?? defaults.ttsPitch,
            ttsSpeed: loaded['ttsSpeed'] as number ?? defaults.ttsSpeed,
            singleHandMode: loaded['singleHandMode'] as boolean ?? defaults.singleHandMode
        };
    }
    //加载阅读设置
    static async loadSettings(context: common.UIAbilityContext): Promise<PersistedReaderSettings | null> {
        try {
            const pref = await preferences.getPreferences(context, STORE_NAME);
            const json = await pref.get(SETTINGS_KEY, '');
            if (!json)
                return null;
            const loaded = JSON.parse(json as string) as Record<string, Object>;
            // 合并默认值，确保所有字段都存在（兼容旧版本数据）
            return SettingStorage.mergeWithDefaults(loaded);
        }
        catch (error) {
            console.error('SettingStorage loadSettings failed:', error);
            return null;
        }
    }
}
