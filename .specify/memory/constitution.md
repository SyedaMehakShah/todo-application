<!--
SYNC IMPACT REPORT
==================
Version Change: NEW → 1.0.0 (Initial constitution)
Rationale: First constitution for Phase II Todo Full-Stack Web Application

Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (4 principles: Reproducibility, Security, Clarity, Modularity)
  - Key Standards
  - Constraints
  - Success Criteria
  - Clarifications
  - Governance

Removed Sections: N/A

Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section present
  ✅ .specify/templates/spec-template.md - Requirements alignment verified
  ✅ .specify/templates/tasks-template.md - Task categorization compatible
  ⚠ .specify/templates/commands/*.md - Review pending for agent-specific references

Follow-up TODOs: None
-->

# Phase II Todo Full-Stack Web Application Constitution

## Core Principles

### I. Reproducibility
Every implemented feature MUST behave consistently across all environments and deployments. Code execution MUST produce identical results given identical inputs. Configuration MUST be externalized and version-controlled. All dependencies MUST be explicitly declared with pinned versions.

**Rationale**: Reproducibility ensures reliable testing, debugging, and deployment. It eliminates "works on my machine" issues and enables confident rollbacks.

### II. Security
Authentication and user data MUST be secure via JWT tokens. All sensitive data MUST be encrypted in transit and at rest. JWT secrets MUST be stored as environment variables and NEVER hardcoded. User isolation MUST be enforced at the database query level. All API endpoints MUST verify JWT tokens before processing requests.

**Rationale**: Security is non-negotiable for multi-user applications handling personal data. JWT-based authentication provides stateless, scalable security with proper token expiry and user isolation.

### III. Clarity
Code MUST be readable and maintainable for multi-developer review. Variable and function names MUST be descriptive and follow language conventions. Complex logic MUST include explanatory comments. API contracts MUST be documented with clear input/output specifications. Error messages MUST be actionable and user-friendly.

**Rationale**: Clarity reduces onboarding time, minimizes bugs, and enables effective code reviews. Clear code is maintainable code.

### IV. Modularity
Components, API routes, and database models MUST be reusable and well-isolated. Each module MUST have a single, well-defined responsibility. Dependencies between modules MUST be explicit and minimal. Frontend components MUST be independent and composable. Backend services MUST be decoupled from presentation logic.

**Rationale**: Modularity enables parallel development, independent testing, and easier refactoring. Well-isolated modules reduce coupling and increase system flexibility.

## Key Standards

### API Standards
- All API endpoints MUST return JSON responses
- All API responses MUST handle errors gracefully using HTTPException for backend
- All endpoints MUST include appropriate HTTP status codes (200, 201, 400, 401, 404, 500)
- All endpoints MUST validate input data before processing
- All endpoints MUST be versioned (e.g., /api/v1/...)

### Frontend Standards
- MUST follow Next.js 16+ App Router conventions for pages and layouts
- MUST use TypeScript for all frontend code
- MUST use Tailwind CSS for all styling; NO inline CSS allowed
- MUST implement responsive design for desktop and mobile viewports
- MUST handle loading states and error boundaries appropriately

### Backend Standards
- MUST use Python FastAPI framework
- MUST use SQLModel for ORM operations
- MUST implement proper error handling with try-catch blocks
- MUST log all significant operations and errors
- MUST validate all user inputs at API boundaries

### Database Standards
- Database schema MUST include necessary indexes for efficient queries
- All queries MUST be parameterized to prevent SQL injection
- MUST use migrations for all schema changes
- MUST enforce foreign key constraints where applicable
- MUST include created_at and updated_at timestamps on all entities

### Security Standards
- JWT tokens MUST be verified on every authenticated request
- JWT secret MUST be stored as environment variable BETTER_AUTH_SECRET
- Passwords MUST be hashed using industry-standard algorithms (bcrypt, argon2)
- MUST implement rate limiting on authentication endpoints
- MUST sanitize all user inputs to prevent XSS attacks

### Documentation Standards
- Technical documentation MUST be minimum 1000 words
- All code MUST be referenced with relevant spec file: `@specs/...`
- All API endpoints MUST be documented with request/response examples
- All environment variables MUST be documented in .env.example

## Constraints

### Technology Stack (NON-NEGOTIABLE)
- **Frontend**: Next.js 16+, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI, SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth with JWT plugin
- **Version Control**: Git with feature branch workflow

### Architectural Constraints
- Frontend and backend logic MUST be clearly separated
- NO business logic in frontend components
- NO presentation logic in backend services
- Database access MUST only occur through ORM (SQLModel)
- NO direct SQL queries except for complex analytics (must be justified)

### Development Constraints
- MUST implement only what is defined in the current phase
- MUST reference the relevant spec before coding
- MUST create feature branches for all new work
- MUST pass all tests before merging to main branch
- MUST use conventional commit messages

### Deployment Constraints
- MUST use environment variables for all configuration
- MUST NOT commit secrets or API keys to version control
- MUST include health check endpoints for monitoring
- MUST support graceful shutdown for backend services

## Success Criteria

### Functional Success
- All task CRUD endpoints MUST be functional with JWT-secured access
- Frontend MUST be fully responsive on desktop (1920px) and mobile (375px) viewports
- Users MUST only be able to access their own tasks (enforced at query level)
- Authentication flow MUST support signup, signin, and token refresh

### Security Success
- ZERO security vulnerabilities in authentication or database access
- All endpoints MUST return 401 Unauthorized for invalid/missing tokens
- User data MUST be isolated (no cross-user data leakage)
- All sensitive operations MUST be logged for audit trail

### Quality Success
- Implementation MUST match specifications in `@specs/features/task-crud.md` and `@specs/features/authentication.md`
- Testing MUST be completed and pass 100% of defined acceptance criteria
- Code MUST pass linting and formatting checks
- NO console errors or warnings in browser developer tools

### Performance Success
- API response time MUST be under 200ms for p95
- Frontend initial page load MUST be under 3 seconds
- Database queries MUST use indexes (no full table scans)
- Frontend MUST achieve Lighthouse score >90 for performance

## Clarifications

### Authentication Flow
- JWT tokens MUST be verified on every request to protected endpoints
- Token expiry MUST be configurable via environment variable (default: 7 days)
- Refresh token mechanism MUST be implemented for seamless user experience
- Failed authentication attempts MUST be logged for security monitoring

### Development Workflow
- MUST follow Agentic Dev Stack workflow: Write spec → Generate plan → Break into tasks → Implement via Claude Code
- NO manual coding allowed outside of Claude Code workflow
- MUST use specialized agents/skills for domain-specific tasks (auth-skill, frontend-skill, backend-skill, database-schema)
- MUST invoke code-reviewer and auth-security-reviewer after implementation

### Scope Management
- Only implement features defined in current phase specifications
- Any scope changes MUST be documented in spec amendments
- Out-of-scope requests MUST be captured as future enhancements
- MUST NOT add features proactively without user approval

### Code Organization
- Separate frontend and backend logic clearly (no mixing)
- Use consistent file naming conventions across the project
- Group related functionality in feature-based modules
- Keep configuration separate from business logic

## Governance

### Amendment Process
This constitution supersedes all other development practices and guidelines. Amendments require:

1. **Proposal**: Document proposed changes with rationale and impact analysis
2. **Review**: Technical review by project stakeholders
3. **Approval**: Explicit approval from project owner/lead
4. **Migration**: Update all dependent templates and documentation
5. **Version Bump**: Increment version according to semantic versioning rules

### Compliance Verification
- All pull requests MUST verify compliance with constitution principles
- Code reviews MUST check for violations of standards and constraints
- Automated linting and testing MUST enforce technical standards
- Security reviews MUST verify authentication and authorization compliance

### Complexity Justification
Any violation of constitution principles MUST be explicitly justified:
- Document why the violation is necessary
- Explain why simpler alternatives were rejected
- Include mitigation plan for technical debt
- Set timeline for remediation if temporary

### Version Control
- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Runtime Guidance
For day-to-day development guidance, refer to `CLAUDE.md` which provides operational instructions for Claude Code agents implementing this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-01-08 | **Last Amended**: 2026-01-08
