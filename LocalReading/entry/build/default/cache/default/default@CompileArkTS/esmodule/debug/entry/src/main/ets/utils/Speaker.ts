import textToSpeech from "@hms:ai.textToSpeech";
import type { BusinessError } from "@ohos:base";
import hilog from "@ohos:hilog";
const TAG = 'Speaker';
export class Speaker {
    private ttsEngine?: textToSpeech.TextToSpeechEngine;
    private engineReadyPromise: Promise<void>;
    private resolveEngineReady!: () => void;
    private rejectEngineReady!: (reason?: BusinessError) => void;
    private isEngineShutdown: boolean = false; // 引擎是否已关闭
    // 引擎配置参数
    private initParams: textToSpeech.CreateEngineParams = {
        language: 'zh-CN',
        person: 0,
        online: 1,
        extraParams: { "style": 'interaction-broadcast' }
    };
    // 播报参数
    private speakParams: textToSpeech.SpeakParams = {
        requestId: '',
        extraParams: {
            "queueMode": 0,
            "speed": 1,
            "volume": 1,
            "pitch": 1,
            "audioType": "pcm",
            "playType": 1 // 合成并播放
        }
    };
    // 分块大小（字符数）
    private readonly CHUNK_SIZE = 500;
    constructor() {
        this.engineReadyPromise = new Promise((resolve, reject) => {
            this.resolveEngineReady = resolve;
            this.rejectEngineReady = reject;
        });
        this.createEngine();
    }
    private createEngine() {
        // 重置Promise
        this.engineReadyPromise = new Promise((resolve, reject) => {
            this.resolveEngineReady = resolve;
            this.rejectEngineReady = reject;
        });
        try {
            textToSpeech.createEngine(this.initParams, (err: BusinessError, engine: textToSpeech.TextToSpeechEngine) => {
                if (err) {
                    hilog.error(0x0000, TAG, `createEngine failed: ${err.code}, ${err.message}`);
                    this.rejectEngineReady(err);
                    return;
                }
                // 保存引擎实例到成员变量
                this.ttsEngine = engine;
                this.isEngineShutdown = false; // 标记引擎已创建
                this.setListener();
                hilog.info(0x0000, TAG, 'TTS Engine created and listener set.');
                // 解决Promise，表示引擎已就绪！
                this.resolveEngineReady();
            });
        }
        catch (error) {
            hilog.error(0x0000, TAG, `createEngine exception: ${error}`);
            this.rejectEngineReady(error);
        }
    }
    private setListener() {
        if (!this.ttsEngine)
            return;
        const listener: textToSpeech.SpeakListener = {
            onStart: (requestId, response) => {
                hilog.info(0x0000, TAG, `onStart: ${requestId}`);
            },
            onComplete: (requestId, response) => {
                hilog.info(0x0000, TAG, `onComplete: ${requestId}`);
            },
            onStop: (requestId, response) => {
                hilog.info(0x0000, TAG, `onStop: ${requestId}`);
            },
            onError: (requestId, errorCode, errorMessage) => {
                hilog.error(0x0000, TAG, `onError: ${requestId}, code:${errorCode}, msg:${errorMessage}`);
            },
            onData: (requestId, audio, response) => { }
        };
        this.ttsEngine.setListener(listener);
    }
    public async startSpeak(text: string): Promise<void> {
        if (!text) {
            hilog.warn(0x0000, TAG, 'startSpeak called with empty text.');
            return;
        }
        hilog.info(0x0000, TAG, `startSpeak called, text length: ${text.length}`);
        try {
            // 如果引擎已关闭，重新创建
            if (this.isEngineShutdown || !this.ttsEngine) {
                hilog.info(0x0000, TAG, 'Engine was shutdown, recreating...');
                // 等待一小段时间确保之前的引擎完全释放
                await new Promise<void>(resolve => setTimeout(resolve, 200));
                this.createEngine();
            }
            await this.engineReadyPromise;
            if (!this.ttsEngine) {
                throw new Error('TTS Engine is not available.');
            }
            hilog.info(0x0000, TAG, 'Engine ready, starting speak...');
            // 将长文本分块
            const chunks: string[] = [];
            for (let i = 0; i < text.length; i += this.CHUNK_SIZE) {
                chunks.push(text.substring(i, i + this.CHUNK_SIZE));
            }
            hilog.info(0x0000, TAG, `Text split into ${chunks.length} chunks.`);
            // 依次合成每一块（引擎内部会排队）
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const requestId = `speak_${Date.now()}_${Math.random().toString(36).substring(2)}`;
                // 每次使用新的 extraParams 副本，避免相互影响
                const extraParamsCopy: Record<string, Object> = {
                    "queueMode": this.speakParams.extraParams?.queueMode ?? 0,
                    "speed": this.speakParams.extraParams?.speed ?? 1,
                    "volume": this.speakParams.extraParams?.volume ?? 2,
                    "pitch": this.speakParams.extraParams?.pitch ?? 1,
                    "audioType": this.speakParams.extraParams?.audioType ?? "pcm",
                    "playType": this.speakParams.extraParams?.playType ?? 1
                };
                const params: textToSpeech.SpeakParams = {
                    requestId: requestId,
                    extraParams: extraParamsCopy
                };
                this.ttsEngine.speak(chunk, params);
                hilog.info(0x0000, TAG, `Queued chunk ${i + 1}/${chunks.length}, requestId: ${requestId}, length: ${chunk.length}`);
                // 可适当延时，但不是必须的
                await new Promise<void>(resolve => setTimeout(resolve, 10));
            }
            hilog.info(0x0000, TAG, 'All chunks queued successfully.');
        }
        catch (error) {
            const errMsg = `startSpeak failed: ${error}`;
            hilog.error(0x0000, TAG, errMsg);
            throw new Error(errMsg); // 重新抛出错误，让调用者知道
        }
    }
    public stopSpeak() {
        if (this.ttsEngine) {
            this.ttsEngine.stop();
            // stop后引擎状态可能异常，标记需要重建
            this.isEngineShutdown = true;
            this.ttsEngine = undefined;
            hilog.info(0x0000, TAG, 'stopSpeak called, engine marked for recreation.');
        }
    }
    //暂时没有使用
    public shutdown() {
        if (this.ttsEngine) {
            this.ttsEngine.shutdown();
            this.isEngineShutdown = true; // 标记引擎已关闭
            this.ttsEngine = undefined; // 清空引擎引用
            hilog.info(0x0000, TAG, 'shutdown called.');
        }
    }
    // ========== 音量、语速、音调控制方法 ==========
    /**
     * 获取当前音量
     * @returns 当前音量值 (范围: 0-2)
     */
    public getVolume(): number {
        return this.speakParams.extraParams?.volume as number ?? 1;
    }
    /**
     * 设置音量
     * @param volume 音量值 (范围: 0-2)
     */
    public setVolume(volume: number): void {
        if (volume < 0)
            volume = 0;
        if (volume > 2)
            volume = 2;
        if (this.speakParams.extraParams) {
            this.speakParams.extraParams.volume = volume;
            hilog.info(0x0000, TAG, `Volume set to: ${volume}`);
        }
    }
    /**
     * 获取当前语速
     * @returns 当前语速值 (范围: 0.5-2.0)
     */
    public getSpeed(): number {
        return this.speakParams.extraParams?.speed as number ?? 1;
    }
    /**
     * 设置语速
     * @param speed 语速值 (范围: 0.5-2.0，1.0为正常速度)
     */
    public setSpeed(speed: number): void {
        if (speed < 0.5)
            speed = 0.5;
        if (speed > 2.0)
            speed = 2.0;
        if (this.speakParams.extraParams) {
            this.speakParams.extraParams.speed = speed;
            hilog.info(0x0000, TAG, `Speed set to: ${speed}`);
        }
    }
    /**
     * 获取当前音调
     * @returns 当前音调值 (范围: 0.5-2.0)
     */
    public getPitch(): number {
        return this.speakParams.extraParams?.pitch as number ?? 1;
    }
    /**
     * 设置音调
     * @param pitch 音调值 (范围: 0.5-2.0，1.0为正常音调)
     */
    public setPitch(pitch: number): void {
        if (pitch < 0.5)
            pitch = 0.5;
        if (pitch > 2.0)
            pitch = 2.0;
        if (this.speakParams.extraParams) {
            this.speakParams.extraParams.pitch = pitch;
            hilog.info(0x0000, TAG, `Pitch set to: ${pitch}`);
        }
    }
}
