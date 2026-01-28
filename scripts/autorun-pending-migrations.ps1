param(
  [int]$Port = 8081
)

$Url = "http://localhost:$Port/settings?tab=developer&autorun=pending"
Write-Host "Opening: $Url"
Start-Process $Url
