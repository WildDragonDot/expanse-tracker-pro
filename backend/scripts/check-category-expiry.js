#!/usr/bin/env node

/**
 * Category Expiry Checker
 * 
 * This script checks for expired categories and sends automatic emails.
 * Run this script periodically using cron or a task scheduler.
 * 
 * Usage:
 *   node scripts/check-category-expiry.js
 * 
 * Cron example (run every hour):
 *   0 * * * * cd /path/to/project && node scripts/check-category-expiry.js
 */

const https = require('https');
const http = require('http');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🔍 Checking for expired categories...');
console.log('App URL:', APP_URL);

const url = new URL('/api/category-expiry-check', APP_URL);
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = protocol.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log(`✅ Successfully processed ${result.processed} expired categories`);
        
        if (result.results && result.results.length > 0) {
          console.log('\nResults:');
          result.results.forEach((r) => {
            if (r.status === 'success') {
              console.log(`  ✓ ${r.categoryName} → ${r.userEmail}`);
            } else {
              console.log(`  ✗ ${r.categoryName} → Failed: ${r.error}`);
            }
          });
        } else {
          console.log('No expired categories found.');
        }
      } else {
        console.error('❌ Error:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();
