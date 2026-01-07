// Simple test to check if the build file works
console.log('Testing build file...');

// Mock react-native
const mockReactNative = {
  NativeModules: {
    RealtimeAudioAnalysis: {
      startAnalysis: () => Promise.resolve(),
      stopAnalysis: () => Promise.resolve(),
      isAnalyzing: () => Promise.resolve(false),
      getAnalysisConfig: () => Promise.resolve({})
    }
  },
  NativeEventEmitter: class {
    constructor(module) { this.module = module; }
    addListener() { return { remove: () => {} }; }
    removeAllListeners() {}
  },
  Platform: { select: (obj) => obj.default || '' }
};

// Mock require
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'react-native') return mockReactNative;
  return originalRequire.apply(this, arguments);
};

try {
  const module = require('./lib/commonjs/index.js');
  console.log('✅ Module loaded successfully');
  console.log('Module exports:', Object.keys(module));
  
  if (module.default) {
    console.log('✅ Default export found');
    console.log('Methods:', Object.keys(module.default));
  } else {
    console.log('❌ No default export');
  }
} catch (error) {
  console.log('❌ Error loading module:', error.message);
  console.log('Stack:', error.stack);
}