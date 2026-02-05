# Quickstart Guide: Phase II Todo Full-Stack Web Application

**Last Updated**: 2026-01-08
**Prerequisites**: Node.js 18+, Python 3.11+, PostgreSQL (Neon account)
**Estimated Setup Time**: 15-20 minutes

## Overview

This guide walks you through setting up and running the Phase II Todo Full-Stack Web Application locally. The application consists of:
- **Backend**: Python FastAPI with SQLModel ORM
- **Frontend**: Next.js 16+ with TypeScript and Tailwind CSS
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth with JWT tokens

## Prerequisites

### Required Software

```bash
# Check versions
node --version    # Should be 18.x or higher
python --version  # Should be 3.11.x or higher
git --version     # Any recent version
```

### Required Accounts

1. **Neon Database**: Sign up at https://neon.tech (free tier available)
2. **GitHub** (optional): For version control and deployment

## Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd hackathon-2

# Verify project structure
ls -la
# Should see: backend/, frontend/, specs/, .specify/, CLAUDE.md
```

## Step 2: Database Setup (Neon PostgreSQL)

### 2.1 Create Neon Project

1. Go to https://console.neon.tech
2. Click "Create Project"
3. Name: "todo-app-dev"
4. Region: Choose closest to your location
5. PostgreSQL version: 15 or 16
6. Click "Create Project"

### 2.2 Get Connection String

1. In Neon console, go to "Connection Details"
2. Copy the connection string (format: `postgresql://user:password@host/database`)
3. Save for next step

### 2.3 Initialize Database Schema

```bash
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRY_DAYS=7
ENVIRONMENT=development
EOF

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Verify tables created
psql $DATABASE_URL -c "\dt"
# Should see: users, tasks, alembic_version
```

## Step 3: Backend Setup (FastAPI)

### 3.1 Install Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3.2 Configure Environment Variables

```bash
# Edit .env file (already created in Step 2.3)
# Update BETTER_AUTH_SECRET with a secure random string:
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output and paste into .env as BETTER_AUTH_SECRET value
```

### 3.3 Start Backend Server

```bash
# From backend/ directory
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Server should start at http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### 3.4 Verify Backend

Open browser to http://localhost:8000/docs

You should see:
- Swagger UI with API documentation
- Auth endpoints: /api/v1/auth/signup, /api/v1/auth/signin
- Task endpoints: /api/v1/tasks, /api/v1/tasks/{id}

## Step 4: Frontend Setup (Next.js)

### 4.1 Install Dependencies

```bash
# Open new terminal (keep backend running)
cd frontend

# Install Node dependencies
npm install
# or
yarn install
```

### 4.2 Configure Environment Variables

```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
BETTER_AUTH_SECRET=<same-secret-from-backend-.env>
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
EOF
```

**IMPORTANT**: `BETTER_AUTH_SECRET` must match the backend value for JWT verification to work.

### 4.3 Start Frontend Server

```bash
# From frontend/ directory
npm run dev
# or
yarn dev

# Server should start at http://localhost:3000
```

### 4.4 Verify Frontend

Open browser to http://localhost:3000

You should see:
- Landing page with "Sign Up" and "Sign In" buttons
- Responsive layout (test by resizing browser)
- No console errors in browser DevTools

## Step 5: Test End-to-End Flow

### 5.1 Create Account

1. Navigate to http://localhost:3000/signup
2. Enter email: `test@example.com`
3. Enter password: `TestPass123!`
4. Click "Sign Up"
5. Should redirect to dashboard with JWT token stored

### 5.2 Create Task

1. On dashboard, click "New Task"
2. Title: "Test Task"
3. Description: "This is a test task"
4. Click "Create"
5. Task should appear in task list

### 5.3 Update Task

1. Click on the task you just created
2. Edit title or description
3. Click "Save"
4. Changes should be reflected immediately

### 5.4 Mark Complete

1. Click checkbox next to task
2. Task should show as completed (strikethrough or different style)
3. Click again to mark incomplete

### 5.5 Delete Task

1. Click "Delete" button on task
2. Confirm deletion
3. Task should disappear from list

### 5.6 Sign Out and Sign In

1. Click "Sign Out" button
2. Should redirect to login page
3. Sign in with same credentials
4. Should see your tasks (if any remain)

## Step 6: Verify User Isolation

### 6.1 Create Second User

1. Sign out from first account
2. Sign up with different email: `test2@example.com`
3. Create some tasks for this user

### 6.2 Verify Isolation

1. Sign in as first user (`test@example.com`)
2. Verify you only see your own tasks (not test2's tasks)
3. Try to access test2's task by guessing URL
4. Should receive 404 or 403 error

## Step 7: Run Tests (Optional)

### 7.1 Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/contract/test_auth.py
```

### 7.2 Frontend Tests

```bash
cd frontend

# Run unit tests
npm run test
# or
yarn test

# Run E2E tests (requires backend running)
npm run test:e2e
# or
yarn test:e2e
```

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**: Activate virtual environment and run `pip install -r requirements.txt`

**Problem**: `sqlalchemy.exc.OperationalError: could not connect to server`
**Solution**: Verify DATABASE_URL in .env is correct and Neon database is running

**Problem**: `401 Unauthorized` on all endpoints
**Solution**: Check BETTER_AUTH_SECRET matches between frontend and backend

### Frontend Issues

**Problem**: `Error: Cannot find module 'next'`
**Solution**: Run `npm install` or `yarn install`

**Problem**: API requests fail with CORS error
**Solution**: Verify backend CORS settings allow http://localhost:3000

**Problem**: JWT token not being sent with requests
**Solution**: Check Better Auth configuration in `src/services/auth.ts`

### Database Issues

**Problem**: `relation "users" does not exist`
**Solution**: Run migrations: `alembic upgrade head`

**Problem**: `password authentication failed`
**Solution**: Verify Neon connection string includes correct username/password

## Development Workflow

### Making Changes

1. **Backend changes**: Server auto-reloads with `--reload` flag
2. **Frontend changes**: Next.js hot-reloads automatically
3. **Database changes**: Create migration with `alembic revision --autogenerate`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to remote
git push origin feature/your-feature-name
```

### Testing Before Commit

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run test

# Linting
cd backend && flake8 src/
cd frontend && npm run lint
```

## Production Deployment (Future)

### Backend Deployment

- **Platform**: Railway, Render, or AWS Lambda
- **Environment**: Set all .env variables in platform dashboard
- **Database**: Use Neon production connection string
- **HTTPS**: Required for production (JWT security)

### Frontend Deployment

- **Platform**: Vercel, Netlify, or AWS Amplify
- **Environment**: Set NEXT_PUBLIC_API_URL to production backend URL
- **Build**: `npm run build` generates optimized production build

## Next Steps

1. **Read the spec**: Review `specs/master/spec.md` for full requirements
2. **Review data model**: See `specs/master/data-model.md` for database schema
3. **Check API contracts**: OpenAPI specs in `specs/master/contracts/`
4. **Run tasks**: Use `/sp.tasks` command to generate implementation tasks
5. **Implement features**: Follow Agentic Dev Stack workflow

## Support

- **Documentation**: See `specs/master/` directory
- **Constitution**: Review `.specify/memory/constitution.md` for standards
- **Issues**: Check GitHub issues or create new one
- **Claude Code**: Use `/help` command for assistance

## Success Checklist

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:3000
- [ ] Database connected (Neon PostgreSQL)
- [ ] Can create user account
- [ ] Can sign in and receive JWT token
- [ ] Can create, read, update, delete tasks
- [ ] User isolation verified (can't see other users' tasks)
- [ ] Tests passing (backend and frontend)
- [ ] No console errors in browser DevTools
- [ ] API documentation accessible at /docs

**Estimated completion time**: 15-20 minutes for experienced developers, 30-45 minutes for first-time setup.
