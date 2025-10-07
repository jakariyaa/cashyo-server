# Cashyo Server

A secure, modular, and role-based backend API for a Cashyo Server built with Node.js, Express, TypeScript, MongoDB, and Mongoose. This API provides endpoints for user authentication, wallet management, and various financial transactions with proper validation and role-based access control.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-8.18.0-green.svg)](https://www.mongodb.com/)

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup and Environment Instructions](#setup-and-environment-instructions)
- [API Documentation](#api-documentation)
- [Implemented Endpoints](#implemented-endpoints)
- [Role-Based Access Control](#role-based-access-control)
- [Validation](#validation)
- [Security Features](#security-features)
- [Testing](#testing)
- [Scripts](#scripts)
- [Database Design](#database-design)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Cashyo Server offers a comprehensive solution for managing digital wallets with features such as user registration and authentication, wallet management, and various transaction types including money transfers, cash-in, and cash-out operations. The system implements role-based access control with three distinct user roles:

- **User**: Can add money, withdraw money, and send money to other users
- **Agent**: Can perform cash-in and cash-out transactions for users
- **Admin**: Can manage users, wallets, and view all transactions

The API includes robust validation using Zod schemas, secure authentication with JWT tokens, and follows best practices for RESTful API design.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- 👥 **Role-Based Access Control**: Distinct permissions for Users, Agents, and Admins
- 💰 **Transaction Management**: Support for multiple transaction types with fee calculations
- 🛡️ **Data Validation**: Comprehensive input validation using Zod schemas
- 📊 **Wallet Management**: Automatic wallet creation with initial balance
- 🔄 **Transaction Safety**: Database transactions for atomic operations
- 📱 **RESTful API**: Well-structured endpoints following REST conventions
- 📈 **Scalable Architecture**: Modular structure for easy maintenance and extension

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Zod
- **Password Security**: Bcrypt.js
- **Environment Management**: Dotenv
- **Code Quality**: ESLint, Prettier

## Project Structure

```
cashyo-server/
├── src/
│   ├── app.ts                 # Express application setup
│   ├── server.ts              # Server entry point
│   ├── config/                # Configuration files
│   ├── middlewares/           # Custom middlewares
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication module
│   │   ├── user/              # User management module
│   │   ├── wallet/            # Wallet management module
│   │   └── transaction/       # Transaction module
│   ├── routes/                # Route definitions
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   └── validation/            # Zod validation schemas
├── test/                      # Test files
├── dist/                      # Compiled JavaScript files
├── node_modules/              # Dependencies
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## Setup and Environment Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB database (local or cloud instance)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd cashyo-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```env
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

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the server:

   ```bash
   # For production
   npm start

   # For development (with auto-reload)
   npm run dev
   ```

The server will run on `http://localhost:3000` by default.

## API Documentation

The API follows REST conventions and returns JSON responses. All successful responses follow a consistent format:

```json
{
  "status": "success",
  "data": {},
  "message": "Description of the operation"
}
```

Error responses follow this format:

```json
{
  "status": "false",
  "message": "Description of the error",
  "code": 400,
  "details": {}
}
```

## Implemented Endpoints

### Authentication Routes

| Method | Endpoint             | Description         | Role Required |
| ------ | -------------------- | ------------------- | ------------- |
| POST   | `/api/auth/register` | Register a new user | None          |
| POST   | `/api/auth/login`    | Login user          | None          |

### Wallet Routes

| Method | Endpoint                 | Description               | Role Required |
| ------ | ------------------------ | ------------------------- | ------------- |
| GET    | `/api/wallets/me`        | Get current user's wallet | User/Agent    |
| GET    | `/api/wallets/`          | Get all wallets           | Admin         |
| PATCH  | `/api/wallets/block/:id` | Block/unblock wallet      | Admin         |

### Transaction Routes

| Method | Endpoint                     | Description                       | Role Required |
| ------ | ---------------------------- | --------------------------------- | ------------- |
| POST   | `/api/transactions/add`      | Add money to own wallet           | User          |
| POST   | `/api/transactions/withdraw` | Withdraw money from own wallet    | User          |
| POST   | `/api/transactions/send`     | Send money to another user        | User          |
| POST   | `/api/transactions/cash-in`  | Cash-in money to user's wallet    | Agent         |
| POST   | `/api/transactions/cash-out` | Cash-out money from user's wallet | Agent         |
| GET    | `/api/transactions/me`       | Get own transactions              | User/Agent    |
| GET    | `/api/transactions/`         | Get all transactions              | Admin         |

### User Routes

| Method | Endpoint                 | Description           | Role Required |
| ------ | ------------------------ | --------------------- | ------------- |
| GET    | `/api/users/`            | Get all users         | Admin         |
| PATCH  | `/api/users/approve/:id` | Approve/suspend agent | Admin         |

## Role-Based Access Control

The API implements three distinct user roles with specific permissions:

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

## Validation

All endpoints include robust validation using Zod schemas to ensure data integrity:

- User registration and login inputs
- Transaction amounts and recipient information
- Wallet operations
- User management operations

Validation errors are returned in a consistent format:

```json
{
  "status": "error",
  "message": "Validation failed",
  "code": 400,
  "details": {
    "errors": [
      {
        "path": "body.email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Security Features

- Password hashing using bcrypt
- JWT-based authentication with HTTP-only cookies
- Role-based access control
- Transaction validation and verification
- Wallet status checks (active/blocked)
- Agent approval workflow
- Input sanitization and validation
- Protection against common web vulnerabilities

## Scripts

```bash
# Start development server with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Database Design

### User Schema

- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: Enum ['admin', 'user', 'agent']
- `isActive`: Boolean (default: true)
- `isApproved`: Boolean (default: false, for agents)

### Wallet Schema

- `userId`: ObjectId (reference to User)
- `balance`: Number (default: 50)
- `isActive`: Boolean (default: true)

### Transaction Schema

- `type`: Enum ['add', 'withdraw', 'send', 'cash-in', 'cash-out']
- `amount`: Number
- `fee`: Number (optional)
- `feeType`: String (optional)
- `feeValue`: Number (optional)
- `fromWalletId`: ObjectId (reference to Wallet)
- `toWalletId`: ObjectId (reference to Wallet, optional)
- `initiatedBy`: ObjectId (reference to User)
- `status`: Enum ['pending', 'completed', 'failed']
- `createdAt`: Date

## Error Handling

The API implements comprehensive error handling with custom error classes:

- `AppError`: Custom application error class
- Global error handling middleware
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for debugging

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new functionality
- Maintain consistent code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
