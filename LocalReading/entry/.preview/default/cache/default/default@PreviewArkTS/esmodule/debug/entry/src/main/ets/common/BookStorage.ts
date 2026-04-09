import preferences from "@ohos:data.preferences";
import type common from "@ohos:app.ability.common";
import { BookParserInfo } from "@bundle:com.example.readerkitdemo/entry/ets/common/BookParserInfo";
const BOOKS_KEY = 'imported_books';
interface StoredBookInfo {
    bookId: string;
    bookName: string;
    bookAuthor: string; // 作者
    filePath: string;
    coverPath: string;
    bookSourceType: number;
    localHash: string;
}
export class BookStorage {
    // 根据用户账号获取存储名称
    private static getStoreName(account?: string): string {
        // 只有当 account 是有效的非空字符串时才使用用户专属存储
        return (account && account.length > 0) ? `book_store_${account}` : 'book_store_default';
    }
    static async saveBooks(books: BookParserInfo[], context: common.UIAbilityContext, account?: string): Promise<void> {
        const storeName = BookStorage.getStoreName(account);
        const pref = await preferences.getPreferences(context, storeName);
        // 直接转换传入的书籍列表为存储格式
        const booksToStore = books.map(book => {
            const storedBook: StoredBookInfo = {
                bookId: book.getBookId(),
                bookName: book.getBookName(),
                bookAuthor: book.getBookAuthor() || '',
                filePath: book.getFilePath(),
                coverPath: book.getCoverPath() || '',
                bookSourceType: book.getBookSourceType(),
                localHash: book.getLocalHash()
            };
            return storedBook;
        });
        await pref.put(BOOKS_KEY, JSON.stringify(booksToStore));
        await pref.flush();
    }
    static async loadBooks(context: common.UIAbilityContext, account?: string): Promise<BookParserInfo[]> {
        const storeName = BookStorage.getStoreName(account);
        const pref = await preferences.getPreferences(context, storeName);
        const json = await pref.get(BOOKS_KEY, '[]');
        try {
            const list: StoredBookInfo[] = JSON.parse(json as string);
            return list.map(item => {
                const book = new BookParserInfo();
                book.setBookId(item.bookId)
                    .setBookName(item.bookName)
                    .setBookAuthor(item.bookAuthor || '')
                    .setFilePath(item.filePath)
                    .setCoverPath(item.coverPath || '')
                    .setBookSourceType(item.bookSourceType ?? -1)
                    .setLocalHash(item.localHash ?? '');
                return book;
            });
        }
        catch {
            return [];
        }
    }
    static async removeBook(bookId: string, context: common.UIAbilityContext, account?: string): Promise<void> {
        const storeName = BookStorage.getStoreName(account);
        const pref = await preferences.getPreferences(context, storeName);
        const existingBooks = await BookStorage.loadBooks(context, account);
        const filtered = existingBooks.filter(book => book.getBookId() !== bookId);
        await pref.put(BOOKS_KEY, JSON.stringify(filtered.map(book => {
            const storedBook: StoredBookInfo = {
                bookId: book.getBookId(),
                bookName: book.getBookName(),
                bookAuthor: book.getBookAuthor() || '',
                filePath: book.getFilePath(),
                coverPath: book.getCoverPath() || '',
                bookSourceType: book.getBookSourceType(),
                localHash: book.getLocalHash()
            };
            return storedBook;
        })));
        await pref.flush();
    }
}
