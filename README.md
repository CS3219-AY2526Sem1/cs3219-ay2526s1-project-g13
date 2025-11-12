[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: G13

## Live Deployment

**Deployment URL:** [https://cs3219-ay2526s1-g13.com/](https://cs3219-ay2526s1-g13.com/)

## Local Development

This section provides instructions for running the application locally on your machine.

### Prerequisites

Before starting, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Docker](https://www.docker.com/) and Docker Compose
- Git

### Step 1: Start Infrastructure Services

Start all required infrastructure services (MongoDB, Redis, RabbitMQ, Kafka, Piston API) using Docker Compose:

```bash
# Start all infrastructure services
docker-compose up -d mongodb redis rabbitmq zookeeper kafka piston-api

# Verify services are running
docker-compose ps
```

**Note:** The Piston API container needs language packages installed. After the services start, run the initialization script (see Step 2).

### Step 2: Initialize Piston Language Packages

After starting the Docker services, install language packages for the Piston API:

**Linux/Mac (Bash):**
```bash
chmod +x init-piston-languages.sh
./init-piston-languages.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File .\init-piston-languages.ps1
```

Alternatively, if your PowerShell execution policy allows it:
```powershell
.\init-piston-languages.ps1
```

**Note:** Language installation happens asynchronously in the background. Some languages may take 10-30 minutes to install. The API will be functional even while languages are installing.

### Step 3: Start Backend Services

Each backend service should be started individually. Navigate to each service directory and start them:

```bash
# User Service (Port 8001)
cd backend/user-service
pnpm install
pnpm start

# Matching Service (Port 8002)
cd backend/matching-service
pnpm install
pnpm start

# Question Service (Port 8003)
cd backend/question-service
pnpm install
pnpm start

# Collaboration Service (Port 8004)
cd backend/collaboration-service
pnpm install
pnpm start

# Execution Service
cd backend/execution-service
pnpm install
pnpm start

# Video Call Service (Port 8011)
cd backend/video-call-service
pnpm install
pnpm start
```

**Alternative:** You can also start all backend services using Docker Compose:

```bash
# Start all services including backend
docker-compose up -d
```

### Step 4: Start Frontend

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000 in your browser
```

### Available Frontend Commands
- `pnpm dev` - Start frontend development server
- `pnpm build` - Build frontend for production
- `pnpm lint` - Run linting
- `pnpm format` - Format code

### Service Ports

When running locally, services are available at:
- **Frontend:** http://localhost:3000
- **User Service:** http://localhost:8001
- **Matching Service:** http://localhost:8002
- **Question Service:** http://localhost:8003
- **Collaboration Service:** http://localhost:8004
- **Video Call Service:** http://localhost:8011
- **Piston API:** http://localhost:2000
- **RabbitMQ Management:** http://localhost:15672 (user: `user`, password: `password`)

## MongoDB Setup

This project uses MongoDB as the database, configured with Docker Compose for easy development setup.

### Starting MongoDB

```bash
# Start MongoDB container
docker-compose up -d mongodb

# View logs
docker-compose logs mongodb

# Stop MongoDB container
docker-compose down
```

### MongoDB Connection Details

- **Host**: `localhost`
- **Port**: `27017`
- **Username**: `admin`
- **Password**: `password`
- **Database**: You can create your own databases as needed

### Connecting to MongoDB

#### Using MongoDB Compass (GUI)
1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Use connection string: `mongodb://admin:password@localhost:27017`
3. Click "Connect" to access your MongoDB instance

#### Using MongoDB Shell (CLI)
```bash
# Connect to MongoDB shell
docker exec -it mongodb mongosh -u admin -p password

# Or connect from host machine (if mongosh is installed locally)
mongosh mongodb://admin:password@localhost:27017
```

#### Using Node.js/JavaScript
```javascript
const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:password@localhost:27017';
const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    // Your database operations here
  } finally {
    await client.close();
  }
}
```

### Database Initialization

The `mongo-init` directory is mounted to `/docker-entrypoint-initdb.d` in the container. Any `.js` or `.sh` files placed in this directory will be executed when the MongoDB container starts for the first time.

To add initialization scripts:
1. Create `.js` files in the `mongo-init` directory
2. Restart the container: `docker-compose restart mongodb`

### Useful Commands

```bash
# View container status
docker-compose ps

# Access MongoDB shell directly
docker exec -it mongodb mongosh -u admin -p password

# Backup database
docker exec mongodb mongodump --username admin --password password --out /data/backup

# Restore database
docker exec mongodb mongorestore --username admin --password password /data/backup
```

## Project Structure

- **Frontend:** Next.js application in `frontend/` directory
- **Backend Services:** Individual microservices in `backend/` directory:
  - `user-service/` - User authentication and management
  - `matching-service/` - User matching for practice sessions
  - `question-service/` - Question management
  - `collaboration-service/` - Real-time collaboration features
  - `execution-service/` - Code execution service
  - `video-call-service/` - Video call functionality
- **Infrastructure:** Docker Compose configuration and Terraform deployment scripts
- **Terraform:** Infrastructure as code for GCP deployment in `terraform/` directory

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 

### Execution Service API

The execution service provides the following endpoints:

```bash
POST /v1/execution/submit # submit language, code -> submit_id
GET /v1/execution/submit/{submit_id} # get result -> submit_status = {pending | processing | done}, result
```

## Deployment

For deployment instructions, please refer to the documentation in the `terraform/` folder:

- **General Deployment:** See the README and configuration files in the `terraform/` directory
- **Piston API Setup:** See [`terraform/PISTON_API_INSTALLATION_GUIDE.md`](terraform/PISTON_API_INSTALLATION_GUIDE.md) for detailed instructions on setting up Piston API on Google Cloud Platform

The deployment uses Google Cloud Platform (GCP) with Terraform for infrastructure as code.
