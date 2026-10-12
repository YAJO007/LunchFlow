@echo off
cd /d "%~dp0"
title LunchFlow Web
if not exist node_modules (
  echo Installing packages... ^(first time only^)
  call npm install
)
call npm start
pause
