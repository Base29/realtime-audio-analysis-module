# Native Linking Fix - Local Module Approach

## The Problem

Your React Native app's `MainApplication.kt` is trying to import:
```kotlin
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
```

But this class isn't accessible because the native module isn't properly linked as a local Android library.

## Solution: Link Native Module as Local Android Library

### Step 1: Add Module to React Native App's settings.gradle

Edit `/Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/android/settings.gradle`:

Add these lines at the end:
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/realtime-audio-analysis-module/android')
```

### Step 2: Add Module Dependency to app/build.gradle

Edit `/Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/android/app/build.gradle`:

In the `dependencies` section, add:
```gradle
dependencies {
    implementation project(':react-native-realtime-audio-analysis')
    // ... your other dependencies
}
```

### Step 3: Update MainApplication.kt

Your `/Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/android/app/src/main/java/com/audioanalysisapp/MainApplication.kt` should be:

```kotlin
package com.audioanalysisapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

class MainApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages.apply {
        // Packages that cannot be autolinked yet can be added manually here
        add(RealtimeAudioAnalyzerPackage())
      },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
```

### Step 4: Clean and Rebuild

```bash
cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

# Clean everything
rm -rf android/build
rm -rf android/app/build
rm -rf android/.gradle

# Rebuild
npx react-native run-android
```

## Alternative Approach: Copy Native Files Directly

If the above doesn't work, we can copy the native files directly into your React Native app:

### Step 1: Create Native Module Directory in Your App

```bash
mkdir -p /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/android/app/src/main/java/com/realtimeaudio
```

### Step 2: Copy Native Files

Copy these files from the module to your app:
- Copy `RealtimeAudioAnalyzerModule.kt` 
- Copy `RealtimeAudioAnalyzerPackage.kt`
- Copy `AudioEngine.kt` (if it exists)
- Copy any other native files

### Step 3: Update CMakeLists.txt

Copy the CMakeLists.txt and native C++ files if needed.

## Recommended Approach

I recommend **Step 1-4 (Local Library Linking)** first, as it's cleaner and maintains separation. The alternative approach should only be used if the local library linking doesn't work.

## Why This Happens

When you install a module via npm (`npm install file:local_modules/...`), React Native's autolinking should handle this automatically. However, sometimes the autolinking doesn't work properly with local file modules, especially with custom native code.

By manually linking the Android library, we ensure the native classes are available to your React Native app.

## Test After Fix

Once you've applied the fix and rebuilt, the native module should be available as `NativeModules.RealtimeAudioAnalysis`, and your JavaScript interface should work correctly.