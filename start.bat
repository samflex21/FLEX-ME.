@echo off
setlocal enabledelayedexpansion
echo Starting FLEX_ME Application...

REM Check common MongoDB installation paths
set "MONGO_PATHS[0]=C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
set "MONGO_PATHS[1]=C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
set "MONGO_PATHS[2]=C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
set "MONGO_PATHS[3]=C:\Program Files\MongoDB\Server\4.4\bin\mongod.exe"

set "MONGOD_PATH="
for %%i in (0,1,2,3) do (
    if exist "!MONGO_PATHS[%%i]!" (
        set "MONGOD_PATH=!MONGO_PATHS[%%i]!"
        goto :found_mongo
    )
)

:not_found_mongo
echo MongoDB executable not found in common paths
echo Please make sure MongoDB is installed and add it to your PATH
echo Common installation paths:
echo - C:\Program Files\MongoDB\Server\7.0\bin
echo - C:\Program Files\MongoDB\Server\6.0\bin
echo - C:\Program Files\MongoDB\Server\5.0\bin
pause
exit /b 1

:found_mongo
echo Found MongoDB at: !MONGOD_PATH!

REM Create data directory if it doesn't exist
if not exist "data\db" (
    echo Creating MongoDB data directory...
    mkdir "data\db"
)

REM Check if MongoDB is already running
netstat -an | find "27017" > nul
if !errorlevel! equ 0 (
    echo MongoDB is already running
) else (
    echo Starting MongoDB...
    start "MongoDB" "!MONGOD_PATH!" --dbpath "data\db"
    echo Waiting for MongoDB to start...
    timeout /t 5 /nobreak
)

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Installing requirements...
    pip install -r requirements.txt
)

REM Start Flask application
echo Starting Flask application...
python server.py

pause
