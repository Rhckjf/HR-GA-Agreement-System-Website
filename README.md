# HRGA Agreement System

This project is a web application for managing HR and GA agreements, featuring a Node.js Express backend and a React frontend.

## Prerequisites

- **Node.js**: 16 or higher
- **MongoDB**: A running MongoDB instance (local or Atlas)

## Installation & Running

### Backend (API)

The backend is built with Express and Mongoose.

1.  Navigate to the backend directory:
    ```bash
    cd app/backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in `app/backend` with the following keys:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/hrga_db
    JWT_SECRET=your_jwt_secret
    ```

4.  Run the server:
    ```bash
    # Development mode
    npm run dev

    # Production mode
    npm start
    ```
    The API will be available at `http://localhost:5000`.

### Frontend (UI)

The frontend is built with React.

1.  Navigate to the frontend directory:
    ```bash
    cd app/frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm start
    ```
    The application will open at `http://localhost:3000`.

## Project Structure

- `app/backend`: Express application code.
  - `src/`: Source code (controllers, models, routes).
  - `package.json`: Node dependencies and scripts.
- `app/frontend`: React application code.
  - `src/`: Source code.
  - `package.json`: Node dependencies and scripts.
