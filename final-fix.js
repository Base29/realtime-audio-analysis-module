#!/usr/bin/env node

/**
 * Final comprehensive fix for React Native module linking
 * Run this from your React Native project root: /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Final comprehensive fix for React Native module linking\n');

// Verify we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('❌ package.json not found. Please run this from your React Native project root.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`📱 React Native project: ${packageJson.name}`);

// 1. Fix android/app/build.gradle
console.log('\n1. Fixing android/app/build.gradle...');
const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

if (fs.existsSync(buildGradlePath)) {
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  
  if (buildGradleContent.includes('react-native-realtime-audio-analysis')) {
    console.log('   ✅ Already present in build.gradle');
  } else {
    // Create backup
    fs.writeFileSync(`${buildGradlePath}.backup.${Date.now()}`, buildGradleContent);
    
    // Add the dependency
    if (buildGradleContent.includes('implementation "com.facebook.react:react-native:+"')) {
      buildGradleContent = buildGradleContent.replace(
        'implementation "com.facebook.react:react-native:+"',
        'implementation "com.facebook.react:react-native:+"\n    implementation project(":react-native-realtime-audio-analysis")'
      );
      fs.writeFileSync(buildGradlePath, buildGradleContent);
      console.log('   ✅ Added to build.gradle');
    } else {
      console.log('   ⚠️  Could not automatically add to build.gradle');
      console.log('   Please manually add: implementation project(":react-native-realtime-audio-analysis")');
    }
  }
} else {
  console.log('   ❌ build.gradle not found');
}

// 2. Fix MainApplication.kt
console.log('\n2. Fixing MainApplication.kt...');

// Find MainApplication.kt file
const findMainApplicationFile = () => {
  const possiblePaths = [
    'android/app/src/main/java',
    'android/app/src/main/kotlin'
  ];
  
  for (const basePath of possiblePaths) {
    const fullPath = path.join(process.cwd(), basePath);
    if (fs.existsSync(fullPath)) {
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
        return mainAppPath;
      }
    }
  }
  return null;
};

const mainAppFile = findMainApplicationFile();

if (!mainAppFile) {
  console.log('   ❌ MainApplication file not found!');
  console.log('   Please manually update your MainApplication file.');
  console.log('   See docs/MANUAL_MAINAPP_FIX.md for guidance.');
} else {
  console.log(`   📁 Found: ${mainAppFile}`);
  
  let content = fs.readFileSync(mainAppFile, 'utf8');
  
  if (content.includes('RealtimeAudioAnalyzerPackage')) {
    console.log('   ✅ Already contains RealtimeAudioAnalyzerPackage');
  } else {
    // Create backup
    fs.writeFileSync(`${mainAppFile}.backup.${Date.now()}`, content);
    
    let updated = false;
    
    // Add import
    const importToAdd = 'import com.realtimeaudio.RealtimeAudioAnalyzerPackage';
    
    if (content.includes('import com.facebook.react.defaults.DefaultReactNativeHost')) {
      content = content.replace(
        'import com.facebook.react.defaults.DefaultReactNativeHost',
        `import com.facebook.react.defaults.DefaultReactNativeHost\n${importToAdd}`
      );
    } else if (content.includes('import com.facebook.react.ReactPackage')) {
      content = content.replace(
        'import com.facebook.react.ReactPackage',
        `import com.facebook.react.ReactPackage\n${importToAdd}`
      );
    } else {
      // Add after package declaration
      content = content.replace(
        /^(package .+)$/m,
        `$1\n\n${importToAdd}`
      );
    }
    
    // Add package registration - try multiple patterns
    if (content.includes('PackageList(this).packages.apply {')) {
      // Pattern 1: New architecture with apply block
      content = content.replace(
        'PackageList(this).packages.apply {',
        `PackageList(this).packages.apply {\n                add(RealtimeAudioAnalyzerPackage())`
      );
      updated = true;
      console.log('   ✅ Added using Pattern 1 (apply block)');
    } else if (content.includes('val packages = PackageList(this).packages')) {
      // Pattern 2: Legacy with packages variable
      content = content.replace(
        'val packages = PackageList(this).packages',
        `val packages = PackageList(this).packages\n      packages.add(RealtimeAudioAnalyzerPackage())`
      );
      updated = true;
      console.log('   ✅ Added using Pattern 2 (packages variable)');
    } else if (content.includes('return PackageList(this).packages')) {
      // Pattern 2b: Direct return
      content = content.replace(
        'return PackageList(this).packages',
        `val packages = PackageList(this).packages\n      packages.add(RealtimeAudioAnalyzerPackage())\n      return packages`
      );
      updated = true;
      console.log('   ✅ Added using Pattern 2b (direct return)');
    } else if (content.includes('Arrays.asList<ReactPackage>(')) {
      // Pattern 3: Arrays.asList pattern
      content = content.replace(
        'MainReactPackage(),',
        `MainReactPackage(),\n          RealtimeAudioAnalyzerPackage(),`
      );
      updated = true;
      console.log('   ✅ Added using Pattern 3 (Arrays.asList)');
    }
    
    if (updated) {
      fs.writeFileSync(mainAppFile, content);
      console.log('   ✅ MainApplication.kt updated successfully');
    } else {
      console.log('   ⚠️  Could not automatically update MainApplication.kt');
      console.log('   Please see docs/MANUAL_MAINAPP_FIX.md for manual instructions');
    }
  }
}

console.log('\n🎯 Final Steps:');
console.log('1. Clean and rebuild:');
console.log('   cd android && ./gradlew clean && cd ..');
console.log('   npx react-native run-android');
console.log('');
console.log('2. Verify the fix:');
console.log('   node debug-module-linking.js');
console.log('');
console.log('3. Test the module:');
console.log('   Use the SimpleAudioTest.js component in your app');

console.log('\n✅ Fix complete! If you still see issues, check docs/MANUAL_MAINAPP_FIX.md');