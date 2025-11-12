# Piston API Installation Guide for Google Cloud VM

This guide provides step-by-step instructions for installing and deploying Piston API on a Google Cloud Platform (GCP) Compute Engine VM instance with public HTTP access.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create a Google Cloud VM Instance](#step-1-create-a-google-cloud-vm-instance)
3. [Step 2: Install Docker on the VM](#step-2-install-docker-on-the-vm)
4. [Step 3: Deploy Piston API Container](#step-3-deploy-piston-api-container)
5. [Step 4: Configure Firewall Rules](#step-4-configure-firewall-rules)
6. [Step 5: Set Up Service Management](#step-5-set-up-service-management)
7. [Step 6: Verify Installation](#step-6-verify-installation)
8. [Install Language Packages](#install-language-packages)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

## Prerequisites

- Google Cloud Platform account with billing enabled
- `gcloud` CLI installed and configured
- Basic knowledge of Linux command line
- A GCP project ID

### Install and Configure gcloud CLI

```bash
# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows: Download from https://cloud.google.com/sdk/docs/install

# Authenticate and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud config list
```

## Step 1: Create a Google Cloud VM Instance

Create a VM with at least 2 vCPUs and 4GB RAM:

```bash
PROJECT_ID="your-project-id"
ZONE="us-central1-a"
VM_NAME="piston-api-vm"
MACHINE_TYPE="e2-standard-2"  # 2 vCPUs, 8GB RAM
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

gcloud compute instances create $VM_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE \
  --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
  --maintenance-policy=MIGRATE \
  --provisioning-model=STANDARD \
  --service-account=$(gcloud iam service-accounts list --filter="displayName:Compute Engine default service account" --format="value(email)") \
  --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
  --create-disk=auto-delete=yes,boot=yes,device-name=$VM_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=20,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-standard \
  --no-shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring \
  --labels=goog-ec-src=vm_add-gcloud \
  --reservation-affinity=any

# Get the external IP address
gcloud compute instances describe $VM_NAME \
  --zone=$ZONE \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# SSH into the VM
gcloud compute ssh $VM_NAME --zone=$ZONE
```

## Step 2: Install Docker on the VM

Once connected via SSH, install Docker:

```bash
# Update system packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker run hello-world

# (Optional) Add user to docker group to avoid sudo
sudo usermod -aG docker $USER
newgrp docker
```

## Step 3: Deploy Piston API Container

**Important:** The volume mount `-v piston_packages:/piston/packages` is **required**. Without it, the container will fail.

```bash
# Create Docker volume for persistent package storage
sudo docker volume create piston_packages

# Run the Piston API container
sudo docker run -d \
  --name piston-api \
  --restart unless-stopped \
  -p 2000:2000 \
  --privileged \
  -v piston_packages:/piston/packages \
  -e PISTON_COMPILE_TIMEOUT=30000 \
  -e PISTON_RUN_TIMEOUT=10000 \
  ghcr.io/engineer-man/piston:latest

# Verify container is running
sudo docker ps
sudo docker logs piston-api
```

**Container flags explained:**
- `-d`: Run in detached mode
- `--restart unless-stopped`: Auto-restart on reboot/crash
- `-p 2000:2000`: Map container port to host
- `--privileged`: Required for code execution isolation
- `-v piston_packages:/piston/packages`: **Required** volume mount for packages

## Step 4: Configure Firewall Rules

**Run this from your local machine** (not the VM), as the VM's service account lacks permissions:

```bash
PROJECT_ID="your-project-id"
RULE_NAME="allow-piston-api"

gcloud compute firewall-rules create $RULE_NAME \
  --project=$PROJECT_ID \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:2000 \
  --source-ranges=0.0.0.0/0 \
  --description="Allow HTTP access to Piston API on port 2000"

# Verify the rule
gcloud compute firewall-rules list --filter="name=$RULE_NAME"
```

**Note:** `--source-ranges=0.0.0.0/0` allows access from any IP. For production, restrict to specific IP ranges.

**Alternative:** Create via [GCP Console > VPC Network > Firewall](https://console.cloud.google.com/networking/firewalls)

## Step 5: Set Up Service Management

Create a systemd service for better control:

```bash
# Create service file
sudo nano /etc/systemd/system/piston-api.service
```

Add the following content:

```ini
[Unit]
Description=Piston API Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/docker start piston-api
ExecStop=/usr/bin/docker stop piston-api
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable piston-api.service
sudo systemctl start piston-api.service
sudo systemctl status piston-api.service
```

## Step 6: Verify Installation

### Test from Within the VM

```bash
curl http://localhost:2000/api/v2/runtimes | python3 -m json.tool
```

### Test from Your Local Machine

Replace `YOUR_VM_EXTERNAL_IP` with the IP from Step 1:

**Linux/macOS:**
```bash
curl http://YOUR_VM_EXTERNAL_IP:2000/api/v2/runtimes | python3 -m json.tool
```

**Windows PowerShell:**
```powershell
$response = Invoke-WebRequest -Uri "http://YOUR_VM_EXTERNAL_IP:2000/api/v2/runtimes"
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Test Code Execution

```bash
curl -X POST http://YOUR_VM_EXTERNAL_IP:2000/api/v2/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "*",
    "files": [{
      "content": "print(\"Hello, World!\")"
    }]
  }'
```

## Install Language Packages

The base Piston image doesn't include language runtimes. Install them via the API:

### Quick Install Script

Create and run this script to install multiple languages:

```bash
cat > install-languages.sh << 'EOF'
#!/bin/bash
set -e

PORT=${PORT:-2000}
PISTON_URL="http://localhost:${PORT}"

languages=(
    "python:*"
    "node:*"
    "java:*"
    "gcc:*"
    "go:*"
    "rust:*"
    "typescript:*"
    "php:*"
    "ruby:*"
    "mono:*"
    "swift:*"
    "kotlin:*"
    "scala:*"
)

install_language() {
    local lang_spec=$1
    local name=$(echo $lang_spec | cut -d':' -f1)
    local version=$(echo $lang_spec | cut -d':' -f2)
    
    echo "Installing $name version $version..."
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "${PISTON_URL}/api/v2/packages" \
        -H "Content-Type: application/json" \
        -d "{\"language\": \"${name}\", \"version\": \"${version}\"}")
    
    if [ "$http_code" -eq 200 ]; then
        echo "✓ Successfully requested installation for $name"
    else
        echo "✗ Error requesting installation for $name (HTTP Status: $http_code)"
    fi
    sleep 1
}

echo "Installing language packages..."
for lang in "${languages[@]}"; do
    install_language "$lang"
done

echo ""
echo "Language installation requests finished."
echo "Installation happens in the background. Monitor progress with:"
echo "  curl http://localhost:${PORT}/api/v2/runtimes | python3 -m json.tool"
echo ""
echo "Expected installation times:"
echo "  - Fast (1-3 min): python, node, php, ruby"
echo "  - Medium (3-8 min): go, gcc, typescript"
echo "  - Slow (10-20+ min): java, rust, mono, swift, kotlin, scala"
echo "  - Mono (C#) can take 15-30 minutes - this is normal!"
EOF

chmod +x install-languages.sh
./install-languages.sh
```

### Manual Installation

Install individual languages:

```bash
# Install Python
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "*"}'

# Check installation progress
curl http://localhost:2000/api/v2/runtimes | python3 -m json.tool
```

**Important Notes:**
- Installation is asynchronous - requests return immediately, installation happens in background
- Languages install in parallel
- Installed packages persist across container restarts (via Docker volume)
- Monitor progress: `curl http://localhost:2000/api/v2/runtimes | python3 -m json.tool`

## Troubleshooting

### Container Won't Start or Keeps Restarting

**Error:** "chown: cannot access '/piston': No such file or directory"

**Solution:** The volume mount is missing. Recreate the container with the volume:

```bash
sudo docker stop piston-api
sudo docker rm piston-api
sudo docker volume create piston_packages
sudo docker run -d \
  --name piston-api \
  --restart unless-stopped \
  -p 2000:2000 \
  --privileged \
  -v piston_packages:/piston/packages \
  -e PISTON_COMPILE_TIMEOUT=30000 \
  -e PISTON_RUN_TIMEOUT=10000 \
  ghcr.io/engineer-man/piston:latest
```

### Cannot Access API from External IP

1. **Check raw response:**
   ```bash
   curl -v http://YOUR_VM_EXTERNAL_IP:2000/api/v2/runtimes
   ```

2. **Verify firewall rule exists:**
   ```bash
   gcloud compute firewall-rules list --filter="name=allow-piston-api"
   ```

3. **Test from within VM first:**
   ```bash
   curl http://localhost:2000/api/v2/runtimes
   ```

4. **Check container is listening:**
   ```bash
   sudo docker exec piston-api netstat -tlnp | grep 2000
   # Should show 0.0.0.0:2000, not 127.0.0.1:2000
   ```

### Firewall Rule Creation Fails

**Error:** "Request had insufficient authentication scopes"

**Solution:** Create the firewall rule from your **local machine**, not the VM. The VM's service account doesn't have permissions.

### Container Keeps Restarting

```bash
# Check detailed logs
sudo docker logs --tail 100 piston-api

# Check system resources
free -h
df -h

# Verify Docker is running
sudo systemctl status docker
```
