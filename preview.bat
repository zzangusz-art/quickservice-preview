@echo off
chcp 65001 >nul
cd /d "%~dp0"
node build.mjs || goto :end
echo.
echo 미리보기: http://localhost:5520  (닫으려면 Ctrl+C)
start "" http://localhost:5520
python -m http.server 5520 --directory dist
:end
pause
