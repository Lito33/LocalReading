$filePath = "D:\devecoStudioDriector\SomeDemo\LocalReading\entry\src\main\ets\pages\Reader.ets"
$content = Get-Content $filePath -Raw

$oldPattern = 'readerCallback: \(err: BusinessError, data: readerCore\.ReaderComponentController\) => \{
            hilog\.info\(0x0000, TAG, `readerCallback: err=\$\{err !== null\}, fontColor=\$\{this\.readerSetting\.fontColor\}`\);
            this\.readerComponentController = data;//使得父组件可以持有并后续使用这个控制器来操作阅读器
            if \(err\) \{
              hilog\.info\(0x0000, TAG, `ReadPageComponent init failed, Code: \$\{err\.code\}, message: \$\{err\.message\}`\);
            \} else \{
              // ReadPageComponent 初始化成功后，重新应用当前配置
              // 这解决了 controller 实例变化导致配置丢失的问题
              hilog\.info\(0x0000, TAG, `readerCallback: re-applying config with fontColor=\$\{this\.readerSetting\.fontColor\}`\);
              try \{
                this\.readerComponentController\.setPageConfig\(this\.readerSetting\);
                hilog\.info\(0x0000, TAG, `readerCallback: setPageConfig success`\);
              \} catch \(e\) \{
                hilog\.error\(0x0000, TAG, `readerCallback setPageConfig failed: \$\{e\}`\);
              \}
            \}
          \}'

$newCode = 'readerCallback: (err: BusinessError, data: readerCore.ReaderComponentController) => {
            hilog.info(0x0000, TAG, `readerCallback: err=${err}, fontColor=${this.readerSetting.fontColor}`);
            this.readerComponentController = data;//使得父组件可以持有并后续使用这个控制器来操作阅读器
            if (err) {
              hilog.info(0x0000, TAG, `ReadPageComponent init failed, Code: ${err.code}, message: ${err.message}`);
            }
            // 注意：不在这里调用 setPageConfig，因为 ReadPageComponent 可能还未完全初始化
            // 配置会在 pageShow 事件中重新应用
          }'

$content = $content -replace $oldPattern, $newCode
Set-Content $filePath $content -NoNewline
Write-Host "Done"
