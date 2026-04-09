import preferences from "@ohos:data.preferences";
import type common from "@ohos:app.ability.common";
const STORE_NAME = 'eye_mode_store';
const KEY = 'eyeMode';
export class EyeModeStorage {
    static async saveEyeMode(context: common.UIAbilityContext, value: boolean): Promise<void> {
        try {
            const pref = await preferences.getPreferences(context, STORE_NAME);
            await pref.put(KEY, value);
            await pref.flush();
        }
        catch (error) {
            console.error('EyeModeStorage save failed:', error);
        }
    }
    static async loadEyeMode(context: common.UIAbilityContext): Promise<boolean> {
        try {
            const pref = await preferences.getPreferences(context, STORE_NAME);
            const value = await pref.get(KEY, false); // 默认 false
            return value as boolean;
        }
        catch (error) {
            console.error('EyeModeStorage load failed:', error);
            return false;
        }
    }
}
