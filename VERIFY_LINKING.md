# Verify Module Linking - Step by Step Guide

If you're experiencing linking issues, follow these steps to diagnose and fix the problem.

## Step 1: Verify Package Installation

Check if the package is properly installed in your app:

```bash
# In your React Native app root
# Check in node_modules (if installed via npm/yarn)
ls node_modules/react-native-realtime-audio-analysis

# OR check in local_modules (if in custom directory)
ls local_modules/react-native-realtime-audio-analysis

# OR check the path from your package.json dependencies
```

You should see:
- `android/` folder
- `ios/` folder  
- `src/` folder
- `package.json`

**Note:** The path depends on how you installed the package. Check your `package.json` to see the exact path.

## Step 2: Check Autolinking Detection

Run this command in your app root to see if React Native detects the package:

```bash
npx react-native config
```

Look for `react-native-realtime-audio-analysis` in the output. If it's not there, autolinking failed.

## Step 3: Verify Android Linking

### Check `android/settings.gradle`

The file should include your module (either automatically or manually). **Adjust the path based on where your package is located:**

**If in `node_modules`:**
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
```

**If in `local_modules`:**
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/react-native-realtime-audio-analysis/android')
```

**If using absolute path:**
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File('/absolute/path/to/realtime-audio-analysis-module/android')
```

### Check `android/app/build.gradle`

In the `dependencies` section, you should see:

```gradle
dependencies {
    // ... other dependencies
    implementation project(':react-native-realtime-audio-analysis')
}
```

### Check MainApplication

Find your `MainApplication.java` or `MainApplication.kt` file in:
`android/app/src/main/java/.../MainApplication.*`

It should include the package (React Native 0.60+ does this automatically, but verify):

**For Java:**
```java
import com.realtimeaudio.RealtimeAudioAnalyzerPackage;

@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new RealtimeAudioAnalyzerPackage()  // Should be here
    );
}
```

**For Kotlin:**
```kotlin
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

override fun getPackages(): List<ReactPackage> {
    return listOf(
        MainReactPackage(this),
        RealtimeAudioAnalyzerPackage()  // Should be here
    )
}
```

## Step 4: Manual Linking (If Autolinking Failed)

If autolinking didn't work, manually add the module:

### 1. Add to `android/settings.gradle`:

```gradle
rootProject.name = 'YourAppName'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); apply nativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')

// Add this line (adjust path based on your package location):
include ':react-native-realtime-audio-analysis'
// For node_modules:
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
// OR for local_modules:
// project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/react-native-realtime-audio-analysis/android')
// OR for absolute path:
// project(':react-native-realtime-audio-analysis').projectDir = new File('/absolute/path/to/realtime-audio-analysis-module/android')
```

### 2. Add to `android/app/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies
    
    // Add this:
    implementation project(':react-native-realtime-audio-analysis')
}
```

### 3. Add to MainApplication:

See Step 3 above for the code to add.

## Step 5: Clean and Rebuild

**IMPORTANT:** After making any changes, you MUST rebuild:

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Clear Metro cache
npx react-native start --reset-cache

# In another terminal, rebuild
npx react-native run-android
```

## Step 6: Check Runtime Debug Info

When you run the app, check the console/logcat. The module now logs debug information:

```
Available NativeModules: [list of modules]
Looking for: RealtimeAudioAnalyzer
Found module: YES/NO
```

If you see "Found module: NO", the linking failed.

## Step 7: Verify Native Library Build

Check if the C++ library compiled successfully:

```bash
# Check for the .so file
find android/app/build -name "librealtimeaudioanalyzer.so"
```

If the file doesn't exist, there might be a CMake/NDK build error. Check the build logs.

## Step 8: Check for Build Errors

Look for errors in:

```bash
# Android build logs
cd android && ./gradlew assembleDebug --stacktrace
```

Common issues:
- CMake not found
- NDK not configured
- Kotlin version mismatch
- Missing dependencies

## Troubleshooting Common Issues

### Issue: "Module not found" at runtime

**Solution:**
1. Verify the module is in the correct location (`node_modules`, `local_modules`, or custom path)
2. Check `android/settings.gradle` includes the module with the **correct path**
3. Rebuild the app (not just restart Metro)

### Issue: "Native module not found"

**Solution:**
1. Check MainApplication includes the package
2. Verify the package name matches: `com.realtimeaudio.RealtimeAudioAnalyzerPackage`
3. Clean and rebuild

### Issue: Build succeeds but module is undefined

**Solution:**
1. Check the module name matches: `RealtimeAudioAnalyzer` (case-sensitive)
2. Verify `getName()` in `RealtimeAudioAnalyzerModule.kt` returns `"RealtimeAudioAnalyzer"`
3. Check console logs for debug info

### Issue: C++ library not loading

**Solution:**
1. Check CMakeLists.txt is correct
2. Verify NDK is installed and configured
3. Check build logs for CMake errors
4. Ensure `librealtimeaudioanalyzer.so` is in the APK

## Still Having Issues?

1. **Check React Native Version Compatibility:**
   - This module requires React Native 0.60+
   - For older versions, use manual linking

2. **Verify Package Structure:**
   - Ensure `android/` folder exists in the package
   - Check `android/build.gradle` is valid
   - Verify package name in `package.json`

3. **Check for Conflicting Packages:**
   - Some packages conflict with autolinking
   - Try removing other native modules temporarily

4. **Get More Debug Info:**
   - Enable verbose logging: `npx react-native run-android --verbose`
   - Check logcat: `adb logcat | grep -i realtime`
   - Check Metro bundler logs

