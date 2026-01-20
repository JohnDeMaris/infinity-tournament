#!/usr/bin/env node

/**
 * Infinity Tournament Manager - First-Time Setup Script
 *
 * Usage: node scripts/setup.js
 *
 * This script:
 * 1. Checks prerequisites
 * 2. Installs dependencies
 * 3. Creates .env.local from template
 * 4. Builds the shared package
 * 5. Shows next steps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = c.reset) {
  console.log(`${color}${msg}${c.reset}`);
}

function run(cmd, silent = false) {
  try {
    return execSync(cmd, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    });
  } catch (e) {
    return null;
  }
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  log('\n' + '='.repeat(60), c.bright);
  log('  Infinity Tournament Manager - Setup', c.bright);
  log('='.repeat(60) + '\n', c.bright);

  // Step 1: Check prerequisites
  log('[1/5] Checking prerequisites...', c.cyan);

  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  if (nodeVersion < 18) {
    log(`✗ Node.js ${process.version} - requires v18+`, c.red);
    process.exit(1);
  }
  log(`✓ Node.js ${process.version}`, c.green);

  const pnpmVersion = run('pnpm --version', true);
  if (!pnpmVersion) {
    log('✗ pnpm not found', c.red);
    log('\nInstall pnpm: npm install -g pnpm', c.yellow);
    process.exit(1);
  }
  log(`✓ pnpm ${pnpmVersion.trim()}`, c.green);

  // Step 2: Install dependencies
  log('\n[2/5] Installing dependencies...', c.cyan);
  run('pnpm install');
  log('✓ Dependencies installed', c.green);

  // Step 3: Setup .env.local
  log('\n[3/5] Configuring environment...', c.cyan);

  const envPath = path.join(ROOT_DIR, '.env.local');
  const envExamplePath = path.join(ROOT_DIR, '.env.local.example');

  if (fs.existsSync(envPath)) {
    log('✓ .env.local already exists', c.green);
  } else if (fs.existsSync(envExamplePath)) {
    // Ask for Supabase credentials
    log('\nYou need a Supabase project. Create one at: https://supabase.com\n', c.yellow);

    const supabaseUrl = await prompt('Enter your Supabase URL (or press Enter to skip): ');
    const supabaseKey = await prompt('Enter your Supabase anon key (or press Enter to skip): ');

    let envContent = fs.readFileSync(envExamplePath, 'utf8');

    if (supabaseUrl) {
      envContent = envContent.replace(
        'https://your-project-id.supabase.co',
        supabaseUrl
      );
    }
    if (supabaseKey) {
      envContent = envContent.replace(
        'your-anon-key-here',
        supabaseKey
      );
    }

    fs.writeFileSync(envPath, envContent);
    log('✓ .env.local created', c.green);

    if (!supabaseUrl || !supabaseKey) {
      log('⚠ Remember to update .env.local with your Supabase credentials', c.yellow);
    }
  } else {
    log('⚠ .env.local.example not found - create .env.local manually', c.yellow);
  }

  // Step 4: Build shared package
  log('\n[4/5] Building shared package...', c.cyan);
  run('pnpm --filter @infinity-tournament/shared build');
  log('✓ Shared package built', c.green);

  // Step 5: Show next steps
  log('\n[5/5] Setup complete!', c.cyan);

  log('\n' + '='.repeat(60), c.bright);
  log('  Next Steps', c.bright);
  log('='.repeat(60), c.bright);

  log(`
1. ${c.yellow}Configure Supabase${c.reset} (if not done above):
   - Create project at https://supabase.com
   - Update .env.local with your credentials

2. ${c.yellow}Run database migrations${c.reset}:
   Go to Supabase SQL Editor and run these files in order:
   - supabase/migrations/001_initial_schema.sql
   - supabase/migrations/002_game_systems.sql
   - supabase/migrations/003_list_validation.sql
   - supabase/migrations/004_admin_dashboard.sql
   - supabase/migrations/005_notifications.sql

3. ${c.yellow}Start development server${c.reset}:
   ${c.blue}pnpm dev${c.reset}

4. ${c.yellow}Open the app${c.reset}:
   http://localhost:3000

${c.green}Happy coding!${c.reset}
`);
}

main().catch(console.error);
