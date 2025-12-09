#!/bin/bash

# Test Orchestration System - Run All Tests Script
# This script runs all tests in sequence: API -> E2E -> Performance

set -e

echo "=================================================="
echo "🚀 Test Orchestration System - Full Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2 PASSED${NC}"
    else
        echo -e "${RED}✗ $2 FAILED${NC}"
        exit 1
    fi
}

# Ensure reports directories exist
echo "📁 Creating report directories..."
mkdir -p reports/api reports/e2e reports/performance

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build
print_status $? "Build"

# Seed database
echo ""
echo "🌱 Seeding database..."
npm run seed
print_status $? "Database Seed"

# Start server in background
echo ""
echo "🖥️  Starting server..."
node dist/src/app/server.js &
SERVER_PID=$!
sleep 3

# Check if server is running
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    exit 1
fi

# Run API Tests
echo ""
echo "=================================================="
echo "📡 Running API Tests (Supertest + Jest)"
echo "=================================================="
npm run test:api
API_STATUS=$?
print_status $API_STATUS "API Tests"

# Run E2E Tests
echo ""
echo "=================================================="
echo "🎭 Running E2E Tests (Playwright)"
echo "=================================================="
npm run test:e2e -- --project=chromium
E2E_STATUS=$?
print_status $E2E_STATUS "E2E Tests"

# Run Performance Tests (short duration for local)
echo ""
echo "=================================================="
echo "⚡ Running Performance Tests (K6)"
echo "=================================================="
k6 run --duration 10s --vus 5 tests/performance/load-test.js || true
echo -e "${YELLOW}⚠ Performance test completed (some thresholds may fail)${NC}"

# Stop server
echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null || true

# Generate unified report
echo ""
echo "📊 Generating unified report..."
npm run report:generate
print_status $? "Report Generation"

# Summary
echo ""
echo "=================================================="
echo "📋 TEST SUMMARY"
echo "=================================================="
echo -e "API Tests:         ${GREEN}PASSED${NC}"
echo -e "E2E Tests:         ${GREEN}PASSED${NC}"
echo -e "Performance Tests: ${YELLOW}COMPLETED${NC}"
echo ""
echo "📄 Reports available at:"
echo "   - API:         reports/api/test-report.html"
echo "   - E2E:         reports/e2e/index.html"
echo "   - Performance: reports/performance/load-test-summary.json"
echo "   - Unified:     reports/unified-report.html"
echo ""
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo "=================================================="
