/**
 * K6 Stress Test Configuration
 * Tests system behavior under extreme load conditions
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');
const apiLatency = new Trend('api_latency');
const breakingPoint = new Counter('breaking_point_errors');

// Stress test configuration
export const options = {
    stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users quickly
        { duration: '2m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Ramp up to 100 users
        { duration: '2m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 150 },  // Ramp up to 150 users
        { duration: '2m', target: 150 },  // Stay at 150 users - stress point
        { duration: '1m', target: 200 },  // Push to 200 users - breaking point test
        { duration: '1m', target: 200 },  // Hold at breaking point
        { duration: '2m', target: 0 },    // Ramp down to 0
    ],

    thresholds: {
        http_req_duration: ['p(95)<2000'],  // More lenient for stress test
        http_req_failed: ['rate<0.10'],     // Allow up to 10% error rate
        errors: ['rate<0.15'],              // Allow up to 15% custom errors
    },

    // Don't stop on threshold failure - we want to find the breaking point
    abortOnFail: false,
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data storage
let testData = {
    products: [],
    users: []
};

export function setup() {
    console.log(`Starting stress test against ${BASE_URL}`);
    console.log('This test will push the system to its limits');

    // Create multiple test products
    for (let i = 0; i < 5; i++) {
        const res = http.post(`${BASE_URL}/api/products`, JSON.stringify({
            name: `Stress Test Product ${i}`,
            description: 'Product for stress testing',
            price: 50 + Math.random() * 100,
            stock: 100000,
            category: ['electronics', 'clothing', 'books', 'home'][i % 4]
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

        try {
            const data = JSON.parse(res.body);
            if (data.data?.id) {
                testData.products.push(data.data.id);
            }
        } catch (e) {
            console.error('Failed to create test product', e);
        }
    }

    // Create test user
    const userRes = http.post(`${BASE_URL}/api/users`, JSON.stringify({
        email: `stresstest-${Date.now()}@test.com`,
        name: 'Stress Test User',
        password: 'stress123'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    try {
        const userData = JSON.parse(userRes.body);
        if (userData.data?.id) {
            testData.users.push(userData.data.id);
        }
    } catch (e) {
        console.error('Failed to create test user', e);
    }

    return testData;
}

export default function (data) {
    // Intensive API calls to stress the system

    // Heavy read operations
    group('Intensive Reads', () => {
        // Multiple product listings
        for (let i = 0; i < 3; i++) {
            const res = http.get(`${BASE_URL}/api/products`);
            const success = check(res, {
                'products list success': (r) => r.status === 200,
            });
            errorRate.add(!success);
            if (!success) breakingPoint.add(1);
            apiLatency.add(res.timings.duration);
        }

        // Product filtering
        const categories = ['electronics', 'clothing', 'books', 'home'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const filterRes = http.get(`${BASE_URL}/api/products?category=${category}`);
        check(filterRes, {
            'filter success': (r) => r.status === 200,
        });
        apiLatency.add(filterRes.timings.duration);

        // Price range filtering
        const minPrice = Math.floor(Math.random() * 50);
        const maxPrice = minPrice + 100;
        const priceRes = http.get(`${BASE_URL}/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}`);
        check(priceRes, {
            'price filter success': (r) => r.status === 200,
        });
        apiLatency.add(priceRes.timings.duration);
    });

    sleep(0.2);

    // Mixed read/write operations
    group('Mixed Operations', () => {
        // Read operations
        const healthRes = http.get(`${BASE_URL}/api/health`);
        check(healthRes, {
            'health check success': (r) => r.status === 200,
        });
        apiLatency.add(healthRes.timings.duration);

        const usersRes = http.get(`${BASE_URL}/api/users`);
        check(usersRes, {
            'users list success': (r) => r.status === 200,
        });
        apiLatency.add(usersRes.timings.duration);

        const ordersRes = http.get(`${BASE_URL}/api/orders`);
        check(ordersRes, {
            'orders list success': (r) => r.status === 200,
        });
        apiLatency.add(ordersRes.timings.duration);
    });

    sleep(0.2);

    // Concurrent requests
    group('Concurrent Requests', () => {
        const responses = http.batch([
            ['GET', `${BASE_URL}/api/health`],
            ['GET', `${BASE_URL}/api/products`],
            ['GET', `${BASE_URL}/api/users`],
            ['GET', `${BASE_URL}/api/orders`],
        ]);

        let allSuccess = true;
        for (const res of responses) {
            if (res.status !== 200) {
                allSuccess = false;
                breakingPoint.add(1);
            }
            apiLatency.add(res.timings.duration);
        }

        check(responses[0], {
            'batch requests successful': () => allSuccess,
        });

        errorRate.add(!allSuccess);
        if (allSuccess) successfulRequests.add(1);
    });

    sleep(0.3);

    // API endpoint stress
    group('Endpoint Stress', () => {
        // Rapid-fire requests
        for (let i = 0; i < 5; i++) {
            const res = http.get(`${BASE_URL}/api/products`);
            const success = res.status === 200;
            errorRate.add(!success);
            if (!success) breakingPoint.add(1);
            apiLatency.add(res.timings.duration);
        }
    });

    sleep(0.5);
}

export function teardown(data) {
    console.log('Stress test completed');
    console.log('Cleaning up test data...');

    // Clean up test products
    for (const productId of data.products || []) {
        http.del(`${BASE_URL}/api/products/${productId}`);
    }

    // Clean up test users
    for (const userId of data.users || []) {
        http.del(`${BASE_URL}/api/users/${userId}`);
    }

    console.log('Cleanup complete');
}

export function handleSummary(data) {
    // Calculate breaking point
    const breakingErrors = data.metrics.breaking_point_errors?.values?.count || 0;
    const totalRequests = data.metrics.http_reqs?.values?.count || 0;
    const breakingPointRatio = totalRequests > 0 ? breakingErrors / totalRequests : 0;

    const summary = {
        ...data,
        custom_analysis: {
            breaking_point_error_ratio: breakingPointRatio,
            system_held_under_stress: breakingPointRatio < 0.1,
            recommendations: getRecommendations(data)
        }
    };

    return {
        'reports/performance/stress-test-summary.json': JSON.stringify(summary, null, 2),
    };
}

function getRecommendations(data) {
    const recommendations = [];

    const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
    const errorRate = data.metrics.http_req_failed?.values?.rate || 0;

    if (p95 > 1000) {
        recommendations.push('Consider implementing caching for frequently accessed data');
    }

    if (p95 > 500) {
        recommendations.push('Database query optimization may improve response times');
    }

    if (errorRate > 0.05) {
        recommendations.push('High error rate detected - review error logs and increase resources');
    }

    if (recommendations.length === 0) {
        recommendations.push('System performed well under stress');
    }

    return recommendations;
}
