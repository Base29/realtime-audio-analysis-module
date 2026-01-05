# Local Module Installation Guide

When using this module as a **local package** (not from npm), autolinking behavior varies depending on how you install it. This guide covers all scenarios.

## 🔍 Autolinking vs Manual Linking for Local Modules

| Installation Method | React Native 0.68+ | React Native 0.60-0.67 | React Native < 0.60 |
|-------------------|-------------------|----------------------|-------------------|
| **npm install /path/to/module** | ✅ **Auto** | ⚠️ **May need manual** | ❌ **Manual only** |
| **yarn add /path/to/module** | ✅ **Auto** | ⚠️ **May need manual** | ❌ **Manual only** |
| **Copy to local_modules/** | ❌ **Manual only** | ❌ **Manual only** | ❌ **Manual only** |
| **Symlink in node_modules** | ✅ **Auto** | ⚠️ **May need manual** | ❌ **Manual only** |

## 📦 Installation Methods

### Method 1: Install from Local Path (Recommended)

This method has the **best autolinking support**:

```bash
# From your React Native project root
npm install /absolute/path/to/realtime-audio-analysis-module
# or
yarn add /absolute/path/to/realtime-audio-analysis-module
```

**What happens:**
- Module gets copied to `node_modules/react-native-realtime-audio-analysis`
- React Native autolinking **should work automatically**
- Package.json gets updated with local path reference

### Method 2: Install with Relative Path

```bash
# If module is adjacent to your RN project
npm install ../realtime-audio-analysis-module
# or
yarn add ../realtime-audio-analysis-module
```

### Method 3: Copy to local_modules (Manual Linking Required)

```bash
# Create local_modules directory
mkdir local_modules
cp -r /path/to/realtime-audio-analysis-module local_modules/

# Then manually link (autolinking won't work)
```

### Method 4: Symlink (Advanced)

```bash
# Create symlink in node_modules
cd node_modules
ln -s /path/to/realtime-audio-analysis-module react-native-realtime-audio-analysis
cd ..
```

## ✅ Checking if Autolinking Worked

After installation, verify autolinking status:

```bash
# Check if React Native detects the module
npx react-native config

# Look for this in the output:
# dependencies:
#   react-native-realtime-audio-analysis:
#     root: /path/to/your/module
#     platforms:
#       android: {...}
#       ios: {...}
```

**If you see the module listed** → Autolinking should work!
**If you don't see it** → You'll need manual linking

## 🔧 Autolinking Setup (When It Works)

### 1. Install the Module

```bash
npm install /path/to/realtime-audio-analysis-module
```

### 2. Verify Detection

```bash
npx react-native config
```

### 3. Clean and Rebuild

```bash
# Clean Metro cache
npx react-native start --reset-cache

# Android
cd android && ./gradlew clean && cd ..
npx react-native run-android

# iOS  
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npx react-native run-ios
```

### 4. Test the Module

```javascript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';
console.log('Module loaded:', RealtimeAudioAnalyzer);
```

## 🛠 Manual Linking Setup (When Autolinking Fails)

### Android Manual Setup

1. **Add to `android/settings.gradle`:**

   ```gradle
   include ':react-native-realtime-audio-analysis'
   
   // Choose the correct path based on your installation:
   
   // If installed via npm/yarn (in node_modules):
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
   
   // If in local_modules:
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/realtime-audio-analysis-module/android')
   
   // If using absolute path:
   project(':react-native-realtime-audio-analysis').projectDir = new File('/absolute/path/to/realtime-audio-analysis-module/android')
   ```

2. **Add to `android/app/build.gradle`:**

   ```gradle
   dependencies {
       implementation project(':react-native-realtime-audio-analysis')
       // ... other dependencies
   }
   ```

3. **Add to MainApplication.kt/java:**

   ```kotlin
   // Add import
   import com.realtimeaudio.RealtimeAudioAnalyzerPackage
   
   // In getPackages() method:
   override fun getPackages(): ReactPackageList {
       return PackageList(this).apply {
           add(RealtimeAudioAnalyzerPackage())
       }
   }
   ```

### iOS Manual Setup

1. **Update Podfile:**

   ```ruby
   target 'YourApp' do
     # ... existing pods
     
     # Add this line with correct path:
     
     # If installed via npm/yarn:
     pod 'RealtimeAudioAnalyzer', :path => '../node_modules/react-native-realtime-audio-analysis'
     
     # If in local_modules:
     pod 'RealtimeAudioAnalyzer', :path => '../local_modules/realtime-audio-analysis-module'
     
     # If using absolute path:
     pod 'RealtimeAudioAnalyzer', :path => '/absolute/path/to/realtime-audio-analysis-module'
   end
   ```

2. **Install Pods:**

   ```bash
   cd ios
   pod install
   cd ..
   ```

## 🚀 Quick Setup Script

Here's a complete setup script for local installation:

```bash
#!/bin/bash

# 1. Install module locally
echo "Installing local module..."
npm install /path/to/realtime-audio-analysis-module

# 2. Check if autolinking detected it
echo "Checking autolinking..."
npx react-native config | grep -i "realtime-audio"

if [ $? -eq 0 ]; then
    echo "✅ Autolinking detected the module!"
else
    echo "⚠️ Autolinking failed - you'll need manual linking"
fi

# 3. Clean and rebuild
echo "Cleaning and rebuilding..."
npx react-native start --reset-cache &

# Android
cd android && ./gradlew clean && cd ..

# iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# 4. Run the app
echo "Building app..."
npx react-native run-android  # or run-ios
```

## 🔍 Troubleshooting Local Modules

### Issue: "Module not found" after installation

**Cause:** Autolinking failed or path is incorrect

**Solution:**
1. Check if module appears in `npx react-native config`
2. If not, use manual linking with correct paths
3. Verify the module's `package.json` has correct `name` field

### Issue: Build errors about missing files

**Cause:** Incorrect paths in configuration

**Solution:**
1. Double-check paths in `settings.gradle` (Android) or `Podfile` (iOS)
2. Use absolute paths if relative paths don't work
3. Ensure the module's native code exists at the specified path

### Issue: Module loads but native methods don't work

**Cause:** Native module not properly registered

**Solution:**
1. Check MainApplication registration (Android)
2. Verify pod installation (iOS)
3. Look for native module registration errors in logs

### Issue: Changes to module don't reflect in app

**Cause:** Module is copied, not linked

**Solution:**
1. If using npm/yarn install, the module is **copied** to node_modules
2. Changes to original source won't reflect automatically
3. Either:
   - Reinstall after each change: `npm install /path/to/module`
   - Use symlinks for development
   - Use `yarn link` for development workflow

## 📋 Development Workflow for Local Modules

### Option 1: Reinstall After Changes (Simple)

```bash
# After making changes to the module
npm install /path/to/realtime-audio-analysis-module --force
npx react-native run-android  # rebuild app
```

### Option 2: Symlink for Development (Advanced)

```bash
# In your module directory
npm link

# In your React Native project
npm link react-native-realtime-audio-analysis

# Now changes reflect immediately (JS only)
# Still need to rebuild for native changes
```

### Option 3: Direct Development

```bash
# Work directly in node_modules (not recommended for production)
cd node_modules/react-native-realtime-audio-analysis
# Make changes here
```

## 🎯 Recommendation

**For local development:**
1. Use `npm install /path/to/module` for simplicity
2. Check `npx react-native config` to verify autolinking
3. Use manual linking if autolinking fails
4. Always rebuild native code after changes
5. Use our CLI tool: `npx rn-module-link verify` to check setup

**The module should work with autolinking in React Native 0.68+ when installed via npm/yarn, but manual linking is more reliable for local development.**

## Installation Steps

### 1. Install the Package

In your React Native app's root directory, install the package:

```bash
npm install /path/to/realtime-audio-analysis-module
# or
yarn add /path/to/realtime-audio-analysis-module
```

### 2. Android Setup

#### Option A: Automatic Linking (Recommended)

React Native should automatically detect and link the package. However, if it doesn't work:

1. **Clean and rebuild:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Verify autolinking:**
   Check `android/settings.gradle` - it should include. **Adjust path based on where package is installed:**
   
   **If in `node_modules`:**
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/realtime-audio-analysis-module/android')
   ```
   
   **If in `local_modules`:**
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/realtime-audio-analysis-module/android')
   ```

3. **Verify MainApplication:**
   Check `android/app/src/main/java/.../MainApplication.java` (or `.kt`) - it should automatically include the package, or manually add:
   ```java
   import com.realtimeaudio.RealtimeAudioAnalyzerPackage;
   
   // In getPackages() method:
   packages.add(new RealtimeAudioAnalyzerPackage());
   ```

#### Option B: Manual Linking (If autolinking fails)

1. **Add to `android/settings.gradle`:**
   
   **Choose the path that matches your package location:**
   
   **If in `node_modules`:**
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/realtime-audio-analysis-module/android')
   ```
   
   **If in `local_modules`:**
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/realtime-audio-analysis-module/android')
   ```
   
   **If using absolute path:**
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File('/absolute/path/to/realtime-audio-analysis-module/android')
   ```

2. **Add to `android/app/build.gradle`:**
   ```gradle
   dependencies {
       implementation project(':react-native-realtime-audio-analysis')
   }
   ```

3. **Add to MainApplication:**
   ```java
   import com.realtimeaudio.RealtimeAudioAnalyzerPackage;
   
   @Override
   protected List<ReactPackage> getPackages() {
       return Arrays.<ReactPackage>asList(
           new MainReactPackage(),
           new RealtimeAudioAnalyzerPackage()  // Add this line
       );
   }
   ```

### 3. iOS Setup

1. **Install pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Rebuild the app:**
   ```bash
   npx react-native run-ios
   ```

### 4. Rebuild the App

**Important:** After installing a local native module, you MUST rebuild the app:

```bash
# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

**DO NOT** use `npx react-native start` alone - you need to rebuild the native code.

### 5. Verify Installation

Check the logs for any linking errors. If you see:
- "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked"
- Native module not found errors

Then autolinking may have failed. Try the manual linking steps above.

## Troubleshooting

### Issue: Module not found / Linking error

**Solution:**
1. Clean build folders:
   ```bash
   # Android
   cd android && ./gradlew clean && cd ..
   
   # iOS
   cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..
   ```

2. Clear Metro bundler cache:
   ```bash
   npx react-native start --reset-cache
   ```

3. Rebuild the app completely

### Issue: Native library not loaded

**Solution:**
- Check that the C++ library compiled successfully
- Look for errors in `adb logcat` (Android) or Xcode console (iOS)
- Verify CMake/NDK setup is correct

### Issue: Permission errors

**Solution:**
- Ensure `RECORD_AUDIO` permission is in `AndroidManifest.xml`
- Request runtime permission before calling `start()`
- For iOS, add `NSMicrophoneUsageDescription` to `Info.plist`

## Development Tips

When developing the module locally:

1. **After making changes to native code:**
   - Rebuild the app (not just restart Metro)
   - Clean build folders if issues persist

2. **After making changes to JavaScript/TypeScript:**
   - Restart Metro bundler with `--reset-cache`
   - Reload the app

3. **Check autolinking status:**
   ```bash
   npx react-native config
   ```

This will show which packages are detected and linked.

