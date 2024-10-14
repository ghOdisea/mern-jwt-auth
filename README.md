# MERN JWT Authentication App

This is a minimal full-stack application built using the MERN stack (**MongoDB**, **Express**, **React**, and **Node.js**) with **JWT (JSON Web Token)** authentication.

## Features
- **User Registration**: New users can create accounts by registering with their email and password.
- **User Login**: Registered users can log in to the application.
- **JWT Authentication**: Upon login, users receive a JWT that grants them access to protected routes.
- **Protected Routes**: Specific pages or API routes are accessible only to authenticated users.
- **State Management**: Utilizes **Redux** to manage authentication state in the React frontend.
- **Persistent Login**: The JWT is stored in the browser’s localStorage, keeping the user logged in even after refreshing the page or closing the browser.

## Technologies Used
- **MongoDB**: NoSQL database to store user data.
- **Express**: Backend web framework to create APIs.
- **React**: Frontend library for building the user interface.
- **Node.js**: Server-side runtime for handling requests.
- **JWT**: JSON Web Tokens for handling authentication and authorization.
- **Redux**: State management in the React application.

## Requirements
- Node.js v20.10.0
- MongoDB

## Installation

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ghOdisea/mern-jwt-auth.git
   cd mern-jwt-auth
   ```

## Backend Setup
2. Install dependencies:
   ```bash
   npm install
  ```

## Environmental Variables
3. Create a .env file and add the following env variables:
```bash

NODE_ENV=development
APP_ORIGIN=<localhost_client>
MONGO_URI=<mongo_uri>
JWT_SECRET=<jwtSecret>
JWT_REFRESH_SECRET=<RefreshToken_secret>

EMAIL_SENDER=g
RESEND_API_KEY=<resend api key>

```

## Frontend Setup
1. Navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

2. Running the App
To run both the client and server concurrently:
```bash
npm run dev
```

The backend server will run on http://localhost:5000
The frontend React app will run on http://localhost:3000


