@echo off
echo Cleaning Metro Bundler cache...
echo.

REM Kill all node processes
echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clean Metro cache
echo Cleaning Metro cache...
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\haste-map-* 2>nul
rd /s /q %LOCALAPPDATA%\Temp\metro-* 2>nul

REM Clean Expo cache
echo Cleaning Expo cache...
rd /s /q .expo 2>nul

REM Clean node_modules cache
echo Cleaning node_modules cache...
rd /s /q node_modules\.cache 2>nul

echo.
echo ✅ Cache cleaned!
echo.
echo Now run: npm start
echo.
pause
