# Manual MainApplication.kt Fix Guide

If the automated scripts didn't work, follow this manual guide to fix your MainApplication.kt file.

## Step 1: Locate Your MainApplication.kt File

Your file is likely at one of these locations:
- `android/app/src/main/java/com/audioanalysisapp/MainApplication.kt`
- `android/app/src/main/kotlin/com/audioanalysisapp/MainApplication.kt`

## Step 2: Add the Import

Add this import statement near the top of the file with other imports:

```kotlin
import com.realtimeaudio.RealtimeAudioAnalyzerPackage
```

## Step 3: Add Package Registration

Find the `getPackages()` method in your MainApplication.kt and add the package registration. The exact location depends on your React Native version:

### For React Native 0.83+ (New Architecture)

Look for this pattern:
```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        // ADD THIS LINE:
        add(RealtimeAudioAnalyzerPackage())
    }
```

### For Legacy Architecture

Look for this pattern:
```kotlin
override fun getPackages(): List<ReactPackage> {
  val packages = PackageList(this).packages
  // ADD THIS LINE:
  packages.add(RealtimeAudioAnalyzerPackage())
  return packages
}
```

### For Older Versions

Look for this pattern:
```kotlin
override fun getPackages(): List<ReactPackage> {
  return Arrays.asList<ReactPackage>(
      MainReactPackage(),
      // ADD THIS LINE:
      RealtimeAudioAnalyzerPackage()
  )
}
```

## Complete Example

Here's what your MainApplication.kt should look like after the changes:

```kotlin
package com.audioanalysisapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
// ✅ ADD THIS IMPORT:
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                // ✅ ADD THIS LINE:
                add(RealtimeAudioAnalyzerPackage())
            }

        override fun getJSMainModuleName(): String = "index"
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
  }
}
```

## Step 4: Verify the Fix

After making the changes:

1. Clean and rebuild:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

2. Verify the linking:
   ```bash
   node debug-module-linking.js
   ```

You should see ✅ for all checks, including "Module registered in MainApplication".

## Troubleshooting

- **Import error**: Make sure the import path is exactly `com.realtimeaudio.RealtimeAudioAnalyzerPackage`
- **Build error**: Make sure you've also updated `android/settings.gradle` and `android/app/build.gradle`
- **Still not working**: Try running `./complete-fix.sh` again or check the console for specific error messages