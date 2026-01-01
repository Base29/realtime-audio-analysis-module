# Path Configuration Guide

When linking this module manually, you need to specify the correct path in `android/settings.gradle`. The path depends on where your package is installed.

## Finding Your Package Location

First, determine where the package is located:

```bash
# In your React Native app root directory

# Check if in node_modules
ls node_modules/react-native-realtime-audio-analysis

# OR check if in local_modules
ls local_modules/react-native-realtime-audio-analysis

# OR check your package.json to see the dependency path
cat package.json | grep realtime-audio-analysis
```

## Path Options for `android/settings.gradle`

### Option 1: Package in `node_modules` (Standard npm/yarn install)

```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-realtime-audio-analysis/android')
```

### Option 2: Package in `local_modules` (Custom directory)

```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/react-native-realtime-audio-analysis/android')
```

### Option 3: Absolute Path (Most reliable for local development)

```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File('/Users/faisalhussain/ReactNativeModule/realtime-audio-analysis-module/android')
```

**Note:** Replace `/Users/faisalhussain/ReactNativeModule/realtime-audio-analysis-module` with your actual absolute path.

### Option 4: Relative Path from App Root

If your package is in a sibling directory:

```gradle
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../../realtime-audio-analysis-module/android')
```

## How to Determine the Correct Path

1. **Find the package location:**
   ```bash
   # In your app root
   find . -name "realtime-audio-analysis-module" -type d 2>/dev/null
   ```

2. **Check package.json:**
   ```json
   {
     "dependencies": {
       "react-native-realtime-audio-analysis": "file:../local_modules/realtime-audio-analysis-module"
     }
   }
   ```
   The path after `file:` tells you where it is.

3. **Use absolute path for certainty:**
   - Most reliable option
   - Works regardless of how package is installed
   - Easy to verify

## Example: Complete `android/settings.gradle`

```gradle
rootProject.name = 'YourAppName'
apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
apply nativeModulesSettingsGradle(settings)
include ':app'
includeBuild('../node_modules/@react-native/gradle-plugin')

// Add your module (choose the correct path option above)
include ':react-native-realtime-audio-analysis'
project(':react-native-realtime-audio-analysis').projectDir = new File(rootProject.projectDir, '../local_modules/react-native-realtime-audio-analysis/android')
```

## Verification

After adding the path, verify it's correct:

```bash
# Check if the path exists
ls -la ../local_modules/react-native-realtime-audio-analysis/android

# Or with absolute path
ls -la /absolute/path/to/realtime-audio-analysis-module/android
```

You should see the `build.gradle` file in that directory.

## Common Mistakes

1. **Wrong directory level:**
   - ❌ `'../node_modules/...'` when package is in `local_modules`
   - ✅ `'../local_modules/...'` when package is in `local_modules`

2. **Missing `/android` suffix:**
   - ❌ `'../local_modules/react-native-realtime-audio-analysis'`
   - ✅ `'../local_modules/react-native-realtime-audio-analysis/android'`

3. **Incorrect relative path:**
   - Make sure you're counting directory levels correctly
   - `../` goes up one level from `android/` directory
   - From `android/settings.gradle`, `../` points to app root

## Still Not Sure?

Use the absolute path option - it's the most reliable and easiest to verify!

