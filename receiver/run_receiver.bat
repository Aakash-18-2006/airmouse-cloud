@echo off
setlocal
cd /d "%~dp0"
title AirMouse Cloud - Windows Receiver
cls
echo ========================================================
echo               AIR MOUSE CLOUD RECEIVER
echo ========================================================
echo.

where py >nul 2>nul
if %errorlevel% equ 0 (
    set PY_CMD=py
    goto check_deps
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    set PY_CMD=python
    goto check_deps
)

echo [ERROR] Python was not found on your system!
echo Please install Python 3.10+ from https://www.python.org or the Microsoft Store.
echo Make sure to check "Add Python to PATH" during installation.
echo.
pause
exit /b 1

:check_deps
echo Checking and installing Python dependencies...
%PY_CMD% -m pip install -q -r "%~dp0requirements.txt"
if %errorlevel% neq 0 (
    echo [WARNING] Dependency installation encountered a warning. Attempting to start anyway...
)

echo.
echo Launching AirMouse Windows Receiver...
echo.
%PY_CMD% "%~dp0receiver.py" %*
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Receiver stopped with error code %errorlevel%.
)

echo.
pause
