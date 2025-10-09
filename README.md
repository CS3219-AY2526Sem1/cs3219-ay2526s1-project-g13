[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: G13

## Quick Start

### Frontend
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

### Available Commands
- `pnpm dev` - Start frontend development server
- `pnpm build` - Build frontend for production
- `pnpm lint` - Run linting
- `pnpm format` - Format code

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

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 
