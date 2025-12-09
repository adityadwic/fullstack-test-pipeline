/**
 * K6 Load Test Configuration
 * Performance testing scenarios for Test Orchestration System API
 */

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
    // Load test stages
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 10 },   // Stay at 10 users
        { duration: '30s', target: 20 },  // Ramp up to 20 users
        { duration: '1m', target: 20 },   // Stay at 20 users
        { duration: '30s', target: 0 },   // Ramp down to 0
    ],

    // Thresholds for pass/fail criteria
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
        http_req_failed: ['rate<0.15'],                  // Error rate under 15% (includes expected 401s)
        errors: ['rate<0.10'],                           // Custom error rate under 10%
        api_latency: ['avg<300', 'p(90)<500'],          // API latency thresholds
    },

    // Summary output
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
let testUserId = null;
let testProductId = null;

/**
 * Setup function - runs once before the test
 */
export function setup() {
    console.log(`Starting load test against ${BASE_URL}`);

    // First check if server is available
    let healthRes;
    try {
        healthRes = http.get(`${BASE_URL}/api/health`, { timeout: '10s' });
    } catch (e) {
        console.error(`Server not available at ${BASE_URL}. Please start the server first.`);
        console.error('Run: npm run dev (in another terminal)');
        return { userId: null, productId: null, serverAvailable: false };
    }

    if (healthRes.status !== 200) {
        console.error(`Server health check failed with status ${healthRes.status}`);
        return { userId: null, productId: null, serverAvailable: false };
    }

    console.log('Server is healthy, creating test data...');

    // Create test user for order tests
    const userRes = http.post(`${BASE_URL}/api/users`, JSON.stringify({
        email: `loadtest-${Date.now()}@test.com`,
        name: 'Load Test User',
        password: 'loadtest123'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    let userId = null;
    try {
        const userData = JSON.parse(userRes.body);
        userId = userData.data?.id;
    } catch (e) {
        console.warn('Could not create test user, continuing without it');
    }

    // Create test product
    const productRes = http.post(`${BASE_URL}/api/products`, JSON.stringify({
        name: 'Load Test Product',
        description: 'Product for load testing',
        price: 99.99,
        stock: 10000,
        category: 'electronics'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    let productId = null;
    try {
        const productData = JSON.parse(productRes.body);
        productId = productData.data?.id;
    } catch (e) {
        console.warn('Could not create test product, continuing without it');
    }

    console.log(`Setup complete. User ID: ${userId}, Product ID: ${productId}`);
    return { userId, productId, serverAvailable: true };
}

/**
 * Main test function - runs for each virtual user
 */
export default function (data) {
    // Skip if server is not available
    if (!data || !data.serverAvailable) {
        console.error('Server not available, skipping test iteration');
        sleep(1);
        return;
    }

    // API Health Check
    group('Health Check', () => {
        const res = http.get(`${BASE_URL}/api/health`);
        const success = check(res, {
            'health check status is 200': (r) => r.status === 200,
            'health check returns healthy': (r) => {
                try {
                    return JSON.parse(r.body).status === 'healthy';
                } catch (e) {
                    return false;
                }
            }
        });

        errorRate.add(!success);
        if (success) successfulRequests.add(1);
        apiLatency.add(res.timings.duration);
    });

    sleep(0.5);

    // Products API Tests
    group('Products API', () => {
        // Get all products
        const listRes = http.get(`${BASE_URL}/api/products`);
        check(listRes, {
            'list products status is 200': (r) => r.status === 200,
            'list products returns array': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.success === true && Array.isArray(body.data);
                } catch (e) {
                    return false;
                }
            }
        });
        apiLatency.add(listRes.timings.duration);

        // Filter products
        const filterRes = http.get(`${BASE_URL}/api/products?category=electronics`);
        check(filterRes, {
            'filter products status is 200': (r) => r.status === 200,
        });
        apiLatency.add(filterRes.timings.duration);

        // Get single product
        if (data.productId) {
            const singleRes = http.get(`${BASE_URL}/api/products/${data.productId}`);
            check(singleRes, {
                'get product status is 200': (r) => r.status === 200,
            });
            apiLatency.add(singleRes.timings.duration);
        }
    });

    sleep(0.5);

    // Users API Tests
    group('Users API', () => {
        // Get all users
        const listRes = http.get(`${BASE_URL}/api/users`);
        check(listRes, {
            'list users status is 200': (r) => r.status === 200,
        });
        apiLatency.add(listRes.timings.duration);

        // Login attempt
        const loginRes = http.post(`${BASE_URL}/api/users/login`, JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        // We expect 401 for invalid credentials, which is correct behavior
        check(loginRes, {
            'login responds appropriately': (r) => r.status === 200 || r.status === 401,
        });
        apiLatency.add(loginRes.timings.duration);
    });

    sleep(0.5);

    // Orders API Tests (read-only to avoid state issues)
    group('Orders API', () => {
        const listRes = http.get(`${BASE_URL}/api/orders`);
        check(listRes, {
            'list orders status is 200': (r) => r.status === 200,
        });
        apiLatency.add(listRes.timings.duration);
    });

    sleep(1);
}

/**
 * Teardown function - runs once after all tests complete
 */
export function teardown(data) {
    console.log('Load test completed');

    if (!data || !data.serverAvailable) {
        console.log('Server was not available, no cleanup needed');
        return;
    }

    // Clean up test data
    if (data.productId) {
        http.del(`${BASE_URL}/api/products/${data.productId}`);
    }
    if (data.userId) {
        http.del(`${BASE_URL}/api/users/${data.userId}`);
    }
}

/**
 * Handle test summary
 */
export function handleSummary(data) {
    return {
        'reports/performance/load-test-summary.json': JSON.stringify(data, null, 2),
    };
}
