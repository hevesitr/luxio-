@echo off
echo Clearing Metro bundler cache...
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\haste-map-* 2>nul
rd /s /q %LOCALAPPDATA%\Temp\metro-* 2>nul

echo Clearing React Native cache...
rd /s /q %LOCALAPPDATA%\Temp\react-native-* 2>nul
rd /s /q %LOCALAPPDATA%\Temp\react-* 2>nul

echo Clearing Expo cache...
rd /s /q %USERPROFILE%\.expo\* 2>nul

echo Cache cleared!
echo.
echo Now restart the app with: npx expo start --clear
pause
