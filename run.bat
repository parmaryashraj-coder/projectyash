@echo off
:: =============================================================================
:: Nexora - 1-Click Windows Launcher Script
:: =============================================================================
:: Purpose: Checks if Java is installed. If Java is available, it compiles and runs
::          Server.java. Otherwise, it runs the native Windows PowerShell server.
:: =============================================================================

:: Line 1: Set terminal window title
title Nexora - Music Player & Media Studio Launcher

:: Line 2: Set console text color to green (0 = Black background, A = Light green text)
color 0A

:: Line 3: Print header banner
echo ============================================================
echo       NEXORA - MUSIC PLAYER & MEDIA STUDIO LAUNCHER
echo ============================================================
echo.

:: Line 4: Check if 'java' command is installed and available in PATH
where java >nul 2>nul
if %errorlevel% equ 0 (
    :: Java is installed on this PC
    echo [OK] Java detected! Starting Java backend web server...
    echo.
    :: Line 5: Compile Java server source code
    javac Server.java
    :: Line 6: Automatically launch browser to localhost:8080
    start "" http://localhost:8080
    :: Line 7: Start Java web server
    java Server
) else (
    :: Java is not installed, use built-in Windows PowerShell HTTP server
    echo [OK] Starting Nexora Localhost Web Server on port 8080...
    :: Line 8: Automatically launch browser to localhost:8080
    start "" http://localhost:8080
    :: Line 9: Start native PowerShell web server
    powershell -ExecutionPolicy Bypass -File .\server.ps1
)

:: Line 10: Keep command prompt open if server is closed
pause
