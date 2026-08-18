$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputRoot = Join-Path $projectRoot "dist"
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

function New-BrowserPackage {
  param(
    [Parameter(Mandatory = $true)][string]$Browser,
    [Parameter(Mandatory = $true)][string]$ManifestPath
  )

  $manifest = Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json
  $outputDirectory = Join-Path $outputRoot $Browser
  $packagePath = Join-Path $outputDirectory "guardian-monitor-$Browser-$($manifest.version).zip"
  $stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("guardian-monitor-$Browser-" + [guid]::NewGuid().ToString("N"))

  try {
    New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    foreach ($relativePath in $packageFiles) {
      Copy-Item -LiteralPath (Join-Path $projectRoot $relativePath) -Destination $stagingDirectory
    }

    Copy-Item -LiteralPath (Join-Path $projectRoot "icons") -Destination $stagingDirectory -Recurse
    Copy-Item -LiteralPath $ManifestPath -Destination (Join-Path $stagingDirectory "manifest.json")
    Compress-Archive -Path (Join-Path $stagingDirectory "*") -DestinationPath $packagePath -Force
    Write-Host "$Browser`: $packagePath"
  }
  finally {
    if (Test-Path -LiteralPath $stagingDirectory) {
      Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
    }
  }
}

New-BrowserPackage -Browser "chromium" -ManifestPath (Join-Path $projectRoot "manifest.json")
New-BrowserPackage -Browser "firefox" -ManifestPath (Join-Path $projectRoot "manifests\firefox.json")
