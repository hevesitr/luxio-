@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo ================================================
echo    Luxio - Inditas Menu
echo ================================================
echo.
echo Valassz inditasi modot:
echo.
echo  1 - Expo Go (QR kod - telefon)
echo  2 - Android Emulator (szimulator)
echo  3 - Web bongeszo (leggyorsabb)
echo  4 - Cache torles es inditas
echo.
echo ================================================
set /p choice="Valasztas (1-4): "

if "%choice%"=="1" goto expo
if "%choice%"=="2" goto android
if "%choice%"=="3" goto web
if "%choice%"=="4" goto cache
goto expo

:expo
cls
echo ================================================
echo    Expo Go Mod - QR Kod
echo ================================================
echo.
echo Verzio: SDK 54 (Expo Go kompatibilis!)
echo.
echo Az alkalmazas elindul az Expo-ban.
echo Szkenneld be a QR kodot a telefonodon!
echo.
echo GYORSBILLENTYUK: R=Ujratoltes, D=Menu, Q=Kilepes
echo.
cd /d "%~dp0"
echo.
echo Ellenorzes: Node.js es npm telepitve?
node --version
npm --version
echo.
echo Expo CLI telepites ellenorzese...
if not exist "node_modules\expo" (
    echo HIBA: Expo nincs telepítve! Futtasd: TELEPITES.bat
    echo.
    pause
    goto end
)
echo.
echo Expo inditasa...
echo.
call npm start
if errorlevel 1 (
    echo.
    echo ================================================
    echo    HIBA TORTENT!
    echo ================================================
    echo.
    echo A parancs hibaval leallt.
    echo Ellenorizd a fenti hibaüzeneteket!
    echo.
    pause
)
goto end

:android
cls
echo ================================================
echo    Android Emulator Mod
echo ================================================
echo.
echo FONTOS: Eloszor inditsd el az Android Emulator-t!
echo (Android Studio - Virtual Device Manager)
echo.
echo Az alkalmazas automatikusan telepul az emulatorra.
echo.
pause
cd /d "%~dp0"
call npm run android
if errorlevel 1 (
    echo.
    echo ================================================
    echo    HIBA TORTENT!
    echo ================================================
    echo.
    pause
)
goto end

:web
cls
echo ================================================
echo    Web Bongeszo Mod
echo ================================================
echo.
echo Az alkalmazas megnyilik a bongeszoben.
echo (http://localhost:8081)
echo.
echo MEGJEGYZES: Nekhany funkcio nem mukodik web-en.
echo.
cd /d "%~dp0"
call npm run web
if errorlevel 1 (
    echo.
    echo ================================================
    echo    HIBA TORTENT!
    echo ================================================
    echo.
    pause
)
goto end

:cache
cls
echo ================================================
echo    Cache Torles es Inditas
echo ================================================
echo.
echo Cache torlese es ujrainditas...
echo.
cd /d "%~dp0"
call npm run reset
if errorlevel 1 (
    echo.
    echo ================================================
    echo    HIBA TORTENT!
    echo ================================================
    echo.
    pause
)
goto end

:end

