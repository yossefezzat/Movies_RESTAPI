@echo off
setlocal enabledelayedexpansion

echo 🎬 Movies REST API Docker Setup
echo ================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

echo ✅ Docker is running

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not available. Please install Docker Compose.
    exit /b 1
)

echo ✅ Docker Compose is available

REM Parse command line arguments
set "mode=%~1"
if "%mode%"=="" set "mode=prod"

if /i "%mode%"=="prod" goto :production
if /i "%mode%"=="production" goto :production
if /i "%mode%"=="dev" goto :development
if /i "%mode%"=="development" goto :development
if /i "%mode%"=="stop" goto :stop
if /i "%mode%"=="clean" goto :clean
if /i "%mode%"=="logs" goto :logs
if /i "%mode%"=="status" goto :status
if /i "%mode%"=="help" goto :help
if /i "%mode%"=="--help" goto :help
if /i "%mode%"=="-h" goto :help

echo ❌ Unknown option: %mode%
goto :help

:production
echo 🚀 Starting in production mode...
docker-compose up -d
echo.
echo ✅ Services started successfully!
echo 📍 API is available at: http://localhost:3000
echo 📍 PostgreSQL is available at: localhost:5432
echo 📍 Redis is available at: localhost:6379
echo.
echo 📋 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
goto :end

:development
echo 🔧 Starting in development mode...
docker-compose --profile dev up -d
echo.
echo ✅ Services started successfully!
echo 📍 API (dev) is available at: http://localhost:3001
echo 📍 API (prod) is available at: http://localhost:3000
echo 📍 PostgreSQL is available at: localhost:5432
echo 📍 Redis is available at: localhost:6379
echo.
echo 📋 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
goto :end

:stop
echo 🛑 Stopping all services...
docker-compose down
echo ✅ All services stopped
goto :end

:clean
echo 🧹 Cleaning up (removing containers and volumes)...
docker-compose down -v
docker system prune -f
echo ✅ Cleanup completed
goto :end

:logs
echo 📋 Showing logs for all services...
docker-compose logs -f
goto :end

:status
echo 📊 Service status:
docker-compose ps
goto :end

:help
echo.
echo Usage: %~nx0 [OPTION]
echo.
echo Options:
echo   prod, production    Start in production mode
echo   dev, development    Start in development mode
echo   stop               Stop all services
echo   clean              Stop and remove all containers and volumes
echo   logs               Show logs for all services
echo   status             Show status of all services
echo   help               Show this help message
echo.
goto :end

:end
endlocal