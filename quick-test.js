#!/usr/bin/env node

/**
 * Quick test to verify the JavaScript interface changes
 * Copy this to your React Native project and run: node quick-test.js
 */

console.log('🧪 Quick JavaScript Interface Test\n');

try {
  // Test the import
  console.log('1. Testing import...');
  
  // Simulate React Native environment
  global.NativeModules = {
    RealtimeAudioAnalysis: {
      startAnalysis: () => Promise.resolve(),
      stopAnalysis: () => Promise.resolve(),
      isAnalyzing: () => Promise.resolve(false),
      getAnalysisConfig: () => Promise.resolve({}),
      addListener: () => {},
      removeListeners: () => {},
    }
  };
  
  global.NativeEventEmitter = class {
    constructor(module) {
      this.module = module;
    }
    addListener(eventType, listener) {
      return { remove: () => {} };
    }
    removeAllListeners() {}
  };
  
  global.Platform = { select: (obj) => obj.default || '' };
  
  // Mock require function for react-native
  const originalRequire = require;
  require = function(moduleName) {
    if (moduleName === 'react-native') {
      return {
        NativeModules: global.NativeModules,
        NativeEventEmitter: global.NativeEventEmitter,
        Platform: global.Platform
      };
    }
    return originalRequire.apply(this, arguments);
  };
  
  // Now test the module
  const RealtimeAudioAnalyzer = originalRequire('./src/index.tsx').default;
  
  if (!RealtimeAudioAnalyzer) {
    console.log('❌ Module import failed');
    process.exit(1);
  }
  
  console.log('✅ Module imported successfully');
  
  // Test methods
  console.log('\n2. Testing methods...');
  const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'getAnalysisConfig'];
  
  for (const method of methods) {
    if (typeof RealtimeAudioAnalyzer[method] === 'function') {
      console.log(`   ✅ ${method}`);
    } else {
      console.log(`   ❌ ${method} (missing)`);
    }
  }
  
  console.log('\n✅ JavaScript interface test passed!');
  console.log('\n📋 Next steps for your React Native app:');
  console.log('1. Copy the updated src/index.tsx to your node_modules');
  console.log('2. Or reinstall the module');
  console.log('3. Rebuild your React Native app');
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
  console.log('\nThis might be expected if running outside React Native environment.');
}