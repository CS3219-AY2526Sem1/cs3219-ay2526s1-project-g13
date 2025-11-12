# Collaboration Service

The Collaboration Service is a microservice responsible for managing real-time collaborative coding sessions in PeerPrep. It provides real-time collaborative coding sessions with WebSocket-based document synchronization using Yjs CRDT, room management, and asynchronous code execution.

## Features

- Real-time collaborative code editing using Yjs CRDT (Conflict-free Replicated Data Type)
- Room-based session management with automatic closure after inactivity
- Integration with the Matching Service for automatic room creation
- Integration with the Question Service to fetch question details
- Integration with the Execution Service for asynchronous code execution
- MongoDB persistence for rooms and documents
- JWT-based authentication and authorization

## Technology Stack

- Node.js + Express
- WebSocket (ws library)
- Yjs + y-mongodb-provider
- MongoDB + Mongoose
- RabbitMQ/Google Pub/Sub (code execution events)
- Kafka/Google Pub/Sub (room creation events)

## Ports

- HTTP API & WebSocket: `8004`

## Architecture

### System Architecture

The Collaboration Service integrates with other microservices and infrastructure components as follows:

```mermaid
graph TB
    Frontend[Frontend Application]
    CS[Collaboration Service]
    MS[Matching Service]
    QS[Question Service]
    ES[Execution Service]
    MQ1[Message Queue<br/>Room Creation]
    MQ2[Message Queue<br/>Code Execution]
    MongoDB[(MongoDB)]

    Frontend -->|HTTP API| CS
    Frontend -->|WebSocket| CS
    MS -->|Publish| MQ1
    MQ1 -->|Consume| CS
    CS -->|Publish| MQ1
    MQ1 -->|Consume| MS
    CS -->|HTTP| QS
    CS -->|Publish| MQ2
    MQ2 -->|Consume| ES
    ES -->|HTTP Callback| CS
    CS -->|Read/Write| MongoDB
```

### Room Creation Flow

When users are matched, the Matching Service triggers room creation through the message queue:

```mermaid
sequenceDiagram
    participant MS as Matching Service
    participant MQ as Message Queue
    participant CS as Collaboration Service
    participant DB as MongoDB

    MS->>MQ: Publish room creation request
    Note over MQ: Topic: room_creation_topic
    MQ->>CS: Consume room creation event
    CS->>DB: Create room document
    CS->>DB: Initialize Yjs document
    CS->>MQ: Publish room created event
    Note over MQ: Topic: room_created_topic
    MQ->>MS: Consume room created event
    MS->>MS: Notify matched users
```

### WebSocket Collaboration Flow

Real-time collaboration uses Yjs for conflict-free document synchronization:

```mermaid
sequenceDiagram
    participant Client1
    participant Client2
    participant WS as WebSocket Server
    participant YDoc as Yjs Document
    participant DB as MongoDB

    Client1->>WS: Connect with JWT token
    WS->>WS: Authenticate & Authorize
    WS->>YDoc: Load/Create Yjs document
    YDoc->>DB: Load persisted state
    DB-->>YDoc: Return document state
    YDoc-->>Client1: Send initial state

    Client1->>YDoc: Edit operation
    YDoc->>DB: Persist update
    YDoc->>WS: Broadcast update
    WS->>Client2: Send update

    Client2->>YDoc: Edit operation
    YDoc->>DB: Persist update
    YDoc->>WS: Broadcast update
    WS->>Client1: Send update
```

### Code Execution Flow

Code execution is handled asynchronously through a message queue:

```mermaid
sequenceDiagram
    participant Client
    participant CS as Collaboration Service
    participant MQ as Message Queue
    participant ES as Execution Service
    participant Piston as Piston API

    Client->>CS: POST /api/v1/code/submit-code
    CS->>Client: Broadcast execution started
    CS->>MQ: Publish execution job
    MQ->>ES: Consume execution job
    ES->>Piston: Execute code
    Piston-->>ES: Return execution result
    ES->>CS: POST /api/v1/code/execute-callback
    CS->>Client: Broadcast execution result
```

### Data Flow Diagram

End-to-end flow from user matching to collaboration:

```mermaid
flowchart TD
    Start[Users Matched] --> Match[Matching Service]
    Match --> MQ1[Message Queue:<br/>room_creation_topic]
    MQ1 --> Create[Collaboration Service:<br/>Create Room]
    Create --> DB1[(MongoDB:<br/>Room Metadata)]
    Create --> DB2[(MongoDB:<br/>Yjs Document)]
    Create --> MQ2[Message Queue:<br/>room_created_topic]
    MQ2 --> Notify[Matching Service:<br/>Notify Users]
    Notify --> Connect[Users Connect via WebSocket]
    Connect --> Collab[Real-time Collaboration]
    Collab --> Execute[Code Execution Request]
    Execute --> MQ3[Message Queue:<br/>job_execution_topic]
    MQ3 --> Worker[Execution Service]
    Worker --> Result[Execution Result]
    Result --> Callback[Callback to Collaboration Service]
    Callback --> Broadcast[Broadcast to All Clients]
```

### Key Integrations

1. **Matching Service**: Consumes room creation requests via message queue (Kafka or Google Pub/Sub)
2. **Question Service**: Fetches question details for room metadata via HTTP
3. **Execution Service**: Processes code execution jobs via message queue (RabbitMQ or Google Pub/Sub) and returns results via HTTP callback
4. **MongoDB**: Stores room metadata and Yjs document state
5. **Frontend**: HTTP API and WebSocket connections for real-time collaboration

## API

### Base URL

- Local: `http://localhost:8004`
- Public: `http://cs3219-ay2526s1-g13.com/api/collaboration`

### Authentication

Most endpoints require JWT via the `Authorization: Bearer <token>`. Token must contain a `username` field.

### HTTP API

#### Get User Rooms

Retrieve all rooms for a specific user.

**Endpoint:** `GET /api/v1/rooms?userId=<userId>`

**Query Parameters:**

- `userId` (required): The ID of the user

**Response:**

```json
{
  "success": true,
  "rooms": [
    {
      "_id": "room_id",
      "roomId": "uuid",
      "questionId": "question_id",
      "userIds": ["user1", "user2"],
      "programmingLanguage": "python",
      "isActive": true,
      "closedAt": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "question": {
        "_id": "question_id",
        "title": "Two Sum",
        "difficulty": "easy",
        "topic": "arrays"
      }
    }
  ]
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "userId query parameter is required"
}
```

#### Get Room Details

Get room information and document content. Requires authentication and user must be part of the room.

**Endpoint:** `GET /api/v1/rooms/:roomId`

**Headers:**

```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "room": {
    "_id": "room_id",
    "roomId": "uuid",
    "questionId": "question_id",
    "userIds": ["user1", "user2"],
    "programmingLanguage": "python",
    "isActive": true,
    "closedAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "document": {
    "content": "def solution():\n    pass"
  }
}
```

**Error Responses:**

404 - Room not found or user not authorized:

```json
{
  "success": false,
  "error": "Room not found"
}
```

401 - Missing or invalid token:

```json
{
  "success": false,
  "error": "Missing Authorization header"
}
```

#### Update Programming Language

Set the programming language for a room. Requires authentication and user must be part of the room. The change is broadcast as `language-change-notification` to all connected clients via WebSocket.

**Endpoint:** `PATCH /api/v1/rooms/:roomId/language`

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "language": "javascript"
}
```

**Supported Languages:**

- `c`, `cpp`, `csharp`, `go`, `java`, `javascript`, `kotlin`, `php`, `python`, `ruby`, `rust`, `swift`, `typescript`

**Response:**

```json
{
  "success": true,
  "message": "Programming language updated to javascript. All clients have been notified."
}
```

**Error Responses:**

400 - Invalid language or room closed:

```json
{
  "success": false,
  "error": "Programming language is required"
}
```

404 - Room not found or user not authorized:

```json
{
  "success": false,
  "error": "Room not found"
}
```

#### Submit Code for Execution

Submit code to be executed asynchronously. The execution start and result are broadcast as `code-execution-started` and `code-execution-result` to all connected clients via WebSocket.

**Endpoint:** `POST /api/v1/code/submit-code`

**Request Body:**

```json
{
  "room_id": "room_uuid",
  "language": "python",
  "source_code": "print('Hello, World!')"
}
```

**Response:**

```json
{
  "message": "Job accepted"
}
```

**Status Code:** `202 Accepted`

**Error Response:**

```json
{
  "error": "Internal Server Error"
}
```

#### Code Execution Callback

Internal endpoint used by the execution service to return execution results. Not intended for direct client use.

**Endpoint:** `POST /api/v1/code/execute-callback`

**Request Body:**

```json
{
  "room_id": "room_uuid",
  "isError": false,
  "output": "Hello, World!\n"
}
```

**Response:**

```json
{
  "message": "Got result and broadcasted to room"
}
```

### Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid JWT)
- `404` - Not Found (room doesn't exist or user not authorized)
- `500` - Internal Server Error

## WebSocket API

### Connection

Connect to the WebSocket server to enable real-time collaboration:

```url
ws://localhost:8004/<roomId>?token=<jwt_token>
```

**Parameters:**

- `roomId` (path): The room ID to join
- `token` (query): JWT authentication token

**Example:**

```url
ws://localhost:8004/550e8400-e29b-41d4-a716-446655440000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Connection Lifecycle

1. Client connects with room ID and JWT token
2. Server authenticates the JWT token
3. Server validates room exists and is active
4. Server verifies user is authorized (part of room)
5. Server loads Yjs document from persistence
6. Server sends initial document state to client
7. Client can now send and receive document updates

### Close Codes

The server may close connections with the following codes:

- `4000` - Authentication failed (invalid/missing token)
- `4001` - Unauthorized (user not in room)
- `4002` - Room not found
- `4003` - Room is closed/inactive

### Message Types

#### Document Updates

Document updates are handled automatically by Yjs. The WebSocket connection uses the Yjs protocol for efficient binary updates.

#### Custom Messages

The service also broadcasts custom JSON messages for relevant events:

**Code Execution Started:** `code-execution-started`

```json
{
  "type": "code-execution-started"
}
```

**Code Execution Result:** `code-execution-result`

```json
{
  "type": "code-execution-result",
  "data": {
    "isError": false,
    "output": "Hello, World!\n"
  }
}
```

**Room Closure Notification:** `room-close-notification`

```json
{
  "type": "room-close-notification",
  "data": {
    "closedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Language Change Notification:** `language-change-notification`

```json
{
  "type": "language-change-notification",
  "data": {
    "language": "javascript"
  }
}
```

### Yjs Document Structure

The Yjs document uses a text type named `"monaco"` to store the code editor content:

```javascript
const ydoc = new Y.Doc();
const ytext = ydoc.getText("monaco");
ytext.insert(0, "code content");
```

## Runbooks

### Service Startup

1. **Check Dependencies:**
   - Verify MongoDB is accessible
   - Verify message queue connectivity
   - Verify environment variables are set
   - Verify other dependent services (Question Service, Matching Service, Execution Service) are reachable

2. **Start Service:**

   ```bash
   pnpm start
   ```

3. **Verify Startup:**
   - Check logs for "HTTP API server running on <http://localhost:8004>"
   - Check logs for "WebSocket server running on ws://localhost:8004"
   - Check logs for "Connected to Kafka" (or message queue connection confirmation)
   - Check logs for "Room creation Kafka consumer started" (or message queue consumer started)

### Common Issues

#### Database Connection Issues

**Symptoms:**

- Service fails to start
- Logs show "Failed to connect to MongoDB"

**Resolution:**

1. Verify MongoDB is running: `docker ps | grep mongodb`
2. Check connection string in environment variables
3. Verify network connectivity: `ping mongodb` (in Docker network)
4. Check MongoDB logs: `docker logs mongodb`

#### Message Queue Connectivity Problems

**Symptoms:**

- Service starts but cannot consume messages
- Logs show connection errors
- Room creation requests are not processed

**Resolution:**

1. Verify message queue service is running
2. Check environment variables: `KAFKA_HOST`, `KAFKA_PORT`, `KAFKA_BROKERS`
3. Verify network connectivity to message queue
4. Check message queue logs
5. Verify topics exist: `room_creation_topic`, `room_created_topic`

#### Room Not Found Errors

**Symptoms:**

- Clients cannot connect to rooms
- 404 errors when fetching room details

**Resolution:**

1. Verify room exists in MongoDB:

   ```javascript
   db.rooms.findOne({ roomId: "room_id" });
   ```

2. Check if room is active: `isActive: true`
3. Verify user is in `userIds` array
4. Check room creation flow in logs

#### WebSocket Connection Failures

**Symptoms:**

- Clients cannot establish WebSocket connections
- Connection closes immediately

**Resolution:**

1. Verify JWT token is valid and not expired
2. Check token contains `username` field
3. Verify `JWT_SECRET` matches user service
4. Check room exists and is active
5. Verify user is authorized (in room's `userIds`)

#### Code Execution Not Working

**Symptoms:**

- Code submission accepted but no results
- Timeout errors

**Resolution:**

1. Verify execution service is running
2. Check message queue connectivity for execution jobs
3. Verify callback URL is correct
4. Check execution service logs
5. Verify Piston API is accessible

### Room Management Operations

#### List All Active Rooms

```javascript
// MongoDB query
db.rooms.find({ isActive: true });
```

#### Close a Room Manually

```javascript
// MongoDB update
db.rooms.updateOne(
  { roomId: "room_id" },
  {
    $set: {
      isActive: false,
      closedAt: new Date(),
    },
  },
);
```

#### Clean Up Inactive Rooms

```javascript
// Find rooms closed more than 7 days ago
db.rooms.find({
  isActive: false,
  closedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
});
```

### Log Analysis

**Key Log Patterns:**

1. **Room Creation:**

   ```bash
   Received room creation request: { matchId, requestData }
   Room created successfully: { matchId, roomId }
   ```

2. **WebSocket Connections:**

   ```bash
   WebSocket server running on ws://localhost:8004
   ```

3. **Code Execution:**

   ```bash
   >>> Got code { room_id, language, source_code }
   >>> Sent job: { room_id }
   >>> Callback, broadcasted to room
   ```

4. **Errors:**

   ```bash
   Failed to create room
   WebSocket authentication failed
   Error handling WebSocket connection
   ```

## Design Documentation

### Yjs CRDT-Based Collaboration

The service uses Yjs, a CRDT (Conflict-free Replicated Data Type) library, for real-time collaborative editing. This ensures:

- **Conflict-free merging**: Multiple users can edit simultaneously without conflicts
- **Efficient synchronization**: Only deltas (changes) are transmitted
- **Eventual consistency**: All clients converge to the same state

**Implementation:**

- Each room has a Yjs document identified by the room ID
- The document uses a Y.Text type named `"monaco"` for code content
- Updates are automatically synchronized via WebSocket
- Document state is persisted to MongoDB using `y-mongodb-provider`

### Room Lifecycle Management

**Room States:**

1. **Created**: Room created in database, Yjs document initialized
2. **Active**: Room is open for collaboration, clients can connect
3. **Inactive**: Room is closed, no new connections allowed

**Lifecycle Events:**

- **Creation**: Triggered by matching service via message queue
- **Activation**: Automatic when first client connects
- **Deactivation**: Automatic when no clients remain for `ROOM_TIMEOUT_MINUTES` (default: 10 minutes)
- **Manual Closure**: Can be closed programmatically (currently automated)

**Timeout Mechanism:**

- When the last client disconnects, a timeout is started
- If no clients reconnect within the timeout period, the room is automatically closed
- Timeout duration is configurable via `ROOM_TIMEOUT_MINUTES` environment variable

### Authentication and Authorization

**Authentication:**

- JWT tokens are used for both HTTP and WebSocket authentication
- Tokens are verified using `JWT_SECRET` (must match user service)
- Token must contain a `username` field identifying the user

**Authorization:**

- Users must be in the room's `userIds` array to access a room
- Authorization is checked on:
  - HTTP API requests (via `authenticateHttp` middleware)
  - WebSocket connections (via `authenticateWebSocket` function)
- Unauthorized access returns 404 (to maintain privacy)

### Persistence Strategy

**Room Metadata:**

- Stored in MongoDB using Mongoose
- Collection: `rooms`
- Indexed on `roomId` and `userIds` for efficient queries

**Yjs Document State:**

- Persisted using `y-mongodb-provider`
- Each document gets its own collection in MongoDB
- Updates are stored incrementally
- Full document state is reconstructed on first client connection

**Persistence Hooks:**

- `bindState`: Called when first client connects, loads persisted state
- `update`: Called on every document update, stores incremental changes
- `writeState`: Called when all clients disconnect, final state save

### Code Execution Architecture

**Asynchronous Processing:**

- Code execution is handled asynchronously to avoid blocking
- Jobs are published to a message queue
- Execution service processes jobs and returns results via HTTP callback

**Timeout Handling:**

- Each execution job has a timeout (60 seconds)
- If timeout expires, a timeout message is broadcast to clients
- Stale callbacks (after timeout) are ignored

**Broadcasting:**

- Execution start is immediately broadcast to all room clients
- Execution results are broadcast to all room clients when received
- Uses WebSocket for real-time delivery

### Error Handling

**Connection Errors:**

- Database connection failures cause service startup to fail
- Message queue connection failures are retried with exponential backoff
- WebSocket errors are logged but don't crash the service

**Validation Errors:**

- Invalid requests return 400 with error message
- Missing authentication returns 401
- Unauthorized access returns 404 (privacy)

**Graceful Degradation:**

- If question service is unavailable, rooms are created without question details
- Question details are fetched asynchronously when available
- Room functionality continues even if question fetch fails

### Scalability Considerations

**Horizontal Scaling:**

- Multiple instances can run behind a load balancer
- WebSocket connections are per-instance (sticky sessions recommended)
- Yjs documents are stored in MongoDB (shared state)
- Message queue ensures room creation events reach all instances

**Performance Optimizations:**

- Yjs uses efficient binary protocol for updates
- MongoDB indexes on frequently queried fields
- Room timeouts prevent resource leaks
- Connection pooling for database and message queue

### Security Considerations

**Authentication:**

- JWT tokens prevent unauthorized access
- Token verification on every request/connection
- Shared secret must be kept secure

**Authorization:**

- Room access restricted to authorized users
- Privacy maintained (404 for unauthorized access)
- User IDs validated against room membership

**Input Validation:**

- Programming language enum validation
- Room ID format validation
- Code execution input sanitization (handled by execution service)

### Environment Variables

| Variable               | Description                                                                       | Default                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `PORT`                 | HTTP & WebSocket server port                                                      | `8004`                                                                            |
| `MONGODB_URI`          | MongoDB connection string                                                         | `mongodb://admin:password@localhost:27017/peerprepCollabService?authSource=admin` |
| `ROOM_TIMEOUT_MINUTES` | Minutes before inactive room closes                                               | `10`                                                                              |
| `QUESTION_SERVICE_URL` | Question service base URL                                                         | `http://localhost:8003`                                                           |
| `JWT_SECRET`           | JWT verification secret (should match with other services)                        | `your-jwt-secret-here`                                                            |
| `KAFKA_HOST`           | Message queue host (implementation-specific variable name)                        | `localhost`                                                                       |
| `KAFKA_PORT`           | Message queue port (implementation-specific variable name)                        | `29092`                                                                           |
| `KAFKA_BROKERS`        | Message queue broker addresses (implementation-specific variable name)            | `localhost:29092`                                                                 |
| `RABBITMQ_URL`         | RabbitMQ connection URL                                                           | `amqp://user:password@rabbitmq`                                                   |
| `PUBSUB_PROJECT_ID`    | Google Pub/Sub project ID (if using Google Pub/Sub to replace Kafka and RabbitMQ) |                                                                                   |
| `WEB_BASE_URL`         | Frontend base URL for CORS                                                        | `http://localhost:3000`                                                           |

### Deployment

**Docker:**

```bash
docker build -f Dockerfile.collaboration -t collaboration-service .
docker run -p 8004:8004 collaboration-service
```

**Docker Compose:**
The service is included in the main `docker-compose.yml` file and will start automatically with all dependencies.

**Production Considerations:**

- Use environment variables for all configuration
- Ensure `JWT_SECRET` matches user service
- Configure proper CORS origins
- Set up monitoring and logging
- Use production-grade message queue (Google Pub/Sub)
- Configure MongoDB connection pooling
- Set up health check endpoints
- Use reverse proxy for WebSocket connections
