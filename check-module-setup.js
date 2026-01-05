#!/usr/bin/env node

/**
 * Module Linking Checker for React Native Projects
 * 
 * Place this file in your React Native project root and run:
 * node check-module-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking react-native-realtime-audio-analysis setup...\n');

const MODULE_NAME = 'react-native-realtime-audio-analysis';
const PACKAGE_NAME = 'com.realtimeaudio';

// Check if we're in a React Native project
if (!fs.existsSync('package.json') || !fs.existsSync('android') || !fs.existsSync('ios')) {
  console.log('❌ This doesn\'t appear to be a React Native project root');
  console.log('   Make sure you\'re running this from your React Native project directory');
  process.exit(1);
}

let issuesFound = 0;

// 1. Check module installation
console.log('1️⃣ Checking module installation...');
const modulePath = path.join('node_modules', MODULE_NAME);
if (fs.existsSync(modulePath)) {
  console.log('✅ Module found in node_modules');
  
  const packageJsonPath = path.join(modulePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`   📦 Name: ${packageJson.name}`);
      console.log(`   📦 Version: ${packageJson.version}`);
    } catch (e) {
      console.log('   ⚠️  Could not read module package.json');
    }
  }
} else {
  console.log('❌ Module NOT found in node_modules');
  console.log('   🔧 Fix: npm install /path/to/realtime-audio-analysis-module');
  issuesFound++;
}

// 2. Check React Native autolinking
console.log('\n2️⃣ Checking React Native autolinking...');
try {
  const configOutput = execSync('npx react-native config', { encoding: 'utf8', stdio: 'pipe' });
  
  if (configOutput.includes(MODULE_NAME)) {
    console.log('✅ Module detected by React Native autolinking');
  } else {
    console.log('❌ Module NOT detected by autolinking');
    console.log('   🔧 Fix: Manual linking required');
    issuesFound++;
  }
} catch (error) {
  console.log('⚠️  Could not run react-native config');
  console.log('   Make sure React Native CLI is installed');
}

// 3. Check Android configuration
console.log('\n3️⃣ Checking Android configuration...');

// Check settings.gradle
const settingsGradlePath = path.join('android', 'settings.gradle');
if (fs.existsSync(settingsGradlePath)) {
  const settingsContent = fs.readFileSync(settingsGradlePath, 'utf8');
  if (settingsContent.includes(MODULE_NAME)) {
    console.log('✅ Module found in android/settings.gradle');
  } else {
    console.log('❌ Module NOT found in android/settings.gradle');
    console.log('   🔧 Add: include \':react-native-realtime-audio-analysis\'');
    issuesFound++;
  }
} else {
  console.log('❌ android/settings.gradle not found');
  issuesFound++;
}

// Check app/build.gradle
const appBuildGradlePath = path.join('android', 'app', 'build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
  const buildContent = fs.readFileSync(appBuildGradlePath, 'utf8');
  if (buildContent.includes(MODULE_NAME)) {
    console.log('✅ Module found in android/app/build.gradle');
  } else {
    console.log('❌ Module NOT found in android/app/build.gradle');
    console.log('   🔧 Add: implementation project(\':react-native-realtime-audio-analysis\')');
    issuesFound++;
  }
} else {
  console.log('❌ android/app/build.gradle not found');
  issuesFound++;
}

// Check MainApplication
console.log('\n4️⃣ Checking MainApplication registration...');
const findMainApplication = () => {
  const searchDirs = [
    path.join('android', 'app', 'src', 'main', 'java'),
    path.join('android', 'app', 'src', 'main', 'kotlin')
  ];
  
  for (const searchDir of searchDirs) {
    if (fs.existsSync(searchDir)) {
      const findInDir = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            const result = findInDir(itemPath);
            if (result) return result;
          } else if (item.includes('MainApplication')) {
            return itemPath;
          }
        }
        return null;
      };
      
      const mainAppPath = findInDir(searchDir);
      if (mainAppPath) {
        const content = fs.readFileSync(mainAppPath, 'utf8');
        if (content.includes('RealtimeAudioAnalyzerPackage')) {
          console.log('✅ Module registered in MainApplication');
          console.log(`   📁 File: ${mainAppPath}`);
          return true;
        } else {
          console.log('❌ Module NOT registered in MainApplication');
          console.log(`   📁 File: ${mainAppPath}`);
          console.log('   🔧 Add: import com.realtimeaudio.RealtimeAudioAnalyzerPackage');
          console.log('   🔧 Add: packages.add(new RealtimeAudioAnalyzerPackage())');
          issuesFound++;
          return false;
        }
      }
    }
  }
  console.log('❌ MainApplication file not found');
  issuesFound++;
  return false;
};

findMainApplication();

// 5. Check iOS configuration
console.log('\n5️⃣ Checking iOS configuration...');
const podfileLockPath = path.join('ios', 'Podfile.lock');
if (fs.existsSync(podfileLockPath)) {
  const podfileLockContent = fs.readFileSync(podfileLockPath, 'utf8');
  if (podfileLockContent.includes('RealtimeAudioAnalyzer')) {
    console.log('✅ Module found in ios/Podfile.lock');
  } else {
    console.log('❌ Module NOT found in ios/Podfile.lock');
    console.log('   🔧 Run: cd ios && pod install');
    issuesFound++;
  }
} else {
  console.log('⚠️  ios/Podfile.lock not found (run pod install)');
}

// 6. Check permissions
console.log('\n6️⃣ Checking permissions...');
const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  if (manifestContent.includes('RECORD_AUDIO')) {
    console.log('✅ RECORD_AUDIO permission found in AndroidManifest.xml');
  } else {
    console.log('❌ RECORD_AUDIO permission missing');
    console.log('   🔧 Add: <uses-permission android:name="android.permission.RECORD_AUDIO" />');
    issuesFound++;
  }
} else {
  console.log('❌ AndroidManifest.xml not found');
}

// Summary
console.log('\n📋 SUMMARY');
console.log('='.repeat(50));

if (issuesFound === 0) {
  console.log('🎉 All checks passed! The module should work correctly.');
  console.log('\n✅ Next steps:');
  console.log('   1. Build your app: npx react-native run-android');
  console.log('   2. Test the module in your code');
} else {
  console.log(`❌ Found ${issuesFound} issue(s) that need to be fixed.`);
  console.log('\n🔧 Quick fix commands:');
  console.log('   1. npm install /path/to/realtime-audio-analysis-module');
  console.log('   2. cd android && ./gradlew clean && cd ..');
  console.log('   3. npx react-native run-android');
  console.log('\n📖 For manual linking, see: docs/MANUAL_LINKING.md');
}

console.log('\n🆘 If you still have issues:');
console.log('   - Check the console logs when running your app');
console.log('   - Look for native module errors in adb logcat');
console.log('   - Try the SimpleAudioTest.js component for testing');