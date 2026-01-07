# How to Update the Module in Your React Native App

## Problem

You're getting "Unexpected token 'export'" error because your React Native app is using an old version of the built module that doesn't include the latest JavaScript interface fixes.

## Solution

You need to reinstall the module in your React Native app to get the updated built files.

## Step-by-Step Instructions

### Option 1: Reinstall from Local Path (Recommended)

From your React Native project directory:

```bash
cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

# Remove the old module
rm -rf node_modules/react-native-realtime-audio-analysis

# Reinstall from local path
npm install file:local_modules/realtime-audio-analysis-module

# Or if the module is in a different location:
# npm install /path/to/realtime-audio-analysis-module
```

### Option 2: Force Reinstall

```bash
cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp

# Uninstall
npm uninstall react-native-realtime-audio-analysis

# Clear npm cache
npm cache clean --force

# Reinstall
npm install file:local_modules/realtime-audio-analysis-module
```

### Option 3: Manual Copy (Quick Fix)

If you need a quick fix without reinstalling:

```bash
# From the module directory
cd /path/to/realtime-audio-analysis-module

# Copy the built files to your React Native app
cp -r lib /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/node_modules/react-native-realtime-audio-analysis/

# Copy the updated source files
cp -r src /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/node_modules/react-native-realtime-audio-analysis/
```

## Verify the Update

After reinstalling, verify the module is updated:

### 1. Check the built file

```bash
cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp
head -30 node_modules/react-native-realtime-audio-analysis/lib/commonjs/index.js
```

You should see:
```javascript
const RealtimeAudioAnalysisModule = _reactNative.NativeModules.RealtimeAudioAnalysis || _reactNative.NativeModules.RealtimeAudioAnalyzer;
```

### 2. Run the quick test

```bash
node quick-test.js
```

Expected output:
```
✅ Module imported successfully from node_modules
✅ startAnalysis
✅ stopAnalysis
✅ isAnalyzing
✅ getAnalysisConfig
✅ addListener
✅ removeListeners
```

### 3. Rebuild your React Native app

```bash
# Clean and rebuild Android
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Understanding the Issue

The error "Unexpected token 'export'" occurs because:

1. **package.json** points to built files in `lib/commonjs/index.js`
2. Node.js (used by quick-test.js) can't parse TypeScript/ES6 modules directly
3. The module needs to be **built** using `npm run prepare` (which runs `bob build`)
4. Your React Native app was using old built files that didn't include the fixes

## What Was Fixed

The module has been rebuilt with these fixes:

✅ **JavaScript Interface**:
- Disabled TurboModule conflicts
- Added fallback module name detection
- Enhanced error handling and debugging
- Fixed TypeScript interfaces

✅ **Built Files**:
- `lib/commonjs/index.js` - CommonJS build (used by Node.js and Metro)
- `lib/module/index.js` - ES Module build
- `lib/typescript/` - TypeScript definitions

## Troubleshooting

### Still getting "Unexpected token 'export'"?

1. **Check package.json main field**:
   ```bash
   cat node_modules/react-native-realtime-audio-analysis/package.json | grep "main"
   ```
   Should show: `"main": "lib/commonjs/index"`

2. **Verify lib directory exists**:
   ```bash
   ls -la node_modules/react-native-realtime-audio-analysis/lib/
   ```
   Should show: `commonjs/`, `module/`, `typescript/`

3. **Check file permissions**:
   ```bash
   ls -la node_modules/react-native-realtime-audio-analysis/lib/commonjs/index.js
   ```

### Module still not working in React Native app?

1. **Clean Metro bundler cache**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Clean Android build**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **Reinstall node_modules**:
   ```bash
   rm -rf node_modules
   npm install
   ```

## Next Steps

After successfully updating the module:

1. ✅ Run `node quick-test.js` - Should pass all tests
2. ✅ Run `node debug-module-linking.js` - Should show all ✅
3. ✅ Test in React Native app with `TestAudioModule.js`
4. ✅ Use `AudioVisualizer.tsx` for full visual test

The module is now ready to use with all the latest fixes!