#!/usr/bin/env node

/**
 * Quick test to verify the JavaScript interface changes
 * Run this from your React Native project root: node quick-test.js
 */

console.log('🧪 Quick JavaScript Interface Test\n');

try {
  // Test the import from node_modules
  console.log('1. Testing import from node_modules...');
  
  // Try to import the module as it would be imported in React Native
  let RealtimeAudioAnalyzer;
  try {
    RealtimeAudioAnalyzer = require('react-native-realtime-audio-analysis').default;
    console.log('✅ Module imported successfully from node_modules');
  } catch (importError) {
    console.log('❌ Failed to import from node_modules:', importError.message);
    
    // Try alternative import paths
    try {
      const modulePath = './node_modules/react-native-realtime-audio-analysis';
      RealtimeAudioAnalyzer = require(modulePath).default;
      console.log('✅ Module imported successfully from local path');
    } catch (altError) {
      console.log('❌ Alternative import also failed:', altError.message);
      console.log('\n💡 This suggests the module is not properly installed in node_modules.');
      console.log('   Make sure you have installed the module in your React Native project:');
      console.log('   npm install /path/to/realtime-audio-analysis-module');
      process.exit(1);
    }
  }
  
  if (!RealtimeAudioAnalyzer) {
    console.log('❌ Module import returned null/undefined');
    console.log('   This suggests a linking issue.');
    process.exit(1);
  }
  
  // Test methods
  console.log('\n2. Testing methods...');
  const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'getAnalysisConfig', 'addListener', 'removeListeners'];
  
  for (const method of methods) {
    if (typeof RealtimeAudioAnalyzer[method] === 'function') {
      console.log(`   ✅ ${method}`);
    } else {
      console.log(`   ❌ ${method} (missing)`);
    }
  }
  
  // Test NativeModules simulation
  console.log('\n3. Testing NativeModules simulation...');
  
  // Simulate React Native environment for testing
  if (typeof global !== 'undefined') {
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
    
    console.log('✅ NativeModules simulation set up');
  }
  
  console.log('\n✅ JavaScript interface test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure the module is properly installed in your React Native project');
  console.log('2. Run: node debug-module-linking.js (to verify native linking)');
  console.log('3. Test the module in your React Native app using SimpleAudioTest.js');
  console.log('4. Use the AudioVisualizer.tsx component for a full visual test');
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
  
  if (error.message.includes('Unexpected token')) {
    console.log('\n💡 This error suggests the module needs to be rebuilt or reinstalled:');
    console.log('   The module source files have been updated but the built files are outdated.');
    console.log('\n🔧 Solutions:');
    console.log('   1. Reinstall the module in your React Native project:');
    console.log('      cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp');
    console.log('      npm uninstall react-native-realtime-audio-analysis');
    console.log('      npm install file:local_modules/realtime-audio-analysis-module');
    console.log('');
    console.log('   2. Or rebuild the module and copy files:');
    console.log('      cd /path/to/realtime-audio-analysis-module');
    console.log('      npm run prepare');
    console.log('      cp -r lib /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/node_modules/react-native-realtime-audio-analysis/');
    console.log('');
    console.log('   3. See UPDATE_MODULE_IN_RN_APP.md for detailed instructions');
  } else {
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you are running this from your React Native project root');
    console.log('2. Ensure the module is installed: npm install /path/to/realtime-audio-analysis-module');
    console.log('3. Check that node_modules/react-native-realtime-audio-analysis exists');
  }
}