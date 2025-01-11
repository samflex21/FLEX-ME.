$downloadUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5-signed.msi"
$installerPath = "$env:USERPROFILE\Downloads\mongodb-windows-x86_64-7.0.5-signed.msi"

Write-Host "Downloading MongoDB installer..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath

Write-Host "Download complete! MongoDB installer saved to: $installerPath"
Write-Host "Please run the installer and follow these steps:"
Write-Host "1. Accept the license agreement"
Write-Host "2. Choose 'Complete' installation"
Write-Host "3. Make sure 'Install MongoDB as a Service' is checked"
Write-Host "4. Make sure 'Add MongoDB to PATH' is checked"
Write-Host "5. Click Install and wait for completion"

Write-Host "`nPress any key to start the installer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process $installerPath
