$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$firefoxManifest = Get-Content -Raw (Join-Path $projectRoot "manifest.firefox.json") | ConvertFrom-Json
$outputDirectory = Join-Path $projectRoot "dist"
$packageName = "guardian-monitor-firefox-$($firefoxManifest.version).zip"
$packagePath = Join-Path $outputDirectory $packageName
$stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("guardian-monitor-firefox-" + [guid]::NewGuid().ToString("N"))

$packageFiles = @(
  "background.js",
  "brand.css",
  "content.js",
  "dark.css",
  "dashboard-detail.css",
  "dashboard.html",
  "dashboard.js",
  "popup.html",
  "popup.js",
  "risk-engine.js",
  "style.css"
)

try {
  New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

  foreach ($relativePath in $packageFiles) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $relativePath) -Destination $stagingDirectory
  }

  Copy-Item -LiteralPath (Join-Path $projectRoot "icons") -Destination $stagingDirectory -Recurse
  Copy-Item -LiteralPath (Join-Path $projectRoot "manifest.firefox.json") -Destination (Join-Path $stagingDirectory "manifest.json")

  Compress-Archive -Path (Join-Path $stagingDirectory "*") -DestinationPath $packagePath -Force
  Write-Host "Pacote Firefox criado em: $packagePath"
}
finally {
  if (Test-Path -LiteralPath $stagingDirectory) {
    Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
  }
}
