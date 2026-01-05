#!/usr/bin/env node

/**
 * Debug script to check module linking status
 * Run this in your React Native project root
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging React Native Module Linking\n');

// Check if module exists in node_modules
const modulePath = path.join(process.cwd(), 'node_modules', 'react-native-realtime-audio-analysis');
console.log('1. Checking module installation...');
if (fs.existsSync(modulePath)) {
  console.log('✅ Module found in node_modules');
  
  // Check package.json
  const packageJsonPath = path.join(modulePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`   Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
  }
} else {
  console.log('❌ Module NOT found in node_modules');
  console.log('   Try: npm install /path/to/realtime-audio-analysis-module');
}

// Check React Native config
console.log('\n2. Checking React Native autolinking...');
try {
  const { execSync } = require('child_process');
  const configOutput = execSync('npx react-native config', { encoding: 'utf8' });
  
  if (configOutput.includes('react-native-realtime-audio-analysis')) {
    console.log('✅ Module detected by React Native autolinking');
  } else {
    console.log('❌ Module NOT detected by autolinking');
    console.log('   Manual linking may be required');
  }
} catch (error) {
  console.log('⚠️  Could not run react-native config');
}

// Check Android files
console.log('\n3. Checking Android configuration...');
const androidSettingsPath = path.join(process.cwd(), 'android', 'settings.gradle');
if (fs.existsSync(androidSettingsPath)) {
  const settingsContent = fs.readFileSync(androidSettingsPath, 'utf8');
  if (settingsContent.includes('react-native-realtime-audio-analysis')) {
    console.log('✅ Module found in android/settings.gradle');
  } else {
    console.log('❌ Module NOT found in android/settings.gradle');
  }
} else {
  console.log('❌ android/settings.gradle not found');
}

const androidBuildPath = path.join(process.cwd(), 'android', 'app', 'build.gradle');
if (fs.existsSync(androidBuildPath)) {
  const buildContent = fs.readFileSync(androidBuildPath, 'utf8');
  if (buildContent.includes('react-native-realtime-audio-analysis')) {
    console.log('✅ Module found in android/app/build.gradle');
  } else {
    console.log('❌ Module NOT found in android/app/build.gradle');
  }
}

// Check iOS files
console.log('\n4. Checking iOS configuration...');
const podfileLockPath = path.join(process.cwd(), 'ios', 'Podfile.lock');
if (fs.existsSync(podfileLockPath)) {
  const podfileLockContent = fs.readFileSync(podfileLockPath, 'utf8');
  if (podfileLockContent.includes('RealtimeAudioAnalyzer')) {
    console.log('✅ Module found in ios/Podfile.lock');
  } else {
    console.log('❌ Module NOT found in ios/Podfile.lock');
  }
} else {
  console.log('❌ ios/Podfile.lock not found');
}

// Check MainApplication
console.log('\n5. Checking MainApplication...');
const findMainApplication = () => {
  const searchPaths = [
    'android/app/src/main/java',
    'android/app/src/main/kotlin'
  ];
  
  for (const searchPath of searchPaths) {
    const fullPath = path.join(process.cwd(), searchPath);
    if (fs.existsSync(fullPath)) {
      // Recursively search for MainApplication files
      const findFiles = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            const result = findFiles(filePath);
            if (result) return result;
          } else if (file.includes('MainApplication')) {
            return filePath;
          }
        }
        return null;
      };
      
      const mainAppPath = findFiles(fullPath);
      if (mainAppPath) {
        const content = fs.readFileSync(mainAppPath, 'utf8');
        if (content.includes('RealtimeAudioAnalyzerPackage')) {
          console.log('✅ Module registered in MainApplication');
        } else {
          console.log('❌ Module NOT registered in MainApplication');
          console.log(`   File: ${mainAppPath}`);
        }
        return;
      }
    }
  }
  console.log('❌ MainApplication file not found');
};

findMainApplication();

console.log('\n📋 Summary:');
console.log('If you see ❌ marks above, the module is not properly linked.');
console.log('Try the following fixes in order:');
console.log('1. npm install /path/to/realtime-audio-analysis-module');
console.log('2. npx react-native run-android (rebuild)');
console.log('3. If still failing, use manual linking');