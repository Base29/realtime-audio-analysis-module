# React Native Integration Guide

This guide shows how to integrate and test the `react-native-realtime-audio-analysis` module in your React Native application.

## 📦 Installation

### Standard Installation (from npm registry)

```bash
npm install react-native-realtime-audio-analysis
```

### Local Installation (from local directory)

```bash
# From your React Native project root
# Note: The folder name is 'realtime-audio-analysis-module' 
# but it installs as 'react-native-realtime-audio-analysis' (from package.json name field)

npm install ./local_modules/realtime-audio-analysis-module

# Alternative paths:
npm install ../path/to/realtime-audio-analysis-module
npm install file:../path/to/realtime-audio-analysis-module
```

**⚠️ Important**: The folder name (`realtime-audio-analysis-module`) differs from the installed package name (`react-native-realtime-audio-analysis`). This is normal - npm uses the `name` field from `package.json` for the installed package name.

### 2. iOS Setup

```bash
cd ios && pod install && cd ..
```

### 3. Android Setup

No additional setup required for React Native 0.60+ (autolinking handles it automatically).

**✅ AUTOLINKING CONFIRMED**: This module **will autolink correctly** when installed as a local module. The module structure follows React Native autolinking conventions and includes all required configuration files.

## 🧪 Testing Integration

### Automated Linking Test

Run the automated linking test to verify the module is correctly integrated:

```bash
# From your React Native project root
node node_modules/react-native-realtime-audio-analysis/test-module-linking.js

# Or if you've added it to package.json scripts:
npm run test:linking
```

This test will verify:
- ✅ Module installation and file structure
- ✅ iOS/Android platform integration
- ✅ JavaScript module loading
- ✅ TypeScript definitions
- ✅ Autolinking configuration
- ✅ Runtime compatibility

### Interactive Test Screen

Add the comprehensive test screen to your app for runtime testing:

```typescript
// In your App.tsx or a new screen
import React from 'react';
import TestScreen from 'react-native-realtime-audio-analysis/testing/TestScreen';

export default function App() {
  return <TestScreen />;
}
```

**Alternative: Copy the file to your project**
```bash
cp node_modules/react-native-realtime-audio-analysis/testing/TestScreen.tsx ./src/components/
# Then update the import to: import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';
```

The test screen provides:
- 🔍 Module availability checks
- 🎤 Permission handling tests
- 📊 Real-time audio data display
- ⚡ Start/stop functionality tests
- 🛠️ Error handling verification

## 📱 Basic Usage

### Simple Example

```typescript
import React, { useEffect, useState } from 'react';
import { NativeEventEmitter } from 'react-native';
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

export const AudioExample = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioData, setAudioData] = useState({ rms: 0, peak: 0 });

  useEffect(() => {
    const emitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = emitter.addListener('AudioAnalysisData', (data) => {
      setAudioData({
        rms: data.rms || data.volume || 0,
        peak: data.peak || 0,
      });
    });

    return () => subscription.remove();
  }, []);

  const startAnalysis = async () => {
    try {
      await RealtimeAudioAnalyzer.startAnalysis({
        fftSize: 1024,
        sampleRate: 48000,
      });
      setIsAnalyzing(true);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    }
  };

  const stopAnalysis = async () => {
    try {
      await RealtimeAudioAnalyzer.stopAnalysis();
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Failed to stop analysis:', error);
    }
  };

  return (
    // Your UI here
  );
};
```

### Complete Example Component

For a complete, ready-to-use example, see:
- `testing/example-usage.tsx` - Simple audio level display
- `testing/TestScreen.tsx` - Comprehensive testing interface
- `examples/AudioVisualizer.tsx` - Advanced visualizer with FFT

## 🔧 Configuration Options

### Analysis Configuration

```typescript
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 1024,        // FFT size (512, 1024, 2048, 4096)
  sampleRate: 48000,    // Preferred sample rate (Hz)
  windowFunction: 'hanning', // Window function for FFT
  smoothing: 0.5,       // Smoothing factor (0.0 - 1.0)
});
```

### Event Data Structure

```typescript
interface AudioAnalysisEvent {
  rms: number;              // RMS level (0.0 - 1.0)
  peak: number;             // Peak level (0.0 - 1.0)
  fft: number[];            // FFT magnitude spectrum
  frequencyData: number[];  // Alias for fft
  timestamp: number;        // Event timestamp
  sampleRate?: number;      // Actual sample rate
  bufferSize?: number;      // Audio buffer size
}
```

## 📋 Permissions

### iOS

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for audio analysis</string>
```

### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

Handle runtime permissions:

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS handles permissions automatically
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Module Not Found

```
Error: Cannot resolve module 'react-native-realtime-audio-analysis'
```

**Solutions:**
- Verify installation: `npm list react-native-realtime-audio-analysis`
- Clear Metro cache: `npx react-native start --reset-cache`
- Reinstall: `npm uninstall react-native-realtime-audio-analysis && npm install react-native-realtime-audio-analysis`

#### 2. iOS Build Errors

```
'RealtimeAudioAnalyzer/RealtimeAudioAnalyzer-Swift.h' file not found
```

**Solutions:**
- Run `cd ios && pod install`
- Clean build: `cd ios && xcodebuild clean`
- Ensure iOS deployment target is 12.0+

#### 3. Android Build Errors

```
Could not find com.realtimeaudio:RealtimeAudioAnalyzer
```

**Solutions:**
- Verify autolinking: `npx react-native config`
- Clean build: `cd android && ./gradlew clean`
- Check `android/settings.gradle` includes the module

#### 4. Runtime Errors

```
Native module RealtimeAudioAnalyzer is null
```

**Solutions:**
- Run the linking test: `npm run test:linking`
- Rebuild the app completely
- Check platform-specific setup steps

### Debug Steps

1. **Run Linking Test**
   ```bash
   npm run test:linking
   ```

2. **Check Module Registration**
   ```typescript
   import { NativeModules } from 'react-native';
   console.log('Available:', !!NativeModules.RealtimeAudioAnalyzer);
   ```

3. **Verify Methods**
   ```typescript
   console.log('Methods:', Object.keys(NativeModules.RealtimeAudioAnalyzer));
   ```

4. **Test Events**
   ```typescript
   const emitter = new NativeEventEmitter(NativeModules.RealtimeAudioAnalyzer);
   emitter.addListener('AudioAnalysisData', (data) => {
     console.log('Event received:', data);
   });
   ```

## 📚 Additional Resources

- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- **[Swift Bridge Implementation](docs/SWIFT_BRIDGE_IMPLEMENTATION.md)** - iOS pure Swift details
- **[Module Registry Audit](MODULE_REGISTRY_AUDIT.md)** - Naming consistency analysis
- **[Examples Directory](examples/)** - Additional code examples

## 🆘 Getting Help

If you encounter issues:

1. Run the automated linking test
2. Check the troubleshooting section above
3. Review the console logs for specific error messages
4. Test with the provided TestScreen component
5. Check the GitHub issues for similar problems

The module includes comprehensive testing tools to help diagnose and resolve integration issues quickly.