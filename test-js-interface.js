#!/usr/bin/env node

/**
 * Test script to verify the JavaScript interface is working
 * Run this from your React Native project root
 */

console.log('🧪 Testing JavaScript Interface...\n');

try {
  // Try to import the module
  console.log('1. Testing module import...');
  const RealtimeAudioAnalyzer = require('react-native-realtime-audio-analysis').default;
  
  if (!RealtimeAudioAnalyzer) {
    console.log('❌ Module import returned null/undefined');
    console.log('   This suggests a linking issue.');
    process.exit(1);
  }
  
  console.log('✅ Module imported successfully');
  
  // Check available methods
  console.log('\n2. Checking available methods...');
  const expectedMethods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing', 'getAnalysisConfig', 'addListener', 'removeListeners'];
  const availableMethods = [];
  const missingMethods = [];
  
  for (const method of expectedMethods) {
    if (typeof RealtimeAudioAnalyzer[method] === 'function') {
      availableMethods.push(method);
      console.log(`   ✅ ${method}`);
    } else {
      missingMethods.push(method);
      console.log(`   ❌ ${method} (missing or not a function)`);
    }
  }
  
  console.log(`\n📊 Summary: ${availableMethods.length}/${expectedMethods.length} methods available`);
  
  if (missingMethods.length > 0) {
    console.log(`❌ Missing methods: ${missingMethods.join(', ')}`);
    console.log('This suggests an issue with the JavaScript interface.');
  } else {
    console.log('✅ All expected methods are available!');
  }
  
  // Test NativeModules access
  console.log('\n3. Testing NativeModules access...');
  const { NativeModules } = require('react-native');
  
  if (NativeModules.RealtimeAudioAnalysis) {
    console.log('✅ NativeModules.RealtimeAudioAnalysis is available');
    
    // Check native methods
    const nativeMethods = Object.keys(NativeModules.RealtimeAudioAnalysis);
    console.log(`   Native methods: ${nativeMethods.join(', ')}`);
  } else {
    console.log('❌ NativeModules.RealtimeAudioAnalysis is NOT available');
    console.log('   This indicates a native linking issue.');
  }
  
  console.log('\n🎯 Next Steps:');
  if (missingMethods.length === 0 && NativeModules.RealtimeAudioAnalysis) {
    console.log('✅ JavaScript interface looks good!');
    console.log('   Try running your React Native app and test the SimpleAudioTest component.');
  } else {
    console.log('❌ Issues detected. Try these fixes:');
    console.log('   1. Run: node final-fix.js');
    console.log('   2. Clean and rebuild: cd android && ./gradlew clean && cd .. && npx react-native run-android');
    console.log('   3. Check that MainApplication.kt includes RealtimeAudioAnalyzerPackage');
  }
  
} catch (error) {
  console.log('❌ Error testing JavaScript interface:');
  console.log(`   ${error.message}`);
  
  if (error.message.includes("Cannot resolve module 'react-native-realtime-audio-analysis'")) {
    console.log('\n💡 This suggests the module is not properly installed.');
    console.log('   Make sure you have installed the module in your React Native project.');
  } else if (error.message.includes('NativeModules')) {
    console.log('\n💡 This suggests a native linking issue.');
    console.log('   Run: node debug-module-linking.js to diagnose linking issues.');
  }
}