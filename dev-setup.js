#!/usr/bin/env node

/**
 * Development setup script for Local Fishing Management System
 * Sets up both frontend and backend for local development
 */

const { execSync, spawn } = require('child_process');
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
    return false;
  }
}

function checkEnvironmentFiles() {
  log('🔍 Checking environment files...', colors.yellow);
  
  const envFile = path.join(process.cwd(), '.env');
  const envExampleFile = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExampleFile)) {
      log('📋 Creating .env from .env.example...', colors.yellow);
      fs.copyFileSync(envExampleFile, envFile);
      log('✅ .env file created. Please update it with your configuration.', colors.green);
    } else {
      log('❌ No .env or .env.example file found!', colors.red);
      return false;
    }
  }
  
  return true;
}

function setupDependencies() {
  log('📦 Installing dependencies...', colors.yellow);
  
  // Install frontend dependencies
  log('Installing frontend dependencies...', colors.cyan);
  if (!execCommand('npm install')) {
    return false;
  }
  
  // Install backend dependencies
  const backendPath = path.join(process.cwd(), 'backend');
  if (fs.existsSync(backendPath)) {
    log('Installing backend dependencies...', colors.cyan);
    if (!execCommand('npm install', backendPath)) {
      return false;
    }
  }
  
  return true;
}

function startDevelopment() {
  log('\n🚀 Starting development servers...', colors.bright + colors.blue);
  
  // Start backend server
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(process.cwd(), 'backend'),
    stdio: 'inherit',
    shell: true
  });
  
  // Wait a bit for backend to start
  setTimeout(() => {
    // Start frontend server
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down development servers...', colors.yellow);
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
  }, 2000);
}

function displayInfo() {
  log('\n📋 Development Information:', colors.bright + colors.magenta);
  log('=' .repeat(50), colors.magenta);
  log('Frontend: http://localhost:8080', colors.green);
  log('Backend:  http://localhost:8787', colors.green);
  log('Database: Supabase (configured in backend/.env)', colors.green);
  log('\n🔧 Available Commands:', colors.bright);
  log('npm run dev:full     - Start both frontend and backend', colors.cyan);
  log('npm run dev          - Start frontend only', colors.cyan);
  log('npm run dev:backend  - Start backend only', colors.cyan);
  log('npm run deploy:all   - Deploy both to production', colors.cyan);
  log('\n💡 Tips:', colors.bright);
  log('- Make sure your .env file is configured correctly', colors.yellow);
  log('- Check backend/wrangler.toml for backend configuration', colors.yellow);
  log('- Use Ctrl+C to stop the development servers', colors.yellow);
}

function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'setup';
  
  log('🎯 Local Fishing Management System - Development Setup', colors.bright + colors.magenta);
  log('=' .repeat(60), colors.magenta);
  
  switch (action) {
    case 'setup':
      if (!checkEnvironmentFiles()) {
        process.exit(1);
      }
      
      if (!setupDependencies()) {
        process.exit(1);
      }
      
      displayInfo();
      
      log('\n✅ Setup completed! Run "npm run dev:full" to start development.', colors.bright + colors.green);
      break;
      
    case 'start':
      startDevelopment();
      break;
      
    case 'info':
      displayInfo();
      break;
      
    default:
      log('Usage: node dev-setup.js [setup|start|info]', colors.yellow);
      break;
  }
}

if (require.main === module) {
  main();
}
