$body = @{ email = 'master@base44.com'; password = 'master123_dev' } | ConvertTo-Json
try {
  $resp = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
  Write-Output "Status: $($resp.StatusCode)"
  Write-Output "Body: $($resp.Content)"
} catch {
  Write-Output "Error: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $content = $reader.ReadToEnd()
    Write-Output "Response body: $content"
  }
}