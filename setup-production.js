#!/usr/bin/env node

/**
 * Production Setup Helper
 * Guides through production setup process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function execCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd,
      env: { ...process.env }
    });
    return true;
  } catch (error) {
    log(`Error executing: ${command}`, colors.red);
    return false;
  }
}

async function checkAuthentication() {
  log('🔐 Checking Cloudflare authentication...', colors.yellow);
  
  try {
    execSync('wrangler whoami', { stdio: 'pipe' });
    log('✅ Already authenticated with Cloudflare', colors.green);
    return true;
  } catch (error) {
    log('❌ Not authenticated with Cloudflare', colors.red);
    
    const shouldLogin = await question('Would you like to login now? (y/n): ');
    if (shouldLogin.toLowerCase() === 'y') {
      log('Opening browser for authentication...', colors.cyan);
      return execCommand('wrangler login');
    }
    return false;
  }
}

async function setupBackendSecrets() {
  log('\n🔧 Setting up backend secrets...', colors.bright + colors.blue);
  
  const secrets = [
    {
      name: 'SUPABASE_URL',
      description: 'Supabase project URL',
      default: 'https://hebdlpduohlfhdgvugla.supabase.co'
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key',
      default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYmRscGR1b2hsZmhkZ3Z1Z2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1MTc2MSwiZXhwIjoyMDY3MDI3NzYxfQ.dkyr-RpF64ETKgDLG_yiHT9UE11UvHVcqovjmT30kmQ'
    },
    {
      name: 'JWT_SECRET',
      description: 'JWT secret (32+ characters)',
      default: 'your_super_secret_jwt_key_here_make_it_at_least_32_characters_long'
    },
    {
      name: 'JWT_REFRESH_SECRET',
      description: 'JWT refresh secret (32+ characters)',
      default: 'your_refresh_secret_here_also_make_it_32_characters_long'
    },
    {
      name: 'EMAIL_PASSWORD',
      description: 'Email app password',
      default: 'wzge fkwj unyk xkiw'
    },
    {
      name: 'CLOUDINARY_API_SECRET',
      description: 'Cloudinary API secret',
      default: 'pB_7QOUVorneWKAer1aErW-yNe0'
    }
  ];

  const setupSecrets = await question('Set up backend secrets? (y/n): ');
  if (setupSecrets.toLowerCase() !== 'y') {
    log('⏭️ Skipping secrets setup', colors.yellow);
    return true;
  }

  const backendPath = path.join(process.cwd(), 'backend');
  
  for (const secret of secrets) {
    log(`\n📝 Setting up ${secret.name}:`, colors.cyan);
    log(`Description: ${secret.description}`, colors.gray);
    
    const useDefault = await question(`Use default value? (y/n): `);
    
    if (useDefault.toLowerCase() === 'y') {
      log(`Setting ${secret.name} with default value...`, colors.yellow);
      try {
        execSync(`echo "${secret.default}" | wrangler secret put ${secret.name}`, {
          cwd: backendPath,
          stdio: 'inherit'
        });
        log(`✅ ${secret.name} set successfully`, colors.green);
      } catch (error) {
        log(`❌ Failed to set ${secret.name}`, colors.red);
        return false;
      }
    } else {
      log(`Please run manually: cd backend && wrangler secret put ${secret.name}`, colors.yellow);
    }
  }

  return true;
}

async function deployBackend() {
  log('\n🚀 Deploying backend...', colors.bright + colors.blue);
  
  const deploy = await question('Deploy backend now? (y/n): ');
  if (deploy.toLowerCase() !== 'y') {
    log('⏭️ Skipping backend deployment', colors.yellow);
    return null;
  }

  const backendPath = path.join(process.cwd(), 'backend');
  
  if (execCommand('npm run deploy', backendPath)) {
    log('✅ Backend deployed successfully!', colors.green);
    
    const workerUrl = await question('Enter your Worker URL (from deployment output): ');
    return workerUrl;
  } else {
    log('❌ Backend deployment failed', colors.red);
    return null;
  }
}

async function updateFrontendConfig(workerUrl) {
  if (!workerUrl) {
    log('⏭️ Skipping frontend config update', colors.yellow);
    return;
  }

  log('\n🎨 Updating frontend configuration...', colors.bright + colors.blue);
  
  const envProdPath = path.join(process.cwd(), '.env.production');
  
  if (fs.existsSync(envProdPath)) {
    let content = fs.readFileSync(envProdPath, 'utf8');
    content = content.replace(
      /VITE_API_URL=.*/,
      `VITE_API_URL=${workerUrl}`
    );
    content = content.replace(
      /REACT_APP_API_URL=.*/,
      `REACT_APP_API_URL=${workerUrl}`
    );
    
    fs.writeFileSync(envProdPath, content);
    log('✅ Frontend configuration updated', colors.green);
  } else {
    log('❌ .env.production not found', colors.red);
  }
}

async function deployFrontend() {
  log('\n🎨 Deploying frontend...', colors.bright + colors.blue);
  
  const deploy = await question('Deploy frontend now? (y/n): ');
  if (deploy.toLowerCase() !== 'y') {
    log('⏭️ Skipping frontend deployment', colors.yellow);
    return null;
  }

  // Build for production
  log('Building for production...', colors.cyan);
  if (!execCommand('npm run build:prod')) {
    log('❌ Build failed', colors.red);
    return null;
  }

  // Deploy to Pages
  log('Deploying to Cloudflare Pages...', colors.cyan);
  if (execCommand('wrangler pages deploy dist')) {
    log('✅ Frontend deployed successfully!', colors.green);
    
    const pagesUrl = await question('Enter your Pages URL (from deployment output): ');
    return pagesUrl;
  } else {
    log('❌ Frontend deployment failed', colors.red);
    return null;
  }
}

async function updateCorsConfig(pagesUrl) {
  if (!pagesUrl) {
    log('⏭️ Skipping CORS update', colors.yellow);
    return;
  }

  log('\n🔧 Updating CORS configuration...', colors.bright + colors.blue);
  
  const wranglerPath = path.join(process.cwd(), 'backend', 'wrangler.toml');
  
  if (fs.existsSync(wranglerPath)) {
    let content = fs.readFileSync(wranglerPath, 'utf8');
    
    // Update CORS_ORIGIN to include the Pages URL
    const currentCors = content.match(/CORS_ORIGIN = "([^"]+)"/);
    if (currentCors) {
      const newCors = `${currentCors[1]},${pagesUrl}`;
      content = content.replace(
        /CORS_ORIGIN = "[^"]+"/,
        `CORS_ORIGIN = "${newCors}"`
      );
      
      fs.writeFileSync(wranglerPath, content);
      log('✅ CORS configuration updated', colors.green);
      
      // Redeploy backend
      const redeploy = await question('Redeploy backend with updated CORS? (y/n): ');
      if (redeploy.toLowerCase() === 'y') {
        const backendPath = path.join(process.cwd(), 'backend');
        execCommand('npm run deploy', backendPath);
      }
    }
  }
}

async function main() {
  log('🎯 Production Setup Helper', colors.bright + colors.magenta);
  log('=' .repeat(50), colors.magenta);

  try {
    // Check authentication
    if (!(await checkAuthentication())) {
      log('❌ Authentication required. Please run: wrangler login', colors.red);
      process.exit(1);
    }

    // Setup backend secrets
    if (!(await setupBackendSecrets())) {
      log('❌ Failed to setup backend secrets', colors.red);
      process.exit(1);
    }

    // Deploy backend
    const workerUrl = await deployBackend();

    // Update frontend config
    await updateFrontendConfig(workerUrl);

    // Deploy frontend
    const pagesUrl = await deployFrontend();

    // Update CORS
    await updateCorsConfig(pagesUrl);

    log('\n🎉 Setup Complete!', colors.bright + colors.green);
    log('\nYour application URLs:', colors.bright);
    if (workerUrl) log(`Backend:  ${workerUrl}`, colors.cyan);
    if (pagesUrl) log(`Frontend: ${pagesUrl}`, colors.cyan);

    log('\n📋 Next steps:', colors.bright);
    log('1. Test your deployed application', colors.yellow);
    log('2. Set up custom domains (optional)', colors.yellow);
    log('3. Monitor performance and logs', colors.yellow);

  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, colors.red);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}
