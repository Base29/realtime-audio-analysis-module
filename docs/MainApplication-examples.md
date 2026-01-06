# MainApplication.kt Patterns for React Native 0.83

Your MainApplication.kt might look like one of these patterns. Find which one matches yours and follow the corresponding fix:

## Pattern 1: New Architecture (Most Common in RN 0.83)

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
// ADD THIS IMPORT:
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
                // ADD THIS LINE:
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

## Pattern 2: Legacy Architecture

```kotlin
package com.audioanalysisapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
// ADD THIS IMPORT:
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getUseDeveloperSupport(): Boolean {
      return BuildConfig.DEBUG
    }

    override fun getPackages(): List<ReactPackage> {
      val packages = PackageList(this).packages
      // ADD THIS LINE:
      packages.add(RealtimeAudioAnalyzerPackage())
      return packages
    }

    override fun getJSMainModuleName(): String {
      return "index"
    }
  }

  override fun getReactNativeHost(): ReactNativeHost {
    return mReactNativeHost
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
  }
}
```

## Pattern 3: Older Style with Manual Package List

```kotlin
package com.audioanalysisapp

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import java.util.Arrays
// ADD THIS IMPORT:
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost = object : ReactNativeHost(this) {
    override fun getUseDeveloperSupport(): Boolean {
      return BuildConfig.DEBUG
    }

    override fun getPackages(): List<ReactPackage> {
      return Arrays.asList<ReactPackage>(
          MainReactPackage(),
          // ADD THIS LINE:
          RealtimeAudioAnalyzerPackage()
      )
    }

    override fun getJSMainModuleName(): String {
      return "index"
    }
  }

  override fun getReactNativeHost(): ReactNativeHost {
    return mReactNativeHost
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
  }
}
```

# How to Identify Your Pattern

1. Open your MainApplication.kt file
2. Look for these key indicators:
   - **Pattern 1**: Has `PackageList(this).packages.apply {`
   - **Pattern 2**: Has `PackageList(this).packages` and `packages.add()`
   - **Pattern 3**: Has `Arrays.asList<ReactPackage>(`

3. Follow the corresponding example above to add:
   - The import: `import com.realtimeaudio.RealtimeAudioAnalyzerPackage`
   - The package registration in the appropriate location