@echo off
chcp 65001 >nul
title Quan ly quan ca phe
cd /d "%~dp0"
echo ============================================
echo   Dang khoi dong ung dung quan ly quan...
echo   Vui long GIU CUA SO NAY MO trong khi ban hang.
echo ============================================
echo.
start "" http://localhost:3000
npm start
pause
