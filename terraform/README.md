# Terraform Infrastructure

Infrastructure as Code for deploying PeerPrep to Google Cloud Platform using Terraform. This configuration provisions a complete microservices architecture with Cloud Run, Cloud Load Balancing, Redis, Pub/Sub, and supporting services.

## Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
 subgraph InternetZone["🌐 Internet"]
        Internet(["User"])
  end

 subgraph LbZone["🌀 Load Balancer Layer"]
        LB["Load Balancer<br>Static IP + SSL"]
  end

 subgraph CloudRun["☁️ Cloud Run Services"]
        FE["Frontend"]
        US["User Service"]
        QS["Question Service"]
        MS["Matching Service"]
        CS["Collaboration Service"]
        VS["Video Call Service"]
        ES["Execution Service"]
  end

 subgraph VPC["🔒 Private VPC Network"]
        Connector["VPC Connector<br>10.8.0.0/28"]
        Redis[("Redis<br>Memorystore")]
        Subnet["Subnet<br>10.0.0.0/24"]
  end

 subgraph Databases["🗄️ MongoDB Atlas"]
        DB1[("User DB")]
        DB2[("Question DB")]
        DB3[("Collab DB")]
  end

 subgraph Messaging["🪶 Pub/Sub"]
        PS["Pub/Sub Topics<br>&amp; Subscriptions"]
  end

 subgraph Artifacts["🧱 Artifacts"]
        AR["Artifact Registry<br>Docker Images"]
  end

 subgraph Security["🔐 Security & IAM"]
        SA["Service Account"]
        SM["Secret Manager<br>JWT Secrets, API Keys, etc."]
  end

 subgraph External["⚙️ External Services"]
        Piston["Piston API<br>Code Executor"]
  end

    Internet --> LB
    LB -- / --> FE
    LB -- /api/user/* --> US
    LB -- /api/question/* --> QS
    LB -- /api/matching/* --> MS
    LB -- /api/collaboration/* --> CS
    LB -- "/api/video-call/*" --> VS

    Connector --> Redis
    MS --> Connector & PS
    US --> DB1
    QS --> DB2 & PS
    CS --> DB3 & PS & ES
    ES --> PS & Piston

    SA --> CloudRun
    SM --> CloudRun
    AR --> CloudRun

```

## Infrastructure Components

### Core Services

| Component              | Type                  | Purpose                                  |
| ---------------------- | --------------------- | ---------------------------------------- |
| **Cloud Run Services** | Serverless containers | Hosts all microservices and frontend     |
| **Load Balancer**      | Global HTTPS LB       | Routes traffic with path-based routing   |
| **Static IP**          | Global IP address     | Fixed entry point for DNS                |
| **SSL Certificate**    | Google-managed        | Automatic HTTPS with certificate renewal |

### Networking

| Component         | Configuration | Purpose                            |
| ----------------- | ------------- | ---------------------------------- |
| **VPC Network**   | Custom VPC    | Private network for some resources |
| **Subnet**        | 10.0.0.0/24   | IP range for VPC resources         |
| **VPC Connector** | 10.8.0.0/28   | Connects Cloud Run to VPC          |

### Data & Messaging

| Component                 | Tier/Config     | Purpose                                          |
| ------------------------- | --------------- | ------------------------------------------------ |
| **Redis (Memorystore)**   | BASIC, 1GB      | Used by Matching Service for matching users      |
| **Pub/Sub Topics**        | 5 topics        | Event-driven messaging (replaces Kafka/RabbitMQ) |
| **Pub/Sub Subscriptions** | 5 subscriptions | Message consumption with retry policies          |
| **Artifact Registry**     | Docker format   | Docker image storage                             |

### Security & IAM

| Component                 | Configuration            | Purpose                           |
| ------------------------- | ------------------------ | --------------------------------- |
| **Service Account**       | peerprep-service-account | Identity for all services         |
| **Secret Manager Access** | secretAccessor role      | Services read secrets             |
| **Pub/Sub Access**        | pubsub.editor role       | Services publish/consume messages |
| **Public Access**         | run.invoker for allUsers | HTTPS access via load balancer    |

### Pub/Sub Topics

| Topic                 | Producers             | Consumers             | Purpose               |
| --------------------- | --------------------- | --------------------- | --------------------- |
| `match_topic`         | Matching Service      | Matching Service      | Match coordination    |
| `question_topic`      | Question Service      | Matching Service      | Question updates      |
| `room_creation_topic` | Matching Service      | Collaboration Service | Trigger room creation |
| `room_created_topic`  | Collaboration Service | Matching Service      | Notify room ready     |
| `job_execution_topic` | Collaboration Service | Execution Service     | Code execution jobs   |

## Prerequisites

### Required Tools

- **Terraform** ([install](https://developer.hashicorp.com/terraform/downloads))
- **gcloud CLI** ([install](https://cloud.google.com/sdk/docs/install))
- **Docker** with buildx support ([install](https://docs.docker.com/get-docker/))

### GCP Setup (using gcloud CLI)

#### 1. Create GCP Project

```bash
# Create project
gcloud projects create PROJECT_ID --name="CS3219-PeerPrep"

# Set as active project
gcloud config set project PROJECT_ID

# Enable billing (required for Cloud Run, Redis, etc.)
# Go to: https://console.cloud.google.com/billing
```

#### 2. Create Terraform State Bucket

```bash
# Create bucket for Terraform remote state
gsutil mb -l REGION gs://cs3219-peerprep-terraform-state

# Enable versioning (recommended)
gsutil versioning set on gs://cs3219-peerprep-terraform-state
```

#### 3. Register Domain Name

Purchase a domain from [Google Cloud Domains](https://console.cloud.google.com/net-services/domains) or any registrar.

- Example: `cs3219-ay2526s1-g13.com`
- Need access to DNS settings for A record configuration for the static IP later.

#### 4. Create MongoDB Atlas Databases

Create 3 databases on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):

1. **User Database**: For user-service
2. **Question Database**: For question-service
3. **Collaboration Database**: For collaboration-service

We can also create 1 database with 3 collections if preferred, but separate DBs are better for isolation and scaling.

**Connection Strings** (save for later):

```url
mongodb+srv://username:password@cluster.mongodb.net/userDB
mongodb+srv://username:password@cluster.mongodb.net/questionDB
mongodb+srv://username:password@cluster.mongodb.net/collabDB
```

#### 5. Configure Secret Manager

Create secrets in [Secret Manager](https://console.cloud.google.com/security/secret-manager):

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets (repeat for each secret)
echo -n "your-secret-value" | gcloud secrets create "your-secret-name" --data-file=-
```

**Required Secrets:**

| Secret Name                          | Used By               | Purpose                                                  |
| ------------------------------------ | --------------------- | -------------------------------------------------------- |
| `jwt_secret`                         | All services          | JWT token signing/verification                           |
| `mongodb_uri_user`                   | user-service          | User database connection                                 |
| `mongodb_uri_question`               | question-service      | Question database connection                             |
| `mongodb_uri_collaboration`          | collaboration-service | Collaboration database connection                        |
| `email_user`                         | user-service          | Email verification sender, used by User Service          |
| `email_password`                     | user-service          | Email SMTP authentication, used by User Service          |
| `video_call_service_app_id`          | video-call-service    | Agora video call app ID, used by Video Call Service      |
| `video_call_service_app_certificate` | video-call-service    | Agora video call certificate, used by Video Call Service |

#### 6. Authenticate with GCP

```bash
# Login to GCP
gcloud auth login

# Set application default credentials (for Terraform)
gcloud auth application-default login

# Configure Docker authentication for Artifact Registry
gcloud auth configure-docker REGION-docker.pkg.dev
```

## Deployment Steps

### 1. Build and Push Docker Images

Use the build script to create and push all Docker images:

```bash
# From project root
./scripts/build-and-push.sh PROJECT_ID REGION
```

Remember to create the Artifact Registry repository with the same repository name used in the script (i.e., `docker-repo`):

```bash
gcloud artifacts repositories create docker-repo \
  --repository-format=docker \
  --location=REGION \
  --description="Docker repository for PeerPrep"
```

Remember to replace `DOMAIN` in the script with your actual domain name for proper CORS configuration.

This builds 7 images:

- frontend
- user-service
- question-service
- matching-service
- collaboration-service
- execution-service
- video-call-service

### 2. Configure Terraform Variables

Create `terraform/terraform.tfvars`:

```hcl
project_id            = "your-gcp-project-id"
region                = "asia-southeast1"
environment           = "production"
room_timeout_minutes  = 10
```

**Configuration Options:**

| Variable               | Required | Default           | Description                |
| ---------------------- | -------- | ----------------- | -------------------------- |
| `project_id`           | Yes      | -                 | GCP project ID             |
| `region`               | No       | `asia-southeast1` | GCP region for resources   |
| `environment`          | No       | `production`      | Environment name           |
| `room_timeout_minutes` | No       | `10`              | Collaboration room timeout |

### 3. Initialize Terraform

```bash
cd terraform

# Download providers and configure backend
terraform init
```

**What happens:**

- Downloads Google Cloud provider
- Configures remote state in GCS bucket
- Prepares Terraform workspace

### 4. Plan Infrastructure

```bash
# Preview changes
terraform plan

# Save plan for review
terraform plan -out=tfplan
```

**Review checklist:**

- [ ] All 7 Cloud Run services will be created
- [ ] Load balancer with SSL certificate
- [ ] Redis instance in VPC
- [ ] Pub/Sub topics and subscriptions
- [ ] IAM bindings for service account

### 5. Apply Infrastructure

```bash
# Apply with saved plan
terraform apply tfplan

# Or apply directly (requires confirmation)
terraform apply
```

### 6. Get Static IP Address

```bash
# Get the static IP from Terraform output
terraform output static_ip

# Example output: 34.107.XX.XX
```

### 7. Update DNS Records

In your domain registrar's DNS settings, create an **A record**:

| Type | Name                  | Value                        | TTL |
| ---- | --------------------- | ---------------------------- | --- |
| A    | @ (or your subdomain) | `<static_ip_from_terraform>` | 300 |

**Verify DNS:**

```bash
# Check DNS resolution
nslookup cs3219-ay2526s1-g13.com

# Should return the static IP
```

### 8. Wait for SSL Certificate

```bash
# Check SSL certificate status
gcloud compute ssl-certificates describe peerprep-ssl-cert

# Look for status: ACTIVE
```

### 9. Verify Deployment

```bash
# Check all services are running
gcloud run services list --region=REGION
```

## Deployment Architecture

### Build and Deploy Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Script as build-and-push.sh
    participant AR as Artifact Registry
    participant TF as Terraform
    participant GCP as GCP
    participant DNS as DNS Provider

    Dev->>Script: Run build script
    Script->>Script: Build 7 Docker images
    Script->>AR: Push images to registry

    Dev->>TF: terraform init
    TF->>GCP: Download state from GCS

    Dev->>TF: terraform plan
    TF->>GCP: Check current infrastructure
    TF-->>Dev: Show planned changes

    Dev->>TF: terraform apply
    TF->>GCP: Create VPC & subnet
    TF->>GCP: Create VPC connector
    TF->>GCP: Create Redis instance
    TF->>GCP: Create Pub/Sub topics
    TF->>GCP: Deploy Cloud Run services
    TF->>GCP: Configure load balancer
    TF->>GCP: Request SSL certificate
    TF-->>Dev: Output static IP

    Dev->>DNS: Update A record with IP
    DNS->>GCP: DNS resolves to LB

    GCP->>GCP: Validate domain ownership
    GCP->>GCP: Provision SSL certificate

    Dev->>GCP: Verify services running
```

### Traffic Flow

```mermaid
sequenceDiagram
    participant User
    participant DNS
    participant LB as Load Balancer
    participant FE as Frontend
    participant MS as Matching Service
    participant Redis
    participant PS as Pub/Sub

    User->>DNS: Resolve domain
    DNS-->>User: Return static IP

    User->>LB: HTTPS request
    LB->>LB: Terminate SSL

    alt Frontend request
        LB->>FE: Forward to Cloud Run
        FE-->>LB: Response
    else API request
        LB->>MS: Forward to service
        MS->>Redis: Via VPC connector
        MS->>PS: Publish event
        MS-->>LB: Response
    end

    LB-->>User: HTTPS response
```

## Common Issues & Troubleshooting

### 1. Terraform Init Fails

**Cause:** Terraform state bucket doesn't exist

**Solution:**

```bash
# Create the state bucket
gsutil mb -l REGION gs://cs3219-peerprep-terraform-state

# Re-run init
terraform init
```

### 2. API Not Enabled

**Cause:** Required GCP APIs not enabled

**Solution:**

```bash
# Enable all required APIs
gcloud services enable \
  run.googleapis.com \
  redis.googleapis.com \
  pubsub.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  compute.googleapis.com \
  secretmanager.googleapis.com
```

### 3. Cloud Run Service Fails to Start

**Cause:** Service crashes on startup, usually due to missing secrets or invalid config

**Solution:**

```bash
# Check service logs
gcloud run services logs read SERVICE_NAME --region=REGION

# Common issues:
# - Secret not found in Secret Manager
# - MongoDB connection string invalid
# - Missing environment variables

# Verify secrets exist
gcloud secrets list

# Check service configuration
gcloud run services describe SERVICE_NAME --region=REGION
```

### 4. Docker Image Not Found

**Cause:** Images not pushed to Artifact Registry before terraform apply

**Solution:**

```bash
# Rebuild and push images
./scripts/build-and-push.sh PROJECT_ID REGION

# Verify images exist
gcloud artifacts docker images list REGION-docker.pkg.dev/PROJECT_ID/docker-repo

# Re-run terraform
terraform apply
```

### 5. Secret Manager Access Denied

**Cause:** Service account lacks Secret Manager permissions

**Solution:**

```bash
# Grant access
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:peerprep-service-account@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Restart service
gcloud run services update SERVICE_NAME --region=REGION
```

### 6. MongoDB Connection Timeout

**Cause:** MongoDB Atlas network access not configured for Google Cloud

**Solution:**

1. Log in to MongoDB Atlas
2. Navigate to Network Access
3. Add IP addresses:
   - **Option A (Recommended)**: Whitelist `0.0.0.0/0` (allow from anywhere)
   - **Option B**: Find Cloud Run egress IPs and whitelist them
4. Wait 1-2 minutes for changes to propagate
5. Restart Cloud Run service

```bash
# Restart service
gcloud run services update SERVICE_NAME --region=REGION
```

## Management Operations

### View Resources

```bash
# List all Cloud Run services
gcloud run services list --region=REGION

# View Terraform state
terraform show

# List all Terraform-managed resources
terraform state list
```

### Update Service Configuration

```bash
# Modify terraform/*.tf files
# Then apply changes
terraform plan
terraform apply
```

### Update Docker Images

```bash
# Rebuild and push images
./scripts/build-and-push.sh PROJECT_ID REGION

# Terraform will detect the new images
# Force Cloud Run to pull new images
terraform apply -replace="google_cloud_run_v2_service.SERVICE_NAME"
```

### Scale Services

Edit `main.tf` to adjust scaling:

```hcl
scaling {
  min_instance_count = 1  # Change to 0 to scale to zero
  max_instance_count = 10 # Increase for more capacity
}
```

Then apply:

```bash
terraform apply
```

### View Logs

```bash
# Service logs
gcloud run services logs read SERVICE_NAME --region=REGION --limit=100

# Follow logs in real-time
gcloud run services logs tail SERVICE_NAME --region=REGION

# Filter logs
gcloud run services logs read SERVICE_NAME --region=REGION --filter="severity=ERROR"
```

### Destroy Infrastructure

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy

# Confirm by typing: yes
```

**Note:** This does NOT delete:

- Docker images in Artifact Registry
- Secrets in Secret Manager
- Terraform state in GCS
- MongoDB Atlas databases
- Domain registration

## Security Best Practices

- Service account with least privilege
- HTTPS only (via load balancer SSL)
- VPC for Redis isolation
- Environment variable injection for secrets stored in Secret Manager (not in code)

## Files Reference

| File               | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| `provider.tf`      | Terraform and GCP provider configuration, remote state |
| `variables.tf`     | Input variable definitions                             |
| `terraform.tfvars` | Variable values (gitignored, use `.example`)           |
| `main.tf`          | Core infrastructure: VPC, Redis, Pub/Sub, Cloud Run    |
| `loadbalancer.tf`  | Load balancer, SSL, URL routing                        |
| `outputs.tf`       | Output values (IPs, URLs)                              |
