# 🧪 Test Orchestration System

<p align="center">
  <img src="https://img.shields.io/badge/Playwright-45ba63?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright"/>
  <img src="https://img.shields.io/badge/K6-7D64FF?style=for-the-badge&logo=k6&logoColor=white" alt="K6"/>
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

A comprehensive **end-to-end test automation ecosystem** integrating UI automation (Playwright), API automation (Supertest), and performance testing (K6) with a unified CI/CD pipeline.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Test Orchestration System                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Docker     │───▶│  Seed Data  │───▶│   API Tests     │  │
│  │  Compose    │    │             │    │   (Supertest)   │  │
│  └─────────────┘    └─────────────┘    └────────┬────────┘  │
│                                                  │           │
│                                                  ▼           │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Unified Report  │◀───│        E2E Tests (Playwright)   │ │
│  │   Dashboard     │    └─────────────────┬───────────────┘ │
│  └─────────────────┘                      │                  │
│          ▲                                ▼                  │
│          │          ┌─────────────────────────────────────┐ │
│          └──────────│   Performance Tests (K6)            │ │
│                     └─────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

- **🎭 UI Automation (Playwright)**
  - Page Object Model architecture
  - Multi-browser support (Chrome, Firefox, Safari)
  - Mobile viewport testing
  - Screenshot & video on failure

- **🔌 API Automation (Supertest + Jest)**
  - Full CRUD test coverage
  - Custom assertion helpers
  - HTML test report generation
  - Code coverage metrics

- **⚡ Performance Testing (K6)**
  - Load testing scenarios
  - Stress testing with breaking point detection
  - Custom metrics & thresholds
  - JSON report output

- **🐳 Docker Integration**
  - Multi-stage Dockerfile
  - Test orchestration with docker-compose
  - Isolated test environment

- **🔄 CI/CD Pipeline (GitHub Actions)**
  - Sequential test execution
  - Unified report generation
  - GitHub Pages deployment
  - Failure notifications

## 📁 Project Structure

```
test-orchestration-system/
├── src/
│   └── app/
│       ├── server.ts          # Express server
│       ├── database.ts        # SQLite database
│       ├── routes/            # API routes
│       └── public/            # Frontend files
├── tests/
│   ├── api/                   # API tests (Supertest)
│   │   ├── helpers/
│   │   ├── users.test.ts
│   │   ├── products.test.ts
│   │   └── orders.test.ts
│   ├── e2e/                   # E2E tests (Playwright)
│   │   ├── pages/             # Page Object Models
│   │   └── specs/             # Test specifications
│   └── performance/           # Performance tests (K6)
│       ├── load-test.js
│       └── stress-test.js
├── scripts/
│   ├── seed-data.ts           # Test data seeding
│   └── generate-report.ts     # Unified report generator
├── .github/workflows/
│   └── test-orchestration.yml # CI/CD pipeline
├── docker-compose.yml         # Development environment
├── docker-compose.test.yml    # Test execution
├── Dockerfile                 # Container build
├── playwright.config.ts       # Playwright configuration
└── jest.config.js            # Jest configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker & Docker Compose (optional)
- K6 (for performance tests)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd test-orchestration-system

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running the Application

```bash
# Development mode
npm run dev

# Seed sample data
npm run seed

# Open browser to http://localhost:3000
```

### Running Tests

```bash
# Run all tests (API + E2E Chromium)
npm run test:all

# Run full test suite with report generation
npm run test:full

# Run API tests only
npm run test:api

# Run E2E tests only
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E in headed mode
npm run test:e2e:headed

# Run performance tests
npm run test:performance

# Run stress tests
npm run test:performance:stress

# Generate unified report
npm run report:generate
```

### Docker Execution

```bash
# Build and start application
docker-compose up -d

# Run full test suite in Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# View generated reports
open reports/unified-report.html
```

## 🧪 Test Suites

### API Tests (Supertest + Jest)

| Suite | Tests | Coverage |
|-------|-------|----------|
| Users | 19 | CRUD, Authentication, Validation |
| Products | 20 | CRUD, Filtering, Stock Management |
| Orders | 18 | Lifecycle, Transactions, Cancellation |
| **Total** | **57** | |

### E2E Tests (Playwright - 5 Browsers)

| Suite | Tests | Coverage |
|-------|-------|----------|
| Home | 6 | Hero, Header, Nav, Cart Button |
| Products | 2 | Display, Grid Loading |
| Cart | 3 | Sidebar, Empty State, Close |
| Auth | 3 | Login Modal, Close, Register Switch |
| **Total** | **14 × 5 = 70** | |

### Performance Tests (K6)

| Test | VUs | Duration | Thresholds |
|------|-----|----------|------------|
| Load | 10-20 | 3.5 min | p95 < 500ms, err < 1% |
| Stress | 50-200 | 13 min | p95 < 2s, err < 10% |

## 📊 Reports

After running tests, reports are generated in the `reports/` directory:

- `reports/unified-report.html` - Combined dashboard
- `reports/api/test-report.html` - API test results
- `reports/e2e/index.html` - Playwright HTML report
- `reports/performance/` - K6 JSON results

## 🔄 CI/CD Pipeline

The GitHub Actions pipeline executes the following stages:

```
Build → Seed → API Tests → E2E Tests → Performance Tests → Generate Report → Deploy
```

Each stage depends on the previous one, ensuring sequential execution and proper test isolation.

## 🛠️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `DB_PATH` | ./data/test.db | Database path |
| `BASE_URL` | http://localhost:3000 | Base URL for tests |

### Customizing Tests

#### Playwright Configuration
Edit `playwright.config.ts` to:
- Add/remove browsers
- Change timeouts
- Configure reporters

#### K6 Configuration
Edit `tests/performance/load-test.js` to:
- Adjust virtual users (VUs)
- Modify test duration
- Update thresholds

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for demonstrating TestOps + DevOps capabilities
</p>
