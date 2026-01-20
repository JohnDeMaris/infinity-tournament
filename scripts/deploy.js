#!/usr/bin/env node

/**
 * Infinity Tournament Manager - Deployment Script
 *
 * Usage:
 *   node scripts/deploy.js [command]
 *
 * Commands:
 *   check     - Validate environment and dependencies
 *   build     - Build the application
 *   migrate   - Show migration instructions
 *   vercel    - Deploy to Vercel
 *   all       - Run check, build, and deploy (default)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase', 'migrations');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${ step }] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function run(command, options = {}) {
  const { silent = false, cwd = ROOT_DIR } = options;
  try {
    const result = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ============================================================================
// CHECK - Validate environment
// ============================================================================

function checkEnvironment() {
  logStep('1/4', 'Checking environment...');
  let errors = 0;

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    logSuccess(`Node.js ${nodeVersion}`);
  } else {
    logError(`Node.js ${nodeVersion} - requires v18+`);
    errors++;
  }

  // Check pnpm
  const pnpmResult = run('pnpm --version', { silent: true });
  if (pnpmResult.success) {
    logSuccess(`pnpm ${pnpmResult.output.trim()}`);
  } else {
    logError('pnpm not found - install with: npm install -g pnpm');
    errors++;
  }

  // Check .env.local
  const envPath = path.join(ROOT_DIR, '.env.local');
  if (fileExists(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('your-project-id') || envContent.includes('your-anon-key')) {
      logWarning('.env.local exists but contains placeholder values');
    } else if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      logSuccess('.env.local configured');
    } else {
      logWarning('.env.local missing Supabase configuration');
    }
  } else {
    logError('.env.local not found - copy from .env.local.example');
    errors++;
  }

  // Check packages/shared
  const sharedPackageJson = path.join(PACKAGES_DIR, 'shared', 'package.json');
  if (fileExists(sharedPackageJson)) {
    logSuccess('packages/shared exists');
  } else {
    logError('packages/shared not found');
    errors++;
  }

  // Check Vercel CLI (optional)
  const vercelResult = run('vercel --version', { silent: true });
  if (vercelResult.success) {
    logSuccess(`Vercel CLI ${vercelResult.output.trim()}`);
  } else {
    logWarning('Vercel CLI not found - install with: npm install -g vercel');
  }

  return errors === 0;
}

// ============================================================================
// BUILD - Build the application
// ============================================================================

function buildApplication() {
  logStep('2/4', 'Building application...');

  // Install dependencies
  log('\nInstalling dependencies...', colors.blue);
  const installResult = run('pnpm install');
  if (!installResult.success) {
    logError('Failed to install dependencies');
    return false;
  }
  logSuccess('Dependencies installed');

  // Build shared package
  log('\nBuilding shared package...', colors.blue);
  const sharedBuildResult = run('pnpm run build', { cwd: path.join(PACKAGES_DIR, 'shared') });
  if (!sharedBuildResult.success) {
    logError('Failed to build shared package');
    return false;
  }
  logSuccess('Shared package built');

  // Build Next.js app
  log('\nBuilding Next.js application...', colors.blue);
  const nextBuildResult = run('pnpm run build');
  if (!nextBuildResult.success) {
    logError('Failed to build Next.js application');
    return false;
  }
  logSuccess('Next.js application built');

  return true;
}

// ============================================================================
// MIGRATE - Database migration instructions
// ============================================================================

function showMigrationInstructions() {
  logStep('3/4', 'Database migrations...');

  const migrations = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  log('\nRun these migrations in your Supabase SQL Editor:', colors.yellow);
  log('https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n', colors.blue);

  migrations.forEach((migration, index) => {
    log(`  ${index + 1}. ${migration}`);
  });

  log('\nOr use Supabase CLI:', colors.yellow);
  log('  supabase db push', colors.blue);

  return true;
}

// ============================================================================
// DEPLOY - Deploy to Vercel
// ============================================================================

function deployToVercel() {
  logStep('4/4', 'Deploying to Vercel...');

  // Check if Vercel CLI is available
  const vercelCheck = run('vercel --version', { silent: true });
  if (!vercelCheck.success) {
    logError('Vercel CLI not installed');
    log('\nInstall with: npm install -g vercel', colors.yellow);
    log('Then run: vercel login', colors.yellow);
    return false;
  }

  // Check if already linked to Vercel
  const vercelDir = path.join(ROOT_DIR, '.vercel');
  if (!fileExists(vercelDir)) {
    log('\nFirst time deploying - this will set up your Vercel project.', colors.yellow);
    log('You\'ll be prompted to link or create a project.\n', colors.yellow);
  }

  // Deploy
  log('\nDeploying to Vercel...', colors.blue);

  // Use spawn for interactive deployment
  return new Promise((resolve) => {
    const vercel = spawn('vercel', ['--prod'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    vercel.on('close', (code) => {
      if (code === 0) {
        logSuccess('Deployed to Vercel!');
        resolve(true);
      } else {
        logError('Deployment failed');
        resolve(false);
      }
    });
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const command = process.argv[2] || 'all';

  log('\n' + '='.repeat(60), colors.bright);
  log('  Infinity Tournament Manager - Deployment', colors.bright);
  log('='.repeat(60), colors.bright);

  switch (command) {
    case 'check':
      checkEnvironment();
      break;

    case 'build':
      if (checkEnvironment()) {
        buildApplication();
      }
      break;

    case 'migrate':
      showMigrationInstructions();
      break;

    case 'vercel':
      await deployToVercel();
      break;

    case 'all':
      if (!checkEnvironment()) {
        logError('\nEnvironment check failed. Fix errors above before deploying.');
        process.exit(1);
      }

      if (!buildApplication()) {
        logError('\nBuild failed. Fix errors above before deploying.');
        process.exit(1);
      }

      showMigrationInstructions();

      log('\n' + '-'.repeat(60), colors.yellow);
      log('Ready to deploy! Run: node scripts/deploy.js vercel', colors.yellow);
      log('-'.repeat(60), colors.yellow);
      break;

    case 'help':
    default:
      log('\nUsage: node scripts/deploy.js [command]\n');
      log('Commands:');
      log('  check     Validate environment and dependencies');
      log('  build     Build the application');
      log('  migrate   Show database migration instructions');
      log('  vercel    Deploy to Vercel');
      log('  all       Run check and build (default)');
      log('  help      Show this help message');
      break;
  }

  log('');
}

main().catch(console.error);
