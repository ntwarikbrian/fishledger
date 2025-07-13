#!/usr/bin/env node

/**
 * Test script for frontend-backend connection
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvironmentConfig() {
  log('🔍 Checking Frontend Environment Configuration...', colors.bright + colors.blue);
  
  const envFiles = [
    { path: '.env', desc: 'Development environment' },
    { path: '.env.production', desc: 'Production environment' },
    { path: '.env.test-deployed', desc: 'Test with deployed backend' }
  ];

  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile.path)) {
      log(`✅ ${envFile.desc}: Found`, colors.green);
      
      const content = fs.readFileSync(envFile.path, 'utf8');
      const apiUrl = content.match(/VITE_API_URL=(.+)/);
      
      if (apiUrl) {
        log(`   API URL: ${apiUrl[1]}`, colors.cyan);
      }
    } else {
      log(`❌ ${envFile.desc}: Missing`, colors.red);
    }
  });
}

function checkAPIConfiguration() {
  log('\n🔧 Checking API Configuration Files...', colors.bright + colors.blue);
  
  const apiFiles = [
    'src/config/api.ts',
    'src/services/api.ts',
    'src/lib/api/client.ts',
    'src/lib/api.ts'
  ];

  apiFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}: Found`, colors.green);
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for environment variable usage
      if (content.includes('VITE_API_URL')) {
        log(`   ✅ Uses VITE_API_URL environment variable`, colors.green);
      }
      
      // Check for production URL
      if (content.includes('ntwaribrian262.workers.dev')) {
        log(`   ✅ Contains deployed backend URL`, colors.green);
      }
      
      // Check for environment detection
      if (content.includes('NODE_ENV') || content.includes('VITE_NODE_ENV')) {
        log(`   ✅ Has environment detection`, colors.green);
      }
    } else {
      log(`❌ ${file}: Missing`, colors.red);
    }
  });
}

function checkCORSConfiguration() {
  log('\n🌐 Checking CORS Configuration...', colors.bright + colors.blue);
  
  const corsFiles = [
    'public/_headers',
    'backend/wrangler.toml'
  ];

  corsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}: Found`, colors.green);
      
      const content = fs.readFileSync(file, 'utf8');
      
      if (file.includes('_headers')) {
        if (content.includes('Access-Control-Allow-Origin')) {
          log(`   ✅ CORS headers configured`, colors.green);
        }
      }
      
      if (file.includes('wrangler.toml')) {
        if (content.includes('CORS_ORIGIN')) {
          log(`   ✅ Backend CORS configured`, colors.green);
          
          const corsOrigin = content.match(/CORS_ORIGIN = "([^"]+)"/);
          if (corsOrigin) {
            log(`   Origins: ${corsOrigin[1]}`, colors.cyan);
          }
        }
      }
    } else {
      log(`❌ ${file}: Missing`, colors.red);
    }
  });
}

function checkDeploymentFiles() {
  log('\n🚀 Checking Deployment Configuration...', colors.bright + colors.blue);
  
  const deployFiles = [
    'wrangler.toml',
    'public/_redirects',
    'deploy.js',
    'package.json'
  ];

  deployFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}: Found`, colors.green);
      
      if (file === 'package.json') {
        const content = fs.readFileSync(file, 'utf8');
        const pkg = JSON.parse(content);
        
        const deployScripts = ['deploy:frontend', 'deploy:backend', 'deploy:all'];
        deployScripts.forEach(script => {
          if (pkg.scripts && pkg.scripts[script]) {
            log(`   ✅ ${script} script available`, colors.green);
          }
        });
      }
    } else {
      log(`❌ ${file}: Missing`, colors.red);
    }
  });
}

function generateConnectionSummary() {
  log('\n📋 Connection Summary:', colors.bright + colors.magenta);
  log('=' .repeat(50), colors.magenta);
  
  // Read current environment
  let currentApiUrl = 'Not configured';
  if (fs.existsSync('.env')) {
    const content = fs.readFileSync('.env', 'utf8');
    const apiUrl = content.match(/VITE_API_URL=(.+)/);
    if (apiUrl) {
      currentApiUrl = apiUrl[1];
    }
  }
  
  log(`Current API URL: ${currentApiUrl}`, colors.cyan);
  log(`Deployed Backend: https://local-fishing-backend.ntwaribrian262.workers.dev`, colors.cyan);
  
  log('\n🎯 Connection Options:', colors.bright);
  log('1. Local Development:', colors.yellow);
  log('   Frontend: http://localhost:8080', colors.cyan);
  log('   Backend:  http://localhost:8787', colors.cyan);
  
  log('\n2. Test with Deployed Backend:', colors.yellow);
  log('   Frontend: http://localhost:8080', colors.cyan);
  log('   Backend:  https://local-fishing-backend.ntwaribrian262.workers.dev', colors.cyan);
  
  log('\n3. Full Production:', colors.yellow);
  log('   Frontend: https://your-pages-url.pages.dev', colors.cyan);
  log('   Backend:  https://local-fishing-backend.ntwaribrian262.workers.dev', colors.cyan);
}

function generateNextSteps() {
  log('\n🚀 Next Steps:', colors.bright + colors.green);
  
  log('\n📝 To test frontend with deployed backend:', colors.yellow);
  log('1. Copy .env.test-deployed to .env:', colors.cyan);
  log('   cp .env.test-deployed .env', colors.cyan);
  log('2. Start frontend:', colors.cyan);
  log('   npm run dev', colors.cyan);
  log('3. Test at http://localhost:8080', colors.cyan);
  
  log('\n🌐 To deploy frontend to production:', colors.yellow);
  log('1. Deploy to Cloudflare Pages:', colors.cyan);
  log('   npm run deploy:frontend', colors.cyan);
  log('2. Update backend CORS with Pages URL', colors.cyan);
  log('3. Test production deployment', colors.cyan);
  
  log('\n🔧 To switch back to local development:', colors.yellow);
  log('1. Restore original .env:', colors.cyan);
  log('   git checkout .env', colors.cyan);
  log('2. Start both servers:', colors.cyan);
  log('   npm run dev:full', colors.cyan);
}

function main() {
  log('🎯 Frontend-Backend Connection Test', colors.bright + colors.magenta);
  log('=' .repeat(60), colors.magenta);

  checkEnvironmentConfig();
  checkAPIConfiguration();
  checkCORSConfiguration();
  checkDeploymentFiles();
  generateConnectionSummary();
  generateNextSteps();

  log('\n✅ Connection test completed!', colors.bright + colors.green);
}

main();
