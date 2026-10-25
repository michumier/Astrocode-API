@echo off
echo ========================================
echo    AstroCode API - Sistema Local
echo ========================================
echo.

REM Verificar si Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker no está instalado o no está en el PATH
    echo Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verificar si Docker Compose está disponible
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker Compose no está disponible
    echo Asegúrate de que Docker Desktop esté ejecutándose
    pause
    exit /b 1
)

if not exist .env (
    echo ❌ Error: falta el archivo .env
    echo Copia .env.example a .env y rellena las contraseñas
    pause
    exit /b 1
)

echo ✅ Docker y Docker Compose están disponibles
echo.

echo 🔨 Construyendo y ejecutando contenedores...
echo.

REM Parar contenedores previos si existen
docker compose down >nul 2>&1

REM Construir y ejecutar
docker compose up --build

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error al ejecutar los contenedores
    echo Revisa los logs arriba para más detalles
    pause
    exit /b 1
)

echo.
echo ========================================
echo           🎉 SISTEMA INICIADO
echo ========================================
echo.
echo 📍 URLs disponibles:
echo   • Web:           http://localhost:3000
echo   • GraphQL API:   http://localhost:4000/graphql
echo   • Health Check:  http://localhost:4000/health
echo.
echo 🧪 Para probar el sistema:
echo   1. Abre http://localhost:4000/graphql en tu navegador
echo   2. Ejecuta una mutación de código Python
echo   3. O usa los comandos curl del README
echo.
echo 🛑 Para parar los servicios:
echo   Presiona Ctrl+C o ejecuta: docker compose down
echo.
pause