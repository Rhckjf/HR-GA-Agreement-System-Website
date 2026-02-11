# HRGA Agreement System

This project is a web application for managing HR and GA agreements, featuring a Python FastAPI backend and a React frontend.

## Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 16 or higher
- **MongoDB**: A running MongoDB instance (local or atlas)

## Installation & Running

### Backend (API)

The backend is built with FastAPI.

1.  Navigate to the backend directory:
    ```bash
    cd app/backend
    ```

2.  (Optional) Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure environment variables:
    Create a `.env` file in `app/backend` with the following keys:
    ```env
    MONGO_URL=mongodb://localhost:27017 # or your MongoDB URL
    DB_NAME=hrga_db # or your database name
    JWT_SECRET=your_secret_key # optional, default exists for dev
    CORS_ORIGINS=http://localhost:3000 # Allow frontend origin
    ```

5.  Run the server:
    ```bash
    uvicorn server:app --reload
    ```
    The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend (UI)

The frontend is built with React.

1.  Navigate to the frontend directory:
    ```bash
    cd app/frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Run the development server:
    ```bash
    npm start
    # or
    yarn start
    ```
    The application will open at `http://localhost:3000`.

## Project Structure

- `app/backend`: FastAPI application code.
  - `server.py`: Main entry point and application logic.
  - `requirements.txt`: Python dependencies.
- `app/frontend`: React application code.
  - `src/`: Source code.
  - `package.json`: Node dependencies and scripts.
