$PROJECT_ID = "your-project-id"
$SA_EMAIL = "peerprep-cd-sa@${PROJECT_ID}.iam.gserviceaccount.com"

Write-Host "Setting up IAM for project: $PROJECT_ID" -ForegroundColor Green
Write-Host "Service Account: $SA_EMAIL" -ForegroundColor Green

# Cloud Run Admin
Write-Host "`nGranting Cloud Run Admin role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/run.admin"

# Artifact Registry Writer
Write-Host "`nGranting Artifact Registry Writer role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/artifactregistry.writer"

# Service Account User (to use the service account)
Write-Host "`nGranting Service Account User role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/iam.serviceAccountUser"

Write-Host "`nIAM setup complete!" -ForegroundColor Green
Write-Host "`nNext step: Create service account key with:" -ForegroundColor Cyan
Write-Host "  gcloud iam service-accounts keys create key.json --iam-account=$SA_EMAIL" -ForegroundColor White

