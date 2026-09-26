@echo off
cd /d "E:\frontend\AGRITECHA FRONTEND"

rem Stop whatever process is already listening on port 8080 so this app can bind it.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":8080 .*LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)
rem Give the OS a moment to release the socket.
timeout /t 2 /nobreak >nul

call mvnw.cmd -q spring-boot:run > backend.log 2>&1
