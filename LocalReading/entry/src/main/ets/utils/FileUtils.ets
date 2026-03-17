//文件操作工具类

import { fileIo as fs } from '@kit.CoreFileKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { image } from '@kit.ImageKit';

const TAG = 'FileUtils';

export class FileUtils {

  //获取后缀名
  public static getExtensionFileName(filePath: string): string {

    if (!filePath || filePath.length === 0) {
      hilog.error(0x0000, TAG, "getExtensionFileName filePath is blank");
      return '';
    }

    let fn = FileUtils.getFileFullName(filePath);
    //将文件名通过.分隔开进入数组
    let fileNameSplit = fn.split(".");
    if (fileNameSplit.length > 1) {
      //获取最后的字符，.txt
      return fileNameSplit[fileNameSplit.length - 1].toLowerCase();//变为小写
    } else {
      return "";
    }
  }

  //获取文件名
  public static getFileName(filePath: string): string {
    if (!filePath || filePath.length === 0) {
      hilog.error(0x0000, TAG, "getFileName filePath is blank");
      return '';
    }
    let fn = FileUtils.getFileFullName(filePath);
    let fileNameSplit = fn.split(".");
    if (fileNameSplit.length > 0) {
      return fileNameSplit[0];
    } else {
      return "";
    }
  }

  //获取路径中的文件全名:123.txt
  private static getFileFullName(filePath: string): string {

    if (!filePath || filePath.length === 0) {
      hilog.error(0x0000, TAG, "getFileFullName filePath is blank");
      return '';
    }
    //定义一个全局匹配的正则表达式，用于匹配一个或多个连续的正斜杠 /
    let reg = /(\/+)/g;
    //将路径中所有连续出现的斜杠序列替换为一个单独的 # 字符。
    // 这样做的目的是将多个连续斜杠压缩为一个分隔符，避免后续分割时产生空字符串元素。
    filePath = filePath.replace(reg, "#");
    //拆分成数组
    let filePathArray = filePath.split("#");
    //返回数组的最后一个元素，即原始路径中最后一个斜杠之后的部分（文件名）
    if (filePathArray.length > 0) {
      return filePathArray[filePathArray.length - 1];
    } else {
      return '';
    }
  }

//将指定路径的文件安全地复制到目标路径
  // srcPath 支持普通路径和 URI 格式
  public static async copyFileToCache(srcPath: string, dstPath: string): Promise<void> {
    if (!srcPath || srcPath.length === 0 || !dstPath || dstPath.length === 0) {
      hilog.error(0x0000, TAG, "copyFileToCache srcPath or dstPath is blank");
      return Promise.reject();
    }
    let fileId = -1;
    try {
      // 直接使用 openSync 打开源文件（支持 URI）
      let file = fs.openSync(srcPath, fs.OpenMode.READ_ONLY);
      fileId = file.fd;

      await fs.copyFile(fileId, dstPath, 0);//0：覆盖写入
      hilog.info(0x0000, TAG, "copyFileToCache succeeded");
      return Promise.resolve();
    } catch (error) {
      hilog.error(0x0000, TAG,
        `copyFileToCache failed, Code: ${error.code}, message: ${error.message}`);
      return Promise.reject();
    } finally {
      if (fileId !== -1) {
        fs.close(fileId).catch(() => {
          hilog.error(0x0000, TAG, "copyFileToCache close file failed");
        });
      }
    }
  }

  /**
   * 将 PixelMap 保存为图片文件
   * @param pixelMap 要保存的 PixelMap
   * @param dir 目标目录
   * @param fileName 文件名（不含扩展名）
   * @returns 保存后的完整文件路径
   */
  static async savePixelMapToFile(pixelMap: image.PixelMap, dir: string, fileName: string): Promise<string> {
    const imagePacker = image.createImagePacker();
    const packOpts: image.PackingOption = { format: "image/jpeg", quality: 80 };
    const arrayBuffer = await imagePacker.packing(pixelMap, packOpts);
    const filePath = dir + fileName + '.jpg';
    let file = fs.openSync(filePath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    fs.writeSync(file.fd, arrayBuffer);
    fs.closeSync(file);
    return filePath;
  }

}