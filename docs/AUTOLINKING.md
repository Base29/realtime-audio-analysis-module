# Autolinking Guide

This guide explains how autolinking works with react-native-realtime-audio-analysis and how to troubleshoot autolinking issues.

## What is Autolinking?

Autolinking is a React Native feature (introduced in 0.60) that automatically links native dependencies without manual configuration. It scans your `node_modules` for React Native libraries and configures them automatically.

## React Native Version Compatibility

| React Native Version | Autolinking Support | Status |
|---------------------|-------------------|---------|
| 0.68.0+ | ✅ Full Support | Recommended |
| 0.60.0 - 0.67.x | ✅ Basic Support | Supported |
| < 0.60.0 | ❌ No Autolinking | Manual linking required |

## Local Module Autolinking

**Special considerations for local modules (not installed from npm):**

### Installation Method Matters

| Method | Autolinking Support | Notes |
|--------|-------------------|-------|
| `npm install /path/to/module` | ✅ **Yes** | Module copied to node_modules, autolinking works |
| `yarn add /path/to/module` | ✅ **Yes** | Module copied to node_modules, autolinking works |
| Copy to `local_modules/` | ❌ **No** | React Native doesn't scan local_modules |
| Symlink in `node_modules` | ✅ **Maybe** | Depends on React Native version |

### Recommended Approach for Local Modules

```bash
# Install from local path (this enables autolinking)
npm install /absolute/path/to/realtime-audio-analysis-module

# Verify autolinking detection
npx react-native config

# If you see the module listed, autolinking should work!
```

### If Autolinking Fails for Local Module

Use our CLI tool or manual linking:

```bash
# Try our automated tool first
npx rn-module-link link

# Or check what's wrong
npx rn-module-link diagnose

# Manual linking guide available at:
# docs/MANUAL_LINKING.md
```

### For This Module

1. **Detection**: React Native CLI scans `node_modules` and finds our module
2. **Configuration**: Uses our `react-native.config.js` and `RealtimeAudioAnalyzer.podspec`
3. **Android**: Automatically adds the module to `settings.gradle` and `build.gradle`
4. **iOS**: Automatically adds the pod to your `Podfile` during `pod install`
5. **Registration**: Automatically registers the native module with React Native

### What Gets Configured Automatically

**Android:**
- Module added to `android/settings.gradle`
- Dependency added to `android/app/build.gradle`
- Package registered in `MainApplication.java/kt`

**iOS:**
- Pod added to `Podfile`
- Native module registered with React Native bridge

## Verifying Autolinking

### 1. Check if Autolinking is Working

```bash
# Run this command in your React Native project
npx react-native config

# Look for our module in the output:
# dependencies:
#   react-native-realtime-audio-analysis:
#     root: /path/to/node_modules/react-native-realtime-audio-analysis
#     platforms:
#       android: {...}
#       ios: {...}
```

### 2. Check Generated Files

**Android** - Check if these files contain our module:
```bash
# Should contain: include ':react-native-realtime-audio-analysis'
cat android/settings.gradle

# Should contain: implementation project(':react-native-realtime-audio-analysis')
cat android/app/build.gradle
```

**iOS** - Check if Podfile.lock contains our pod:
```bash
# Should contain: RealtimeAudioAnalyzer
cat ios/Podfile.lock | grep -i realtime
```

### 3. Use Our CLI Tool

```bash
npx rn-module-link verify
```

## Troubleshooting Autolinking

### Common Issues

#### 1. Module Not Found After Installation

**Symptoms:**
- `Module 'react-native-realtime-audio-analysis' not found`
- Import errors in JavaScript

**Solutions:**
```bash
# Clean Metro cache
npx react-native start --reset-cache

# Reinstall node_modules
rm -rf node_modules
npm install

# For iOS, reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

#### 2. Autolinking Not Working

**Symptoms:**
- Module not appearing in `npx react-native config`
- Build errors about missing native modules

**Solutions:**
```bash
# Check React Native version
npx react-native --version

# If < 0.60, use manual linking
# If >= 0.60, try forcing autolinking:
npx react-native unlink react-native-realtime-audio-analysis
npx react-native link react-native-realtime-audio-analysis
```

#### 3. Android Build Errors

**Symptoms:**
- `Could not find :react-native-realtime-audio-analysis`
- Gradle sync failures

**Solutions:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Check if module is in settings.gradle
grep -i "realtime-audio-analysis" android/settings.gradle

# If missing, try manual linking or use our CLI tool
npx rn-module-link link --platform android
```

#### 4. iOS Build Errors

**Symptoms:**
- `Pod not found: RealtimeAudioAnalyzer`
- CocoaPods installation failures

**Solutions:**
```bash
# Update CocoaPods
sudo gem install cocoapods

# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..

# Check if pod is in Podfile
grep -i "RealtimeAudioAnalyzer" ios/Podfile
```

#### 5. New Architecture (Fabric/TurboModules) Issues

**Symptoms:**
- Build errors when New Architecture is enabled
- Runtime crashes with Fabric

**Solutions:**

1. **Check New Architecture Status:**
```bash
# In android/gradle.properties
grep "newArchEnabled" android/gradle.properties

# In ios/Podfile
grep "RCT_NEW_ARCH_ENABLED" ios/Podfile
```

2. **Ensure Compatibility:**
Our module supports both old and new architecture. If you encounter issues:

```bash
# Disable New Architecture temporarily
# In android/gradle.properties:
# newArchEnabled=false

# In ios/Podfile:
# ENV['RCT_NEW_ARCH_ENABLED'] = '0'

# Then clean and rebuild
```

### Advanced Troubleshooting

#### 1. Force Manual Configuration

If autolinking completely fails, you can disable it for our module:

**Create `react-native.config.js` in your project root:**
```javascript
module.exports = {
  dependencies: {
    'react-native-realtime-audio-analysis': {
      platforms: {
        android: null, // disable Android platform auto linking
        ios: null, // disable iOS platform auto linking
      },
    },
  },
};
```

Then follow our [Manual Linking Guide](./MANUAL_LINKING.md).

#### 2. Check Autolinking Configuration

**Verify our module's configuration:**
```bash
# Check if react-native.config.js exists in our module
ls node_modules/react-native-realtime-audio-analysis/react-native.config.js

# Check podspec
ls node_modules/react-native-realtime-audio-analysis/*.podspec
```

#### 3. Debug Autolinking Process

**Enable verbose logging:**
```bash
# For Android
npx react-native run-android --verbose

# For iOS
npx react-native run-ios --verbose

# Check for autolinking messages in the output
```

## React Native Version-Specific Notes

### React Native 0.73+
- Full support for New Architecture (Fabric/TurboModules)
- Enhanced autolinking with better error messages
- Improved Gradle and CocoaPods integration

### React Native 0.68-0.72
- Stable autolinking support
- New Architecture available but experimental
- May require manual configuration for complex native modules

### React Native 0.60-0.67
- Basic autolinking support
- Some manual configuration may be needed
- Limited New Architecture support

### React Native < 0.60
- No autolinking support
- Must use [Manual Linking Guide](./MANUAL_LINKING.md)

## Best Practices

### 1. Keep Dependencies Updated
```bash
# Update React Native CLI
npm install -g @react-native-community/cli

# Update CocoaPods (iOS)
sudo gem install cocoapods

# Update Android Gradle Plugin
# Check android/build.gradle for latest versions
```

### 2. Clean Builds Regularly
```bash
# Full clean build script
#!/bin/bash
npx react-native start --reset-cache &
rm -rf node_modules && npm install
cd android && ./gradlew clean && cd ..
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npx react-native run-android  # or run-ios
```

### 3. Use Our CLI Tools
```bash
# Diagnose issues
npx rn-module-link diagnose

# Verify setup
npx rn-module-link verify

# Auto-fix common issues
npx rn-module-link link
```

## Getting Help

If autolinking still doesn't work:

1. **Check React Native Version Compatibility**
2. **Use Our Diagnostic Tools**: `npx rn-module-link diagnose`
3. **Try Manual Linking**: See [Manual Linking Guide](./MANUAL_LINKING.md)
4. **Check GitHub Issues**: Search for similar autolinking problems
5. **Create Minimal Reproduction**: Test in a fresh React Native project

## Autolinking vs Manual Linking

| Aspect | Autolinking | Manual Linking |
|--------|-------------|----------------|
| Setup Time | Automatic | 5-10 minutes |
| Maintenance | Low | Medium |
| Debugging | Can be complex | More transparent |
| Compatibility | RN 0.60+ | All versions |
| Customization | Limited | Full control |

**Recommendation**: Use autolinking for React Native 0.68+ projects. Use manual linking for older versions or when you need custom configuration.