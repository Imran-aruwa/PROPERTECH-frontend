#!/usr/bin/env node
/**
 * PROPERTECH Frontend Diagnostic Script
 * Run this to show your current frontend setup
 */

const fs = require('fs');
const path = require('path');

function checkFrontendSetup() {
  console.log('\n' + '='.repeat(60));
  console.log('PROPERTECH FRONTEND DIAGNOSTIC');
  console.log('='.repeat(60) + '\n');

  const basePath = process.cwd();
  const results = {};

  // 1. Package.json Check
  console.log('1. PACKAGE.JSON CHECK:');
  const packagePath = path.join(basePath, 'package.json');
  let packageJson = {};
  
  if (fs.existsSync(packagePath)) {
    console.log('   ✅ package.json found');
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`   📦 Project: ${packageJson.name}`);
  } else {
    console.log('   ❌ package.json not found');
  }

  // 2. Framework Check
  console.log('\n2. FRAMEWORK CHECK:');
  const frameworks = {
    'next': 'Next.js',
    'react': 'React',
    'tailwindcss': 'Tailwind CSS',
  };

  for (const [pkg, name] of Object.entries(frameworks)) {
    if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
      const version = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
      console.log(`   ✅ ${name}: ${version}`);
      results[pkg] = version;
    } else {
      console.log(`   ❌ ${name}: NOT INSTALLED`);
    }
  }

  // 3. Authentication Libraries
  console.log('\n3. AUTHENTICATION CHECK:');
  const authLibs = {
    '@supabase/supabase-js': 'Supabase Client',
    '@supabase/auth-helpers-nextjs': 'Supabase Auth Helpers',
    'next-auth': 'NextAuth.js',
  };

  for (const [pkg, name] of Object.entries(authLibs)) {
    if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
      const version = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
      console.log(`   ✅ ${name}: ${version}`);
    } else {
      console.log(`   ⚠️  ${name}: NOT INSTALLED`);
    }
  }

  // 4. Payment Libraries
  console.log('\n4. PAYMENT LIBRARIES CHECK:');
  const paymentLibs = {
    '@stripe/react-stripe-js': 'Stripe React',
    '@stripe/stripe-js': 'Stripe JS',
    'stripe': 'Stripe',
  };

  for (const [pkg, name] of Object.entries(paymentLibs)) {
    if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
      const version = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
      console.log(`   ✅ ${name}: ${version}`);
    } else {
      console.log(`   ⚠️  ${name}: NOT INSTALLED`);
    }
  }

  // 5. Analytics Libraries
  console.log('\n5. ANALYTICS LIBRARIES CHECK:');
  const analyticsLibs = {
    '@next/bundle-analyzer': 'Bundle Analyzer',
    'next-gtag': 'GA4 Integration',
    'plausible-tracker': 'Plausible Tracker',
  };

  for (const [pkg, name] of Object.entries(analyticsLibs)) {
    if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
      const version = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
      console.log(`   ✅ ${name}: ${version}`);
    } else {
      console.log(`   ⚠️  ${name}: NOT INSTALLED`);
    }
  }

  // 6. Environment Variables
  console.log('\n6. ENVIRONMENT VARIABLES:');
  const envFiles = ['.env', '.env.local', '.env.example'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(basePath, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n').filter(line => line && !line.startsWith('#'));
      console.log(`   ✅ ${envFile} found (${lines.length} variables)`);
      
      // Show variable names (not values)
      lines.forEach(line => {
        const varName = line.split('=')[0];
        console.log(`      - ${varName}`);
      });
    }
  }

  // 7. Project Structure
  console.log('\n7. PROJECT STRUCTURE:');
  const dirs = {
    'app': 'Next.js App Router',
    'pages': 'Next.js Pages Router',
    'components': 'React Components',
    'lib': 'Utilities & Helpers',
    'public': 'Static Assets',
    'styles': 'CSS/Styles',
  };

  for (const [dir, desc] of Object.entries(dirs)) {
    const dirPath = path.join(basePath, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).length;
      console.log(`   ✅ ${dir}/: ${desc} (${files} items)`);
    } else {
      console.log(`   ⚠️  ${dir}/: NOT FOUND`);
    }
  }

  // 8. Key Files
  console.log('\n8. KEY FILES:');
  const keyFiles = {
    'package.json': 'Dependencies',
    'tsconfig.json': 'TypeScript Config',
    'next.config.js': 'Next.js Config',
    'tailwind.config.js': 'Tailwind Config',
    '.env': 'Environment Variables',
    'app/page.tsx': 'Home Page',
    'app/layout.tsx': 'Root Layout',
  };

  for (const [file, desc] of Object.entries(keyFiles)) {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}: ${desc}`);
    } else {
      console.log(`   ⚠️  ${file}: NOT FOUND`);
    }
  }

  // 9. TypeScript Check
  console.log('\n9. TYPESCRIPT CHECK:');
  const tsconfigPath = path.join(basePath, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    console.log('   ✅ TypeScript configured');
  } else {
    console.log('   ⚠️  No TypeScript configuration');
  }

  // 10. Public Assets
  console.log('\n10. PUBLIC ASSETS:');
  const publicPath = path.join(basePath, 'public');
  if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    console.log(`   ✅ public/ folder exists (${files.length} files)`);
    if (files.includes('logo.svg')) {
      console.log('      ✅ logo.svg found');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Framework: Next.js ${results.next || '❌ NOT FOUND'}`);
  console.log(`✅ Styling: ${results.tailwindcss ? 'Tailwind CSS' : '❌ NOT FOUND'}`);
  console.log(`✅ Auth Setup: ${packageJson.dependencies?.['@supabase/supabase-js'] ? '✅ Supabase' : '⚠️  Not configured'}`);
  console.log(`✅ Payment Ready: ${packageJson.dependencies?.['@stripe/react-stripe-js'] ? '✅ Stripe installed' : '❌ Not installed'}`);
  console.log(`✅ Analytics Ready: ${packageJson.dependencies?.['next-gtag'] ? '✅ GA4 ready' : '❌ Not installed'}`);
  console.log('\n' + '='.repeat(60) + '\n');

  return results;
}

// Run the check
checkFrontendSetup();