$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$pgData = "C:\Program Files\PostgreSQL\18\data"

Write-Host "Registrando PostgreSQL como servicio..."
& "$pgBin\pg_ctl.exe" register -N "postgresql-18" -D "$pgData"

Write-Host "Iniciando servicio..."
Start-Service "postgresql-18"

Write-Host "Estado del servicio:"
Get-Service "postgresql-18"
