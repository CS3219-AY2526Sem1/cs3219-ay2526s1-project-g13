$PISTON_URL = "http://localhost:2000"

$languages = @(
    "python:*",
    "node:*",
    "java:*",
    "gcc:*",
    "go:*",
    "rust:*",
    "typescript:*",
    "php:*",
    "ruby:*",
    "mono:*",
    "swift:*",
    "kotlin:*"
)

function Install-Language {
    param(
        [string]$LangSpec
    )
    
    $parts = $LangSpec -split ':'
    $name = $parts[0]
    $version = $parts[1]
    
    Write-Host "Installing $name version $version..."
    
    $body = @{
        language = $name
        version = $version
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "${PISTON_URL}/api/v2/packages" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host "Successfully requested installation for $name"
        } else {
            Write-Host "Error requesting installation for $name (HTTP Status: $($response.StatusCode))"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Error requesting installation for $name (HTTP Status: $statusCode)"
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "Waiting for Piston API to start..."
do {
    try {
        $response = Invoke-WebRequest -Uri "${PISTON_URL}/api/v2/runtimes" -UseBasicParsing -ErrorAction Stop
        $apiReady = $true
    } catch {
        Write-Host "Waiting..."
        Start-Sleep -Seconds 3
        $apiReady = $false
    }
} while (-not $apiReady)

Write-Host "Piston API is ready."

foreach ($lang in $languages) {
    Install-Language -LangSpec $lang
}

Write-Host "Language installation requests finished."
Write-Host "Final list of installed runtimes:"
try {
    $response = Invoke-WebRequest -Uri "${PISTON_URL}/api/v2/runtimes" -UseBasicParsing
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error fetching runtimes: $_"
}

