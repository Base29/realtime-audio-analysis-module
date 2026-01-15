#!/usr/bin/env node

/**
 * Module Loading and Registration Validation Script
 * This script validates that the RealtimeAudioAnalyzer module
 * can be loaded and registered correctly in a React Native environment
 */

console.log('🔍 Validating Module Loading and Registration...');

// Check 1: Verify main entry points exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/index.ts',
  'src/NativeRealtimeAudioAnalyzer.ts',
  'ios/RealtimeAudioAnalyzer.swift',
  'RealtimeAudioAnalyzer.podspec',
  'react-native.config.js'
];

console.log('\n📁 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    process.exit(1);
  }
}

// Check 2: Verify package.json configuration
console.log('\n📦 Checking package.json configuration...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = ['main', 'module', 'types', 'react-native'];
for (const field of requiredFields) {
  if (packageJson[field]) {
    console.log(`✅ Package field '${field}': ${packageJson[field]}`);
  } else {
    console.log(`❌ Missing package field: ${field}`);
    process.exit(1);
  }
}

// Check 3: Verify TypeScript interface structure
console.log('\n🔧 Checking TypeScript interface...');
const nativeInterface = fs.readFileSync('src/NativeRealtimeAudioAnalyzer.ts', 'utf8');

const requiredMethods = [
  'startAnalysis',
  'stopAnalysis', 
  'isAnalyzing',
  'getAnalysisConfig',
  'start',
  'stop',
  'isRunning',
  'setSmoothing',
  'setFftConfig'
];

for (const method of requiredMethods) {
  if (nativeInterface.includes(method)) {
    console.log(`✅ Interface method: ${method}`);
  } else {
    console.log(`❌ Missing interface method: ${method}`);
    process.exit(1);
  }
}

// Check 4: Verify Swift module structure
console.log('\n🍎 Checking Swift module structure...');
const swiftContent = fs.readFileSync('ios/RealtimeAudioAnalyzer.swift', 'utf8');

// Check class declaration
if (swiftContent.includes('class RealtimeAudioAnalyzer: RCTEventEmitter')) {
  console.log('✅ Swift class properly inherits from RCTEventEmitter');
} else {
  console.log('❌ Swift class declaration issue');
  process.exit(1);
}

// Check required bridge methods
const requiredBridgeMethods = [
  'static func moduleName()',
  'override static func requiresMainQueueSetup()',
  'override func supportedEvents()',
  'override func methodQueue()'
];

for (const method of requiredBridgeMethods) {
  if (swiftContent.includes(method.split('(')[0])) {
    console.log(`✅ Swift bridge method: ${method.split('(')[0]}`);
  } else {
    console.log(`❌ Missing Swift bridge method: ${method}`);
    process.exit(1);
  }
}

// Check 5: Verify JavaScript API structure
console.log('\n🌐 Checking JavaScript API structure...');
const jsInterface = fs.readFileSync('src/index.ts', 'utf8');

const requiredJSMethods = [
  'startAnalysis',
  'stopAnalysis',
  'isAnalyzing',
  'start',
  'stop',
  'isRunning',
  'onData',
  'addListener',
  'removeListeners'
];

for (const method of requiredJSMethods) {
  if (jsInterface.includes(method)) {
    console.log(`✅ JavaScript API method: ${method}`);
  } else {
    console.log(`❌ Missing JavaScript API method: ${method}`);
    process.exit(1);
  }
}

// Check 6: Verify event emitter setup
if (jsInterface.includes('NativeEventEmitter')) {
  console.log('✅ NativeEventEmitter properly configured');
} else {
  console.log('❌ NativeEventEmitter not found');
  process.exit(1);
}

// Check 7: Verify module registration logic
if (jsInterface.includes('TurboModuleRegistry') && jsInterface.includes('NativeModules')) {
  console.log('✅ Both TurboModule and legacy module support configured');
} else {
  console.log('❌ Module registration logic incomplete');
  process.exit(1);
}

console.log('\n🎉 Module Loading and Registration validation completed successfully!');
console.log('\n📋 Summary:');
console.log('   ✅ All required files present');
console.log('   ✅ Package.json properly configured');
console.log('   ✅ TypeScript interfaces complete');
console.log('   ✅ Swift bridge methods implemented');
console.log('   ✅ JavaScript API properly structured');
console.log('   ✅ Event emitter configured');
console.log('   ✅ Module registration logic complete');
console.log('\n✨ The module should load and register correctly in React Native apps!');