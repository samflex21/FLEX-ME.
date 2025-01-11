# Start MongoDB
Write-Host "Starting MongoDB..."
$mongoProcess = Start-Process "mongod" -ArgumentList "--dbpath", "C:\data\db" -PassThru

# Wait a moment for MongoDB to start
Start-Sleep -Seconds 5

# Activate virtual environment and start Flask
Write-Host "Starting Flask application..."
if (Test-Path "venv\Scripts\activate.ps1") {
    # Activate venv
    . .\venv\Scripts\activate.ps1
} else {
    Write-Host "Creating virtual environment..."
    python -m venv venv
    . .\venv\Scripts\activate.ps1
    Write-Host "Installing requirements..."
    pip install -r requirements.txt
}

# Set Flask environment variables
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"

# Start Flask
python -m flask run

# Cleanup when the script ends
Register-EngineEvent PowerShell.Exiting -Action {
    if ($mongoProcess) {
        Stop-Process -Id $mongoProcess.Id -Force
    }
}
