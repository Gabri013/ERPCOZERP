@echo off
title ERP COZINCA - Iniciando...

echo [1/4] Iniciando PostgreSQL...
"C:\Users\Gabriel Costa\scoop\apps\postgresql\current\bin\pg_ctl" start -D "C:\Users\Gabriel Costa\scoop\apps\postgresql\current\data" -l "C:\Users\Gabriel Costa\scoop\apps\postgresql\current\data\pg.log" -w
echo PostgreSQL OK

echo [2/4] Iniciando Redis...
start /B "" "C:\Users\Gabriel Costa\scoop\apps\redis\current\redis-server" --port 6379 --appendonly yes
timeout /t 2 /nobreak >nul
echo Redis OK

echo [3/4] Iniciando Backend...
cd /d "C:\Users\Gabriel Costa\Documents\GitHub\ERPCOZERP\apps\backend"
start "ERP Backend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo [4/4] Iniciando Frontend...
cd /d "C:\Users\Gabriel Costa\Documents\GitHub\ERPCOZERP\apps\frontend"
start "ERP Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo  ERP COZINCA RODANDO!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:3001
echo ============================================
pause
