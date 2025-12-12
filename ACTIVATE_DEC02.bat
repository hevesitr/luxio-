@echo off
REM ACTIVATE_DEC02.bat - Dec 02 verzió aktiválása
REM Csak akkor futtasd, ha a .DEC02 fájlok készen vannak!

echo ========================================
echo   DEC 02 VERZIO AKTIVALASA
echo ========================================
echo.
echo FIGYELEM: Ez lecseréli a jelenlegi fájlokat!
echo Backup: backup_dec08_complete\
echo.
pause

REM 1. JELENLEGI VERZIÓ BACKUP
echo [1/4] Jelenlegi verzió backup...
copy src\screens\HomeScreen.js src\screens\HomeScreen.BACKUP_DEC08.js >nul 2>&1
copy src\screens\MatchesScreen.js src\screens\MatchesScreen.BACKUP_DEC08.js >nul 2>&1
copy src\screens\MessagesScreen.js src\screens\MessagesScreen.BACKUP_DEC08.js >nul 2>&1
copy src\screens\ProfileScreen.js src\screens\ProfileScreen.BACKUP_DEC08.js >nul 2>&1
copy src\screens\MapScreen.js src\screens\MapScreen.BACKUP_DEC08.js >nul 2>&1
copy App.js App.BACKUP_DEC08.js >nul 2>&1
echo    ✓ Backup kész: *.BACKUP_DEC08.js
echo.

REM 2. DEC 02 AKTIVÁLÁSA
echo [2/4] Dec 02 verzió aktiválása...
copy src\screens\HomeScreen.DEC02.js src\screens\HomeScreen.js >nul 2>&1
copy src\screens\MatchesScreen.DEC02.js src\screens\MatchesScreen.js >nul 2>&1
copy src\screens\MessagesScreen.DEC02.js src\screens\MessagesScreen.js >nul 2>&1
copy src\screens\ProfileScreen.DEC02.js src\screens\ProfileScreen.js >nul 2>&1
copy src\screens\MapScreen.DEC02.js src\screens\MapScreen.js >nul 2>&1
copy src\screens\EventsScreen.DEC02.js src\screens\EventsScreen.js >nul 2>&1
copy src\screens\VideosScreen.DEC02.js src\screens\VideosScreen.js >nul 2>&1
copy App.DEC02.js App.js >nul 2>&1
echo    ✓ Dec 02 verzió aktiválva
echo.

REM 3. CACHE TÖRLÉS
echo [3/4] Cache törlés...
if exist ".expo" rmdir /s /q .expo >nul 2>&1
if exist "node_modules\.cache" rmdir /s /q node_modules\.cache >nul 2>&1
echo    ✓ Cache törölve
echo.

REM 4. KÉSZ
echo [4/4] KÉSZ!
echo.
echo    ✓ Dec 02 verzió aktiválva
echo    ✓ Backup: *.BACKUP_DEC08.js
echo    ✓ Cache törölve
echo.
echo KÖVETKEZŐ LÉPÉSEK:
echo    1. npm start -- --clear
echo    2. Reload app (R key)
echo    3. Teszteld az appot
echo.
echo ========================================
echo   DEC 02 VERZIO AKTIV
echo ========================================
pause
