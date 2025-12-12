@echo off
REM RESTORE_DEC02_SAFE.bat - Biztonságos helyreállítás dec 02 állapotra
REM Semmi nem vész el!

echo ========================================
echo   DEC 02 HELYREALLITAS - BIZTONSAGOS
echo ========================================
echo.

REM 1. TELJES BACKUP
echo [1/5] Teljes backup készítése...
if not exist "backup_dec08_complete" mkdir "backup_dec08_complete"
xcopy /E /I /H /Y src backup_dec08_complete\src >nul 2>&1
xcopy /Y *.js backup_dec08_complete\ >nul 2>&1
xcopy /Y *.json backup_dec08_complete\ >nul 2>&1
echo    ✓ Backup kész: backup_dec08_complete\
echo.

REM 2. DEC 02 FÁJLOK MÁSOLÁSA
echo [2/5] Dec 02 fájlok másolása .DEC02 kiterjesztéssel...
copy version_dec01_final\src\screens\HomeScreen.js src\screens\HomeScreen.DEC02.js >nul 2>&1
copy version_dec01_final\src\screens\MatchesScreen.js src\screens\MatchesScreen.DEC02.js >nul 2>&1
copy version_dec01_final\src\screens\MessagesScreen.js src\screens\MessagesScreen.DEC02.js >nul 2>&1
copy version_dec01_final\src\screens\ProfileScreen.js src\screens\ProfileScreen.DEC02.js >nul 2>&1
copy version_dec01_final\src\screens\MapScreen.js src\screens\MapScreen.DEC02.js >nul 2>&1
copy version_dec01_final\src\screens\EventsScreen.js src\screens\EventsScreen.DEC02.js >nul 2>&1
copy version_dec01_final\src\screens\VideosScreen.js src\screens\VideosScreen.DEC02.js >nul 2>&1
copy version_dec01_final\App.js App.DEC02.js >nul 2>&1
echo    ✓ Dec 02 fájlok átmásolva
echo.

REM 3. KOMPONENSEK MÁSOLÁSA
echo [3/5] Dec 02 komponensek másolása...
copy version_dec01_final\src\components\SwipeCard.js src\components\SwipeCard.DEC02.js >nul 2>&1
copy version_dec01_final\src\components\MatchAnimation.js src\components\MatchAnimation.DEC02.js >nul 2>&1
copy version_dec01_final\src\components\LiveMapView.js src\components\LiveMapView.DEC02.js >nul 2>&1
echo    ✓ Komponensek átmásolva
echo.

REM 4. STÁTUSZ
echo [4/5] Helyreállítás státusz:
echo    ✓ Backup: backup_dec08_complete\
echo    ✓ Dec 02 screens: src\screens\*.DEC02.js
echo    ✓ Dec 02 App.js: App.DEC02.js
echo    ✓ Jelenlegi fájlok: MEGMARADTAK
echo.

REM 5. KÖVETKEZŐ LÉPÉSEK
echo [5/5] KÖVETKEZŐ LÉPÉSEK:
echo.
echo    1. Ellenőrizd a .DEC02 fájlokat
echo    2. Add hozzá az új funkciókat:
echo       - AISearchModal integráció
echo       - MapScreen navigáció
echo    3. Futtasd: ACTIVATE_DEC02.bat
echo.
echo ========================================
echo   HELYREÁLLÍTÁS ELŐKÉSZÍTVE
echo ========================================
pause
