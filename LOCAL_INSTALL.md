# Local Package Installation Guide

When installing this package as a local module in your React Native application, follow these steps:

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
   Check `android/settings.gradle` - it should include:
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
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
   ```gradle
   include ':react-native-realtime-audio-analysis'
   project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
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

