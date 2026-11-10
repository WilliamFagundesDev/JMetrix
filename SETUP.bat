@echo off
setlocal
title JMETRIX - Instalador e Configurador Automatizado
cd /d "%~dp0"

echo ========================================================
echo    JMETRIX - PLATAFORMA INTELIGENTE DE TESTES
echo    Instalador e Configurador Automatizado
echo ========================================================
echo.
echo Iniciando assistente de configuracao...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
set "SETUP_EXIT=%ERRORLEVEL%"

if %SETUP_EXIT% neq 0 (
    echo.
    echo ========================================================
    echo [ERRO] O assistente de configuracao retornou codigo %SETUP_EXIT%.
    echo Verifique as mensagens de erro acima.
    echo ========================================================
    pause
    exit /b %SETUP_EXIT%
)

endlocal
exit /b 0
