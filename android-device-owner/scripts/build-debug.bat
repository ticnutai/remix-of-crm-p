@echo off
setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0.."
set "GRADLE_BAT="

if defined JAVA_HOME (
  if not exist "%JAVA_HOME%\bin\java.exe" (
    set "JAVA_HOME="
  )
)

if not defined JAVA_HOME (
  for /f "delims=" %%J in ('where java 2^>nul') do (
    if not defined JAVA_HOME (
      for %%D in ("%%~dpJ..") do set "JAVA_HOME=%%~fD"
    )
  )
)

for /f "delims=" %%G in ('dir /s /b "%USERPROFILE%\.gradle\wrapper\dists\gradle.bat" 2^>nul') do (
  set "GRADLE_BAT=%%G"
)

if "%GRADLE_BAT%"=="" (
  echo Gradle was not found. Install Android Studio or Gradle, then retry.
  exit /b 1
)

pushd "%PROJECT_ROOT%"
call "%GRADLE_BAT%" :app:assembleDebug
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%
