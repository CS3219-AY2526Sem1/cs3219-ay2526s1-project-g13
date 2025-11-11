# Question Service

## Overview

The Question Service manages coding practice questions and their solutions. It provides REST APIs for question management and integrates with the matching service via message queue to automatically select questions based on user matching criteria.

## Architecture & Deployment

### Microservices Layout

The question service is part of a microservices architecture that includes:

- **Question Service** (this service) - Port 8003
- **Matching Service** - Port 8002 (sends match events)
- **Collaboration Service** - Port 8004/8005 (receives question assignments)
- **User Service** - Port 8001 (authentication)
- **Frontend** - Port 3000 (consumes question APIs)

### Data Flow

The question service participates in the matching flow:

1. Matching service publishes match event to message queue (match_topic) with topic and difficulty criteria
2. Question service consumes match event from message queue
3. Question service selects a random question matching the criteria using MongoDB aggregation
4. Question service publishes question ID to message queue (question_topic)
5. Matching service receives question ID and forwards to collaboration service for room creation

Additionally, the service provides direct HTTP APIs for:

- Frontend to browse and manage questions
- Admin operations (create, update, archive questions)
- Solution management

### Key Integrations

- **MongoDB**: Primary data store for questions and solutions
- **Message Queue**: Async messaging with matching-service (consumes match_topic, produces question_topic)
- **Express**: HTTP REST API server
- **Mongoose**: MongoDB ODM for data modeling

### Architecture Diagram

```mermaid
graph TB
    Frontend[Frontend Client] -->|HTTP REST| QuestionService[Question Service<br/>Port 8003]
    MatchingService[Matching Service<br/>Port 8002] -->|Publish Match Event| MQ1[Message Queue: match_topic]
    MQ1 -->|Consume| QuestionService
    QuestionService -->|Publish Question ID| MQ2[Message Queue: question_topic]
    MQ2 -->|Consume| MatchingService
    QuestionService -->|Read/Write| MongoDB[(MongoDB<br/>Port 27017)]
    QuestionService -->|Query Questions| MongoDB
```

## API Documentation

### Question Endpoints

**GET /v1/questions**

- **Description**: Fetch all questions with optional filtering
- **Query Parameters**:
  - `status`: Filter by status ("Active" or "Archived")
  - `includeArchived`: Set to "true" to include archived questions
- **Response**: Array of question objects
- **Status Codes**: 200 (success), 400 (invalid status), 500 (server error)

**GET /v1/questions/active**

- **Description**: Convenience endpoint to fetch only active questions
- **Response**: Array of active question objects
- **Status Codes**: 200 (success), 500 (server error)

**GET /v1/questions/archived**

- **Description**: Convenience endpoint to fetch only archived questions
- **Response**: Array of archived question objects
- **Status Codes**: 200 (success), 500 (server error)

**GET /v1/questions/pick**

- **Description**: Select a random question based on optional filters
- **Query Parameters**:
  - `topic`: Filter by topic (e.g., "Array", "Tree")
  - `difficulty`: Filter by difficulty ("Easy", "Medium", "Hard")
  - `includeArchived`: Set to "true" to include archived questions
- **Response**: Single question object
- **Status Codes**: 200 (success), 400 (invalid topic/difficulty), 404 (no match found), 500 (server error)

**GET /v1/questions/:id**

- **Description**: Get a specific question by ID (supports numeric questionID or MongoDB ObjectId)
- **Query Parameters**:
  - `includeArchived`: Set to "true" to access archived questions
- **Response**: Question object
- **Status Codes**: 200 (success), 400 (invalid ID), 404 (not found), 500 (server error)

**POST /v1/questions**

- **Description**: Create a new question
- **Request Body**:
  ```json
  {
    "title": "string (required)",
    "difficulty": "Easy|Medium|Hard (required)",
    "topic": "string (required)",
    "description": "string (required)",
    "examples": [{"input": "string", "output": "string", "explanation": "string"}],
    "link": "string (optional)",
    "mediaLink": "string (optional, must be .jpg/.jpeg/.png)",
    "questionID": "number (optional, auto-assigned if not provided)",
    "status": "Active|Archived (optional, defaults to Active)",
    "suggestedSolution": { /* solution object (optional) */ }
  }
  ```
- **Response**: Created question object
- **Status Codes**: 201 (created), 400 (missing required fields or duplicate questionID), 500 (server error)

**PATCH /v1/questions/:id**

- **Description**: Update an existing question (partial update supported)
- **Request Body**: Any question fields to update
- **Response**: Updated question object
- **Status Codes**: 200 (success), 400 (invalid ID or status), 404 (not found), 500 (server error)

**DELETE /v1/questions/:id**

- **Description**: Archive a question and all its associated solutions
- **Response**: Success message with archived question
- **Status Codes**: 200 (success), 400 (invalid ID), 404 (not found), 500 (server error)

**POST /v1/questions/:id/restore**

- **Description**: Restore an archived question and its solutions to active status
- **Response**: Success message with restored question
- **Status Codes**: 200 (success), 400 (invalid ID), 404 (not found), 500 (server error)

**GET /v1/questions/topics**

- **Description**: Get list of all supported topics
- **Response**: Object with topics array
- **Status Codes**: 200 (success), 500 (server error)

**POST /v1/questions/seed**

- **Description**: Seed database with questions from seed data (admin operation)
- **Response**: Object with count of inserted questions
- **Status Codes**: 200 (success), 500 (server error)

### Solution Endpoints

**GET /v1/questions/:id/solutions**

- **Description**: Get all solutions for a question
- **Query Parameters**:
  - `status`: Filter by status ("Active" or "Archived")
  - `includeArchived`: Set to "true" to include archived solutions
  - `language`: Filter by programming language (case-insensitive)
- **Response**: Array of solution objects
- **Status Codes**: 200 (success), 400 (invalid ID or status), 404 (question not found), 500 (server error)

**POST /v1/questions/:id/solutions**

- **Description**: Create a new solution for a question
- **Request Body**:
  ```json
  {
    "title": "string (optional, defaults to question title + ' - solution')",
    "difficulty": "Easy|Medium|Hard (optional, inherits from question)",
    "topic": "string (optional, inherits from question)",
    "language": "JavaScript|Python|C++|Java (required)",
    "code": "string (required)",
    "explanation": "string (required)",
    "timeComplexity": "O(1)|O(log n)|O(n)|... (optional)",
    "spaceComplexity": "O(1)|O(n)|... (optional)",
    "mediaLink": "string (optional, must be .jpg/.jpeg/.png)"
  }
  ```
- **Response**: Created solution object
- **Status Codes**: 201 (created), 400 (invalid question ID), 404 (question not found), 409 (solution for language already exists), 500 (server error)

**GET /v1/solutions/:solutionId**

- **Description**: Get a specific solution by ID
- **Query Parameters**:
  - `includeArchived`: Set to "true" to access archived solutions
- **Response**: Solution object
- **Status Codes**: 200 (success), 400 (invalid ID), 404 (not found), 500 (server error)

**PATCH /v1/solutions/:solutionId**

- **Description**: Update an existing solution
- **Request Body**: Any solution fields to update
- **Response**: Updated solution object
- **Status Codes**: 200 (success), 400 (invalid ID or status), 404 (not found), 500 (server error)

**DELETE /v1/solutions/:solutionId**

- **Description**: Archive a solution
- **Response**: Success message with archived solution
- **Status Codes**: 200 (success), 400 (invalid ID), 404 (not found), 500 (server error)

**POST /v1/solutions/:solutionId/restore**

- **Description**: Restore an archived solution to active status
- **Response**: Success message with restored solution
- **Status Codes**: 200 (success), 400 (invalid ID), 404 (not found), 500 (server error)

**POST /v1/solutions/seed**

- **Description**: Seed database with solutions from seed data (admin operation)
- **Response**: Object with count of inserted solutions
- **Status Codes**: 200 (success), 500 (server error)

### Message Queue Topics

**Consumed Topics:**

- `match_topic`: Match events from matching service containing topic and difficulty criteria

**Produced Topics:**

- `question_topic`: Question ID responses sent back to matching service

## Runbooks

### Starting the Service

**Development:**

```bash
cd backend/question-service
pnpm install
pnpm run dev
```

**Production (Docker):**

```bash
docker-compose up question-service
```

### Environment Variables

Required environment variables:

- `PORT`: Service port (default: 8003)
- `MONGO_URI`: MongoDB connection string (e.g., mongodb://admin:password@mongodb:27017/peerprepQuestionServiceDB?authSource=admin)
- `MESSAGE_QUEUE_HOST`: Message queue broker host (default: localhost)
- `MESSAGE_QUEUE_PORT`: Message queue broker port (default: 9092)
- `MESSAGE_QUEUE_BROKERS`: Comma-separated message queue broker list

### Monitoring & Debugging

**Check MongoDB Connection:**

```bash
mongosh "mongodb://admin:password@localhost:27017/peerprepQuestionServiceDB?authSource=admin"
> db.questions.countDocuments()
> db.solutions.countDocuments()
```

**View Message Queue Messages:**

```bash
# View messages in message queue (implementation depends on message queue provider)
# For Google Pub/Sub, use gcloud CLI or Pub/Sub console
# For Kafka, use kafka-console-consumer
```

**Check Service Health:**

```bash
curl http://localhost:8003/
```

**View Logs:**

```bash
# Docker
docker logs question-service -f

# Local
# Logs are output to stdout/stderr
```

### Common Issues

**Issue: MongoDB connection failures**

- Verify MongoDB is running: `docker ps | grep mongodb`
- Check MONGO_URI environment variable format
- Verify network connectivity between services
- Check MongoDB authentication credentials

**Issue: Message queue connection failures**

- Verify message queue service is running
- Check MESSAGE_QUEUE_BROKERS environment variable
- Review message queue connection logs

**Issue: No questions found for criteria**

- Verify questions exist in database: `db.questions.find({ status: "Active" })`
- Check topic and difficulty values match enum values
- Verify questions are not archived

**Issue: Duplicate questionID errors**

- Question IDs must be unique
- Check existing questionIDs: `db.questions.find({}, { questionID: 1 })`
- Service auto-assigns next sequential ID if not provided

### Database Seeding

The service automatically seeds questions and solutions on first startup if the database is empty. Manual seeding:

```bash
# Seed questions
curl -X POST http://localhost:8003/v1/questions/seed

# Seed solutions
curl -X POST http://localhost:8003/v1/solutions/seed
```

## Design Documentation

### Data Models

**Question Schema:**

- `questionID` (Number, unique, required): Public numeric identifier
- `title` (String, required): Question title
- `difficulty` (Enum: "Easy", "Medium", "Hard", required)
- `topic` (Enum: 30+ topics, required): Question category
- `description` (String, required): Problem description
- `examples` (Array): Input/output examples with explanations
- `link` (String, optional): External reference link
- `mediaLink` (String, optional): Image URL (must be .jpg/.jpeg/.png)
- `status` (Enum: "Active", "Archived", default: "Active")

**Solution Schema:**

- `questionID` (Number, required, indexed): Reference to parent question
- `title` (String, required): Solution title
- `difficulty` (Enum: "Easy", "Medium", "Hard", required)
- `topic` (Enum: same as Question, required)
- `language` (Enum: "JavaScript", "Python", "C++", "Java", required)
- `code` (String, required): Solution code
- `explanation` (String, required): Solution explanation
- `timeComplexity` (Enum: 9 options, optional): Time complexity notation
- `spaceComplexity` (Enum: 6 options, optional): Space complexity notation
- `mediaLink` (String, optional): Image URL (must be .jpg/.jpeg/.png)
- `status` (Enum: "Active", "Archived", default: "Active")
- Unique constraint: `(questionID, language)` - one solution per language per question

### Question Selection Algorithm

The service uses MongoDB aggregation pipeline for random question selection:

1. **Match Stage**: Filters questions by:

   - Status (default: "Active", unless includeArchived=true)
   - Topic (if provided)
   - Difficulty (if provided)

2. **Sample Stage**: Randomly selects one document from matched results using `$sample: { size: 1 }`

This ensures:

- Fair random distribution
- Efficient querying with proper indexes
- Support for complex filtering criteria

### Supported Topics

The service supports 30+ topics including:

Array, Algorithms, Backtracking, Breadth-first search, Binary search, Bit manipulation, Brainteaser, Data Structures, Databases, Depth-first search, Divide and conquer, Dynamic programming, Greedy, Hash table, Linked list, Math, Matrix, Memoization, Monotonic stack, Recursion, Segment tree, Sorting, Stack, String, Topological sort, Tree, Trie, Two pointers, Queue, Quickselect, Union find

### Status Management

- **Active**: Questions/solutions visible to users and available for matching
- **Archived**: Hidden from normal operations but preserved in database
- **Cascading**: Archiving a question automatically archives all its solutions
- **Restoration**: Restoring a question restores all its solutions

### Message Queue Integration

**Match Event Processing:**

1. Consumes message from `match_topic` with structure:
   ```json
   {
     "topic": "string (optional)",
     "difficulty": "string (optional)",
     "includeArchived": "boolean (optional)"
   }
   ```

2. Selects random question matching criteria
3. Publishes to `question_topic` with structure:
   ```json
   {
     "questionId": "MongoDB ObjectId string"
   }
   ```

**Error Handling:**

- Invalid topic/difficulty: Logs error, no message published
- No question found: Logs error, no message published
- Message parsing errors: Logged and ignored

### Concurrency & Scalability

- **MongoDB Indexes**: questionID is unique indexed, solutions have compound index on (questionID, language)
- **Stateless Design**: Service instances can scale horizontally
- **Message Queue**: Supports multiple consumer instances for load distribution
- **Connection Pooling**: Mongoose handles connection pooling automatically

### Security Considerations

- **Input Validation**: Topic and difficulty values validated against enums
- **ID Validation**: Both numeric questionID and MongoDB ObjectId formats supported
- **Data Sanitization**: Internal MongoDB fields (_id, __v) removed from API responses
- **Archive Protection**: Archived questions/solutions hidden by default unless explicitly requested

## Dependencies

- **express**: HTTP server framework
- **mongoose**: MongoDB ODM
- **kafkajs**: Message queue client (can be replaced with Google Pub/Sub client in production)
- **cors**: CORS middleware
- **dotenv**: Environment variable management

## Development

### Project Structure

```
backend/question-service/
├── src/
│   ├── config/          # Configuration (MongoDB, Message Queue)
│   ├── controllers/     # Request handlers (questions, solutions)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── data/            # Seed data files
│   ├── seed-runner.js   # Seeding utility
│   └── index.js         # Entry point
├── Dockerfile.question  # Docker configuration
└── package.json         # Dependencies
```

### Building

```bash
# No build step required (Node.js runtime)
# For production, ensure dependencies are installed
pnpm install --prod
```

### Testing

Currently no automated tests. Manual testing via:

1. Use HTTP client (curl, Postman) to test REST endpoints
2. Verify message queue integration by triggering matches
3. Test question selection with various topic/difficulty combinations
4. Verify archive/restore functionality

