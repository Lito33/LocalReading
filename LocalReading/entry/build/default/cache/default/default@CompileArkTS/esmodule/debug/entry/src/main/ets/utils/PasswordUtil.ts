import cryptoFramework from "@ohos:security.cryptoFramework";
import util from "@ohos:util";
/**
 * 密码安全工具类
 * 使用 SHA-256 + Salt 哈希存储密码
 */
export class PasswordUtil {
    /**
     * 生成随机 Salt（16字节，返回十六进制字符串）
     */
    static generateSalt(): string {
        const saltArray = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            saltArray[i] = Math.floor(Math.random() * 256);
        }
        return PasswordUtil.uint8ArrayToHex(saltArray);
    }
    /**
     * 使用 SHA-256 哈希密码（密码 + Salt）
     */
    static hashPassword(password: string, salt: string): string {
        try {
            //创建 SHA-256 摘要算法
            const md = cryptoFramework.createMd('SHA256');
            //将密码和 Salt 组合
            const combined = password + salt;
            //使用 util.TextEncoder 将字符串转换为 Uint8Array
            const encoder = new util.TextEncoder();
            const inputData = encoder.encodeInto(combined);
            //创建数据Blob并更新
            const dataBlob: cryptoFramework.DataBlob = {
                data: inputData
            };
            md.updateSync(dataBlob);
            //计算摘要（同步）
            const result = md.digestSync();
            //转换为十六进制字符串
            return PasswordUtil.uint8ArrayToHex(result.data);
        }
        catch (err) {
            const errorMsg = `hashPassword failed: ${JSON.stringify(err)}`;
            console.error('PasswordUtil:', errorMsg);
            throw new Error(errorMsg);
        }
    }
    /**
     * 验证密码
     * @param inputPassword 用户输入的密码
     * @param storedHash 存储的哈希值
     * @param salt 存储的盐值
     */
    static verifyPassword(inputPassword: string, storedHash: string, salt: string): boolean {
        const inputHash = PasswordUtil.hashPassword(inputPassword, salt);
        return inputHash === storedHash;
    }
    /**
     * Uint8Array 转十六进制字符串
     */
    private static uint8ArrayToHex(arr: Uint8Array): string {
        const hexChars: string[] = [];
        for (let i = 0; i < arr.length; i++) {
            const hex = arr[i].toString(16).padStart(2, '0');
            hexChars.push(hex);
        }
        return hexChars.join('');
    }
}
/**
 * 存储的用户凭证结构
 * 格式: { "账号": { hash: "哈希值", salt: "盐值" } }
 */
export interface StoredUserCredential {
    hash: string; // SHA-256 哈希后的密码
    salt: string; // 随机盐值
}
