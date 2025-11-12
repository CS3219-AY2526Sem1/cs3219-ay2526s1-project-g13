# User Service

## Overview

The User Service is responsible for user authentication and account management. It handles user registration, email verification, login, password reset, and profile updates. The service uses JWT-based authentication with refresh tokens and integrates with email services for account verification and password recovery.

## Architecture & Deployment

### Microservices Layout

The user service is part of a microservices architecture that includes:

- **User Service** (this service) - Port 8001
- **Matching Service** - Port 8002
- **Question Service** - Port 8003
- **Collaboration Service** - Port 8004/8005
- **Execution Service** - Code execution
- **Video Call Service** - Video communication

### Key Features

- User registration with email verification (6-digit OTP code)
- JWT-based authentication (access & refresh tokens)
- Password reset via email
- User profile management
- Role-based access control (user/admin)
- Token versioning for logout support

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /v1/register
```
Create a new user account and send verification email.

#### Verify User
```
POST /v1/verify
```
Verify user account with verification code.

#### Resend Verification Code
```
POST /v1/resend
```
Resend verification code to user email.

#### Login User
```
POST /v1/login
```
Authenticate user and issue tokens.
Sets `refresh_token` as HttpOnly cookie.

#### Logout User
```
POST /v1/logout
Authorization: Bearer <accessToken>
```
Logout user and invalidate refresh tokens.


#### Get User Profile
```
GET /v1/account
Authorization: Bearer <accessToken>
```
Retrieve authenticated user's profile information.


#### Send Password Reset Email
```
POST /v1/forgot-password
```
Send password reset link to user email.


#### Reset Password
```
POST /v1/reset-password
```
Reset user password using reset token.


#### Update User Profile
```
PATCH /v1/update-account
Authorization: Bearer <accessToken>
```
Update username and/or password.

#### Refresh Access Token
```
POST /v1/auth/refresh
```
Issue new access token using refresh token from cookies.

## Runbooks

### Starting the Service

**Development:**

```bash
cd backend/user-service
pnpm install
pnpm run dev
```

**Production (Docker):**

```bash
docker-compose up user-service
```

### Environment Variables

Required environment variables (see `.env` file):

```env
# Server Configuration
PORT=8001

# Database
MONGO_URI=mongodb://admin:password@localhost:27017/peerprepUserServiceDB?authSource=admin

# JWT
JWT_SECRET=your-jwt-secret-here

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend
WEB_BASE_URL=http://localhost:3000

# Admin Credentials (for initialization)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@peerprep.com
ADMIN_PW=your-admin-password
```

### Database Initialization

When the service starts:

1. Connects to MongoDB using `MONGO_URI`
2. Automatically creates a default admin user if one doesn't exist using credentials from environment variables
3. Uses the `User` model schema from [`src/model/user-model.js`](src/model/user-model.js)

## Design Documentation

### Archiecture Diagram
```mermaid
flowchart TB
  subgraph Frontend["Frontend"]
    User["User Browser"]
  end

  subgraph "User Service"
    US["User Service<br>Port 8001"]
    USController["Controller"]
    USMiddleware["Middleware (auth-token)"]
    USModel["Model / Repository"]
  end

  subgraph "Data Store"
    MongoDB[("MongoDB<br>User Data")]
  end

  %% Entry
  User -- HTTP Request --> US

  %% Routes that DO NOT require authenticate
  US -- "POST /register" --> USController
  US -- "POST /verify" --> USController
  US -- "POST /resend" --> USController
  US -- "POST /login" --> USController
  US -- "POST /forgot-password" --> USController
  US -- "POST /reset-password" --> USController
  US -- "POST /auth/refresh" --> USController

  %% Routes that DO require authenticate (middleware applied per-route)
  US -- "POST /logout, GET /account, PATCH /update-account" --> USMiddleware
  USMiddleware --> USController

  %% Controller -> Model -> DB
  USController -->|execute business logic| USModel
  USModel <-->|CRUD| MongoDB

  %% Styling
  classDef service fill:#4A90E2,stroke:#2E5282,stroke-width:2px,color:#fff
  classDef storage fill:#50C878,stroke:#27AE60,stroke-width:2px,color:#fff
  class US,USController,USMiddleware,USModel service
  class MongoDB storage
```
### Sequence Diagram
```mermaid
sequenceDiagram
    participant User
    participant UserService as User Service
    participant DB as User DB
    participant NodeMailer as NodeMailer (SMTP)
    participant Auth as JWT Auth Service

    %% =============== SIGN UP ==================
    Note over User: User signs up
    User->>UserService: POST /register (username, email, password)
    UserService->>DB: Insert user (verified = FALSE)
    UserService->>UserService: Generate verification token, OTP
    UserService->>NodeMailer: Send verification email
    NodeMailer-->>User: Email: Verify your account
    UserService-->>User: SUCCESS: User created

    %% =============== VERIFY ACCOUNT ==================
    Note over User: User verifies account
    User->>UserService: POST /verify
    UserService->>UserService: Validate token
    alt Valid
        UserService->>DB: Update verified = TRUE
        UserService-->>User: SUCCESS: User verified
    else Invalid token
        UserService-->>User: Invalid token
    end

    %% =============== SIGN IN ==================
    Note over User: User logs in
    User->>UserService: POST /login (username, password)
    UserService->>DB: Get user by username
    UserService->>UserService: Validate password & account verification
    alt Auth OK
        UserService->>Auth: Generate access & refresh tokens
        Auth-->>UserService: Access token
        UserService-->>User: SUCCESS: User logged in
    else Auth failed
        UserService-->>User: UNAUTHORIZED
    end

    %% =============== UPDATE PROFILE ==================
    Note over User: User updates profile (username/password)
    User->>UserService: PATCH /update-account
    UserService->>Auth: Validate access token
    alt Token valid
        UserService->>DB: Update profile fields
        UserService-->>User: SUCCESS: User profile updated
    else Token invalid
        UserService-->>User: Unauthorized
    end

    %% =============== LOGOUT ==================
    Note over User: User logouts
    User->>UserService: POST /logout (refresh token)
    UserService->>Auth: Validate access token
    alt Token valid
        UserService->>UserService: Remove access token, invalidate refresh token
        UserService-->>User: SUCCESS: User logged out
    else Token invalid
        UserService-->>User: Unauthorized
    end

    %% =============== RESET PASSWORD REQUEST ==================
    Note over User: User requests to reset password
    User->>UserService: POST /forgot-password
    UserService->>DB: Find user by email
    UserService->>UserService: Generate reset token
    UserService->>NodeMailer: Send reset email (token link)
    NodeMailer-->>User: Email: Reset your password
    UserService-->>User: SUCCESS: Password reset email sent

    %% =============== RESET PASSWORD CONFIRM ==================
    Note over User: User sets new password
    User->>UserService: POST /reset-password
    UserService->>UserService: Validate reset token
    alt Valid
        UserService->>DB: Update password hash
        UserService-->>User: SUCCESS: Password updated
    else Invalid/expired
        UserService-->>User: Invalid token
    end
```
### Activity Diagram
```mermaid
---
config:
  layout: elk
---
stateDiagram
  direction TB
  state AccountChoice <<choice>>
  state VerifyChoice <<choice>>
  state ValidInput <<choice>>
  state UserRole <<choice>>
  state VerifyExpired <<choice>>
  [*] --> WebsiteAccess
  WebsiteAccess --> Account
  Login --> ForgotPassword
  Account --> AccountChoice
  AccountChoice --> Login:Yes
  AccountChoice --> Register:No
  Register --> Verify
  Verify --> VerifyChoice
  VerifyChoice --> Login:Yes
  VerifyChoice --> VerifyExpired:No
  VerifyExpired --> Resend:Yes
  VerifyExpired --> [*]:No
  ValidInput --> LoggedIn:Yes
  ValidInput --> [*]:No
  Login --> Validate
  Validate --> ValidInput
  UserRole --> QuestionPage:Admin
  UserRole --> MatchingPage:User
  LoggedIn --> UserRole
  LoggedIn --> UpdateProfile
  UpdateProfile --> LoggedIn
  LoggedIn --> Logout
  Logout --> [*]
  ForgotPassword --> ResetPassword:Yes
  ForgotPassword --> [*]:No
  ResetPassword --> [*]
```

### Authentication Flow

1. **Registration**
   - User submits username, email, password
   - Password is hashed with bcrypt (10 rounds)
   - Verification token and code generated
   - Verification email sent to user

2. **Verification**
   - User enters 6-digit code from email
   - Code validated against expiry (1 hour)
   - User marked as verified
   - Access token issued automatically

3. **Login**
   - User submits username and password
   - Password verified with bcrypt
   - Access token (5 minutes) and refresh token (7 days) issued
   - Refresh token stored as HttpOnly cookie

4. **Token Refresh**
   - Client sends refresh token via cookies
   - New access token issued if refresh token valid
   - Token versioning prevents stale refresh tokens

### Password Reset Flow

1. User requests password reset with email
2. Reset token generated and sent via email (1 hour expiry)
3. User clicks reset link and provides new password
4. Password updated and reset token invalidated

### User Model

```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed, 12-64 chars),
  role: String (user|admin),
  verified: Boolean,
  verificationCode: Number (6-digit),
  verificationCodeExpiry: Date,
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordTokenExpiry: Date,
  tokenVersion: Number (for logout),
  timestamps: true
}
```
### Admin Management

- Purpose: provide a single administrative account for system-level tasks (role checks/privileged endpoints).
- Creation:
  - The admin can be created automatically at first startup by setting `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PW` in the `.env` file.
  - If no admin exists, the service will create one using these values.
- Constraints:
  - Exactly one admin account is supported; additional admin accounts are not created through the public registration endpoint.
  - Admin role cannot be granted via the public API. Role elevation must be done through:
    - Startup auto-creation (if no admin exists), or
    - Direct database modification (use with caution).
- Security:
  - Keep admin credentials secret and rotate periodically.
  - Prefer updating admin credentials via secure DB tooling or an internal admin-only script that correctly hashes passwords.
  - The service enforces admin-only access on privileged endpoints using role checks in middleware.
  
### Security Considerations

- Passwords hashed with bcrypt (10 rounds salt)
- JWT secrets stored in environment variables
- Refresh tokens stored as HttpOnly cookies (CSRF protection)
- Sensitive fields excluded from default queries (password, tokens, codes)
- Email validation and duplicate checks
- Token expiry enforcement
- CORS configured for frontend origin only

## Project Structure

```
src/
├── controllers/
│   └── auth-controllers.js      # Authentication logic
├── middleware/
│   └── auth-token.js            # JWT verification middleware
├── model/
│   └── user-model.js            # User schema and methods
├── routes/
│   └── auth-routes.js           # API endpoint definitions
├── utils/
│   └── mailer.js                # Email sending utilities
└── server.js                    # Express app setup
```

## Dependencies

- **express**: HTTP server framework
- **mongoose**: MongoDB object modeling
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT creation and verification
- **nodemailer**: Email sending
- **cors**: CORS middleware
- **cookie-parser**: Cookie parsing middleware
- **dotenv**: Environment variable management

## Development

### Building

```bash
cd backend/user-service
pnpm run build
```

### Common Issues

**Issue**: Email not being sent during registration
- **Solution**: Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`. Use Gmail app passwords if using Gmail.

**Issue**: User already verified error on registration
- **Solution**: User already exists in database. Use different username/email or delete user from database.

**Issue**: Token verification failed
- **Solution**: Ensure `JWT_SECRET` is consistent across service instances and matches token signing.

## Error Handling

Common HTTP status codes returned:

- `200`: Success
- `201`: Resource created
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid credentials, expired token)
- `404`: User not found
- `409`: Conflict (username/email already exists)
- `500`: Server error

## Concurrency & Scalability

- MongoDB handles concurrent database operations
- Stateless design allows horizontal scaling
- JWT tokens enable distributed authentication
- No in-memory session storage
- Email sending is asynchronous (non-blocking)

## Integration with Other Services

The User Service provides authentication for other microservices:

- **Matching Service** validates JWT tokens for WebSocket connections
- **Collaboration Service** verifies user identity before room access
- **Question Service** verify admin role for protected endpoints 
- **Frontend** uses access tokens in Authorization headers

All services share the same `JWT_SECRET` for token verification.