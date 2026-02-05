# Implementation Plan: Phase II Todo Full-Stack Web Application

**Branch**: `master` | **Date**: 2026-01-08 | **Spec**: [specs/master/spec.md](./spec.md)
**Input**: Feature specification from `/specs/master/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a modern multi-user todo web application with JWT-based authentication, full CRUD operations for tasks, and responsive frontend interface. Backend uses Python FastAPI with SQLModel ORM connecting to Neon Serverless PostgreSQL. Frontend uses Next.js 16+ with TypeScript and Tailwind CSS. Authentication handled by Better Auth with JWT plugin for stateless, scalable security. User isolation enforced at database query level to ensure each user only accesses their own tasks.

## Technical Context

**Language/Version**:
- Backend: Python 3.11+
- Frontend: TypeScript 5.0+ with Next.js 16+

**Primary Dependencies**:
- Backend: FastAPI, SQLModel, uvicorn, python-jose (JWT), passlib (password hashing)
- Frontend: Next.js 16+, React 18+, Tailwind CSS, Better Auth (JWT plugin)
- Database: Neon Serverless PostgreSQL with psycopg2/asyncpg driver

**Storage**: Neon Serverless PostgreSQL (cloud-hosted, connection pooling enabled)

**Testing**:
- Backend: pytest 8.x with pytest-asyncio for async tests
- Frontend: Vitest 2.x with @testing-library/react for unit/component tests
- E2E: Playwright 1.40+ for end-to-end tests
- Integration: Contract tests for API endpoints using pytest
- See research.md for detailed framework selection rationale

**Target Platform**:
- Backend: Linux server (containerized with Docker) or serverless deployment
- Frontend: Web browsers (Chrome, Firefox, Safari, Edge) with Node.js 18+ runtime

**Project Type**: Web application (frontend + backend separation)

**Performance Goals**:
- API response time: <200ms p95 latency
- Frontend initial page load: <3 seconds
- Lighthouse performance score: >90
- Database query time: <50ms for indexed queries

**Constraints**:
- <200ms p95 API latency (constitution requirement)
- JWT tokens must be verified on every authenticated request
- User isolation enforced at query level (no cross-user data access)
- All API responses must be JSON
- Frontend must be responsive (1920px desktop, 375px mobile)
- No inline CSS (Tailwind only)
- Environment variables for all secrets (no hardcoded credentials)

**Scale/Scope**:
- Initial: 100-1000 concurrent users
- Database: ~10k tasks per user, millions of tasks total
- API endpoints: 7 core endpoints (auth + CRUD)
- Frontend pages: 4-5 pages (login, signup, dashboard, task list, task details)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Compliance

**✅ I. Reproducibility**
- All dependencies pinned in requirements.txt (backend) and package.json (frontend)
- Environment variables documented in .env.example
- Database migrations version-controlled
- Docker configuration for consistent deployment

**✅ II. Security**
- JWT tokens for authentication (Better Auth)
- JWT secret stored in BETTER_AUTH_SECRET environment variable
- User isolation enforced at database query level (WHERE user_id = ?)
- Password hashing with bcrypt/argon2
- All API endpoints verify JWT before processing

**✅ III. Clarity**
- TypeScript for frontend (type safety)
- Descriptive variable/function names following conventions
- API contracts documented in OpenAPI format
- Error messages are actionable (HTTP status codes + JSON error details)

**✅ IV. Modularity**
- Frontend components are independent and composable
- Backend services decoupled from API routes
- Database models isolated in models/ directory
- Clear separation between frontend and backend

### Standards Compliance

**✅ API Standards**
- All endpoints return JSON responses
- HTTPException for error handling
- Appropriate HTTP status codes (200, 201, 400, 401, 404, 500)
- Input validation at API boundaries
- API versioning (/api/v1/...)

**✅ Frontend Standards**
- Next.js 16+ App Router conventions
- TypeScript for all code
- Tailwind CSS only (no inline CSS)
- Responsive design (desktop 1920px, mobile 375px)
- Loading states and error boundaries

**✅ Backend Standards**
- Python FastAPI framework
- SQLModel ORM for database operations
- Try-catch error handling
- Logging for significant operations
- Input validation at API boundaries

**✅ Database Standards**
- Indexes on user_id and task status fields
- Parameterized queries (SQLModel prevents SQL injection)
- Migrations for schema changes
- Foreign key constraints (tasks.user_id → users.id)
- created_at and updated_at timestamps on all entities

**✅ Security Standards**
- JWT verification on every authenticated request
- BETTER_AUTH_SECRET environment variable
- Password hashing (bcrypt/argon2)
- Rate limiting on auth endpoints (NEEDS IMPLEMENTATION)
- Input sanitization for XSS prevention

**✅ Documentation Standards**
- Technical documentation >1000 words (this plan + research + data-model + quickstart)
- Code references spec files (@specs/master/spec.md)
- API endpoints documented in contracts/
- Environment variables in .env.example

### Gate Results

**Status**: ✅ PASS (with 1 clarification needed)

**Clarifications Needed**:
1. Testing framework selection (pytest vs alternatives) - marked as NEEDS CLARIFICATION in Technical Context

**No Violations**: All constitution requirements can be met with the proposed architecture.

## Project Structure

### Documentation (this feature)

```text
specs/master/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (created)
├── research.md          # Phase 0 output (to be created)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
└── contracts/           # Phase 1 output (to be created)
    ├── auth.openapi.yaml
    └── tasks.openapi.yaml
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User model (managed by Better Auth)
│   │   └── task.py          # Task model with user_id foreign key
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py  # JWT verification, user context
│   │   └── task_service.py  # Task CRUD business logic
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py      # Auth endpoints (signup, signin, refresh)
│   │   │   └── tasks.py     # Task CRUD endpoints
│   │   └── middleware/
│   │       ├── __init__.py
│   │       └── jwt_auth.py  # JWT verification middleware
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py    # Neon PostgreSQL connection
│   │   └── migrations/      # Alembic migrations
│   ├── config.py            # Environment configuration
│   └── main.py              # FastAPI application entry point
├── tests/
│   ├── contract/            # API contract tests
│   ├── integration/         # Integration tests
│   └── unit/                # Unit tests
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
└── Dockerfile               # Container configuration

frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   ├── page.tsx     # Task list
│   │   │   └── [id]/
│   │   │       └── page.tsx # Task details
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── TaskCard.tsx     # Task display component
│   │   ├── TaskForm.tsx     # Task create/edit form
│   │   └── AuthForm.tsx     # Login/signup form
│   ├── services/
│   │   ├── api.ts           # API client with JWT token attachment
│   │   └── auth.ts          # Better Auth configuration
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   └── types.ts         # TypeScript type definitions
│   └── styles/
│       └── globals.css      # Tailwind CSS imports
├── tests/
│   ├── unit/                # Component unit tests
│   └── e2e/                 # End-to-end tests
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── next.config.js           # Next.js configuration
└── .env.local.example       # Environment variables template
```

**Structure Decision**: Web application structure (Option 2) selected because the project explicitly requires separate frontend (Next.js) and backend (FastAPI) components. This separation enables:
- Independent deployment and scaling of frontend/backend
- Clear technology boundaries (TypeScript vs Python)
- Parallel development by different team members
- Better Auth integration on frontend with JWT verification on backend
- Compliance with constitution's modularity principle (clear separation of concerns)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ No violations detected

All constitution requirements are met with the proposed architecture. No complexity justifications needed.

---

## Phase 0: Research (Completed)

**Output**: `research.md` - Testing framework selection research

**Key Decisions**:
- Backend testing: pytest 8.x with pytest-asyncio
- Frontend unit testing: Vitest 2.x with @testing-library/react
- E2E testing: Playwright 1.40+

**Status**: ✅ Complete - All NEEDS CLARIFICATION items resolved

---

## Phase 1: Design & Contracts (Completed)

**Outputs**:
- `data-model.md` - Database schema, entities, relationships, validation rules
- `contracts/auth.openapi.yaml` - Authentication API contract (OpenAPI 3.1)
- `contracts/tasks.openapi.yaml` - Tasks API contract (OpenAPI 3.1)
- `quickstart.md` - Development setup and testing guide
- `CLAUDE.md` - Updated agent context with Neon PostgreSQL

**Status**: ✅ Complete - All design artifacts generated

---

## Next Steps

1. **Run `/sp.tasks`** to generate implementation tasks from this plan
2. **Review ADR suggestion** for testing framework selection (optional)
3. **Begin implementation** following Agentic Dev Stack workflow
4. **Use specialized agents/skills**:
   - `auth-skill` for authentication implementation
   - `frontend-skill` for UI components
   - `backend-skill` for API endpoints
   - `database-schema` for database setup

---

## Plan Completion Summary

**Branch**: master
**Plan Path**: C:\Users\Admin\hackathon-2\specs\master\plan.md
**Generated Artifacts**:
- ✅ spec.md (feature specification)
- ✅ plan.md (this file)
- ✅ research.md (testing framework research)
- ✅ data-model.md (database schema)
- ✅ contracts/auth.openapi.yaml (auth API contract)
- ✅ contracts/tasks.openapi.yaml (tasks API contract)
- ✅ quickstart.md (setup guide)

**Constitution Compliance**: ✅ PASS (no violations)
**Ready for**: Task generation (`/sp.tasks` command)
