Get-NetTCPConnection -State Listen | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        $duration = "N/A"
        try {
            if ($proc.StartTime) {
                $duration = (New-TimeSpan -Start $proc.StartTime).ToString("dd\.hh\:mm\:ss")
            }
        } catch {
            $duration = "Access Denied"
        }
        
        [PSCustomObject]@{
            LocalPort = $_.LocalPort
            PID = $_.OwningProcess
            ProcessName = $proc.ProcessName
            Duration = $duration
        }
    }
} | Sort-Object LocalPort | Format-Table -AutoSize
