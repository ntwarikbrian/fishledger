#!/usr/bin/env node

/**
 * Frontend Deployment Script for LocalFishing
 * 
 * This script helps deploy the frontend to Cloudflare Pages with proper environment configuration.
 * 
 * Usage:
 *   npm run deploy:frontend:prod    # Deploy to production
 *   npm run deploy:frontend:preview # Deploy to preview/staging
 *   npm run deploy:frontend:dev     # Deploy to development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get environment from command line arguments
const environment = process.argv[2] || 'production';

// Validate environment
const validEnvironments = ['production', 'preview', 'development'];
if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

console.log(`🚀 Deploying LocalFishing Frontend to ${environment}...`);

try {
  // Step 1: Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Step 2: Build the application
  console.log('🔨 Building application...');
  execSync('npm run build:prod', { stdio: 'inherit' });

  // Step 3: Deploy to Cloudflare Pages
  console.log(`📤 Deploying to Cloudflare Pages (${environment})...`);
  
  let deployCommand;
  if (environment === 'production') {
    deployCommand = 'npx wrangler pages deploy dist --project-name=local-fishing-frontend --env=production';
  } else {
    deployCommand = `npx wrangler pages deploy dist --project-name=local-fishing-frontend --env=${environment}`;
  }

  execSync(deployCommand, { stdio: 'inherit' });

  console.log('✅ Deployment completed successfully!');
  console.log(`🌐 Your application should be available at:`);
  
  if (environment === 'production') {
    console.log('   Production: https://local-fishing-frontend.pages.dev');
  } else {
    console.log(`   ${environment}: https://${environment}.local-fishing-frontend.pages.dev`);
  }

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
