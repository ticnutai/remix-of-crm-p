@echo off
setlocal

set "PROJECT_ROOT=%~dp0.."
set "APK_PATH=%PROJECT_ROOT%\app\build\outputs\apk\debug\app-debug.apk"
set "ADB_PATH=adb"

where adb >nul 2>nul
if errorlevel 1 (
  if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
  ) else (
    echo adb was not found. Install Android platform-tools or add adb to PATH.
    exit /b 1
  )
)

if not exist "%APK_PATH%" (
  call "%~dp0build-debug.bat"
  if errorlevel 1 exit /b %ERRORLEVEL%
)

"%ADB_PATH%" install -r "%APK_PATH%"
if errorlevel 1 exit /b %ERRORLEVEL%

"%ADB_PATH%" shell dpm set-device-owner "com.ncrm.deviceowner/.DeviceOwnerReceiver"
if errorlevel 1 exit /b %ERRORLEVEL%

"%ADB_PATH%" shell am start -n "com.ncrm.deviceowner/.MainActivity"
