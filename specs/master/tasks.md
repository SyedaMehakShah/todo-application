---

description: "Task list for Phase II Todo Full-Stack Web Application implementation"
---

# Tasks: Phase II Todo Full-Stack Web Application

**Input**: Design documents from `/specs/master/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/

**Tests**: Tests are OPTIONAL and not included in this task list as they were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow web application structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend project structure (backend/src/models/, backend/src/services/, backend/src/api/, backend/src/database/)
- [X] T002 Create frontend project structure (frontend/src/app/, frontend/src/components/, frontend/src/services/, frontend/src/lib/)
- [X] T003 [P] Initialize Python project with requirements.txt (FastAPI, SQLModel, uvicorn, python-jose, passlib, alembic, asyncpg)
- [X] T004 [P] Initialize Next.js project with package.json (Next.js 16+, React 18+, TypeScript, Tailwind CSS, Better Auth)
- [X] T005 [P] Configure Python linting and formatting (flake8, black) in backend/.flake8 and backend/pyproject.toml
- [X] T006 [P] Configure TypeScript and ESLint in frontend/tsconfig.json and frontend/.eslintrc.json
- [X] T007 [P] Configure Tailwind CSS in frontend/tailwind.config.js and frontend/src/styles/globals.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create environment configuration in backend/src/config.py (load DATABASE_URL, BETTER_AUTH_SECRET, JWT_ALGORITHM, JWT_EXPIRY_DAYS)
- [X] T009 Setup Neon PostgreSQL connection in backend/src/database/connection.py (async engine, session management)
- [X] T010 Initialize Alembic for migrations in backend/alembic.ini and backend/src/database/migrations/env.py
- [X] T011 Create migration 001_create_users_table.py in backend/src/database/migrations/versions/ (users table schema from data-model.md)
- [X] T012 Create migration 002_create_tasks_table.py in backend/src/database/migrations/versions/ (tasks table with foreign key to users)
- [X] T013 Create migration 003_add_indexes.py in backend/src/database/migrations/versions/ (indexes on user_id, completed, email)
- [X] T014 Create .env.example files in backend/.env.example and frontend/.env.local.example (document all required environment variables)
- [X] T015 Create FastAPI application entry point in backend/src/main.py (app initialization, CORS, middleware registration)
- [X] T016 Create JWT authentication middleware in backend/src/api/middleware/jwt_auth.py (verify JWT token, extract user_id)
- [X] T017 Configure Better Auth in frontend/src/services/auth.ts (JWT plugin, API endpoints, token storage)
- [X] T018 Create API client with JWT token attachment in frontend/src/services/api.ts (axios/fetch wrapper with Authorization header)
- [X] T019 Create TypeScript type definitions in frontend/src/lib/types.ts (User, Task, AuthResponse, ApiError types)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to create accounts and securely sign in using JWT tokens

**Independent Test**: Create account, sign in, receive JWT token, verify token required for protected endpoints

### Implementation for User Story 1

- [X] T020 [P] [US1] Create User model in backend/src/models/user.py (SQLModel with id, email, password_hash, email_verified, timestamps)
- [X] T021 [P] [US1] Create __init__.py files in backend/src/models/__init__.py (export User model)
- [X] T022 [US1] Create AuthService in backend/src/services/auth_service.py (password hashing, JWT generation, token verification, user context extraction)
- [X] T023 [US1] Create auth API endpoints in backend/src/api/v1/auth.py (POST /signup, POST /signin, POST /refresh, GET /me)
- [X] T024 [US1] Register auth routes in backend/src/main.py (include auth router with /api/v1/auth prefix)
- [X] T025 [US1] Add input validation for auth endpoints in backend/src/api/v1/auth.py (email format, password length, error responses)
- [X] T026 [US1] Add error handling for auth endpoints in backend/src/api/v1/auth.py (401 for invalid credentials, 409 for duplicate email, 400 for validation errors)
- [X] T027 [P] [US1] Create login page in frontend/src/app/(auth)/login/page.tsx (email/password form, Better Auth integration)
- [X] T028 [P] [US1] Create signup page in frontend/src/app/(auth)/signup/page.tsx (email/password form, Better Auth integration)
- [X] T029 [P] [US1] Create AuthForm component in frontend/src/components/AuthForm.tsx (reusable form for login/signup with validation)
- [X] T030 [US1] Implement auth state management in frontend/src/services/auth.ts (login, signup, logout, token refresh functions)
- [X] T031 [US1] Add error handling for auth in frontend (display validation errors, network errors, authentication failures)
- [X] T032 [US1] Test JWT token attachment in API client (verify Authorization header includes Bearer token on authenticated requests)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Task CRUD Operations (Priority: P2) 🎯 MVP

**Goal**: Enable authenticated users to create, read, update, and delete their personal tasks with user isolation

**Independent Test**: Authenticate user, create tasks, verify only that user's tasks returned, test all CRUD operations

### Implementation for User Story 2

- [X] T033 [P] [US2] Create Task model in backend/src/models/task.py (SQLModel with id, user_id, title, description, completed, timestamps)
- [X] T034 [P] [US2] Update __init__.py in backend/src/models/__init__.py (export Task model)
- [X] T035 [US2] Create TaskService in backend/src/services/task_service.py (CRUD operations with user_id filtering for isolation)
- [X] T036 [US2] Implement get_user_tasks in backend/src/services/task_service.py (filter by user_id, optional completed filter)
- [X] T037 [US2] Implement get_task_by_id in backend/src/services/task_service.py (verify task belongs to user, return 404 if not)
- [X] T038 [US2] Implement create_task in backend/src/services/task_service.py (set user_id from JWT, validate title not empty)
- [X] T039 [US2] Implement update_task in backend/src/services/task_service.py (verify ownership, update title/description, refresh updated_at)
- [X] T040 [US2] Implement delete_task in backend/src/services/task_service.py (verify ownership, delete from database)
- [X] T041 [US2] Implement toggle_completion in backend/src/services/task_service.py (verify ownership, update completed field)
- [X] T042 [US2] Create task API endpoints in backend/src/api/v1/tasks.py (GET /tasks, POST /tasks, GET /tasks/{id}, PUT /tasks/{id}, DELETE /tasks/{id}, PATCH /tasks/{id}/complete)
- [X] T043 [US2] Register task routes in backend/src/main.py (include tasks router with /api/v1/tasks prefix, require JWT authentication)
- [X] T044 [US2] Add input validation for task endpoints in backend/src/api/v1/tasks.py (title required, max lengths, error responses)
- [X] T045 [US2] Add error handling for task endpoints in backend/src/api/v1/tasks.py (404 for not found, 401 for unauthorized, 400 for validation)
- [X] T046 [US2] Verify user isolation enforcement in backend/src/services/task_service.py (all queries include WHERE user_id = current_user_id)
- [X] T047 [US2] Add logging for task operations in backend/src/services/task_service.py (log create, update, delete with user_id)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Responsive Frontend Interface (Priority: P3)

**Goal**: Provide modern, responsive web interface for task management on desktop and mobile

**Independent Test**: Load pages on different viewport sizes (1920px desktop, 375px mobile), verify responsive layout and API integration

### Implementation for User Story 3

- [X] T048 [P] [US3] Create root layout in frontend/src/app/layout.tsx (HTML structure, Tailwind CSS, Better Auth provider)
- [X] T049 [P] [US3] Create home page in frontend/src/app/page.tsx (landing page with sign up/sign in links)
- [X] T050 [P] [US3] Create dashboard page in frontend/src/app/dashboard/page.tsx (protected route, display user info, link to tasks)
- [X] T051 [US3] Create task list page in frontend/src/app/tasks/page.tsx (fetch and display user's tasks, filter by completed status)
- [X] T052 [US3] Create task details page in frontend/src/app/tasks/[id]/page.tsx (fetch single task, display details, edit/delete actions)
- [X] T053 [P] [US3] Create Button component in frontend/src/components/ui/Button.tsx (reusable button with variants, Tailwind styling)
- [X] T054 [P] [US3] Create Input component in frontend/src/components/ui/Input.tsx (reusable input with validation, Tailwind styling)
- [X] T055 [P] [US3] Create Card component in frontend/src/components/ui/Card.tsx (reusable card container, Tailwind styling)
- [X] T056 [US3] Create TaskCard component in frontend/src/components/TaskCard.tsx (display task with title, description, completed checkbox, actions)
- [X] T057 [US3] Create TaskForm component in frontend/src/components/TaskForm.tsx (create/edit task form with title and description fields)
- [X] T058 [US3] Implement responsive layout in frontend/src/app/layout.tsx (mobile-first design, breakpoints at 768px and 1920px)
- [X] T059 [US3] Add responsive styles to TaskCard in frontend/src/components/TaskCard.tsx (stack vertically on mobile, grid on desktop)
- [X] T060 [US3] Add responsive styles to task list page in frontend/src/app/tasks/page.tsx (single column mobile, multi-column desktop)
- [X] T061 [US3] Implement loading states in frontend/src/app/tasks/page.tsx (skeleton loader while fetching tasks)
- [X] T062 [US3] Implement error boundaries in frontend/src/app/layout.tsx (catch and display errors gracefully)
- [X] T063 [US3] Add error handling for API calls in frontend/src/services/api.ts (display user-friendly error messages)
- [X] T064 [US3] Implement task creation flow in frontend/src/app/tasks/page.tsx (open TaskForm modal, call API, refresh list)
- [X] T065 [US3] Implement task update flow in frontend/src/app/tasks/[id]/page.tsx (edit form, call API, update UI)
- [X] T066 [US3] Implement task deletion flow in frontend/src/app/tasks/[id]/page.tsx (confirmation dialog, call API, redirect to list)
- [X] T067 [US3] Implement task completion toggle in frontend/src/components/TaskCard.tsx (checkbox, call API, update UI)
- [X] T068 [US3] Add utility functions in frontend/src/lib/utils.ts (date formatting, class name helpers, validation helpers)
- [X] T069 [US3] Test responsive layout on desktop viewport (1920px width, verify multi-column layout)
- [X] T070 [US3] Test responsive layout on mobile viewport (375px width, verify single-column layout)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T071 [P] Create backend Dockerfile in backend/Dockerfile (Python 3.11, install dependencies, run uvicorn)
- [X] T072 [P] Create frontend Dockerfile in frontend/Dockerfile (Node.js 18, install dependencies, build Next.js, run production server)
- [X] T073 [P] Add logging configuration in backend/src/config.py (structured logging, log levels, log format)
- [X] T074 [P] Add request logging middleware in backend/src/main.py (log all requests with method, path, status, duration)
- [ ] T075 Add rate limiting for auth endpoints in backend/src/api/v1/auth.py (prevent brute force attacks, 5 requests per minute)
- [ ] T076 Add input sanitization in backend/src/api/v1/tasks.py (prevent XSS attacks, sanitize title and description)
- [ ] T077 Optimize database queries in backend/src/services/task_service.py (use select_related for joins, add query hints)
- [ ] T078 Add database connection pooling in backend/src/database/connection.py (configure pool size, timeout, recycling)
- [X] T079 [P] Add loading indicators to all forms in frontend (Button component shows spinner during submission)
- [ ] T080 [P] Add success notifications in frontend (toast/snackbar for successful operations)
- [X] T081 Verify environment variables documented in backend/.env.example and frontend/.env.local.example (all required vars listed with descriptions)
- [ ] T082 Run quickstart.md validation (follow setup guide, verify all steps work, update if needed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - No dependencies on other stories (backend only)
  - User Story 3 (P3): Can start after Foundational - Requires User Story 2 API endpoints for integration
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of User Story 1 for backend implementation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires User Story 1 (auth) and User Story 2 (API) for full integration

### Within Each User Story

- Models before services
- Services before endpoints/pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- User Story 1 and User Story 2 backend work can proceed in parallel after Foundational phase
- Models within a story marked [P] can run in parallel
- UI components marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch models in parallel:
Task: "T020 [P] [US1] Create User model in backend/src/models/user.py"
Task: "T021 [P] [US1] Create __init__.py files in backend/src/models/__init__.py"

# Launch frontend pages in parallel:
Task: "T027 [P] [US1] Create login page in frontend/src/app/(auth)/login/page.tsx"
Task: "T028 [P] [US1] Create signup page in frontend/src/app/(auth)/signup/page.tsx"
Task: "T029 [P] [US1] Create AuthForm component in frontend/src/components/AuthForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Task CRUD)
5. **STOP and VALIDATE**: Test authentication and task CRUD via API (use Postman/curl)
6. Deploy backend API if ready

### Full Application (All User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Auth) → Test independently
3. Add User Story 2 (Task CRUD) → Test independently via API
4. Add User Story 3 (Frontend UI) → Test independently → Full application ready
5. Complete Phase 6: Polish → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: User Story 2 (Task CRUD backend)
   - Developer C: User Story 3 (Frontend UI - waits for US1 and US2 APIs)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests are OPTIONAL and not included as they were not explicitly requested in the specification
- All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

---

## Task Summary

**Total Tasks**: 82 tasks
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (User Story 1 - Authentication): 13 tasks
- Phase 4 (User Story 2 - Task CRUD): 15 tasks
- Phase 5 (User Story 3 - Frontend UI): 23 tasks
- Phase 6 (Polish): 12 tasks

**Parallel Opportunities**: 31 tasks marked [P] can run in parallel within their phase

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 = 47 tasks (Authentication + Task CRUD API)

**Independent Test Criteria**:
- User Story 1: Create account → Sign in → Receive JWT → Verify token required
- User Story 2: Authenticate → Create tasks → Verify user isolation → Test CRUD operations
- User Story 3: Load pages on desktop/mobile → Verify responsive layout → Test API integration
