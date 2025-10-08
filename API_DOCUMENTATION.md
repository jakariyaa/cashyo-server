# Cashyo Server Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Routes](#auth-routes)
   - [Wallet Routes](#wallet-routes)
   - [Transaction Routes](#transaction-routes)
   - [User Routes](#user-routes)
4. [Authorization & Roles](#authorization--roles)
5. [Request/Response Formats](#requestresponse-formats)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)
8. [Dependencies & Requirements](#dependencies--requirements)

## Introduction

The Cashyo Server is a secure, role-based backend service for managing digital wallets and financial transactions. It provides endpoints for user authentication, wallet management, and various transaction types with proper validation and access control.

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Zod
- **Password Security**: Bcrypt.js

## Authentication

The API uses JWT (JSON Web Token) based authentication with HTTP-only cookies for security. After successful login or registration, a token is set in an HTTP-only cookie which is automatically sent with subsequent requests.

### Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Server sets a JWT token in an HTTP-only cookie
3. Browser automatically sends this cookie with all subsequent requests
4. Server verifies the token and attaches user information to the request object

## API Endpoints

### Auth Routes

#### Register a New User

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Authentication**: Not required
- **Authorization**: None

**Request Body**:

```json
{
  "name": "string (1-50 characters)",
  "email": "string (valid email format)",
  "password": "string (minimum 6 characters)",
  "role": "enum ['user', 'agent'] (optional, defaults to 'user')"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "isActive": true,
      "isApproved": false,
      "createdAt": "date",
      "updatedAt": "date"
    }
  },
  "statusCode": 201
}
```

**Error Responses**:

- 400: Validation errors or user already exists

#### Login User

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Authentication**: Not required
- **Authorization**: None

**Request Body**:

```json
{
  "email": "string (valid email format)",
  "password": "string"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "_id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "isActive": true,
      "isApproved": false,
      "createdAt": "date",
      "updatedAt": "date"
    }
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Incorrect email or password
- 401: User account is deactivated
- 401: Agent account is not approved yet

### Wallet Routes

#### Get Current User's Wallet

- **URL**: `/api/wallets/me`
- **Method**: `GET`
- **Authentication**: Required
- **Authorization**: User, Agent

**Success Response**:

```json
{
  "success": true,
  "message": "Wallet retrieved successfully",
  "data": {
    "_id": "string",
    "userId": "string",
    "walletId": "string",
    "balance": "number",
    "isActive": "boolean",
    "dailyLimit": "number",
    "monthlyLimit": "number",
    "dailyAmountUsed": "number",
    "monthlyAmountUsed": "number",
    "lastResetDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 404: Wallet not found

#### Get All Wallets (Admin)

- **URL**: `/api/wallets/`
- **Method**: `GET`
- **Authentication**: Required
- **Authorization**: Admin

**Success Response**:

```json
{
  "success": true,
  "message": "Wallets retrieved successfully",
  "data": [
    {
      "_id": "string",
      "userId": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "role": "string"
      },
      "walletId": "string",
      "balance": "number",
      "isActive": "boolean",
      "dailyLimit": "number",
      "monthlyLimit": "number",
      "dailyAmountUsed": "number",
      "monthlyAmountUsed": "number",
      "lastResetDate": "date",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions

#### Block/Unblock Wallet (Admin)

- **URL**: `/api/wallets/block/:id`
- **Method**: `PATCH`
- **Authentication**: Required
- **Authorization**: Admin

**URL Parameters**:

- `id`: Wallet ID

**Request Body**:

```json
{
  "isActive": "boolean"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Wallet blocked/unblocked successfully",
  "data": {
    "_id": "string",
    "userId": "string",
    "walletId": "string",
    "balance": "number",
    "isActive": "boolean",
    "dailyLimit": "number",
    "monthlyLimit": "number",
    "dailyAmountUsed": "number",
    "monthlyAmountUsed": "number",
    "lastResetDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 404: Wallet not found

### Transaction Routes

#### Add Money to Own Wallet (User)

- **URL**: `/api/transactions/add`
- **Method**: `POST`
- **Authentication**: Required
- **Authorization**: User

**Request Body**:

```json
{
  "amount": "number (positive)"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Money added successfully",
  "data": {
    "transaction": {
      "_id": "string",
      "type": "add",
      "amount": "number",
      "fromWalletId": "string",
      "initiatedBy": "string",
      "status": "completed",
      "createdAt": "date",
      "updatedAt": "date"
    },
    "newBalance": "number"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 400: Wallet is blocked
- 404: Wallet not found

#### Withdraw Money from Own Wallet (User)

- **URL**: `/api/transactions/withdraw`
- **Method**: `POST`
- **Authentication**: Required
- **Authorization**: User

**Request Body**:

```json
{
  "amount": "number (positive)"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Money withdrawn successfully",
  "data": {
    "transaction": {
      "_id": "string",
      "type": "withdraw",
      "amount": "number",
      "fromWalletId": "string",
      "initiatedBy": "string",
      "status": "completed",
      "createdAt": "date",
      "updatedAt": "date"
    },
    "newBalance": "number"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 400: Wallet is blocked
- 400: Insufficient balance
- 404: Wallet not found

#### Send Money to Another User (User)

- **URL**: `/api/transactions/send`
- **Method**: `POST`
- **Authentication**: Required
- **Authorization**: User

**Request Body**:

```json
{
  "receiverEmail": "string (valid email format)",
  "amount": "number (positive)"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Money sent successfully",
  "data": {
    "transaction": {
      "_id": "string",
      "type": "send",
      "amount": "number",
      "fee": "number",
      "feeType": "string",
      "feeValue": "number",
      "fromWalletId": "string",
      "toWalletId": "string",
      "initiatedBy": "string",
      "status": "completed",
      "createdAt": "date",
      "updatedAt": "date"
    },
    "newBalance": "number"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 400: Sender's wallet is blocked
- 400: Insufficient balance
- 400: Receiver's wallet is blocked
- 404: Wallet not found
- 404: Receiver not found

#### Cash-In to User's Wallet (Agent)

- **URL**: `/api/transactions/cash-in`
- **Method**: `POST`
- **Authentication**: Required
- **Authorization**: Agent (must be approved)

**Request Body**:

```json
{
  "userEmail": "string (valid email format)",
  "amount": "number (positive)"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Cash-in successful",
  "data": {
    "transaction": {
      "_id": "string",
      "type": "cash-in",
      "amount": "number",
      "toWalletId": "string",
      "initiatedBy": "string",
      "status": "completed",
      "createdAt": "date",
      "updatedAt": "date"
    },
    "newUserBalance": "number"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 403: Agent not approved
- 400: Agent's wallet is blocked
- 400: User's wallet is blocked
- 404: User not found
- 404: User wallet not found

#### Cash-Out from User's Wallet (Agent)

- **URL**: `/api/transactions/cash-out`
- **Method**: `POST`
- **Authentication**: Required
- **Authorization**: Agent (must be approved)

**Request Body**:

```json
{
  "userEmail": "string (valid email format)",
  "amount": "number (positive)"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Cash-out successful",
  "data": {
    "transaction": {
      "_id": "string",
      "type": "cash-out",
      "amount": "number",
      "fee": "number",
      "feeType": "string",
      "feeValue": "number",
      "fromWalletId": "string",
      "toWalletId": "string",
      "initiatedBy": "string",
      "status": "completed",
      "createdAt": "date",
      "updatedAt": "date"
    },
    "newUserBalance": "number"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 403: Agent not approved
- 400: Agent's wallet is blocked
- 400: User's wallet is blocked
- 400: User has insufficient balance
- 404: User not found
- 404: User wallet not found

#### Get Own Transactions (User/Agent)

- **URL**: `/api/transactions/me`
- **Method**: `GET`
- **Authentication**: Required
- **Authorization**: User, Agent

**Success Response**:

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "_id": "string",
      "type": "string",
      "amount": "number",
      "fee": "number",
      "feeType": "string",
      "feeValue": "number",
      "fromWalletId": {
        "_id": "string",
        "userId": "string",
        "balance": "number"
      },
      "toWalletId": {
        "_id": "string",
        "userId": "string",
        "balance": "number"
      },
      "initiatedBy": {
        "_id": "string",
        "name": "string",
        "email": "string"
      },
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated

#### Get All Transactions (Admin)

- **URL**: `/api/transactions/`
- **Method**: `GET`
- **Authentication**: Required
- **Authorization**: Admin

**Success Response**:

```json
{
  "success": true,
  "message": "All transactions retrieved successfully",
  "data": [
    {
      "_id": "string",
      "type": "string",
      "amount": "number",
      "fee": "number",
      "feeType": "string",
      "feeValue": "number",
      "fromWalletId": {
        "_id": "string",
        "userId": "string",
        "balance": "number"
      },
      "toWalletId": {
        "_id": "string",
        "userId": "string",
        "balance": "number"
      },
      "initiatedBy": {
        "_id": "string",
        "name": "string",
        "email": "string"
      },
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions

### User Routes

#### Get All Users (Admin)

- **URL**: `/api/users/`
- **Method**: `GET`
- **Authentication**: Required
- **Authorization**: Admin

**Success Response**:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "isActive": "boolean",
      "isApproved": "boolean",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions

#### Approve/Suspend Agent (Admin)

- **URL**: `/api/users/approve/:id`
- **Method**: `PATCH`
- **Authentication**: Required
- **Authorization**: Admin

**URL Parameters**:

- `id`: User ID

**Request Body**:

```json
{
  "isApproved": "boolean"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "Agent approved/suspended successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "isActive": "boolean",
    "isApproved": "boolean",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Insufficient permissions
- 400: User is not an agent
- 404: User not found

#### Update User

- **URL**: `/api/users/:id`
- **Method**: `PATCH`
- **Authentication**: Required
- **Authorization**: User (can update own profile), Admin (can update any profile)

**URL Parameters**:

- `id`: User ID

**Request Body**:

```json
{
  "name": "string (optional)",
  "email": "string (optional, valid email format)",
  "password": "string (optional, minimum 6 characters)",
  "role": "enum ['user', 'agent'] (optional, admin only)",
  "isApproved": "boolean (optional, admin only)",
  "isActive": "boolean (optional, admin only)"
}
```

**Success Response**:

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "isActive": "boolean",
    "isApproved": "boolean",
    "createdAt": "date",
    "updatedAt": "date"
  },
  "statusCode": 200
}
```

**Error Responses**:

- 400: Validation errors
- 401: Not authenticated
- 403: Insufficient permissions
- 404: User not found

## Authorization & Roles

The API implements role-based access control with three distinct user roles:

### User

- Can register and login to the system
- Can add money to their wallet
- Can withdraw money from their wallet
- Can send money to other users
- Can view their own transactions
- Can view their own wallet information

### Agent

- Must be approved by an admin before performing transactions
- Can perform cash-in operations for users
- Can perform cash-out operations for users
- Can view their own transactions
- Can view their own wallet information

### Admin

- Can view all users in the system
- Can approve or suspend agent accounts
- Can view all wallets in the system
- Can block or unblock wallets
- Can view all transactions in the system

## Request/Response Formats

### Success Response Format

```json
{
  "success": true,
  "message": "string",
  "data": "object|array",
  "statusCode": "number"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "string",
  "error": "object|string|null",
  "statusCode": "number"
}
```

## Error Handling

The API implements comprehensive error handling with the following HTTP status codes:

| Status Code | Description                                       |
| ----------- | ------------------------------------------------- |
| 200         | Successful GET, PUT, PATCH or DELETE request      |
| 201         | Successful POST request                           |
| 400         | Bad request - validation errors, duplicate fields |
| 401         | Unauthorized - invalid or expired token           |
| 403         | Forbidden - insufficient permissions              |
| 404         | Not found - resource doesn't exist                |
| 500         | Internal server error                             |

### Common Error Responses

#### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "errors": [
      {
        "path": "body.email",
        "message": "Invalid email format"
      }
    ]
  },
  "statusCode": 400
}
```

#### Authentication Error (401)

```json
{
  "success": false,
  "message": "You are not logged in! Please log in to get access.",
  "error": null,
  "statusCode": 401
}
```

#### Authorization Error (403)

```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "error": null,
  "statusCode": 403
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "message": "User not found",
  "error": null,
  "statusCode": 404
}
```

## Usage Examples

### User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Add Money to Wallet

```bash
curl -X POST http://localhost:3000/api/transactions/add \
  -H "Content-Type: application/json" \
  -b "token=JWT_TOKEN" \
  -d '{
    "amount": 100
  }'
```

### Send Money to Another User

```bash
curl -X POST http://localhost:3000/api/transactions/send \
  -H "Content-Type: application/json" \
  -b "token=JWT_TOKEN" \
  -d '{
    "receiverEmail": "jane@example.com",
    "amount": 50
  }'
```

### Get Own Transactions

```bash
curl -X GET http://localhost:3000/api/transactions/me \
  -b "token=JWT_TOKEN"
```

## Dependencies & Requirements

### Runtime Requirements

- Node.js (version 14 or higher)
- MongoDB (version 4.0 or higher)

### NPM Dependencies

- **Express**: Web framework
- **Mongoose**: MongoDB object modeling
- **JSONWebToken**: JWT implementation
- **Bcrypt.js**: Password hashing
- **Zod**: Schema validation
- **Cookie-parser**: Cookie parsing middleware
- **Dotenv**: Environment variable management

### Development Dependencies

- **TypeScript**: Typed JavaScript
- **Nodemon**: Auto-restart server during development
- **TS-Node**: TypeScript execution environment
- **Jest**: Testing framework
- **Supertest**: HTTP assertions for testing

### Environment Variables

The following environment variables must be set in a `.env` file:

```
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Initial Balance for New Wallets
INITIAL_WALLET_BALANCE=50

# Transaction Fees
TRANSACTION_FEE_PERCENTAGE=0.01 # 1% fee
SYSTEM_WALLET_ID=system_wallet_001

# Transaction Limits
DAILY_TRANSACTION_LIMIT=5000
MONTHLY_TRANSACTION_LIMIT=10000
```
