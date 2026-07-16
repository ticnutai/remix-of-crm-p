$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ApkPath = Join-Path $ProjectRoot "app\build\outputs\apk\debug\app-debug.apk"
$Adb = Get-Command adb -ErrorAction SilentlyContinue

if (-not $Adb) {
  $DefaultAdb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if (Test-Path $DefaultAdb) {
    $AdbPath = $DefaultAdb
  } else {
    throw "adb was not found. Install Android platform-tools or add adb to PATH."
  }
} else {
  $AdbPath = $Adb.Source
}

if (-not (Test-Path $ApkPath)) {
  & (Join-Path $PSScriptRoot "build-debug.ps1")
}

& $AdbPath install -r $ApkPath
& $AdbPath shell dpm set-device-owner "com.ncrm.deviceowner/.DeviceOwnerReceiver"
& $AdbPath shell am start -n "com.ncrm.deviceowner/.MainActivity"
