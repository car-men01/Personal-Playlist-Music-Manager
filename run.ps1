<#
.SYNOPSIS
    Sets up (if needed) and runs Sonora: FastAPI backend + Vite frontend.

.DESCRIPTION
    First run:  creates backend\.venv, installs Python and npm dependencies, seeds the database.
    Later runs: reuses everything; dependencies are reinstalled only when
                requirements.txt or package-lock.json have changed.
    Press Ctrl+C to stop both servers.

.PARAMETER Reinstall
    Force a reinstall of Python and npm dependencies.

.PARAMETER SetupOnly
    Prepare everything but don't start the servers.

.PARAMETER NoBrowser
    Don't open the app in the browser automatically.

.EXAMPLE
    .\run.ps1
    .\run.ps1 -Reinstall
#>
param(
    [switch]$Reinstall,
    [switch]$SetupOnly,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$Root        = $PSScriptRoot
$Backend     = Join-Path $Root "backend"
$Frontend    = Join-Path $Root "frontend"
$Venv        = Join-Path $Backend ".venv"
$VenvPython  = Join-Path $Venv "Scripts\python.exe"
$BackendPort = 8000   # the frontend calls http://127.0.0.1:8000

function Write-Step($message) { Write-Host "==> $message" -ForegroundColor Cyan }

function Stop-WithError($message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

# Runs a native command and stops the script if it fails
function Invoke-Native {
    param([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory = $Root)
    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) { Stop-WithError "'$FilePath $($Arguments -join ' ')' failed (exit code $LASTEXITCODE)." }
    } finally {
        Pop-Location
    }
}

# A stamp file records the hash of the dependency manifest that was last installed successfully
function Test-UpToDate($manifest, $stamp) {
    if ($Reinstall -or -not (Test-Path $stamp)) { return $false }
    return (Get-Content $stamp -Raw).Trim() -eq (Get-FileHash $manifest -Algorithm SHA256).Hash
}

function Save-Stamp($manifest, $stamp) {
    Set-Content -Path $stamp -Value (Get-FileHash $manifest -Algorithm SHA256).Hash -Encoding ascii
}

function Test-PortInUse($port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

# ---------------------------------------------------------------- prerequisites

function Find-Python {
    # Prefer the py launcher; plain "python" may be the Microsoft Store stub
    $candidates = @(@{ Exe = "py"; Args = @("-3") }, @{ Exe = "python"; Args = @() }, @{ Exe = "python3"; Args = @() })
    foreach ($c in $candidates) {
        if (-not (Get-Command $c.Exe -ErrorAction SilentlyContinue)) { continue }
        $versionArgs = $c.Args + @("-c", "import sys; print('%d.%d' % sys.version_info[:2])")
        $version = & $c.Exe @versionArgs 2>$null
        if ($LASTEXITCODE -eq 0 -and $version -and [version]$version -ge [version]"3.10") { return $c }
    }
    return $null
}

Write-Step "Checking prerequisites"

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Stop-WithError "Node.js not found. Install Node 18+ (22 LTS recommended) from https://nodejs.org" }
$nodeMajor = [int]((& node -v).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 18) { Stop-WithError "Node $(& node -v) is too old - Vite needs Node 18+. Upgrade, or switch with 'nvm use 22'." }
Write-Host "    Node $(& node -v)"

# ---------------------------------------------------------------- backend setup

if (-not (Test-Path $VenvPython)) {
    $python = Find-Python
    if (-not $python) { Stop-WithError "Python 3.10+ not found. Install it from https://www.python.org/downloads (tick 'Add to PATH')." }
    Write-Step "Creating Python virtual environment (backend\.venv)"
    Invoke-Native $python.Exe ($python.Args + @("-m", "venv", $Venv))
}
Write-Host "    $(& $VenvPython --version)"

$requirements = Join-Path $Backend "requirements.txt"
$requirementsStamp = Join-Path $Venv ".requirements.sha256"
if (Test-UpToDate $requirements $requirementsStamp) {
    Write-Step "Python dependencies up to date"
} else {
    Write-Step "Installing Python dependencies"
    Invoke-Native $VenvPython @("-m", "pip", "install", "--disable-pip-version-check", "-q", "-r", $requirements)
    Save-Stamp $requirements $requirementsStamp
}

if (-not (Test-Path (Join-Path $Backend "music_manager.db"))) {
    Write-Step "Creating and seeding the database"
    Invoke-Native $VenvPython @("core\seed.py") $Backend
}

# ---------------------------------------------------------------- frontend setup

$lockFile = Join-Path $Frontend "package-lock.json"
if (-not (Test-Path $lockFile)) { $lockFile = Join-Path $Frontend "package.json" }
$nodeModules = Join-Path $Frontend "node_modules"
$npmStamp = Join-Path $nodeModules ".sonora-install.sha256"
if ((Test-Path $nodeModules) -and (Test-UpToDate $lockFile $npmStamp)) {
    Write-Step "npm dependencies up to date"
} else {
    Write-Step "Installing npm dependencies (first run can take a minute)"
    Invoke-Native "npm.cmd" @("install", "--no-fund", "--no-audit") $Frontend
    Save-Stamp $lockFile $npmStamp
}

if ($SetupOnly) {
    Write-Step "Setup complete. Run .\run.ps1 to start the app."
    exit 0
}

# ---------------------------------------------------------------- run

if (Test-PortInUse $BackendPort) {
    Stop-WithError "Port $BackendPort is already in use - is the backend already running in another terminal? Stop it and try again."
}

Write-Step "Starting backend on http://127.0.0.1:$BackendPort  (API docs: /docs)"
$backendProcess = Start-Process -FilePath $VenvPython `
    -ArgumentList @("-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", $BackendPort) `
    -WorkingDirectory $Backend -NoNewWindow -PassThru

try {
    # Wait for the API before starting the frontend, so the first page load has data
    $ready = $false
    for ($i = 0; $i -lt 60 -and -not $backendProcess.HasExited; $i++) {
        try {
            Invoke-WebRequest "http://127.0.0.1:$BackendPort/" -UseBasicParsing -TimeoutSec 2 | Out-Null
            $ready = $true
            break
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $ready) { Stop-WithError "Backend did not start - see the output above." }

    Write-Step "Starting frontend (Ctrl+C stops both servers)"
    $viteArgs = @("run", "dev")
    if (-not $NoBrowser) { $viteArgs += @("--", "--open") }
    Push-Location $Frontend
    try {
        & npm.cmd @viteArgs
    } finally {
        Pop-Location
    }
} finally {
    # Runs on normal exit and on Ctrl+C. Kill the whole tree: --reload spawns a child worker.
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Step "Stopping backend"
        & taskkill.exe /PID $backendProcess.Id /T /F 2>&1 | Out-Null
    }
}
