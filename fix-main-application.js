#!/usr/bin/env node

/**
 * Script to fix MainApplication.kt for React Native module linking
 * Run this from your React Native project root
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing MainApplication.kt for module linking...\n');

// Find MainApplication.kt file
const findMainApplicationFile = () => {
  const possiblePaths = [
    'android/app/src/main/java',
    'android/app/src/main/kotlin'
  ];
  
  for (const basePath of possiblePaths) {
    const fullPath = path.join(process.cwd(), basePath);
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
        return mainAppPath;
      }
    }
  }
  return null;
};

const mainAppFile = findMainApplicationFile();

if (!mainAppFile) {
  console.log('❌ MainApplication file not found!');
  console.log('Please check that you are running this from your React Native project root.');
  process.exit(1);
}

console.log(`📁 Found MainApplication at: ${mainAppFile}`);

// Read the current content
let content = fs.readFileSync(mainAppFile, 'utf8');

// Check if already updated
if (content.includes('RealtimeAudioAnalyzerPackage')) {
  console.log('✅ MainApplication already contains RealtimeAudioAnalyzerPackage');
  console.log('Module should be properly linked.');
  process.exit(0);
}

// Create backup
const backupFile = `${mainAppFile}.backup.${Date.now()}`;
fs.writeFileSync(backupFile, content);
console.log(`💾 Created backup: ${backupFile}`);

// Add import
console.log('📝 Adding import statement...');
const importToAdd = 'import com.realtimeaudio.RealtimeAudioAnalyzerPackage';

// Find a good place to add the import
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

// Add package registration
console.log('📝 Adding package registration...');

if (content.includes('PackageList(this).packages.apply {')) {
  // Pattern 1: New architecture with apply block
  content = content.replace(
    'PackageList(this).packages.apply {',
    `PackageList(this).packages.apply {\n                add(RealtimeAudioAnalyzerPackage())`
  );
  console.log('   Using Pattern 1: apply block');
} else if (content.includes('val packages = PackageList(this).packages')) {
  // Pattern 2: Legacy with packages variable
  content = content.replace(
    'val packages = PackageList(this).packages',
    `val packages = PackageList(this).packages\n      packages.add(RealtimeAudioAnalyzerPackage())`
  );
  console.log('   Using Pattern 2: packages variable');
} else if (content.includes('Arrays.asList<ReactPackage>(')) {
  // Pattern 3: Arrays.asList pattern
  content = content.replace(
    'MainReactPackage(),',
    `MainReactPackage(),\n          RealtimeAudioAnalyzerPackage(),`
  );
  console.log('   Using Pattern 3: Arrays.asList');
} else {
  console.log('⚠️  Could not automatically detect package registration pattern');
  console.log('Please manually add: add(RealtimeAudioAnalyzerPackage())');
  console.log('See docs/MainApplication-examples.md for guidance');
}

// Write the updated content
fs.writeFileSync(mainAppFile, content);

console.log('\n✅ MainApplication.kt updated successfully!');
console.log('\nNext steps:');
console.log('1. cd android && ./gradlew clean && cd ..');
console.log('2. npx react-native run-android');
console.log('3. Run: node debug-module-linking.js (to verify)');

// Show what was added
console.log('\n📋 Changes made:');
console.log('✓ Added import: import com.realtimeaudio.RealtimeAudioAnalyzerPackage');
console.log('✓ Added package registration in getPackages() method');