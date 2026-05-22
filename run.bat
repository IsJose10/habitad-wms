@echo off
title HABITAD WMS Server

:: Posicionarse siempre en la carpeta donde está este .bat (sin importar desde dónde lo lances)
cd /d "%~dp0"

echo ==================================================
echo   HABITAD WMS - CONTROL DE INVENTARIOS
echo   Carpeta: %~dp0
echo ==================================================
echo.

set NODE_PATH=C:\Users\JoseT\AppData\Local\ms-playwright-go\1.57.0\node.exe

if not exist "%NODE_PATH%" (
    echo [ERROR] No se encontro el motor Node.js local.
    echo Ruta buscada: %NODE_PATH%
    echo.
    pause
    exit /b
)

echo [OK] Motor Node.js detectado.
echo [INFO] Iniciando servidor en http://localhost:3000 ...
echo [INFO] Para detener el servidor presione CTRL+C
echo.

:: Abrir navegador automaticamente despues de 2 segundos
start /b cmd /c "timeout /t 2 >nul && start http://localhost:3000"

:: Ejecutar el servidor Node.js
"%NODE_PATH%" server.js

pause
