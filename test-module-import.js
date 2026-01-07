#!/usr/bin/env node

/**
 * Simple test to verify the module can be imported without React Native dependencies
 * Run this from your React Native project root
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
  
  // Try to import the module
  const RealtimeAudioAnalyzer = require('react-native-realtime-audio-analysis').default;
  
  if (!RealtimeAudioAnalyzer) {
    console.log('❌ Module import returned null/undefined');
    process.exit(1);
  }
  
  console.log('✅ Module imported successfully');
  
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
    console.log('1. Test in your React Native app with TestAudioModule.js');
    console.log('2. Run: node debug-module-linking.js (to verify native linking)');
    console.log('3. Use AudioVisualizer.tsx for full visual test');
  } else {
    console.log('\n❌ Some methods are missing. Check the module build.');
  }
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
  
  if (error.message.includes('Cannot find module')) {
    console.log('\n💡 Module not found. Make sure it\'s installed:');
    console.log('   npm install file:local_modules/realtime-audio-analysis-module');
  } else if (error.message.includes('Unexpected token')) {
    console.log('\n💡 Syntax error in built files. Try:');
    console.log('   1. Rebuild the module: npm run prepare');
    console.log('   2. Reinstall in React Native app');
    console.log('   3. Check UPDATE_MODULE_IN_RN_APP.md for details');
  } else {
    console.log('\n💡 Unexpected error. Check the module installation and build.');
  }
}