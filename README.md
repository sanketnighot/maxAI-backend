# Express TypeScript MongoDB Backend

A RESTful API backend built with Express.js, TypeScript, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/maxi-db
NODE_ENV=development
```

3. Build the TypeScript code:
```bash
npm run build
```

## Development

Run the development server:
```bash
npm run dev
```

## Production

Build and start the production server:
```bash
npm run build
npm start
```

## API Endpoints

### Users
- GET `/api/users` - Get all users
- GET `/api/users/:id` - Get a specific user
- POST `/api/users` - Create a new user

## Project Structure

```
src/
├── controllers/    # Request handlers
├── models/        # Database models
├── routes/        # Route definitions
└── server.ts      # Application entry point
``` 