#!/usr/bin/env node

/**
 * Production Readiness Checker
 * Validates configuration before deployment
 */

const fs = require('fs');
const path = require('path');

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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, colors.green);
    return true;
  } else {
    log(`❌ ${description} - Missing: ${filePath}`, colors.red);
    return false;
  }
}

function checkEnvironmentFile(filePath, requiredVars) {
  if (!fs.existsSync(filePath)) {
    log(`❌ Environment file missing: ${filePath}`, colors.red);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPresent = true;

  requiredVars.forEach(varName => {
    if (content.includes(`${varName}=`)) {
      log(`  ✅ ${varName}`, colors.green);
    } else {
      log(`  ❌ ${varName} - Missing`, colors.red);
      allPresent = false;
    }
  });

  return allPresent;
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found', colors.red);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = ['dev', 'build', 'build:prod', 'deploy:frontend', 'deploy:backend', 'deploy:all'];
  
  let allPresent = true;
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      log(`  ✅ ${script}`, colors.green);
    } else {
      log(`  ❌ ${script} - Missing script`, colors.red);
      allPresent = false;
    }
  });

  return allPresent;
}

function checkBackendConfig() {
  const backendPath = path.join(process.cwd(), 'backend');
  const wranglerPath = path.join(backendPath, 'wrangler.toml');
  const packagePath = path.join(backendPath, 'package.json');

  let allGood = true;

  if (!checkFile(wranglerPath, 'Backend wrangler.toml')) {
    allGood = false;
  }

  if (!checkFile(packagePath, 'Backend package.json')) {
    allGood = false;
  }

  // Check wrangler.toml content
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, 'utf8');
    if (content.includes('local-fishing-backend')) {
      log('  ✅ Worker name configured', colors.green);
    } else {
      log('  ❌ Worker name not configured', colors.red);
      allGood = false;
    }

    if (content.includes('CORS_ORIGIN')) {
      log('  ✅ CORS configuration present', colors.green);
    } else {
      log('  ❌ CORS configuration missing', colors.red);
      allGood = false;
    }
  }

  return allGood;
}

function checkFrontendConfig() {
  const files = [
    { path: 'wrangler.toml', desc: 'Frontend wrangler.toml' },
    { path: 'public/_headers', desc: 'CORS headers file' },
    { path: 'public/_redirects', desc: 'SPA redirects file' },
    { path: 'vite.config.ts', desc: 'Vite configuration' }
  ];

  let allGood = true;
  files.forEach(file => {
    if (!checkFile(file.path, file.desc)) {
      allGood = false;
    }
  });

  return allGood;
}

function main() {
  log('🔍 Production Readiness Check', colors.bright + colors.magenta);
  log('=' .repeat(50), colors.magenta);

  let overallStatus = true;

  // Check environment files
  log('\n📋 Environment Configuration:', colors.bright + colors.blue);
  const envChecks = [
    {
      file: '.env',
      vars: ['VITE_API_URL', 'VITE_API_MODE', 'VITE_NODE_ENV'],
      desc: 'Development environment'
    },
    {
      file: '.env.production',
      vars: ['VITE_API_URL', 'VITE_API_MODE', 'VITE_NODE_ENV'],
      desc: 'Production environment'
    }
  ];

  envChecks.forEach(check => {
    log(`\n${check.desc}:`, colors.cyan);
    if (!checkEnvironmentFile(check.file, check.vars)) {
      overallStatus = false;
    }
  });

  // Check package.json scripts
  log('\n📦 Package Scripts:', colors.bright + colors.blue);
  if (!checkPackageJson()) {
    overallStatus = false;
  }

  // Check backend configuration
  log('\n🔧 Backend Configuration:', colors.bright + colors.blue);
  if (!checkBackendConfig()) {
    overallStatus = false;
  }

  // Check frontend configuration
  log('\n🎨 Frontend Configuration:', colors.bright + colors.blue);
  if (!checkFrontendConfig()) {
    overallStatus = false;
  }

  // Check deployment files
  log('\n🚀 Deployment Files:', colors.bright + colors.blue);
  const deploymentFiles = [
    { path: 'deploy.js', desc: 'Deployment script' },
    { path: 'DEPLOYMENT.md', desc: 'Deployment guide' },
    { path: 'PRODUCTION_DEPLOYMENT.md', desc: 'Production guide' },
    { path: 'CONNECTION_GUIDE.md', desc: 'Connection guide' }
  ];

  deploymentFiles.forEach(file => {
    if (!checkFile(file.path, file.desc)) {
      overallStatus = false;
    }
  });

  // Final status
  log('\n' + '='.repeat(50), colors.magenta);
  if (overallStatus) {
    log('✅ Production Ready!', colors.bright + colors.green);
    log('\nNext steps:', colors.bright);
    log('1. Run: wrangler login', colors.cyan);
    log('2. Run: node deploy.js', colors.cyan);
    log('3. Test your deployment', colors.cyan);
  } else {
    log('❌ Not Ready for Production', colors.bright + colors.red);
    log('\nPlease fix the issues above before deploying.', colors.yellow);
  }

  return overallStatus;
}

if (require.main === module) {
  const isReady = main();
  process.exit(isReady ? 0 : 1);
}

module.exports = { main };
