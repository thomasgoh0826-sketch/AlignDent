param([Parameter(Mandatory = $true)][string]$InstallerPath)
$ErrorActionPreference = 'Stop'
$resolvedInstaller = (Resolve-Path -LiteralPath $InstallerPath).Path
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('AlignDent-Smoke-' + [guid]::NewGuid().ToString('N'))
$resolvedTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$resolvedTarget = [System.IO.Path]::GetFullPath($testRoot)
if (-not $resolvedTarget.StartsWith($resolvedTemp, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe test install path' }
New-Item -ItemType Directory -Path $resolvedTarget | Out-Null
Start-Process -FilePath $resolvedInstaller -ArgumentList '/S',('/D=' + $resolvedTarget) -Wait -WindowStyle Hidden
$executable = Join-Path $resolvedTarget 'AlignDent.exe'
if (-not (Test-Path -LiteralPath $executable)) { throw 'Installed executable was not found' }
$process = Start-Process -FilePath $executable -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 4
if ($process.HasExited) { throw 'Installed app exited unexpectedly' }
$process.CloseMainWindow() | Out-Null
if (-not $process.WaitForExit(5000)) { $process.Kill(); $process.WaitForExit() }
$uninstaller = Join-Path $resolvedTarget 'Uninstall AlignDent.exe'
if (Test-Path -LiteralPath $uninstaller) { Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -WindowStyle Hidden }
if (Test-Path -LiteralPath $resolvedTarget) { throw 'Test installation directory remains after uninstall' }
Write-Output 'Installed-app smoke test passed.'
