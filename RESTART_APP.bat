@echo off
echo Stopping Metro Bundler...
taskkill /F /IM node.exe 2>nul

echo Clearing cache...
rmdir /s /q node_modules\.cache 2>nul
del /q .expo\* 2>nul

echo Starting Expo with cleared cache...
npx expo start --clear

pause
