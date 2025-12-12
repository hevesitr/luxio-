@echo off
echo Stopping Metro Bundler...
taskkill /F /IM node.exe 2>nul

echo Clearing all caches...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .expo 2>nul
rmdir /s /q %TEMP%\metro-* 2>nul
rmdir /s /q %TEMP%\haste-map-* 2>nul
del /q package-lock.json 2>nul

echo Reinstalling dependencies...
call npm install

echo Starting Expo with cleared cache...
npx expo start --clear

pause
