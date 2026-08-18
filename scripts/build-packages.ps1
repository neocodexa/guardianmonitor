$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outputRoot = Join-Path $projectRoot "dist"

& (Join-Path $projectRoot "scripts\validate-project.ps1")

function Compress-CompatibleArchive {
  param(
    [Parameter(Mandatory = $true)][string]$SourceDirectory,
    [Parameter(Mandatory = $true)][string]$DestinationPath
  )

  $zipStream = [System.IO.File]::Open($DestinationPath, [System.IO.FileMode]::Create)
  $archive = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

  try {
    foreach ($file in Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File) {
      $relativePath = $file.FullName.Substring($SourceDirectory.Length + 1) -replace "\\", "/"
      $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
      $entryStream = $entry.Open()
      $fileStream = $file.OpenRead()
      try {
        $fileStream.CopyTo($entryStream)
      }
      finally {
        $fileStream.Dispose()
        $entryStream.Dispose()
      }
    }
  }
  finally {
    $archive.Dispose()
    $zipStream.Dispose()
  }
}

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

    Get-ChildItem -LiteralPath $outputDirectory -Filter "guardian-monitor-$Browser-*.zip" -File | Remove-Item -Force
    Copy-Item -LiteralPath (Join-Path $projectRoot "src") -Destination $stagingDirectory -Recurse
    Copy-Item -LiteralPath $ManifestPath -Destination (Join-Path $stagingDirectory "manifest.json")
    Compress-CompatibleArchive -SourceDirectory $stagingDirectory -DestinationPath $packagePath
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
