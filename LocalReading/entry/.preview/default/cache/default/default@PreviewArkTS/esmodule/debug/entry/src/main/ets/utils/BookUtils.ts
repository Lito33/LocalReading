//书籍工具类
enum BOOK_FILE_TYPE {
    UNKNOWN = -1,
    TXT = 1,
    EPUB = 2,
    MOBI = 3,
    AZW = 4,
    AZW3 = 5
}
const EXTENSION_FILE_TXT = 'txt';
const EXTENSION_FILE_EPUB = 'epub';
const EXTENSION_FILE_MOBI = 'mobi';
const EXTENSION_FILE_AZW = 'azw';
const EXTENSION_FILE_AZW3 = 'azw3';
const SUPPORT_EXTENSION_FILE = [EXTENSION_FILE_TXT, EXTENSION_FILE_EPUB, EXTENSION_FILE_MOBI, EXTENSION_FILE_AZW, EXTENSION_FILE_AZW3];
const SUPPORT_BOOK_FILE_TYPES = [BOOK_FILE_TYPE.TXT, BOOK_FILE_TYPE.EPUB, BOOK_FILE_TYPE.MOBI, BOOK_FILE_TYPE.AZW, BOOK_FILE_TYPE.AZW3];
export class BookUtils {
    //根据后缀转换书籍类型
    //对应两种不同的上传方式
    public static convertSuffixToSourceType(suffixName: string): number {
        switch (suffixName) {
            case EXTENSION_FILE_TXT:
                return BOOK_FILE_TYPE.TXT;
            case EXTENSION_FILE_EPUB:
                return BOOK_FILE_TYPE.EPUB;
            case EXTENSION_FILE_MOBI:
                return BOOK_FILE_TYPE.MOBI;
            case EXTENSION_FILE_AZW:
                return BOOK_FILE_TYPE.AZW;
            case EXTENSION_FILE_AZW3:
                return BOOK_FILE_TYPE.AZW3;
            default:
                return BOOK_FILE_TYPE.UNKNOWN;
        }
    }
    //根据图书类型转换图书文件的后缀
    public static convertSourceTypeToSuffix(sourceType: number): string {
        switch (sourceType) {
            case BOOK_FILE_TYPE.TXT:
                return EXTENSION_FILE_TXT;
            case BOOK_FILE_TYPE.EPUB:
                return EXTENSION_FILE_EPUB;
            case BOOK_FILE_TYPE.MOBI:
                return EXTENSION_FILE_MOBI;
            case BOOK_FILE_TYPE.AZW:
                return EXTENSION_FILE_AZW;
            case BOOK_FILE_TYPE.AZW3:
                return EXTENSION_FILE_AZW3;
            default:
                return "";
        }
    }
    //构建书籍文件存储路径
    public static getBookFileBasePath(workPath: string, bookId: string): string {
        // 移除末尾斜杠，统一处理
        let basePath = workPath;
        if (basePath.endsWith('/')) {
            basePath = basePath.slice(0, -1);
        }
        return `${basePath}/${bookId}/`;
    }
    //根据传入路径生成该路径下import子目录的完整字符路径
    public static getBookFileLocalBookPath(workPath: string): string {
        // 移除末尾斜杠，统一处理
        let basePath = workPath;
        if (basePath.endsWith('/')) {
            basePath = basePath.slice(0, -1);
        }
        return `${basePath}/import/`;
    }
    //判断传入的文件后缀名是否在应用支持的扩展名列表，includes（）是否包含指定元素
    public static isSupportFromSuffix(suffixName: string): boolean {
        return SUPPORT_EXTENSION_FILE.includes(suffixName);
    }
    public static isSupportFromType(bookFileType: number): boolean {
        return SUPPORT_BOOK_FILE_TYPES.includes(bookFileType);
    }
    public static getString(context: Context | undefined, name: string): string {
        try {
            return context?.resourceManager.getStringByNameSync(name) || '';
        }
        catch (error) {
            console.error(`getStringSync failed, error code: ${error.code}, message: ${error.message}.`);
        }
        return '';
    }
}
