# Testing Guide for React Native Audio Module

## Overview

This guide helps you test the React Native audio module after applying the JavaScript interface fixes.

## Available Test Components

### 1. TestAudioModule.js (Simple Test)
**Location**: Copy from module root to your React Native project
**Purpose**: Basic functionality test with detailed logging

**Features**:
- ✅ Module availability check
- ✅ Method validation
- ✅ Basic audio analysis test
- ✅ Detailed console logging
- ✅ Error handling

**Usage**:
```bash
# Copy to your React Native project
cp TestAudioModule.js /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/

# Then import in your App.js:
import TestAudioModule from './TestAudioModule';
```

### 2. AudioVisualizer.tsx (Advanced Test)
**Location**: `examples/AudioVisualizer.tsx`
**Purpose**: Full visual audio analysis with spectrum display

**Features**:
- ✅ Real-time frequency spectrum bars
- ✅ RMS volume indicator with pulsing circle
- ✅ Peak level monitoring
- ✅ Visual feedback
- ✅ Professional UI

**Usage**:
```bash
# Copy to your React Native project
cp examples/AudioVisualizer.tsx /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/

# Then import in your App.js:
import { AudioVisualizer } from './AudioVisualizer';
```

### 3. SimpleAudioTest.js (Legacy Test)
**Location**: Module root
**Purpose**: Original test component (already in your project)

## Testing Steps

### Step 1: Run Diagnostic Scripts

From your React Native project root:

```bash
# Test JavaScript interface
node quick-test.js

# Test native linking
node debug-module-linking.js

# Test module setup (if available)
node check-module-setup.js
```

**Expected Output**:
```
✅ Module imported successfully from node_modules
✅ startAnalysis
✅ stopAnalysis  
✅ isAnalyzing
✅ getAnalysisConfig
✅ addListener
✅ removeListeners
```

### Step 2: Test in React Native App

1. **Copy test component**:
   ```bash
   cp /path/to/module/TestAudioModule.js /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/
   ```

2. **Update your App.js**:
   ```javascript
   import React from 'react';
   import TestAudioModule from './TestAudioModule';
   
   export default function App() {
     return <TestAudioModule />;
   }
   ```

3. **Run the app**:
   ```bash
   npx react-native run-android
   ```

### Step 3: Verify Functionality

1. **Check Module Status**: Should show "✅ Module ready"
2. **Test Module**: Tap "Test Module" button - should show available methods
3. **Start Analysis**: Tap "Start Analysis" - should request microphone permission
4. **Check Audio**: Speak or make noise - volume bar should respond

### Step 4: Check Console Logs

Look for these logs in your React Native console:

```
✅ Module imported successfully
🎤 Requesting microphone permission...
🚀 Starting audio analysis...
RealtimeAudioAnalysis native methods: ["startAnalysis", "stopAnalysis", ...]
Calling startAnalysis with config: {fftSize: 1024, sampleRate: 44100}
📊 Audio data received: {volume: 0.123, rms: 0.123, peak: 0.456, ...}
✅ Audio analysis started successfully
```

## Troubleshooting

### Issue: "Module not available"
**Solution**: 
1. Check native linking: `node debug-module-linking.js`
2. Ensure MainApplication.kt includes RealtimeAudioAnalyzerPackage
3. Clean and rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`

### Issue: "Cannot read property 'RealtimeAudioAnalyzer' of undefined"
**Solution**:
1. Apply JavaScript interface fix from `docs/JAVASCRIPT_INTERFACE_FIX.md`
2. Copy updated `src/index.tsx` to your `node_modules/react-native-realtime-audio-analysis/src/`
3. Rebuild the app

### Issue: "Missing methods"
**Solution**:
1. Check that you're using the correct import: `require('react-native-realtime-audio-analysis').default`
2. Verify the module version in node_modules matches the updated version
3. Reinstall the module: `npm uninstall react-native-realtime-audio-analysis && npm install /path/to/module`

### Issue: No audio data received
**Solution**:
1. Check microphone permissions
2. Verify event listener is set up correctly: `addListener('AudioAnalysisData', callback)`
3. Check console for native module logs
4. Test on a physical device (emulator microphone may not work)

## Expected Behavior

### Successful Test Results:
- ✅ Module imports without errors
- ✅ All required methods are available
- ✅ Microphone permission is granted
- ✅ Audio analysis starts without errors
- ✅ Volume bar responds to audio input
- ✅ Console shows audio data logs
- ✅ Analysis stops cleanly

### Performance Expectations:
- **Startup time**: < 1 second
- **Audio latency**: < 100ms
- **CPU usage**: Low (< 10% on modern devices)
- **Memory usage**: Stable (no leaks)

## Advanced Testing with AudioVisualizer

For a more comprehensive test, use the AudioVisualizer component:

1. **Copy the component**:
   ```bash
   cp examples/AudioVisualizer.tsx /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp/
   ```

2. **Update App.js**:
   ```javascript
   import React from 'react';
   import { AudioVisualizer } from './AudioVisualizer';
   
   export default function App() {
     return <AudioVisualizer />;
   }
   ```

3. **Test features**:
   - Real-time frequency bars should animate with audio
   - RMS circle should pulse with volume
   - Peak levels should update
   - Start/stop controls should work smoothly

This provides a complete visual test of all module functionality.