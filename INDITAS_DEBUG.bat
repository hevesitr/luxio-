@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo ================================================
echo    Luxio - Debug Mod
echo ================================================
echo.
echo Ez a script reszletes hibainformaciokat mutat.
echo.
echo Ellenorzesek futtatasa...
echo.
echo [1] Node.js verzio:
node --version
if errorlevel 1 (
    echo HIBA: Node.js nincs telepítve!
    pause
    exit /b 1
)
echo.
echo [2] npm verzio:
npm --version
if errorlevel 1 (
    echo HIBA: npm nincs telepítve!
    pause
    exit /b 1
)
echo.
echo [3] Expo CLI ellenorzes:
if not exist "node_modules\expo" (
    echo HIBA: Expo nincs telepítve!
    echo Futtasd: TELEPITES.bat
    pause
    exit /b 1
)
echo OK: Expo telepítve
echo.
echo [4] package.json ellenorzes:
if not exist "package.json" (
    echo HIBA: package.json nem talalhato!
    pause
    exit /b 1
)
echo OK: package.json megtalálva
echo.
echo [5] node_modules ellenorzes:
if not exist "node_modules" (
    echo HIBA: node_modules mappa nem talalhato!
    echo Futtasd: TELEPITES.bat
    pause
    exit /b 1
)
echo OK: node_modules megtalálva
echo.
echo [6] Expo start teszteles (reszletes kimenettel):
echo.
echo ================================================
echo    EXPO START KIMENET
echo ================================================
echo.
call npm start
echo.
echo ================================================
echo    VEGE
echo ================================================
echo.
pause

