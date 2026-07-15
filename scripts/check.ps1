$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($env:VITRUM_ENGINE_DIR)) {
    $env:VITRUM_ENGINE_DIR = (Resolve-Path (Join-Path $RepoRoot "..\vitrum-engine")).Path
}
else {
    $env:VITRUM_ENGINE_DIR = (Resolve-Path -LiteralPath $env:VITRUM_ENGINE_DIR).Path
}

Push-Location (Join-Path $RepoRoot "node-widget")
try {
    & npm test
    if ($LASTEXITCODE -ne 0) {
        throw "Node widget contract tests failed with exit code $LASTEXITCODE"
    }
    & node .\widget.mjs --seed=42
    if ($LASTEXITCODE -ne 0) {
        throw "Node widget render failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "Vitrum examples: PASS (M1 prototype)"
