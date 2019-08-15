# VizNet Experiment System

## Running Experiment Frontend
1. Enter `/system/frontend` directory
2. Install frontend javascript dependencies: `npm install`
2. Run using: `pip install -r requirements.txt`
4. Access in browser at `localhost:3000`

## Running Experiment Backend

### Install system dependencies
1. Install PostgreSQL on your system
2. Create admin user: `createuser admin -P`
3. Create _viznet_ database: `createdb viznet -O  admin`

### Install Python dependencies
4. Enter `/system/backend` directory
5. Initialize and activate virtual environment: `virtualenv -p python3 venv && source venv/bin/activate`
6. Install Python dependencies: `pip install -r requirements.txt`

### Initialize database tables
7. Create database tables: `flask create`
8. Populate questions: `flask populate_questions`

### Run server
9. Run flask server: `flask run -p 9999`
