//字体信息
export class FontFileInfo {
    private alias: string;
    private path: string;
    public constructor(alias: string, path: string) {
        this.alias = alias;
        this.path = path;
    }
    public setAlias(value: string) {
        this.alias = value;
    }
    public getAlias(): string {
        return this.alias;
    }
    public setPath(value: string) {
        this.path = value;
    }
    public getPath(): string {
        return this.path;
    }
}
