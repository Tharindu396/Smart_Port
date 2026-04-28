@echo off
REM Smart Port - Run All Services Script (Windows Batch)
REM This is a simple alternative to the PowerShell script

setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
set "ACTION=%1"
if "%ACTION%"=="" set "ACTION=start"

REM Color codes (using findstr for colors)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "ERROR=[ERROR]"
set "WARNING=[WARNING]"

title Smart Port - Multi-Service Launcher

cls
echo.
echo ============================================================
echo        Smart Port - Multi-Service Launcher
echo ============================================================
echo.
echo Project Root: %PROJECT_ROOT%
echo Action: %ACTION%
echo.

if /i "%ACTION%"=="help" goto show_help
if /i "%ACTION%"=="status" goto show_status
if /i "%ACTION%"=="stop" goto stop_services
if /i "%ACTION%"=="start" goto start_services

echo ERROR: Unknown action '%ACTION%'
goto show_help

:start_services
echo %INFO% Checking prerequisites...
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo %ERROR% Node.js is not installed
    echo Install from: https://nodejs.org
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo %ERROR% npm is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo %SUCCESS% Node.js !NODE_VERSION!
echo %SUCCESS% npm !NPM_VERSION!
echo.

echo %INFO% Starting services...
echo.

set "LOG_DIR=%PROJECT_ROOT%logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Start Frontend
echo %INFO% Starting Frontend on port 3000...
cd "%PROJECT_ROOT%smart_port_fe"
if not exist "node_modules" (
    call npm install --silent
)
start "SmartPort-Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak

REM Start Vessel Tracking Service
echo %INFO% Starting Vessel Tracking Service on port 8001...
cd "%PROJECT_ROOT%smart_port_be\vessel_tracking_service"
start "SmartPort-VesselTracking" cmd /k "go run main.go"
timeout /t 2 /nobreak

REM Start Berthing Service
echo %INFO% Starting Berthing Service on port 8002...
cd "%PROJECT_ROOT%smart_port_be\berthing_service"
start "SmartPort-Berthing" cmd /k "go run ./cmd/main.go"
timeout /t 2 /nobreak

REM Start Invoice Service
echo %INFO% Starting Invoice Service on port 3001...
cd "%PROJECT_ROOT%smart_port_be\invoice_service"
if not exist "node_modules" (
    call npm install --silent
)
start "SmartPort-Invoice" cmd /k "npm run start:dev"
timeout /t 2 /nobreak

REM Start Logistics Service
echo %INFO% Starting Logistics Service on port 3002...
cd "%PROJECT_ROOT%smart_port_be\logistics_service"
if not exist "node_modules" (
    call npm install --silent
)
start "SmartPort-Logistics" cmd /k "npm run start:dev"
timeout /t 2 /nobreak

REM Start Nest Services
echo %INFO% Starting Nest Services on port 3003...
cd "%PROJECT_ROOT%smart_port_be\nest_services"
if not exist "node_modules" (
    call npm install --silent
)
start "SmartPort-NestServices" cmd /k "npm run start:dev"
timeout /t 2 /nobreak

REM Start Notification Service
echo %INFO% Starting Notification Service on port 3004...
cd "%PROJECT_ROOT%smart_port_be\notification_service"
if not exist "node_modules" (
    call npm install --silent
)
start "SmartPort-Notification" cmd /k "npm run start:dev"
timeout /t 2 /nobreak

echo.
echo %SUCCESS% All services started!
echo.
echo Service Windows:
echo   - SmartPort-Frontend (Port 3000)
echo   - SmartPort-VesselTracking (Port 8001)
echo   - SmartPort-Berthing (Port 8002)
echo   - SmartPort-Invoice (Port 3001)
echo   - SmartPort-Logistics (Port 3002)
echo   - SmartPort-NestServices (Port 3003)
echo   - SmartPort-Notification (Port 3004)
echo.
echo Close any window to stop that service.
echo.
pause
goto end

:stop_services
echo %INFO% Stopping all Smart Port services...
taskkill /FI "WINDOWTITLE eq SmartPort*" /T /F
echo %SUCCESS% All services stopped.
goto end

:show_status
cls
echo.
echo ============================================================
echo                    Service Status
echo ============================================================
echo.

tasklist /V | findstr "SmartPort" >nul 2>nul
if errorlevel 1 (
    echo   - All services are stopped
) else (
    echo   - Some services are running
    echo.
    tasklist /V | findstr "SmartPort"
)

echo.
echo Service Ports:
echo   Frontend..................3000
echo   Vessel Tracking...........8001
echo   Berthing..................8002
echo   Invoice...................3001
echo   Logistics.................3002
echo   Nest Services.............3003
echo   Notification..............3004
echo.
goto end

:show_help
cls
echo.
echo ============================================================
echo     Smart Port - Multi-Service Launcher (Windows Batch)
echo ============================================================
echo.
echo USAGE:
echo     run-all-services.bat [action]
echo.
echo ACTIONS:
echo     start       Start all services (default)
echo     stop        Stop all services
echo     status      Show service status
echo     help        Show this help message
echo.
echo EXAMPLES:
echo     run-all-services.bat                    # Start all services
echo     run-all-services.bat start             # Start all services
echo     run-all-services.bat stop              # Stop all services
echo     run-all-services.bat status            # Show service status
echo     run-all-services.bat help              # Show this help
echo.
echo SERVICES:
echo     Frontend (Next.js)..................Port 3000
echo     Vessel Tracking Service (Go)........Port 8001
echo     Berthing Service (Go)...............Port 8002
echo     Invoice Service (NestJS)............Port 3001
echo     Logistics Service (NestJS)..........Port 3002
echo     Nest Services (NestJS)..............Port 3003
echo     Notification Service (NestJS).......Port 3004
echo.
echo PREREQUISITES:
echo     - Node.js 18+ (https://nodejs.org)
echo     - npm 9+ (comes with Node.js)
echo     - Go 1.26+ (for Go services)
echo     - PostgreSQL 13+
echo     - Redis 7+
echo     - Kafka 3.0+
echo.
echo LOGS:
echo     Logs are saved to: %PROJECT_ROOT%logs\
echo.
echo KEYBOARD SHORTCUTS:
echo     Close any service window to stop that service
echo     Close all windows to stop all services
echo.
echo TROUBLESHOOTING:
echo     1. Ensure PostgreSQL and Kafka are running
echo     2. Check .env files in each service directory
echo     3. Review logs in the logs/ directory
echo     4. Verify ports are not already in use
echo.

:end
endlocal
