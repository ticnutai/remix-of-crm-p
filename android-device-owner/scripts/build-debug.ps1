$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$GradleBat = Get-ChildItem "$env:USERPROFILE\.gradle\wrapper\dists" -Recurse -Filter gradle.bat |
  Sort-Object FullName -Descending |
  Select-Object -First 1

if (-not $GradleBat) {
  throw "Gradle was not found. Install Android Studio or Gradle, then retry."
}

Push-Location $ProjectRoot
try {
  & $GradleBat.FullName ":app:assembleDebug"
} finally {
  Pop-Location
}
