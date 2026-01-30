#!/usr/bin/env node

/**
 * Firebase Setup Helper Script
 * Run this script to check your Firebase setup and get guidance
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function checkEnvFile() {
  const envPath = path.join(__dirname, 'frontend', '.env')
  const envExamplePath = path.join(__dirname, 'frontend', '.env.example')

  log('\n📝 Checking environment configuration...', 'cyan')

  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red')
    
    if (fs.existsSync(envExamplePath)) {
      log('✓ .env.example found. Copying to .env...', 'yellow')
      fs.copyFileSync(envExamplePath, envPath)
      log('✓ .env file created! Please update it with your Firebase config.', 'green')
    } else {
      log('❌ .env.example also not found. Creating template...', 'yellow')
      createEnvTemplate(envPath)
    }
    
    return false
  }

  log('✓ .env file exists', 'green')
  
  // Check if env file has Firebase config
  const envContent = fs.readFileSync(envPath, 'utf8')
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_DATABASE_URL',
  ]

  let missingVars = []
  for (const varName of requiredVars) {
    const regex = new RegExp(`${varName}=.+`)
    if (!regex.test(envContent) || envContent.includes(`${varName}=your-`)) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    log('⚠️  Missing or incomplete Firebase configuration:', 'yellow')
    missingVars.forEach((v) => log(`   - ${v}`, 'yellow'))
    return false
  }

  log('✓ Firebase configuration appears complete', 'green')
  return true
}

function createEnvTemplate(envPath) {
  const template = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# Optional: Use Firebase Emulator for local development
VITE_USE_FIREBASE_EMULATOR=false

# Backend API URL
VITE_API_URL=http://localhost:5000
`
  
  fs.writeFileSync(envPath, template)
  log('✓ .env template created', 'green')
}

function checkFirebasePackage() {
  const packageJsonPath = path.join(__dirname, 'frontend', 'package.json')
  
  log('\n📦 Checking Firebase package...', 'cyan')

  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found!', 'red')
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  if (packageJson.dependencies?.firebase) {
    log(`✓ Firebase package installed (v${packageJson.dependencies.firebase})`, 'green')
    return true
  }

  log('❌ Firebase package not installed', 'red')
  log('   Run: npm install firebase', 'yellow')
  return false
}

function checkFirebaseFiles() {
  const frontendDir = path.join(__dirname, 'frontend', 'src')
  const requiredFiles = [
    'config/firebase.js',
    'services/firebase-realtime.js',
    'hooks/useFirebase.js',
  ]

  log('\n🗂️  Checking Firebase files...', 'cyan')

  let allExist = true
  for (const file of requiredFiles) {
    const filePath = path.join(frontendDir, file)
    if (fs.existsSync(filePath)) {
      log(`✓ ${file}`, 'green')
    } else {
      log(`❌ ${file} missing`, 'red')
      allExist = false
    }
  }

  return allExist
}

function displaySetupInstructions() {
  log('\n' + '='.repeat(60), 'cyan')
  log('🔥 FIREBASE SETUP INSTRUCTIONS', 'cyan')
  log('='.repeat(60), 'cyan')

  log('\n📖 Step 1: Create Firebase Project', 'yellow')
  log('   1. Go to https://console.firebase.google.com/')
  log('   2. Click "Add Project"')
  log('   3. Enter project name and follow the wizard')

  log('\n📖 Step 2: Register Web App', 'yellow')
  log('   1. Click the web icon (</>) in Firebase Console')
  log('   2. Register your app')
  log('   3. Copy the Firebase configuration')

  log('\n📖 Step 3: Enable Services', 'yellow')
  log('   • Realtime Database (required)')
  log('   • Authentication (recommended)')
  log('   • Firestore (optional)')
  log('   • Storage (optional)')

  log('\n📖 Step 4: Update .env File', 'yellow')
  log('   Edit frontend/.env with your Firebase config:')
  log('   VITE_FIREBASE_API_KEY=your-actual-api-key', 'blue')
  log('   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com', 'blue')
  log('   VITE_FIREBASE_PROJECT_ID=your-project-id', 'blue')
  log('   VITE_FIREBASE_DATABASE_URL=https://...firebaseio.com', 'blue')

  log('\n📖 Step 5: Set Security Rules', 'yellow')
  log('   In Firebase Console → Realtime Database → Rules')
  log('   Copy rules from FIREBASE_SETUP_GUIDE.md')

  log('\n📖 Step 6: Test Your Setup', 'yellow')
  log('   Run: npm run dev', 'blue')
  log('   Open browser console and check for Firebase logs')

  log('\n📚 Full Guide:', 'green')
  log('   See FIREBASE_SETUP_GUIDE.md for detailed instructions')
  
  log('\n' + '='.repeat(60), 'cyan')
}

function main() {
  log('\n🚀 Firebase Setup Checker', 'magenta')
  log('='.repeat(60), 'magenta')

  const envOk = checkEnvFile()
  const packageOk = checkFirebasePackage()
  const filesOk = checkFirebaseFiles()

  log('\n' + '='.repeat(60), 'cyan')
  log('📊 SETUP STATUS', 'cyan')
  log('='.repeat(60), 'cyan')

  const allGood = envOk && packageOk && filesOk

  if (allGood) {
    log('\n🎉 All checks passed!', 'green')
    log('Your Firebase setup is complete.', 'green')
    log('\nNext steps:', 'yellow')
    log('1. Verify Firebase config in .env file', 'yellow')
    log('2. Set up security rules in Firebase Console', 'yellow')
    log('3. Run: npm run dev', 'yellow')
  } else {
    log('\n⚠️  Setup incomplete', 'yellow')
    if (!packageOk) {
      log('\n👉 Run: cd frontend && npm install firebase', 'blue')
    }
    if (!envOk) {
      log('\n👉 Update frontend/.env with your Firebase config', 'blue')
    }
    if (!filesOk) {
      log('\n👉 Some Firebase files are missing. Re-run the setup.', 'blue')
    }
  }

  displaySetupInstructions()
}

main()
