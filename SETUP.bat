@echo off
title TaskFlow Setup
color 0B
echo.
echo  ========================================
echo   TaskFlow Setup
echo   Health Market Connect
echo  ========================================
echo.

SET PROJECT=C:\Users\mpari\Claude\Projects\Daily and Weekly To-Do List\TaskFlow

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js not found. Opening download page...
    start https://nodejs.org/en/download
    echo  Install Node.js, then run this script again.
    pause
    exit /b 1
)

echo  [1/5] Installing server dependencies...
cd /d "%PROJECT%\server"
call npm install --silent
echo       Done.

echo  [2/5] Installing web app dependencies...
cd /d "%PROJECT%\web"
call npm install --silent
echo       Done.

echo  [3/5] Installing mobile app dependencies...
cd /d "%PROJECT%\mobile"
call npm install --silent
echo       Done.

echo  [4/5] Creating .env file...
cd /d "%PROJECT%"
if not exist .env (
    copy .env.example .env >nul
    echo       .env created from template.
) else (
    echo       .env already exists, skipping.
)

echo  [5/5] Opening VS Code...
where code >nul 2>&1
if %errorlevel% equ 0 (
    code "%PROJECT%"
    echo       VS Code opened!
) else (
    echo  [!] VS Code 'code' command not found.
    echo      Open VS Code manually and open this folder:
    echo      %PROJECT%
    explorer "%PROJECT%"
)

echo.
echo  ========================================
echo   Setup complete!
echo  ========================================
echo.
echo  Next steps in VS Code:
echo    1. Open .env and fill in your API keys
echo       (See README.md for where to get them)
echo.
echo  To start the app, open 3 terminals and run:
echo    Terminal 1:  cd server  ^&^& npm run dev
echo    Terminal 2:  cd web     ^&^& npm run dev
echo    Terminal 3:  cd mobile  ^&^& npx expo start
echo.
echo  Web app will open at: http://localhost:5173
echo.
pause
