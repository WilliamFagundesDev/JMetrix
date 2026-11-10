$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$toolsDir = Join-Path $projectRoot "tools"

if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}

# 1. Prepare Apache JMeter 5.6.3
$jmeterTarget = Join-Path $toolsDir "apache-jmeter-5.6.3"
if (-not (Test-Path "$jmeterTarget\bin\jmeter.bat")) {
    $localJmeter = "$env:LOCALAPPDATA\Programs\apache-jmeter-5.6.3"
    if (Test-Path "$localJmeter\bin\jmeter.bat") {
        Write-Host "[Tools] Copiando Apache JMeter de $localJmeter..." -ForegroundColor Cyan
        Copy-Item -Path $localJmeter -Destination $jmeterTarget -Recurse -Force
    } else {
        Write-Host "[Tools] Baixando Apache JMeter 5.6.3..." -ForegroundColor Cyan
        $jmeterZip = Join-Path $env:TEMP "apache-jmeter-5.6.3.zip"
        Invoke-WebRequest -Uri "https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.zip" -OutFile $jmeterZip -UseBasicParsing
        tar -xf "$jmeterZip" -C "$toolsDir"
        Remove-Item "$jmeterZip" -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "[Tools] Apache JMeter verificado em: $jmeterTarget" -ForegroundColor Green

# 2. Prepare Portable JRE 21
$jreTarget = Join-Path $toolsDir "jre21"
if (-not (Test-Path "$jreTarget\bin\java.exe")) {
    Write-Host "[Tools] Baixando Eclipse Temurin OpenJDK 21 JRE..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $jreTarget -Force | Out-Null
    $jreZip = Join-Path $env:TEMP "temurin-jre21.zip"
    $jreUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk"
    Invoke-WebRequest -Uri $jreUrl -OutFile $jreZip -UseBasicParsing
    tar -xf "$jreZip" -C "$jreTarget" --strip-components=1
    Remove-Item "$jreZip" -Force -ErrorAction SilentlyContinue
}
Write-Host "[Tools] JRE 21 verificado em: $jreTarget" -ForegroundColor Green

Write-Host "[Tools] Todos os binarios embutidos foram preparados com sucesso!" -ForegroundColor Green

