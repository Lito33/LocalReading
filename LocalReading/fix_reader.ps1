$file = "D:\devecoStudioDriector\SomeDemo\LocalReading\entry\src\main\ets\pages\Reader.ets"
$lines = Get-Content $file

# 找到需要修改的行号
$targetLine = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "readerCallback.*BusinessError.*ReaderComponentController") {
        $targetLine = $i
        break
    }
}

if ($targetLine -ge 0) {
    Write-Host "Found readerCallback at line $targetLine"
    
    # 创建新的代码块
    $newLines = @()
    $newLines += $lines[0..($targetLine)]
    $newLines += "            hilog.info(0x0000, TAG, `"`readerCallback: err=`${err !== null}, fontColor=`${this.readerSetting.fontColor}`");"
    $newLines += $lines[($targetLine+1)]
    $newLines += "            if (err) {"
    $newLines += "              hilog.info(0x0000, TAG, `"`ReadPageComponent init failed, Code: `${err.code}, message: `${err.message}`");"
    $newLines += "            } else {"
    $newLines += "              // ReadPageComponent 初始化成功后，重新应用当前配置"
    $newLines += "              hilog.info(0x0000, TAG, `"`readerCallback: re-applying config with fontColor=`${this.readerSetting.fontColor}`");"
    $newLines += "              try {"
    $newLines += "                this.readerComponentController.setPageConfig(this.readerSetting);"
    $newLines += "                hilog.info(0x0000, TAG, `"`readerCallback: setPageConfig success`");"
    $newLines += "              } catch (e) {"
    $newLines += "                hilog.error(0x0000, TAG, `"`readerCallback setPageConfig failed: `${e}`");"
    $newLines += "              }"
    $newLines += "            }"
    
    # 跳过原来的 3 行 (if err 块)
    $newLines += $lines[($targetLine+5)..($lines.Count-1)]
    
    # 写入文件
    $newLines | Set-Content $file
    Write-Host "File updated successfully"
} else {
    Write-Host "readerCallback not found"
}
