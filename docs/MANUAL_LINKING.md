# Manual Linking Guide

This guide provides step-by-step instructions for manually linking the react-native-realtime-audio-analysis module when automatic linking fails.

## When to Use Manual Linking

Use manual linking if:
- Automatic linking fails during installation
- You're using React Native < 0.60
- You need custom configuration
- The CLI tool reports linking issues

## Prerequisites

Before starting manual linking:

1. **Module Installed**: Ensure the module is installed in your project
2. **Backup Project**: Create a backup before making changes
3. **Development Environment**: Have Android Studio and/or Xcode properly configured

## Android Manual Linking

### Step 1: Configure MainApplication

1. **Locate MainApplication File**

   Find your MainApplication file at:
   ```
   android/app/src/main/java/com/yourproject/MainApplication.kt
   ```
   or
   ```
   android/app/src/main/java/com/yourproject/MainApplication.java
   ```

2. **Add Import Statement**

   Add this import at the top of your MainApplication file:

   ```kotlin
   import com.realtimeaudio.RealtimeAudioAnalyzerPackage
   ```

3. **Register the Package**

   In the `getPackages()` method, add the package:

   **For Kotlin:**
   ```kotlin
   override fun getPackages(): ReactPackageList {
       return PackageList(this).apply {
           add(RealtimeAudioAnalyzerPackage())
       }
   }
   ```

   **For Java:**
   ```java
   @Override
   protected List<ReactPackage> getPackages() {
       return Arrays.<ReactPackage>asList(
           new MainReactPackage(),
           new RealtimeAudioAnalyzerPackage()  // Add this line
       );
   }
   ```

### Step 2: Configure Build Files

1. **Update settings.gradle**

   Open `android/settings.gradle` and add:

   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
   ```

2. **Update app/build.gradle**

   Open `android/app/build.gradle` and add to the dependencies section:

   ```gradle
   dependencies {
       implementation fileTree(dir: "libs", include: ["*.jar"])
       implementation "com.facebook.react:react-native:+"
       
       // Add this line:
       implementation project(':react-native-realtime-audio-analysis')
       
       // ... other dependencies
   }
   ```

### Step 3: Clean and Rebuild

After making changes:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## iOS Manual Linking

### Step 1: Configure Podfile

1. **Open Podfile**

   Navigate to your iOS directory:
   ```bash
   cd ios
   open Podfile
   ```

2. **Add Pod Reference**

   Add this line inside your target block:

   ```ruby
   target 'YourProjectName' do
     config = use_native_modules!

     # ... existing pods

     # Add this line:
     pod 'react-native-realtime-audio-analysis', :path => '../node_modules/react-native-realtime-audio-analysis'

     # ... rest of configuration
   end
   ```

### Step 2: Install Pods

Run pod install:

```bash
pod install
cd ..
```

### Step 3: Build and Run

```bash
npx react-native run-ios
```

## Verification

After manual linking, verify the setup:

### 1. Test Import

Create a test file and try importing:

```javascript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

console.log('Module imported:', RealtimeAudioAnalyzer);
```

### 2. Use CLI Verification

```bash
npx rn-module-link verify
```

### 3. Check Build Logs

Look for successful module registration in your logs:
- No import errors when the app starts
- Module appears in available modules list

## Troubleshooting

### Android Issues

**Build Errors:**
```bash
# Clean everything
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx react-native run-android
```

**Package Not Found:**
- Verify the import statement is correct
- Check that the package is added to `getPackages()`
- Ensure settings.gradle includes the project

**NDK Issues:**
- Install Android NDK through Android Studio
- Verify NDK path in local.properties
- Check supported ABIs in build.gradle

### iOS Issues

**Pod Install Failures:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

**Build Errors:**
- Clean build folder in Xcode (Product → Clean Build Folder)
- Delete derived data
- Ensure you're opening .xcworkspace, not .xcodeproj

**Module Not Found:**
- Verify pod path in Podfile is correct
- Check that the module's iOS directory exists
- Ensure podspec file is valid

### General Issues

**Metro Cache:**
```bash
npx react-native start --reset-cache
```

**Complete Reset:**
```bash
# Clean everything
npx react-native start --reset-cache
rm -rf node_modules
npm install

# Android
cd android && ./gradlew clean && cd ..

# iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Rebuild
npx react-native run-android  # or run-ios
```

## Advanced Configuration

### Custom Module Path

If your module is in a custom location:

**Android (settings.gradle):**
```gradle
project(':react-native-realtime-audio-analysis').projectDir = new File('/path/to/your/module/android')
```

**iOS (Podfile):**
```ruby
pod 'react-native-realtime-audio-analysis', :path => '/path/to/your/module'
```

### Multiple Architectures (Android)

For specific architecture support:

```gradle
android {
    defaultConfig {
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a"
        }
    }
}
```

### Custom Build Configuration

For release builds, ensure ProGuard rules are configured:

```
# android/app/proguard-rules.pro
-keep class com.realtimeaudio.** { *; }
-dontwarn com.realtimeaudio.**
```

## Getting Help

If manual linking still doesn't work:

1. **Use Diagnostic Tools:**
   ```bash
   npx rn-module-link diagnose
   ```

2. **Check Module Documentation:**
   - Review the module's README
   - Check for platform-specific requirements

3. **Create Minimal Reproduction:**
   - Test in a fresh React Native project
   - Compare working vs non-working configurations

4. **Community Support:**
   - Search existing GitHub issues
   - Check Stack Overflow for similar problems

## Automation

For future projects, consider using our automated tools:

```bash
# Automatic linking with preview
npx rn-module-link link --dry-run

# Full automatic linking
npx rn-module-link link

# Generate manual guide for your project
npx rn-module-link generate-guide
```

This handles all manual steps automatically and provides verification.