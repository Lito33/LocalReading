import fs from "@ohos:file.fs";
import hash from "@ohos:file.hash";
import util from "@ohos:util";
import { BookParserInfo, LocalBookImportResult } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookParserInfo";
import { BookUtils } from "@bundle:com.example.readerkitdemo/entry/ets/utils/BookUtils";
import { FileUtils } from "@bundle:com.example.readerkitdemo/entry/ets/utils/FileUtils";
import hilog from "@ohos:hilog";
const TAG = "LocalBookImporter";
// 用于文件哈希的算法
const LOCAL_FILE_HASH_ALGORITHM = 'sha256';
// 导入文件的最大大小为300 MB
const IMPORT_FILE_SIZE_THRESHOLD = 300 * 1024 * 1024;
const LOCAL_BOOK_PREFIX: string = 'import_';
// 重复导入错误码
export const LOCAL_BOOK_IMPORT_DUPLICATE = 100;
export class LocalBookImporter {
    /**
     * 将指定路径的本地书籍文件导入到应用的工作缓存目录中
     * @param filePath 源文件路径
     * @param workPath 工作目录
     * @param existingBooks 已导入的书籍列表，用于重复检测
     * @returns BookParserInfo 对象
     */
    public async importLocalBookToCache(filePath: string, workPath: string, existingBooks?: BookParserInfo[]): Promise<BookParserInfo> {
        hilog.info(0x0000, TAG, "importLocalBookToCache start", filePath);
        hilog.info(0x0000, TAG, `importLocalBookToCache: workPath=${workPath}`);
        try {
            // workPath 已经是完整的导入目录路径，不需要再次调用 getBookFileLocalBookPath
            let importPath = workPath;
            if (!fs.accessSync(importPath)) {
                //创建目录
                fs.mkdirSync(importPath);
            }
            hilog.info(0x0000, TAG, `importLocalBookToCache: importPath=${importPath}`);
            await this.checkFileValid(filePath);
            // 注意：重复检测改为在文件复制后进行，因为 hash.hash 不支持 URI
            // 如果需要提前检测重复，可以跳过此步骤，在复制后检测
            //文件缓存处理
            let bookParserInfo = await this.getLocalBookBasicParserInfo(filePath);
            bookParserInfo = await this.handleLocalBookFileCache(filePath, workPath, bookParserInfo, existingBooks);
            return Promise.resolve(bookParserInfo);
        }
        catch (error) {
            hilog.info(0x0000, TAG, `importLocalBookToCache failed, Code: ${error.code}, message: ${error.message}`);
            return Promise.reject(error);
        }
    }
    private async checkFileValid(filePath: string): Promise<LocalBookImportResult> {
        if (!filePath || filePath.length === 0) {
            hilog.error(0x0000, TAG, "checkFileValid LOCAL_BOOK_IMPORT_FILE_NOT_EXIST : ", filePath);
            return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_NOT_EXIST);
        }
        let fileFd = -1;
        try {
            // 使用 openSync 打开文件（支持 URI）
            let file = fs.openSync(filePath, fs.OpenMode.READ_ONLY);
            fileFd = file.fd;
            let stat = await fs.stat(file.fd); //异步获取状态信息
            if (0 >= stat.size) { //文件大小
                hilog.error(0x0000, TAG, "checkFileValid LOCAL_BOOK_IMPORT_FILE_EXCEPTION.");
                return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_EXCEPTION);
            }
            else if (IMPORT_FILE_SIZE_THRESHOLD < stat.size) { //超限检查
                hilog.error(0x0000, TAG, "checkFileValid LOCAL_BOOK_IMPORT_FILE_EXCEED_THRESHOLD.", stat.size);
                return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_EXCEED_THRESHOLD);
            }
            else {
                hilog.info(0x0000, TAG, "checkFileValid LOCAL_BOOK_IMPORT_SUCCESS.");
                return Promise.resolve(LocalBookImportResult.LOCAL_BOOK_IMPORT_SUCCESS);
            }
        }
        catch (error) {
            hilog.error(0x0000, TAG, `checkFileValid LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR, Code: ${error.code}, message: ${error.message}`);
            return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR);
        }
        finally {
            if (fileFd !== -1) {
                fs.closeSync(fileFd);
            }
        }
    }
    //本地书籍缓存处理流程
    private async handleLocalBookFileCache(filePath: string, workPath: string, bookParserInfo: BookParserInfo, existingBooks?: BookParserInfo[]): Promise<BookParserInfo> {
        try {
            hilog.info(0x0000, TAG, `handleLocalBookFileCache: workPath=${workPath}, bookId=${bookParserInfo.getBookId()}`);
            let bookFilePath = BookUtils.getBookFileBasePath(workPath, bookParserInfo.getBookId());
            hilog.info(0x0000, TAG, `handleLocalBookFileCache: bookFilePath=${bookFilePath}`);
            if (!fs.accessSync(bookFilePath)) {
                fs.mkdirSync(bookFilePath);
            }
            //构造完整文件路径
            let dstPath = bookFilePath + bookParserInfo.getBookName() + '.' +
                BookUtils.convertSourceTypeToSuffix(bookParserInfo.getBookSourceType()); //将书籍来源类型（如 1TXT，2EPUB）转换为对应的文件扩展名字符串
            hilog.info(0x0000, TAG, `handleLocalBookFileCache: dstPath=${dstPath}`);
            if (!fs.accessSync(dstPath)) {
                // 将图书文件复制到目标目录
                await this.copyBookToCache(filePath, dstPath, bookParserInfo);
                // 计算文件哈希值（复制后的文件）
                let hashCode = await hash.hash(dstPath, LOCAL_FILE_HASH_ALGORITHM);
                // 重复检测：检查哈希值是否已存在
                if (existingBooks && existingBooks.length > 0) {
                    const isDuplicate = existingBooks.some(book => book.getLocalHash() === hashCode);
                    if (isDuplicate) {
                        // 删除刚复制的文件
                        fs.unlinkSync(dstPath);
                        // 删除创建的目录
                        try {
                            fs.rmdirSync(bookFilePath);
                        }
                        catch {
                            // 忽略目录删除失败
                        }
                        hilog.warn(0x0000, TAG, 'Book already imported, duplicate detected by hash:', hashCode);
                        return Promise.reject({ code: LOCAL_BOOK_IMPORT_DUPLICATE, message: '该书籍已存在，请勿重复导入' });
                    }
                }
                bookParserInfo.setLocalHash(hashCode);
            }
            // 无论文件是新复制的还是已存在的，都要设置 filePath
            bookParserInfo.setFilePath(dstPath);
            hilog.info(0x0000, TAG, `handleLocalBookFileCache succeeded, filePath=${dstPath}`);
            return Promise.resolve(bookParserInfo);
        }
        catch (error) {
            hilog.error(0x0000, TAG, `handleLocalBookFileCache err:, Code: ${error.code}, message: ${error.message}`);
            return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR);
        }
    }
    //将指定路径的书籍文件复制到应用的缓存目录
    private async copyBookToCache(filePath: string, dstPath: string, bookParserInfo: BookParserInfo): Promise<void> {
        try {
            await FileUtils.copyFileToCache(filePath, dstPath);
            hilog.info(0x0000, TAG, 'copyBookToCache succeeded. bookId:', bookParserInfo.getBookId());
            return Promise.resolve();
        }
        catch (error) {
            hilog.error(0x0000, TAG, "copyBookToCache LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR : ", error.message, ", error code: ", error.code);
            return Promise.reject();
        }
    }
    //根据本地文件的路径，生成并返回一个包含书籍基本元数据的 BookParserInfo 对象,用于本地书籍导入时的初始化处理。
    private async getLocalBookBasicParserInfo(filePath: string): Promise<BookParserInfo> {
        try {
            let extensionFileName = FileUtils.getExtensionFileName(filePath);
            let bookName = FileUtils.getFileName(filePath);
            let bookType = -1;
            if (!BookUtils.isSupportFromSuffix(extensionFileName)) {
                // 检查是否在支持的扩展中
                hilog.error(0x0000, TAG, "getLocalBookBasicParserInfo LOCAL_BOOK_IMPORT_FILE_NOT_SUPPORT_TYPE : ", extensionFileName);
                return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_NOT_SUPPORT_TYPE);
            }
            else {
                //类型映射
                bookType = BookUtils.convertSuffixToSourceType(extensionFileName);
            }
            let bookId = LOCAL_BOOK_PREFIX + util.generateRandomUUID(true); //结合一个随机UUID生成一个唯一的bookID
            //设置属性
            let bookInfo = new BookParserInfo();
            bookInfo.setBookId(bookId).setBookSourceType(bookType).setBookName(bookName);
            return Promise.resolve(bookInfo);
        }
        catch (error) {
            hilog.error(0x0000, TAG, "getLocalBookBasicParserInfo LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR : ", error.message, ", error code: ", error.code);
            return Promise.reject(LocalBookImportResult.LOCAL_BOOK_IMPORT_FILE_SYSTEM_ERROR);
        }
    }
}
