@echo off
setlocal
title JMETRIX - Test. Measure. Dominate.
echo ========================================================
echo    JMETRIX - Plataforma Inteligente de Testes
echo    Motor Apache JMeter integrado + Interface Electron
echo ========================================================
echo.

if exist "%~dp0dist-electron\JMETRIX-win32-x64\JMETRIX.exe" (
    echo [JMETRIX] Iniciando aplicativo desktop compilado...
    start "" "%~dp0dist-electron\JMETRIX-win32-x64\JMETRIX.exe"
    exit /b 0
)

echo [JMETRIX] Iniciando via Electron em modo desenvolvimento...
cd /d "%~dp0"
call npm start
