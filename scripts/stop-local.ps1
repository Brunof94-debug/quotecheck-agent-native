$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$quoteState=Join-Path (Get-Location) '.runtime/processes.json'
$quoteNode=Join-Path (Get-Location) '.runtime/node/node-v22.23.4-win-x64/node.exe'
$quoteServer=Join-Path (Get-Location) '.runtime/llama/llama-server.exe'
$quoteAppPath=Join-Path (Get-Location) 'server.mjs'
$quoteOwned=Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $quoteServer -or ($_.ExecutablePath -eq $quoteNode -and $_.CommandLine -match 'server\.mjs') -or ($_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.Contains($quoteAppPath)) }
foreach($quoteProcess in $quoteOwned){
  Stop-Process -Id $quoteProcess.ProcessId -Force -ErrorAction SilentlyContinue
}
if(Test-Path -LiteralPath $quoteState){Remove-Item -LiteralPath $quoteState}
Write-Output 'Recorded QuoteCheck session stopped.'
