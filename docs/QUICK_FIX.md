# Quick Fix for Linking Issues

## Immediate Steps to Fix Linking

### 1. Determine Your Package Location

First, identify where your package is located:
- `node_modules/realtime-audio-analysis-module` (if installed via npm/yarn)
- `local_modules/realtime-audio-analysis-module` (if in custom directory)
- Absolute path to the module directory

### 2. Manual Linking (Most Reliable for Local Packages)

#### Android:

**A. Edit `android/settings.gradle`:**

Add at the end. **Choose the path that matches your setup:**

**If package is in `node_modules`:**
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/realtime-audio-analysis-module/android')
```

**If package is in `local_modules`:**
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/realtime-audio-analysis-module/android')
```

**If using absolute path:**
```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File('/absolute/path/to/realtime-audio-analysis-module/android')
```

**To find the correct path:**
1. Check where the package is installed: `ls -la | grep realtime` in your app root
2. Or check `package.json` dependencies to see the path format
3. Adjust the path accordingly

**B. Edit `android/app/build.gradle`:**

In the `dependencies` block, add:
```gradle
dependencies {
    // ... existing dependencies
    implementation project(':react-native-realtime-audio-analysis')
}
```

**C. Edit MainApplication:**

Find `android/app/src/main/java/.../MainApplication.java` (or `.kt`)

**For Java:**
```java
import com.realtimeaudio.RealtimeAudioAnalyzerPackage;

// In getPackages() method:
@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new RealtimeAudioAnalyzerPackage()); // Add this line
    return packages;
}
```

**For Kotlin:**
```kotlin
import com.realtimeaudio.RealtimeAudioAnalyzerPackage

override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages
    packages.add(RealtimeAudioAnalyzerPackage()) // Add this line
    return packages
}
```

### 3. Clean and Rebuild

```bash
# Clean Android
cd android
./gradlew clean
cd ..

# Clear Metro cache and rebuild
npx react-native start --reset-cache
# In another terminal:
npx react-native run-android
```

### 4. Verify It Works

When the app starts, check the console. You should see:
```
Available NativeModules: [..., RealtimeAudioAnalyzer, ...]
Looking for: RealtimeAudioAnalyzer
Found module: YES
```

If you see "Found module: NO", the linking still failed - check the steps above.

## Why Manual Linking?

For local packages, manual linking is often more reliable because:
1. Autolinking can sometimes miss local packages
2. You have full control over the linking process
3. It's easier to debug if something goes wrong

## Still Not Working?

1. **Verify package is installed:**
   ```bash
   # Check in node_modules
   ls node_modules/realtime-audio-analysis-module/android
   
   # OR check in local_modules
   ls local_modules/realtime-audio-analysis-module/android
   
   # OR check the path specified in your package.json
   ```

2. **Check for build errors:**
   ```bash
   cd android && ./gradlew assembleDebug --stacktrace
   ```

3. **Check logcat for errors:**
   ```bash
   adb logcat | grep -i "realtime\|audio\|error"
   ```

4. **Verify module name:**
   - Module name in JS: `RealtimeAudioAnalyzer`
   - Package name in Kotlin: `com.realtimeaudio.RealtimeAudioAnalyzerPackage`
   - These must match exactly

