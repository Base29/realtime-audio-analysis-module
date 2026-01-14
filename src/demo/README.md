# Rich Audio Demo

A comprehensive React Native demo component showcasing the full functionality of the realtime-audio-analysis library with rich animated visuals, robust permission handling, and clean API design.

## Quick Start

```typescript
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function App() {
  return (
    <RichAudioDemo
      autoStart={true}
      showDebug={false}
      barCount={32}
      onError={(error) => console.error('Audio error:', error)}
    />
  );
}
```

## Installation & Setup

### 1. Install the Package

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

### 2. Platform Configuration

#### iOS Configuration

Add microphone usage description to your `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to analyze audio in real-time</string>
```

**Required**: Without this entry, your app will crash when requesting microphone permission on iOS.

#### Android Configuration

Add microphone permission to your `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**Note**: This permission requires runtime request on Android 6.0+ (API level 23+). The RichAudioDemo component handles this automatically.

### 3. Link Native Dependencies

For React Native 0.60+, autolinking should handle this automatically. For older versions:

```bash
npx react-native link react-native-realtime-audio-analysis
```

## Usage Examples

### Basic Usage

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function AudioScreen() {
  return (
    <View style={styles.container}>
      <RichAudioDemo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Advanced Configuration

```typescript
import React, { useCallback } from 'react';
import { View, Alert } from 'react-native';
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

export default function AdvancedAudioScreen() {
  const handleError = useCallback((error: Error) => {
    console.error('Audio analysis error:', error);
    Alert.alert('Audio Error', error.message);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <RichAudioDemo
        autoStart={false}        // Don't start automatically
        showDebug={true}         // Show debug panel
        barCount={64}            // More frequency bars
        onError={handleError}    // Custom error handling
      />
    </View>
  );
}
```

### Using Individual Components

```typescript
import React from 'react';
import { View } from 'react-native';
import { 
  useRealtimeAudioLevels,
  SpectrumVisualizer,
  LevelMeter 
} from 'react-native-realtime-audio-analysis';

export default function CustomAudioScreen() {
  const {
    isAnalyzing,
    frequencyData,
    rms,
    peak,
    startAnalysis,
    stopAnalysis,
    permissionStatus
  } = useRealtimeAudioLevels();

  return (
    <View style={{ flex: 1 }}>
      <SpectrumVisualizer 
        frequencyData={frequencyData}
        barCount={32}
      />
      <LevelMeter 
        rms={rms}
        peak={peak}
      />
    </View>
  );
}
```

## Props Reference

### RichAudioDemo Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoStart` | `boolean` | `false` | Automatically start audio analysis when component mounts |
| `showDebug` | `boolean` | `false` | Show debug panel with raw audio values and configuration |
| `barCount` | `number` | `32` | Number of frequency bars in spectrum visualizer (8-128) |
| `onError` | `(error: Error) => void` | `undefined` | Callback for handling errors |

### useRealtimeAudioLevels Hook

Returns an object with the following properties:

```typescript
interface AudioLevelsHook {
  // Permission state
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'blocked';
  requestPermission: () => Promise<boolean>;
  
  // Audio data
  isAnalyzing: boolean;
  rms: number;              // RMS level (0.0-1.0)
  peak: number;             // Peak level (0.0-1.0)
  rmsSmoothed: number;      // Smoothed RMS level
  peakSmoothed: number;     // Smoothed peak level
  frequencyData: number[];  // FFT magnitude spectrum
  
  // Configuration
  sampleRate: number;
  fftSize: number;
  smoothingEnabled: boolean;
  smoothingFactor: number;
  
  // Controls
  startAnalysis: (config?: AnalysisConfig) => Promise<void>;
  stopAnalysis: () => Promise<void>;
  setSmoothing: (enabled: boolean, factor: number) => Promise<void>;
  setFftConfig: (fftSize: number, downsampleBins: number) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}
```

## Manual Testing Guide

### Permission Testing Scenarios

#### iOS Permission Testing

1. **First Launch (Undetermined)**
   - Install fresh app
   - Launch RichAudioDemo
   - Verify permission prompt appears
   - Test "Allow" and "Don't Allow" responses

2. **Permission Denied**
   - Deny permission when prompted
   - Verify "Enable Microphone" button appears
   - Test button opens Settings app

3. **Permission Granted**
   - Grant permission when prompted
   - Verify audio analysis starts automatically
   - Check spectrum visualizer shows data

#### Android Permission Testing

1. **First Launch (API 23+)**
   - Install fresh app on Android 6.0+
   - Launch RichAudioDemo
   - Verify runtime permission request
   - Test "Allow" and "Deny" responses

2. **Permission Permanently Denied**
   - Deny permission and check "Don't ask again"
   - Verify "Open Settings" button appears
   - Test button opens app settings

3. **Pre-API 23 Testing**
   - Test on Android 5.x or lower
   - Verify permission granted automatically
   - Check audio analysis works immediately

### Functional Testing Steps

#### Basic Functionality

1. **Component Mounting**
   - Mount RichAudioDemo component
   - Verify permission check occurs
   - Check UI renders correctly

2. **Audio Analysis**
   - Grant microphone permission
   - Start audio analysis
   - Verify spectrum bars animate with audio
   - Check level meter responds to volume

3. **Controls Testing**
   - Test start/stop buttons
   - Verify smoothing controls work
   - Check FFT size configuration
   - Test debug panel toggle

#### Error Scenarios

1. **Module Not Linked**
   - Test with unlinked native module
   - Verify clear error message appears
   - Check error callback is triggered

2. **Permission Errors**
   - Test various permission states
   - Verify appropriate UI responses
   - Check error recovery options

3. **Runtime Errors**
   - Test with invalid configurations
   - Verify graceful error handling
   - Check component remains stable

### Performance Testing

1. **Memory Usage**
   - Run analysis for extended periods
   - Monitor memory consumption
   - Verify no memory leaks occur

2. **Animation Performance**
   - Test on lower-end devices
   - Verify 30+ FPS performance
   - Check smooth animations

3. **Battery Impact**
   - Monitor battery usage during analysis
   - Test background/foreground transitions
   - Verify proper cleanup on app backgrounding

## Troubleshooting

### Common Issues

#### "Native module not found" Error

**Cause**: Native module not properly linked
**Solution**: 
1. Ensure proper installation: `npm install react-native-realtime-audio-analysis`
2. For RN < 0.60: `npx react-native link`
3. Clean and rebuild: `npx react-native run-ios` or `npx react-native run-android`

#### Permission Denied on iOS

**Cause**: Missing NSMicrophoneUsageDescription in Info.plist
**Solution**: Add the required key to your Info.plist file (see iOS Configuration above)

#### No Audio Data on Android

**Cause**: RECORD_AUDIO permission not declared or granted
**Solution**: 
1. Add permission to AndroidManifest.xml
2. Ensure runtime permission is granted
3. Check device microphone functionality

#### Poor Performance

**Cause**: High-frequency updates or too many spectrum bars
**Solution**:
1. Reduce `barCount` prop (try 16-32)
2. Enable smoothing to reduce update frequency
3. Test on physical device (not simulator)

### Debug Mode

Enable debug mode to troubleshoot issues:

```typescript
<RichAudioDemo showDebug={true} />
```

Debug panel shows:
- Raw vs smoothed audio values
- Current configuration settings
- Permission status
- Error messages
- Performance metrics

## Structure

```
src/demo/
├── components/           # React components
│   ├── RichAudioDemo.tsx # Main demo component
│   ├── SpectrumVisualizer.tsx # Frequency spectrum bars
│   └── LevelMeter.tsx    # RMS/Peak indicators
├── hooks/               # Custom React hooks
│   └── useRealtimeAudioLevels.ts # Audio analysis hook
├── types/               # TypeScript interfaces
│   └── interfaces.ts    # All type definitions
├── utils/               # Utility classes
│   ├── RingBuffer.ts    # Memory-bounded buffer
│   └── PermissionManager.ts # Cross-platform permissions
├── __tests__/           # Test files
│   ├── setup.ts         # Test configuration
│   ├── jest.config.js   # Jest configuration
│   └── *.test.ts        # Test files
└── index.ts             # Main export
```

## Features

- **Cross-platform Permission Handling**: Seamless microphone access on iOS and Android
- **Rich Animated Visuals**: Spectrum visualizer and level meters with smooth animations  
- **Memory Management**: Ring buffer prevents unbounded memory growth
- **Advanced Controls**: Smoothing, FFT configuration, and debug options
- **Property-Based Testing**: Comprehensive test coverage using fast-check
- **TypeScript Support**: Full type safety and IntelliSense support
- **Clean API**: Simple props interface for easy integration
- **Performance Optimized**: 30-60 FPS animations with minimal CPU usage