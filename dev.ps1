# Kill any process holding port 5173
$port = 5173
$pids = netstat -ano | Select-String ":$port\s" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique

foreach ($p in $pids) {
    if ($p -match '^\d+$' -and $p -ne '0') {
        Write-Host "Killing PID $p on port $port..."
        taskkill /F /PID $p 2>$null
    }
}

npm run dev
