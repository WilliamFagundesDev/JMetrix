@echo off
setlocal
title JMETRIX - Suite de Testes JUnit 5

echo ========================================================
echo    JMETRIX - Suite Automatizada de Testes JUnit 5
echo    Validacao: SSRF, JMX, Percentis, APDEX e API REST
echo ========================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "TESTS_DIR=%PROJECT_ROOT%tests-junit"
set "BUILD_DIR=%TESTS_DIR%\build\classes"
set "JUNIT_JAR=%TESTS_DIR%\lib\junit-platform-console-standalone-1.10.2.jar"

set "JAVA_BIN=java"
set "JAVAC_BIN=javac"

where javac >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "JAVAC_BIN=javac"
    set "JAVA_BIN=java"
) else if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\javac.exe" (
        set "JAVA_BIN=%JAVA_HOME%\bin\java.exe"
        set "JAVAC_BIN=%JAVA_HOME%\bin\javac.exe"
    )
)

if not exist "%JAVAC_BIN%" (
    for /d %%D in ("%USERPROFILE%\.jdks\*") do (
        if exist "%%D\bin\javac.exe" (
            set "JAVA_BIN=%%D\bin\java.exe"
            set "JAVAC_BIN=%%D\bin\javac.exe"
        )
    )
)

if not exist "%JAVAC_BIN%" (
    for /d %%D in ("C:\Program Files\Java\*") do (
        if exist "%%D\bin\javac.exe" (
            set "JAVA_BIN=%%D\bin\java.exe"
            set "JAVAC_BIN=%%D\bin\javac.exe"
        )
    )
)

if not exist "%JAVAC_BIN%" (
    for /d %%D in ("C:\Program Files\Eclipse Adoptium\*") do (
        if exist "%%D\bin\javac.exe" (
            set "JAVA_BIN=%%D\bin\java.exe"
            set "JAVAC_BIN=%%D\bin\javac.exe"
        )
    )
)

if not exist "%JAVAC_BIN%" (
    if exist "%PROJECT_ROOT%tools\jdk\bin\javac.exe" (
        set "JAVA_BIN=%PROJECT_ROOT%tools\jdk\bin\java.exe"
        set "JAVAC_BIN=%PROJECT_ROOT%tools\jdk\bin\javac.exe"
    )
)

echo [1/3] Compilador Java localizado:
echo       "%JAVAC_BIN%"
echo.

if not exist "%BUILD_DIR%" (
    mkdir "%BUILD_DIR%"
)

echo [2/3] Compilando classes e testes Java com JUnit 5...
powershell -NoProfile -Command "$sources = (Get-ChildItem -Recurse '%TESTS_DIR%\src' -Filter '*.java').FullName; & '%JAVAC_BIN%' -encoding UTF-8 -cp '%JUNIT_JAR%' -d '%BUILD_DIR%' $sources"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Falha durante a compilacao dos testes JUnit.
    exit /b %ERRORLEVEL%
)

echo [OK] Compilacao finalizada com sucesso!
echo.

echo [3/3] Disparando runner do JUnit 5...
echo ========================================================
"%JAVA_BIN%" -jar "%JUNIT_JAR%" execute --class-path "%BUILD_DIR%" --scan-class-path --details=tree

if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo [SUCESSO] Todos os 26 testes JUnit 5 foram aprovados com exito!
    echo ========================================================
) else (
    echo ========================================================
    echo [ALERTA] Alguns testes JUnit falharam.
    echo ========================================================
)
echo.
