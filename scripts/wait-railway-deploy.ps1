Param(
    [int]$MaxChecks = 30,
    [int]$IntervalSeconds = 10
)

for ($i = 0; $i -lt $MaxChecks; $i++) {
    try {
        $json = npx @railway/cli status --json 2>$null
        $s = $null
        if ($json) { $s = $json | ConvertFrom-Json }
        if ($s -ne $null) {
            $edges = $s.environments.edges
            foreach ($envEdge in $edges) {
                $svcEdges = $envEdge.node.serviceInstances.edges
                foreach ($svcEdge in $svcEdges) {
                    if ($svcEdge.node.serviceName -eq 'erp-backend') {
                        $status = $svcEdge.node.latestDeployment.status
                        Write-Host "[Check $i] Deployment status: $status"
                        if ($status -eq 'SUCCESS' -or $status -eq 'FAILED') { exit 0 }
                    }
                }
            }
        } else {
            Write-Host "[Check $i] No status JSON returned"
        }
    } catch {
        Write-Host "[Check $i] Error fetching status: $_"
    }
    Start-Sleep -Seconds $IntervalSeconds
}
Write-Host "Timeout waiting for deployment"
exit 2
