@echo off
setlocal enabledelayedexpansion
set NODE_PATH=C:\Program Files\nodejs
set PATH=%NODE_PATH%;%PATH%

cd /d c:\Users\Nutrial\.vscode\lead-flow-master

echo Removendo node_modules corrompido...
rmdir /s /q node_modules >nul 2>&1

echo Instalando dependências...
"%NODE_PATH%\npm.cmd" install

echo.
echo Iniciando servidor de desenvolvimento...
"%NODE_PATH%\npm.cmd" run dev
