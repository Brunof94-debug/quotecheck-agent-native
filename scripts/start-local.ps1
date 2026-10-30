$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$quoteNode=Join-Path (Get-Location) '.runtime/node/node-v22.23.4-win-x64/node.exe'
if(-not(Test-Path -LiteralPath $quoteNode)) { $quoteNode=(Get-Command node).Source }
$quoteModel=Join-Path (Get-Location) '.runtime/Qwen3-4B-Instruct-2507-Q4_K_M.gguf'
$quoteServer=Join-Path (Get-Location) '.runtime/llama/llama-server.exe'
$quoteAppPath=Join-Path (Get-Location) 'server.mjs'
if(-not(Test-Path -LiteralPath $quoteModel) -or -not(Test-Path -LiteralPath $quoteServer)){throw 'Run node scripts/setup-model.mjs first.'}
$quoteExisting=Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $quoteServer -or ($_.ExecutablePath -eq $quoteNode -and $_.CommandLine -match 'server\.mjs') -or ($_.Name -eq 'node.exe' -and $_.CommandLine.Contains($quoteAppPath)) }
if($quoteExisting){throw 'QuoteCheck is already starting or running. Use stop-local.ps1 before starting another session.'}
foreach($quotePort in @(4364,4365)){if(Get-NetTCPConnection -LocalPort $quotePort -State Listen -ErrorAction SilentlyContinue){throw "Port $quotePort is already in use. Close the existing QuoteCheck session first."}}
$quoteThreads=[Math]::Min(8,[Environment]::ProcessorCount)
$quoteLlama=Start-Process -FilePath $quoteServer -ArgumentList @('-m',('"' + $quoteModel + '"'),'--host','127.0.0.1','--port','4365','-c','4096','-t',"$quoteThreads",'-np','1','--alias','quotecheck-local') -WindowStyle Hidden -PassThru -RedirectStandardOutput '.runtime/model.stdout.log' -RedirectStandardError '.runtime/model.stderr.log'
$quoteApp=Start-Process -FilePath $quoteNode -ArgumentList ('"'+$quoteAppPath+'"') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -PassThru -RedirectStandardOutput '.runtime/app.stdout.log' -RedirectStandardError '.runtime/app.stderr.log'
@{appPid=$quoteApp.Id;modelPid=$quoteLlama.Id;appUrl='http://127.0.0.1:4364';started=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath '.runtime/processes.json'
$quoteReady=$false
$quoteUntil=(Get-Date).AddSeconds(45)
while((Get-Date) -lt $quoteUntil){
  try{
    $quoteAppHealth=Invoke-RestMethod 'http://127.0.0.1:4364/api/health' -TimeoutSec 2
    $quoteModelHealth=Invoke-RestMethod 'http://127.0.0.1:4365/health' -TimeoutSec 2
    if($quoteAppHealth.ok -and $quoteModelHealth.status -eq 'ok'){$quoteReady=$true;break}
  }catch{}
  Start-Sleep -Milliseconds 500
}
if(-not $quoteReady){throw 'QuoteCheck did not become ready. Check .runtime/app.stderr.log and .runtime/model.stderr.log.'}
Write-Output 'QuoteCheck is ready at http://127.0.0.1:4364'
Write-Output 'Use scripts/stop-local.ps1 to close only these two processes.'
