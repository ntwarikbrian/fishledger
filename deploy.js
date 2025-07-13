#!/usr/bin/env node

/**
 * Deployment script for Local Fishing Management System
 * Handles deployment of both frontend (Cloudflare Pages) and backend (Cloudflare Workers)
 */

const { execSync } = require('child_process');
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

function execCommand(command, cwd = process.cwd()) {
  log(`Executing: ${command}`, colors.cyan);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd,
      env: { ...process.env }
    });
    return true;
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

function checkWranglerAuth() {
  try {
    execSync('wrangler whoami', { stdio: 'pipe' });
    return true;
  } catch (error) {
    log('❌ Not authenticated with Cloudflare. Please run: wrangler login', colors.red);
    return false;
  }
}

function deployBackend() {
  log('\n🚀 Deploying Backend (Cloudflare Workers)...', colors.bright + colors.blue);
  
  const backendPath = path.join(process.cwd(), 'backend');
  
  if (!fs.existsSync(backendPath)) {
    log('❌ Backend directory not found!', colors.red);
    return false;
  }
  
  // Install dependencies if needed
  if (!fs.existsSync(path.join(backendPath, 'node_modules'))) {
    log('📦 Installing backend dependencies...', colors.yellow);
    if (!execCommand('npm install', backendPath)) {
      return false;
    }
  }
  
  // Deploy backend
  log('🔧 Deploying backend to Cloudflare Workers...', colors.yellow);
  return execCommand('npm run deploy', backendPath);
}

function deployFrontend() {
  log('\n🚀 Deploying Frontend (Cloudflare Pages)...', colors.bright + colors.blue);
  
  // Build frontend for production
  log('🔨 Building frontend for production...', colors.yellow);
  if (!execCommand('npm run build:prod')) {
    return false;
  }
  
  // Deploy to Cloudflare Pages
  log('🔧 Deploying frontend to Cloudflare Pages...', colors.yellow);
  return execCommand('wrangler pages deploy dist');
}

function main() {
  const args = process.argv.slice(2);
  const deployTarget = args[0] || 'all';
  
  log('🎯 Local Fishing Management System - Deployment Script', colors.bright + colors.magenta);
  log('=' .repeat(60), colors.magenta);
  
  // Check authentication
  if (!checkWranglerAuth()) {
    process.exit(1);
  }
  
  let success = true;
  
  switch (deployTarget) {
    case 'backend':
      success = deployBackend();
      break;
      
    case 'frontend':
      success = deployFrontend();
      break;
      
    case 'all':
    default:
      // Deploy backend first, then frontend
      success = deployBackend();
      if (success) {
        success = deployFrontend();
      }
      break;
  }
  
  if (success) {
    log('\n✅ Deployment completed successfully!', colors.bright + colors.green);
    log('\n📋 Next steps:', colors.bright);
    log('1. Update your production environment variables', colors.yellow);
    log('2. Test your deployed application', colors.yellow);
    log('3. Update DNS settings if using custom domain', colors.yellow);
  } else {
    log('\n❌ Deployment failed!', colors.bright + colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployBackend, deployFrontend };
