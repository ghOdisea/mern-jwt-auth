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
- Node.js (v14.x or higher)
- MongoDB
- Git (optional)

## Installation

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ghOdisea/mern-jwt-auth.git
   cd mern-jwt-auth
  ```
