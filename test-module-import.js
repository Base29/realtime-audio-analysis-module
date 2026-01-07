#!/usr/bin/env node

/**
 * Simple test to verify the module can be imported without React Native dependencies
 * Run this from the module directory
 */

console.log('🧪 Testing Module Import (Node.js compatible)\n');

try {
  // Mock React Native dependencies for Node.js
  const mockNativeModules = {
    RealtimeAudioAnalysis: {
      startAnalysis: () => Promise.resolve(),
      stopAnalysis: () => Promise.resolve(),
      isAnalyzing: () => Promise.resolve(false),
      getAnalysisConfig: () => Promise.resolve({}),
      addListener: () => {},
      removeListeners: () => {},
    }
  };

  const mockNativeEventEmitter = class {
    constructor(module) {
      this.module = module;
    }
    addListener(eventType, listener) {
      return { remove: () => {} };
    }
    removeAllListeners() {}
  };

  const mockPlatform = { 
    select: (obj) => obj.default || '' 
  };

  // Mock require for react-native
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  
  Module.prototype.require = function(id) {
    if (id === 'react-native') {
      return {
        NativeModules: mockNativeModules,
        NativeEventEmitter: mockNativeEventEmitter,
        Platform: mockPlatform
      };
    }
    return originalRequire.apply(this, arguments);
  };

  console.log('1. Testing module import...');
  
  // Try to import the module from the built file
  let RealtimeAudioAnalyzer;
  try {
    RealtimeAudioAnalyzer = require('./lib/commonjs/index.js').default;
    console.log('✅ Module imported successfully from lib/commonjs/index.js');
  } catch (error) {
    console.log('❌ Failed to import from lib/commonjs/index.js:', error.message);
    
    // Try alternative paths
    try {
      RealtimeAudioAnalyzer = require('./lib/commonjs/index').default;
      console.log('✅ Module imported successfully from lib/commonjs/index');
    } catch (altError) {
      console.log('❌ Alternative import also failed:', altError.message);
      throw new Error('Could not import module from any path');
    }
  }
  
  if (!RealtimeAudioAnalyzer) {
    console.log('❌ Module import returned null/undefined');
    process.exit(1);
  }
  
  // Test methods
  console.log('\n2. Testing methods...');
  const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'getAnalysisConfig', 'addListener', 'removeListeners'];
  
  let allMethodsAvailable = true;
  for (const method of methods) {
    if (typeof RealtimeAudioAnalyzer[method] === 'function') {
      console.log(`   ✅ ${method}`);
    } else {
      console.log(`   ❌ ${method} (missing)`);
      allMethodsAvailable = false;
    }
  }
  
  if (allMethodsAvailable) {
    console.log('\n✅ All methods are available!');
    console.log('\n📋 Next steps:');
    console.log('1. Update module in React Native app:');
    console.log('   cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp');
    console.log('   rm -rf node_modules/react-native-realtime-audio-analysis');
    console.log('   npm install file:local_modules/realtime-audio-analysis-module');
    console.log('2. Test in React Native app with TestAudioModule.js');
    console.log('3. Run: node debug-module-linking.js (to verify native linking)');
  } else {
    console.log('\n❌ Some methods are missing. Check the module build.');
  }
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
  
  if (error.message.includes('Cannot find module')) {
    console.log('\n💡 Module build files not found. Try:');
    console.log('   1. Run: ./fix-and-update-module.sh');
    console.log('   2. Or manually rebuild: npm run prepare');
  } else if (error.message.includes('Unexpected token')) {
    console.log('\n💡 Syntax error in built files. The build is corrupted.');
    console.log('   1. Run: ./fix-and-update-module.sh');
    console.log('   2. Check lib/commonjs/index.js for syntax errors');
  } else {
    console.log('\n💡 Unexpected error. Check the module build files.');
  }
}