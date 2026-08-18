$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$chromiumManifestPath = Join-Path $projectRoot "manifest.json"
$firefoxManifestPath = Join-Path $projectRoot "manifests\firefox.json"
$chromiumManifest = Get-Content -Raw -LiteralPath $chromiumManifestPath | ConvertFrom-Json
$firefoxManifest = Get-Content -Raw -LiteralPath $firefoxManifestPath | ConvertFrom-Json

if ($chromiumManifest.version -ne $firefoxManifest.version) {
  throw "As versões dos manifestos são diferentes: Chromium $($chromiumManifest.version), Firefox $($firefoxManifest.version)."
}

$requiredFiles = @(
  "src\background\background.js",
  "src\background\risk-engine.js",
  "src\background\risk-replay.js",
  "src\content\content.js",
  "src\dashboard\dashboard.html",
  "src\dashboard\dashboard.js",
  "src\dashboard\dashboard-detail.css",
  "src\dashboard\risk-replay.css",
  "src\popup\popup.html",
  "src\popup\popup.js",
  "src\shared\brand.css",
  "src\shared\dark.css",
  "src\shared\style.css",
  "src\icons\icon.png",
  "src\icons\icon16.png",
  "src\icons\icon32.png",
  "src\icons\icon48.png",
  "src\icons\icon128.png"
)

foreach ($relativePath in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relativePath) -PathType Leaf)) {
    throw "Arquivo obrigatório ausente: $relativePath"
  }
}

$rootCodeFiles = Get-ChildItem -LiteralPath $projectRoot -File | Where-Object { $_.Extension -in @(".js", ".css", ".html") }
if ($rootCodeFiles) {
  throw "Arquivos de código devem ficar em src, não na raiz: $($rootCodeFiles.Name -join ', ')"
}

$manifestPaths = @(
  $chromiumManifest.background.service_worker,
  $chromiumManifest.action.default_popup,
  $chromiumManifest.options_page,
  $chromiumManifest.content_scripts[0].js[0],
  $firefoxManifest.background.scripts[0],
  $firefoxManifest.background.scripts[1],
  $firefoxManifest.action.default_popup,
  $firefoxManifest.options_page,
  $firefoxManifest.content_scripts[0].js[0]
) + @($chromiumManifest.icons.PSObject.Properties.Value) + @($firefoxManifest.icons.PSObject.Properties.Value)

foreach ($relativePath in $manifestPaths | Select-Object -Unique) {
  if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relativePath) -PathType Leaf)) {
    throw "Referência de manifesto inválida: $relativePath"
  }
}

foreach ($htmlFile in Get-ChildItem -LiteralPath (Join-Path $projectRoot "src") -Recurse -Filter "*.html") {
  $html = Get-Content -Raw -LiteralPath $htmlFile.FullName
  foreach ($match in [regex]::Matches($html, '(?:src|href)="([^"]+)"')) {
    $reference = $match.Groups[1].Value
    if ($reference -match '^(?:https?:|#|data:)') { continue }
    $resolvedReference = [System.IO.Path]::GetFullPath((Join-Path $htmlFile.DirectoryName $reference))
    if (-not (Test-Path -LiteralPath $resolvedReference -PathType Leaf)) {
      throw "Referência HTML inválida em $($htmlFile.Name): $reference"
    }
  }
}

$readme = Get-Content -Raw -LiteralPath (Join-Path $projectRoot "README.md")
if (-not $readme.Contains("Versão atual: **$($chromiumManifest.version)**")) {
  throw "A versão atual do README não corresponde aos manifestos."
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  Get-ChildItem -LiteralPath (Join-Path $projectRoot "src") -Recurse -Filter "*.js" | ForEach-Object {
    & $node.Source --check $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "JavaScript inválido: $($_.FullName)" }
  }
}

Write-Host "Estrutura válida. Versão: $($chromiumManifest.version)"
