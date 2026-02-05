# Testing Framework Research - Phase II Todo Full-Stack Application

**Date:** 2026-01-08
**Project:** Phase II Todo Full-Stack Web Application
**Stack:** Python FastAPI + SQLModel (Backend) | Next.js 16+ TypeScript (Frontend)

---

## Executive Summary

This document provides testing framework recommendations for a full-stack Todo application. After evaluating current industry standards, community support, and technical requirements, the recommended testing stack is:

- **Backend Unit/Integration:** pytest
- **Frontend Unit/Component:** Vitest
- **End-to-End:** Playwright

---

## 1. Backend Testing (Python FastAPI + SQLModel)

### Decision: pytest

**Version:** pytest 8.x with pytest-asyncio

### Rationale

1. **Industry Standard for FastAPI**: pytest is the de facto testing framework for FastAPI applications, with official FastAPI documentation using pytest exclusively.

2. **Excellent Async Support**: pytest-asyncio plugin provides seamless async/await testing, critical for FastAPI's async endpoints.

3. **Rich Fixture System**: pytest's fixture system is ideal for managing database sessions, test clients, and dependency injection overrides.

4. **FastAPI TestClient Integration**: The `TestClient` from `fastapi.testclient` (built on Starlette) integrates perfectly with pytest.

5. **SQLModel Compatibility**: pytest fixtures work excellently with SQLModel's session management and database setup/teardown.

6. **Extensive Plugin Ecosystem**:
   - `pytest-asyncio`: Async test support
   - `pytest-cov`: Code coverage reporting
   - `pytest-mock`: Mocking utilities
   - `pytest-xdist`: Parallel test execution

7. **Superior Developer Experience**: Clear assertion messages, powerful parametrization, and minimal boilerplate.

### Alternatives Considered

#### unittest (Python Standard Library)
- **Pros**: Built-in, no external dependencies, familiar to Python developers
- **Cons**:
  - Verbose class-based syntax
  - Poor async support (requires manual event loop management)
  - Less intuitive fixture management
  - Weaker assertion messages
  - More boilerplate code
- **Verdict**: Rejected due to poor async support and verbose syntax

#### nose2
- **Pros**: Extension of unittest with some improvements
- **Cons**:
  - Less active maintenance (last major release 2020)
  - Smaller community compared to pytest
  - Limited async support
  - Fewer plugins and integrations
- **Verdict**: Rejected due to declining community support and limited async capabilities

### Best Practices

#### 1. Project Structure
```
backend/
├── app/
│   ├── api/
│   ├── models/
│   └── services/
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── test_api/            # API endpoint tests
│   ├── test_models/         # SQLModel tests
│   └── test_services/       # Business logic tests
└── pytest.ini               # pytest configuration
```

#### 2. Essential Configuration (pytest.ini)
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts =
    --strict-markers
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    -v
```

#### 3. Database Testing Pattern
```python
# conftest.py
import pytest
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient

@pytest.fixture(name="session")
def session_fixture():
    """Create a fresh database for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with database session override."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
```

#### 4. Async Endpoint Testing
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_todo(client: AsyncClient):
    """Test creating a new todo item."""
    response = await client.post(
        "/api/todos",
        json={"title": "Test Todo", "completed": False}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Todo"
    assert data["id"] is not None
```

#### 5. SQLModel Testing Pattern
```python
def test_todo_model_creation(session: Session):
    """Test SQLModel CRUD operations."""
    todo = Todo(title="Test", completed=False)
    session.add(todo)
    session.commit()
    session.refresh(todo)

    assert todo.id is not None
    assert todo.title == "Test"
    assert todo.completed is False
```

#### 6. Parametrized Testing
```python
@pytest.mark.parametrize("title,completed,expected_status", [
    ("Valid Todo", False, 201),
    ("", False, 422),  # Empty title
    ("A" * 300, False, 422),  # Too long
])
def test_todo_validation(client: TestClient, title, completed, expected_status):
    """Test input validation with multiple scenarios."""
    response = client.post(
        "/api/todos",
        json={"title": title, "completed": completed}
    )
    assert response.status_code == expected_status
```

#### 7. Contract Testing Pattern
```python
def test_todo_response_schema(client: TestClient):
    """Verify API contract matches expected schema."""
    response = client.get("/api/todos/1")
    assert response.status_code == 200

    data = response.json()
    assert "id" in data
    assert "title" in data
    assert "completed" in data
    assert "created_at" in data
    assert isinstance(data["id"], int)
    assert isinstance(data["completed"], bool)
```

#### 8. CI/CD Integration
```yaml
# .github/workflows/backend-tests.yml
name: Backend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov --cov-report=xml
      - uses: codecov/codecov-action@v3
```

---

## 2. Frontend Unit/Component Testing (Next.js 16+ TypeScript)

### Decision: Vitest

**Version:** Vitest 2.x with @testing-library/react

### Rationale

1. **Native Vite Integration**: Vitest is built on Vite, providing blazing-fast test execution with instant HMR for tests.

2. **Superior TypeScript Support**: First-class TypeScript support without additional configuration, type-aware mocking, and better type inference.

3. **Jest-Compatible API**: Drop-in replacement for Jest with familiar syntax, making migration easy and reducing learning curve.

4. **Faster Execution**: 5-10x faster than Jest for most test suites due to Vite's ESM-first approach and smart caching.

5. **Modern ESM Support**: Native ES modules support without transformation overhead, aligning with Next.js 16's modern architecture.

6. **Better Watch Mode**: Intelligent test re-running based on module graph, only running affected tests.

7. **Built-in Coverage**: Integrated coverage reporting with c8 (V8 coverage) without additional setup.

8. **Active Development**: Rapidly evolving with strong community backing from the Vite ecosystem.

### Alternatives Considered

#### Jest
- **Pros**:
  - Most widely adopted (largest community)
  - Extensive documentation and resources
  - Mature ecosystem with many plugins
  - Snapshot testing
- **Cons**:
  - Slower test execution (CommonJS-based)
  - Requires complex configuration for ESM and TypeScript
  - Heavier dependency footprint
  - Less optimal for modern Vite/Next.js projects
  - Transform overhead for TypeScript
- **Verdict**: Rejected due to performance concerns and configuration complexity with modern Next.js

#### Testing Library Alone (without test runner)
- **Pros**: Lightweight, focused on component testing
- **Cons**:
  - Requires separate test runner
  - No built-in assertion library
  - Missing test organization features
- **Verdict**: Rejected as incomplete solution (used alongside Vitest)

### Best Practices

#### 1. Project Structure
```
frontend/
├── app/                     # Next.js App Router
├── components/
│   ├── TodoList.tsx
│   └── __tests__/
│       └── TodoList.test.tsx
├── lib/
│   └── __tests__/
├── vitest.config.ts
└── vitest.setup.ts
```

#### 2. Vitest Configuration (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

#### 3. Setup File (vitest.setup.ts)
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

#### 4. Component Testing Pattern
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TodoList from '@/components/TodoList'

describe('TodoList', () => {
  it('renders todo items', () => {
    const todos = [
      { id: 1, title: 'Test Todo', completed: false },
    ]

    render(<TodoList todos={todos} />)

    expect(screen.getByText('Test Todo')).toBeInTheDocument()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn()
    const todos = [
      { id: 1, title: 'Test Todo', completed: false },
    ]

    render(<TodoList todos={todos} onToggle={onToggle} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(1)
    })
  })
})
```

#### 5. TypeScript Utility Testing
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, validateTodo } from '@/lib/utils'

describe('formatDate', () => {
  it('formats ISO date correctly', () => {
    const date = new Date('2026-01-08T12:00:00Z')
    expect(formatDate(date)).toBe('Jan 8, 2026')
  })
})

describe('validateTodo', () => {
  it('validates todo object structure', () => {
    const validTodo = { title: 'Test', completed: false }
    expect(validateTodo(validTodo)).toBe(true)
  })

  it('rejects invalid todo', () => {
    const invalidTodo = { title: '', completed: false }
    expect(validateTodo(invalidTodo)).toBe(false)
  })
})
```

#### 6. API Mocking with MSW (Mock Service Worker)
```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { beforeAll, afterAll, afterEach } from 'vitest'

const handlers = [
  http.get('/api/todos', () => {
    return HttpResponse.json([
      { id: 1, title: 'Test Todo', completed: false },
    ])
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

#### 7. Server Component Testing (Next.js 16)
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TodoPage from '@/app/todos/page'

// Mock the fetch for server components
global.fetch = vi.fn()

describe('TodoPage (Server Component)', () => {
  it('renders todos from server', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, title: 'Server Todo', completed: false },
      ],
    } as Response)

    const page = await TodoPage()
    render(page)

    expect(screen.getByText('Server Todo')).toBeInTheDocument()
  })
})
```

#### 8. CI/CD Integration
```yaml
# .github/workflows/frontend-tests.yml
name: Frontend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 3. End-to-End Testing

### Decision: Playwright

**Version:** Playwright 1.40+

### Rationale

1. **Multi-Browser Support**: Tests run on Chromium, Firefox, and WebKit out of the box, ensuring cross-browser compatibility.

2. **Superior Performance**: Faster test execution than Cypress due to parallel test running and efficient browser automation.

3. **Excellent TypeScript Support**: First-class TypeScript support with strong typing for all APIs.

4. **Auto-Waiting**: Intelligent auto-waiting for elements eliminates flaky tests without manual waits.

5. **Network Interception**: Powerful network mocking and interception capabilities for testing various scenarios.

6. **Multiple Contexts**: Can test multiple browser contexts, tabs, and iframes simultaneously (Cypress limitation).

7. **Better Debugging**: Built-in trace viewer, video recording, and screenshot capture for failed tests.

8. **Next.js Integration**: Official Next.js documentation recommends Playwright for E2E testing.

9. **API Testing**: Can test both UI and API endpoints in the same test suite.

10. **Active Development**: Backed by Microsoft with frequent updates and strong community support.

### Alternatives Considered

#### Cypress
- **Pros**:
  - Mature ecosystem with extensive plugins
  - Excellent developer experience with time-travel debugging
  - Strong community and documentation
  - Visual test runner
- **Cons**:
  - Single browser context limitation (no multi-tab testing)
  - Slower test execution (runs in browser)
  - iframe testing limitations
  - WebKit support only in paid version
  - More complex setup for TypeScript
  - Network stubbing less flexible than Playwright
- **Verdict**: Rejected due to architectural limitations and slower performance

#### Selenium WebDriver
- **Pros**:
  - Industry standard for decades
  - Supports many programming languages
  - Extensive browser support
- **Cons**:
  - Verbose API and complex setup
  - No auto-waiting (requires explicit waits)
  - Slower test execution
  - Poor TypeScript support
  - More flaky tests due to timing issues
- **Verdict**: Rejected as outdated compared to modern alternatives

### Best Practices

#### 1. Project Structure
```
e2e/
├── tests/
│   ├── auth.spec.ts
│   ├── todos.spec.ts
│   └── api.spec.ts
├── fixtures/
│   └── test-data.ts
├── page-objects/
│   ├── TodoPage.ts
│   └── LoginPage.ts
├── playwright.config.ts
└── global-setup.ts
```

#### 2. Playwright Configuration (playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### 3. Page Object Model Pattern
```typescript
// page-objects/TodoPage.ts
import { Page, Locator } from '@playwright/test'

export class TodoPage {
  readonly page: Page
  readonly todoInput: Locator
  readonly addButton: Locator
  readonly todoItems: Locator

  constructor(page: Page) {
    this.page = page
    this.todoInput = page.getByPlaceholder('What needs to be done?')
    this.addButton = page.getByRole('button', { name: 'Add' })
    this.todoItems = page.getByTestId('todo-item')
  }

  async goto() {
    await this.page.goto('/todos')
  }

  async addTodo(title: string) {
    await this.todoInput.fill(title)
    await this.addButton.click()
  }

  async getTodoCount(): Promise<number> {
    return await this.todoItems.count()
  }

  async toggleTodo(index: number) {
    await this.todoItems.nth(index).getByRole('checkbox').click()
  }
}
```

#### 4. E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test'
import { TodoPage } from '../page-objects/TodoPage'

test.describe('Todo Management', () => {
  let todoPage: TodoPage

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page)
    await todoPage.goto()
  })

  test('should create a new todo', async ({ page }) => {
    await todoPage.addTodo('Buy groceries')

    await expect(todoPage.todoItems).toHaveCount(1)
    await expect(todoPage.todoItems.first()).toContainText('Buy groceries')
  })

  test('should toggle todo completion', async ({ page }) => {
    await todoPage.addTodo('Test todo')
    await todoPage.toggleTodo(0)

    const checkbox = todoPage.todoItems.first().getByRole('checkbox')
    await expect(checkbox).toBeChecked()
  })

  test('should persist todos after refresh', async ({ page }) => {
    await todoPage.addTodo('Persistent todo')
    await page.reload()

    await expect(todoPage.todoItems).toHaveCount(1)
  })
})
```

#### 5. API Testing Pattern
```typescript
import { test, expect } from '@playwright/test'

test.describe('Todo API', () => {
  test('should create todo via API', async ({ request }) => {
    const response = await request.post('/api/todos', {
      data: {
        title: 'API Todo',
        completed: false,
      },
    })

    expect(response.ok()).toBeTruthy()
    const todo = await response.json()
    expect(todo.title).toBe('API Todo')
    expect(todo.id).toBeDefined()
  })

  test('should handle validation errors', async ({ request }) => {
    const response = await request.post('/api/todos', {
      data: {
        title: '',
        completed: false,
      },
    })

    expect(response.status()).toBe(422)
  })
})
```

#### 6. Authentication Testing
```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Login and save auth state
  await page.goto('http://localhost:3000/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await page.context().storageState({ path: 'auth.json' })
  await browser.close()
}

export default globalSetup

// Use in tests
test.use({ storageState: 'auth.json' })
```

#### 7. Network Mocking
```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Mock API failure
  await page.route('/api/todos', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    })
  })

  await page.goto('/todos')

  await expect(page.getByText('Failed to load todos')).toBeVisible()
})
```

#### 8. Visual Regression Testing
```typescript
test('should match todo page screenshot', async ({ page }) => {
  await page.goto('/todos')
  await expect(page).toHaveScreenshot('todo-page.png', {
    maxDiffPixels: 100,
  })
})
```

#### 9. CI/CD Integration
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 4. Testing Strategy Summary

### Test Pyramid

```
        /\
       /  \      E2E (Playwright)
      /    \     - Critical user flows
     /------\    - Cross-browser testing
    /        \
   /          \  Integration (pytest + Vitest)
  /            \ - API contracts
 /--------------\- Component interactions
/                \
------------------
    Unit Tests    (pytest + Vitest)
    - Business logic
    - Utilities
    - Models
```

### Coverage Targets

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All API endpoints and critical paths
- **E2E Tests**: Core user journeys (5-10 critical flows)

### Test Execution Strategy

1. **Local Development**:
   - Run unit tests in watch mode during development
   - Run integration tests before committing
   - Run E2E tests before pushing

2. **CI/CD Pipeline**:
   - Unit tests: Run on every commit (fast feedback)
   - Integration tests: Run on every commit
   - E2E tests: Run on PR and before deployment
   - Parallel execution for faster feedback

3. **Performance Benchmarks**:
   - Unit tests: < 30 seconds total
   - Integration tests: < 2 minutes total
   - E2E tests: < 5 minutes total

---

## 5. Installation Commands

### Backend (pytest)
```bash
cd backend
pip install pytest pytest-asyncio pytest-cov httpx
```

### Frontend (Vitest)
```bash
cd frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

### E2E (Playwright)
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

---

## 6. Package.json Scripts (Frontend)

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## 7. Key Takeaways

### Why This Stack?

1. **Performance**: Vitest and Playwright are significantly faster than alternatives
2. **TypeScript**: All tools have first-class TypeScript support
3. **Modern Architecture**: Aligned with Next.js 16 and FastAPI best practices
4. **Community**: Active development and strong community support
5. **CI/CD**: Easy integration with GitHub Actions and other CI platforms
6. **Developer Experience**: Excellent debugging tools and clear error messages

### Migration Path

If migrating from Jest/Cypress:
- **Jest → Vitest**: Minimal changes (API compatible)
- **Cypress → Playwright**: Requires rewriting tests but worth the investment

### Future Considerations

- **Contract Testing**: Consider Pact for microservices
- **Load Testing**: Consider k6 or Locust for performance testing
- **Visual Testing**: Consider Percy or Chromatic for visual regression
- **Mutation Testing**: Consider Stryker for test quality validation

---

## 8. References

- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)

---

**Document Status:** Final
**Last Updated:** 2026-01-08
**Next Review:** After Phase II implementation begins
