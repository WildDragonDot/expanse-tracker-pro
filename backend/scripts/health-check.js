#!/usr/bin/env node

/**
 * Health Check Script for Docker Container
 * This script checks if the application is running properly
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✅ Application is healthy');
    process.exit(0);
  } else {
    console.log('❌ Application is unhealthy');
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.log('❌ Health check failed:', err.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.log('❌ Health check timed out');
  healthCheck.destroy();
  process.exit(1);
});

healthCheck.end();