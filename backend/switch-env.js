#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.js');

function switchEnvironment(env) {
  if (!['development', 'production'].includes(env)) {
    console.error('❌ Invalid environment. Use "development" or "production"');
    process.exit(1);
  }

  try {
    // Read current config
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update the environment line
    configContent = configContent.replace(
      /environment: process\.env\.NODE_ENV \|\| '[^']*'/,
      `environment: process.env.NODE_ENV || '${env}'`
    );
    
    // Write updated config
    fs.writeFileSync(configPath, configContent);
    
    console.log(`✅ Switched to ${env} environment`);
    console.log(`🌍 Current environment: ${env}`);
    
    if (env === 'development') {
      console.log('🏠 Server will use: localhost');
      console.log('🔗 Test URL: http://localhost:3001');
      console.log('💡 For frontend: npm run dev');
    } else {
      console.log('🏢 Server will use: 192.168.120.4');
      console.log('🔗 Test URL: http://192.168.120.4:3001');
      console.log('💡 For frontend: npm run build && npm run preview');
    }
    
    console.log('\n💡 To start the server, run: node server.js');
    console.log('💡 To test the server, run: node test-proxy.js');
    console.log('💡 For Docker: docker-compose up -d');
    
  } catch (error) {
    console.error('❌ Error switching environment:', error.message);
    process.exit(1);
  }
}

// Get environment from command line arguments
const env = process.argv[2];

if (!env) {
  console.log('🔧 Environment Switcher for CORS Proxy Server');
  console.log('');
  console.log('Usage:');
  console.log('  node switch-env.js development  - Switch to localhost');
  console.log('  node switch-env.js production   - Switch to 192.168.120.4');
  console.log('');
  console.log('Current environments:');
  console.log('  development: Uses localhost for testing');
  console.log('  production:  Uses 192.168.120.4 for production');
  console.log('');
  console.log('Commands:');
  console.log('  Development:  NODE_ENV=development node server.js');
  console.log('  Production:   NODE_ENV=production node server.js');
  console.log('');
  process.exit(0);
}

switchEnvironment(env); 