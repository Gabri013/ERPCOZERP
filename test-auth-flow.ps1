# Primeiro, obter token
$body = @{ email='master@base44.com'; password='master123_dev' } | ConvertTo-Json
$login = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$data = $login.Content | ConvertFrom-Json
$token = $data.accessToken

Write-Host "Token: $token"

# Agora testar /me
$me = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/me' -Method Get -Headers @{ Authorization = "Bearer $token" }
$me.Content