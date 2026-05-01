# Login
$body = @{ email='master@base44.com'; password='master123_dev' } | ConvertTo-Json
$login = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json' -UseBasicParsing
$data = $login.Content | ConvertFrom-Json
$token = $data.accessToken
Write-Host "Token: $($token.Substring(0,20))..."

# Get current user
$headers = @{ Authorization = "Bearer $token" }
$me = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/me' -Method Get -Headers $headers -UseBasicParsing
$meData = $me.Content | ConvertFrom-Json
Write-Host "User:" $meData.email "-" $meData.full_name
Write-Host "Roles:" ($meData.roles -join ', ')

# Dashboard KPIs
$kpi = Invoke-WebRequest -Uri 'http://localhost:3001/api/dashboard/kpis' -Method Get -Headers $headers -UseBasicParsing
$kpiData = $kpi.Content | ConvertFrom-Json
Write-Host "KPIs status:" $kpi.StatusCode
Write-Host "KPIs data:" ($kpiData | ConvertTo-Json -Depth 3)