#!/usr/bin/env node

/**
 * Integration test script to verify Python backend works with frontend
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing Python Backend Integration...\n');

// Test 1: Check if Python backend is running
console.log('1. Testing Python backend health...');
try {
  const response = execSync('curl -s http://localhost:3001/health', { encoding: 'utf8' });
  const health = JSON.parse(response);
  console.log('✅ Python backend is healthy:', health.status);
} catch (error) {
  console.log('❌ Python backend not running. Please start it first:');
  console.log('   cd backend_python && python run.py');
  process.exit(1);
}

// Test 2: Test code generation endpoint
console.log('\n2. Testing code generation...');
try {
  const testRequest = {
    prompt: "Create a simple hello world React component",
    framework: "react",
    conversation_history: [],
    current_files: {}
  };

  const curlCommand = `curl -s -X POST http://localhost:3001/api/v1/generate/ \\
    -H "Content-Type: application/json" \\
    -d '${JSON.stringify(testRequest)}'`;
  
  const response = execSync(curlCommand, { encoding: 'utf8' });
  const result = JSON.parse(response);
  
  if (result.files && Object.keys(result.files).length > 0) {
    console.log('✅ Code generation working! Generated files:', Object.keys(result.files));
  } else {
    console.log('❌ Code generation failed:', result);
  }
} catch (error) {
  console.log('❌ Code generation test failed:', error.message);
}

// Test 3: Test provider endpoints
console.log('\n3. Testing provider endpoints...');
try {
  const providersResponse = execSync('curl -s http://localhost:3001/api/v1/providers/available', { encoding: 'utf8' });
  const providers = JSON.parse(providersResponse);
  console.log('✅ Available providers:', providers);

  const currentResponse = execSync('curl -s http://localhost:3001/api/v1/providers/current', { encoding: 'utf8' });
  const current = JSON.parse(currentResponse);
  console.log('✅ Current provider:', current.provider);
} catch (error) {
  console.log('❌ Provider endpoints test failed:', error.message);
}

// Test 4: Test monitoring endpoints
console.log('\n4. Testing monitoring endpoints...');
try {
  const healthResponse = execSync('curl -s http://localhost:3001/api/v1/monitoring/health/detailed', { encoding: 'utf8' });
  const health = JSON.parse(healthResponse);
  console.log('✅ Detailed health check:', health.status);
  console.log('   Services:', Object.keys(health.services || {}));
} catch (error) {
  console.log('❌ Monitoring endpoints test failed:', error.message);
}

console.log('\n🎉 Integration tests completed!');
console.log('\n📝 Next steps:');
console.log('1. Update frontend/.env to use Python backend:');
console.log('   VITE_USE_TYPESCRIPT_BACKEND=false');
console.log('2. Start frontend: cd frontend && npm run dev');
console.log('3. Test the application at http://localhost:3000');