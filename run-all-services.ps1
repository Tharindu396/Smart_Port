# Smart Port - Run All Services Script
# This script starts all backend and frontend services for development

param(
    [ValidateSet('start', 'stop', 'restart', 'status')]
    [string]$action = 'start',
    
    [string[]]$services = @('frontend', 'vessel-tracking', 'berthing', 'invoice', 'logistics', 'nest-services', 'notification'),
    
    [switch]$docker = $false,
    
    [switch]$skipDeps = $false
)

$ErrorActionPreference = 'Continue'
$projectRoot = if ($PSScriptRoot) {
    $PSScriptRoot
} elseif ($MyInvocation.MyCommandPath) {
    Split-Path -Parent $MyInvocation.MyCommandPath
} else {
    (Get-Location).Path
}
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Color codes for output
$colors = @{
    'Success' = 'Green'
    'Error'   = 'Red'
    'Warning' = 'Yellow'
    'Info'    = 'Cyan'
}

# Service configurations
$serviceConfigs = @{
    'frontend' = @{
        'name'       = 'Frontend (Next.js)'
        'path'       = 'smart_port_fe'
        'type'       = 'node'
        'command'    = 'npm run dev'
        'port'       = 3000
        'env'        = @{}
    }
    'vessel-tracking' = @{
        'name'       = 'Vessel Tracking Service'
        'path'       = 'smart_port_be/vessel_tracking_service'
        'type'       = 'go'
        'command'    = 'go run main.go'
        'port'       = 8001
        'env'        = @{
            'PORT' = '8001'
        }
    }
    'berthing' = @{
        'name'       = 'Berthing Service'
        'path'       = 'smart_port_be/berthing_service'
        'type'       = 'go'
        'command'    = 'go run ./cmd/main.go'
        'port'       = 8002
        'env'        = @{
            'PORT' = '8002'
        }
    }
    'invoice' = @{
        'name'       = 'Invoice Service'
        'path'       = 'smart_port_be/invoice_service'
        'type'       = 'node'
        'command'    = 'npm run start:dev'
        'port'       = 3001
        'env'        = @{
            'PORT' = '3001'
        }
    }
    'logistics' = @{
        'name'       = 'Logistics Service'
        'path'       = 'smart_port_be/logistics_service'
        'type'       = 'node'
        'command'    = 'npm run start:dev'
        'port'       = 3002
        'env'        = @{
            'PORT' = '3002'
        }
    }
    'nest-services' = @{
        'name'       = 'Nest Services'
        'path'       = 'smart_port_be/nest_services'
        'type'       = 'node'
        'command'    = 'npm run start:dev'
        'port'       = 3003
        'env'        = @{
            'PORT' = '3003'
        }
    }
    'notification' = @{
        'name'       = 'Notification Service'
        'path'       = 'smart_port_be/notification_service'
        'type'       = 'node'
        'command'    = 'npm run start:dev'
        'port'       = 3004
        'env'        = @{
            'PORT' = '3004'
        }
    }
}

# Process registry to track running services
$processRegistry = @{}

function Write-Log {
    param(
        [string]$message,
        [string]$level = 'Info'
    )
    $color = $colors[$level]
    Write-Host "[$timestamp] [$level] $message" -ForegroundColor $color
}

function Check-Prerequisites {
    Write-Log "Checking prerequisites..." -level 'Info'
    
    $goInstalled = $null -ne (Get-Command 'go' -ErrorAction SilentlyContinue)
    $nodeInstalled = $null -ne (Get-Command 'node' -ErrorAction SilentlyContinue)
    $npmInstalled = $null -ne (Get-Command 'npm' -ErrorAction SilentlyContinue)
    
    if (-not $nodeInstalled -or -not $npmInstalled) {
        Write-Log "ERROR: Node.js and npm are required but not found" -level 'Error'
        Write-Log "Install from: https://nodejs.org" -level 'Error'
        exit 1
    }
    
    Write-Log "[OK] Node.js $(node --version)" -level 'Success'
    Write-Log "[OK] npm $(npm --version)" -level 'Success'
    
    if ($false -in @($goInstalled)) {
        Write-Log "WARNING: Go not found. Go services won't run." -level 'Warning'
    } else {
        Write-Log "[OK] Go $(go version)" -level 'Success'
    }
}

function Install-Dependencies {
    param([string]$serviceName)
    
    $config = $serviceConfigs[$serviceName]
    $fullPath = Join-Path $projectRoot $config['path']
    
    if (-not (Test-Path $fullPath)) {
        Write-Log "Service directory not found: $fullPath" -level 'Error'
        return $false
    }
    
    if ($config['type'] -eq 'node') {
        if (-not (Test-Path "$fullPath/node_modules")) {
            Write-Log "Installing dependencies for $($config['name'])..." -level 'Info'
            Push-Location $fullPath
            npm install --silent
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Failed to install dependencies for $($config['name'])" -level 'Error'
                Pop-Location
                return $false
            }
            Pop-Location
            Write-Log "[OK] Dependencies installed for $($config['name'])" -level 'Success'
        }
    }
    
    return $true
}

function Start-Service {
    param([string]$serviceName)
    
    $config = $serviceConfigs[$serviceName]
    
    if ($processRegistry.ContainsKey($serviceName)) {
        Write-Log "$($config['name']) is already running (PID: $($processRegistry[$serviceName]))" -level 'Warning'
        return
    }
    
    Write-Log "Starting $($config['name']) on port $($config['port'])..." -level 'Info'
    
    $fullPath = Join-Path $projectRoot $config['path']
    
    if (-not (Test-Path $fullPath)) {
        Write-Log "ERROR: Service path not found: $fullPath" -level 'Error'
        return
    }
    
    # Set environment variables
    foreach ($envVar in $config['env'].GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($envVar.Key, $envVar.Value, 'Process')
    }
    
    # Start service in new PowerShell window
    $logFile = Join-Path $projectRoot "logs/$serviceName.log"
    New-Item -ItemType Directory -Force -Path (Split-Path $logFile) | Out-Null
    
    $startScript = {
        param($servicePath, $command, $logFile, $envVars)
        Set-Location $servicePath
        & $command 2>&1 | Tee-Object -FilePath $logFile
    }
    
    $job = Start-Job -ScriptBlock {
        param($servicePath, $command, $logFile, $envVars)
        Set-Location $servicePath
        Invoke-Expression $command 2>&1 | Tee-Object -FilePath $logFile
    } -ArgumentList $fullPath, $config['command'], $logFile, $config['env']
    
    $processRegistry[$serviceName] = $job.Id
    
    Write-Log "[OK] $($config['name']) started (Job ID: $($job.Id))" -level 'Success'
    Write-Log "  Logs: $logFile" -level 'Info'
}

function Stop-Service {
    param([string]$serviceName)
    
    if (-not $processRegistry.ContainsKey($serviceName)) {
        Write-Log "$serviceName is not running" -level 'Warning'
        return
    }
    
    $config = $serviceConfigs[$serviceName]
    $jobId = $processRegistry[$serviceName]
    
    Write-Log "Stopping $($config['name']) (Job ID: $jobId)..." -level 'Info'
    
    Stop-Job -Id $jobId -ErrorAction SilentlyContinue
    Remove-Job -Id $jobId -ErrorAction SilentlyContinue
    
    $processRegistry.Remove($serviceName)
    Write-Log "[OK] $($config['name']) stopped" -level 'Success'
}

function Stop-AllServices {
    Write-Log "Stopping all services..." -level 'Info'
    
    foreach ($serviceName in $processRegistry.Keys.ToArray()) {
        Stop-Service -serviceName $serviceName
    }
    
    Write-Log "All services stopped" -level 'Success'
}

function Show-Status {
    Write-Log "Service Status:" -level 'Info'
    Write-Host ""
    
    foreach ($serviceName in $services) {
        $config = $serviceConfigs[$serviceName]
        $status = if ($processRegistry.ContainsKey($serviceName)) {
            "[RUNNING] (Port: $($config['port']))"
        } else {
            "[STOPPED]"
        }
        
        Write-Host "  [$status] $($config['name'])"
    }
    
    Write-Host ""
}

function Show-Help {
    Write-Host @"
Smart Port - Run All Services Script

USAGE:
    .\run-all-services.ps1 [options]

OPTIONS:
    -action start|stop|restart|status
        Action to perform (default: start)
    
    -services <service1,service2,...>
        Services to run (default: all)
        Available: frontend, vessel-tracking, berthing, invoice, logistics, nest-services, notification
    
    -skipDeps
        Skip installing dependencies
    
    -docker
        Use Docker Compose to run services (requires Docker)
    
    -help
        Show this help message

EXAMPLES:
    .\run-all-services.ps1                              # Start all services
    .\run-all-services.ps1 -action stop               # Stop all services
    .\run-all-services.ps1 -action restart            # Restart all services
    .\run-all-services.ps1 -services frontend,invoice # Start only frontend and invoice
    .\run-all-services.ps1 -docker                    # Use Docker Compose

SERVICES:
"@
    foreach ($serviceName in $serviceConfigs.Keys) {
        $config = $serviceConfigs[$serviceName]
        Write-Host "  $serviceName          $($config['name']) (Port: $($config['port']))"
    }
    
    Write-Host @"

LOGS:
    Logs are saved to: $projectRoot\logs\<service>.log

KEYBOARD SHORTCUTS:
    Press Ctrl+C to stop the script
    Services will be stopped gracefully

TROUBLESHOOTING:
    1. Ensure PostgreSQL and Kafka are running
    2. Check .env files in each service directory
    3. Review logs in the logs/ directory
    4. Verify ports are not already in use

"@
}

# Main execution
if ($action -eq 'status') {
    Show-Status
    exit 0
}

if ($args[0] -eq '-help' -or $args[0] -eq '--help' -or $args[0] -eq '-h') {
    Show-Help
    exit 0
}

Write-Log "Smart Port - Multi-Service Launcher" -level 'Info'
Write-Log "Project Root: $projectRoot" -level 'Info'

if ($action -eq 'stop') {
    Stop-AllServices
    exit 0
}

if ($action -eq 'restart') {
    Stop-AllServices
    Start-Sleep -Seconds 2
}

# Check prerequisites
Check-Prerequisites

# Install dependencies if needed
if (-not $skipDeps) {
    foreach ($serviceName in $services) {
        Install-Dependencies -serviceName $serviceName
    }
}

# Start services
Write-Host ""
Write-Log "Starting services..." -level 'Info'
Write-Host ""

foreach ($serviceName in $services) {
    if ($serviceConfigs.ContainsKey($serviceName)) {
        Start-Service -serviceName $serviceName
        Start-Sleep -Milliseconds 500
    } else {
        Write-Log "Unknown service: $serviceName" -level 'Error'
    }
}

Write-Host ""
Write-Log "All services started! Press Ctrl+C to stop." -level 'Success'
Write-Host ""
Show-Status

# Wait for user to stop
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Log "Shutting down all services..." -level 'Info'
    Stop-AllServices
    Write-Log "Goodbye!" -level 'Success'
}
