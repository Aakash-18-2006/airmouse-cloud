@echo off
setlocal
cd /d "%~dp0"
title Build Standalone AirMouse Receiver Executable
cls
echo ========================================================
echo        PACKAGING AIR MOUSE WINDOWS RECEIVER (.EXE)
echo ========================================================
echo.

where py >nul 2>nul
if %errorlevel% equ 0 (
    set PY_CMD=py
) else (
    set PY_CMD=python
)

echo Installing dependencies and build tools (PyInstaller)...
%PY_CMD% -m pip install -q -r "%~dp0requirements.txt"
%PY_CMD% -m pip install --upgrade pyinstaller -q

echo Compiling AirMouseReceiver.exe...
%PY_CMD% -m PyInstaller --clean --onefile --noconsole --name "AirMouseReceiver" --add-data "gui.py;." --add-data "config.py;." receiver.py

echo.
if exist "dist\AirMouseReceiver.exe" (
    echo Copying configuration templates to dist...
    if exist "config.json" copy /y "config.json" "dist\" >nul
    if exist ".env.example" copy /y ".env.example" "dist\" >nul
    echo ========================================================
    echo SUCCESS! Standalone executable created at:
    echo %~dp0dist\AirMouseReceiver.exe
    echo ========================================================
) else (
    echo [ERROR] Packaging encountered an issue. Check output above.
)
pause
