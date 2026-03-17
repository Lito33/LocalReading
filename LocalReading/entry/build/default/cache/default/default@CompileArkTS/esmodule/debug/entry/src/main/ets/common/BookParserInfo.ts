//导入书籍信息
/**
 * Local book import result code
 *
 */
export enum LocalBookImportResult {
    // Local book import successful
    LOCAL_BOOK_IMPORT_SUCCESS = 0,
    // Failed to import local book -- No file in the corresponding directory
    LOCAL_BOOK_IMPORT_FILE_NOT_EXIST = 1,
    // Local book import failed -- file size exceeds the threshold
    LOCAL_BOOK_IMPORT_FILE_EXCEED_THRESHOLD = 2,
    // Local book import failed -- system exception
    LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR = 3,
    // Local book import failed -- Invalid file format
    LOCAL_BOOK_IMPORT_FILE_NOT_SUPPORT_TYPE = 4,
    // Local book import failed -- file size is too small
    LOCAL_BOOK_IMPORT_FILE_EXCEPTION = 5
}
//用于管理书库书籍
export class BookParserInfo {
    private coverPath: string = '';
    private bookLanguage: string = '';
    private bookName: string = '';
    private bookId: string = '';
    private bookSourceType: number = -1;
    private localHash: string = '';
    private filePath: string = '';
    constructor() {
    }
    //设置对象的封面路径属性，并返回当前对象实例
    public setCoverPath(value: string): BookParserInfo {
        this.coverPath = value;
        return this;
    }
    //配套的，返回当前对象中coverPath属性的值
    public getCoverPath(): string {
        return this.coverPath;
    }
    public setFilePath(filePath: string): BookParserInfo {
        this.filePath = filePath;
        return this;
    }
    public setLocalHash(value: string): BookParserInfo {
        this.localHash = value;
        return this;
    }
    public getLocalHash(): string {
        return this.localHash;
    }
    public setBookLanguage(value: string): BookParserInfo {
        this.bookLanguage = value;
        return this;
    }
    public getBookLanguage(): string {
        return this.bookLanguage;
    }
    public setBookName(value: string): BookParserInfo {
        this.bookName = value;
        return this;
    }
    public getBookName(): string {
        return this.bookName;
    }
    public setBookId(value: string): BookParserInfo {
        this.bookId = value;
        return this;
    }
    public getBookId(): string {
        return this.bookId;
    }
    public setBookSourceType(value: number): BookParserInfo {
        this.bookSourceType = value;
        return this;
    }
    public getBookSourceType(): number {
        return this.bookSourceType;
    }
    public getFilePath(): string {
        return this.filePath;
    }
}
