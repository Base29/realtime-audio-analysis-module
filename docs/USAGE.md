# React Native Realtime Audio Analysis - Usage Guide

This guide covers how to use the react-native-realtime-audio-analysis module in your React Native application for both Android and iOS platforms.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Android Setup](#android-setup)
- [iOS Setup](#ios-setup)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

### 1. Install the Module

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

### 2. Automatic Linking (Recommended)

For React Native 0.60+, the module should auto-link. If you encounter issues, use our CLI tool:

```bash
npx rn-module-link link
```

### 3. Manual Linking (If Needed)

If automatic linking fails, follow our [Manual Linking Guide](./MANUAL_LINKING.md).

## Basic Usage

### Import the Module

```javascript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';
```

### Request Permissions

Before using audio analysis, request microphone permissions:

```javascript
import { PermissionsAndroid, Platform } from 'react-native';

const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'This app needs access to your microphone for audio analysis',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS permissions handled in Info.plist
};
```

### Start Audio Analysis

```javascript
const startAnalysis = async () => {
  try {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      console.log('Microphone permission denied');
      return;
    }

    await RealtimeAudioAnalyzer.startAnalysis({
      fftSize: 1024,
      sampleRate: 44100,
      windowFunction: 'hanning'
    });
    
    console.log('Audio analysis started');
  } catch (error) {
    console.error('Failed to start audio analysis:', error);
  }
};
```

### Listen for Audio Data

```javascript
import { NativeEventEmitter } from 'react-native';

const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);

const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
  const { frequencyData, timeData, volume } = data;
  
  // Process frequency spectrum data
  console.log('Frequency data:', frequencyData);
  
  // Process time domain data
  console.log('Time data:', timeData);
  
  // Current volume level
  console.log('Volume:', volume);
});

// Don't forget to remove the listener
// subscription.remove();
```

### Stop Audio Analysis

```javascript
const stopAnalysis = async () => {
  try {
    await RealtimeAudioAnalyzer.stopAnalysis();
    console.log('Audio analysis stopped');
  } catch (error) {
    console.error('Failed to stop audio analysis:', error);
  }
};
```

## Android Setup

### Prerequisites

- React Native 0.60+
- Android API level 21+
- NDK (for native audio processing)

### Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### ProGuard Configuration

If using ProGuard, add to `android/app/proguard-rules.pro`:

```
-keep class com.realtimeaudio.** { *; }
-dontwarn com.realtimeaudio.**
```

### Build Configuration

The module requires NDK for native audio processing. Ensure your `android/app/build.gradle` includes:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
}
```

## iOS Setup

### Prerequisites

- React Native 0.60+
- iOS 11.0+
- Xcode 12+

### Permissions

Add to `ios/YourProject/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone for real-time audio analysis</string>
```

### Audio Session Configuration

The module automatically configures the audio session, but you can customize it:

```javascript
await RealtimeAudioAnalyzer.configureAudioSession({
  category: 'record',
  mode: 'measurement',
  options: ['allowBluetooth']
});
```

### Background Audio (Optional)

To enable background audio processing, add to `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

## API Reference

### Methods

#### `startAnalysis(config?: AnalysisConfig): Promise<void>`

Starts real-time audio analysis.

**Parameters:**
- `config` (optional): Analysis configuration object

**Config Options:**
```typescript
interface AnalysisConfig {
  fftSize?: number;        // FFT size (512, 1024, 2048, 4096)
  sampleRate?: number;     // Sample rate in Hz (default: 44100)
  windowFunction?: string; // 'hanning', 'hamming', 'blackman'
  smoothing?: number;      // Smoothing factor (0.0 - 1.0)
}
```

#### `stopAnalysis(): Promise<void>`

Stops audio analysis and releases resources.

#### `isAnalyzing(): Promise<boolean>`

Returns whether audio analysis is currently active.

#### `getAnalysisConfig(): Promise<AnalysisConfig>`

Returns the current analysis configuration.

### Events

#### `AudioAnalysisData`

Emitted continuously during analysis with audio data.

**Event Data:**
```typescript
interface AudioAnalysisEvent {
  frequencyData: number[];  // Frequency spectrum (0-1 normalized)
  timeData: number[];       // Time domain data
  volume: number;           // Current volume level (0-1)
  timestamp: number;        // Event timestamp
}
```

#### `AudioAnalysisError`

Emitted when an error occurs during analysis.

**Event Data:**
```typescript
interface AudioAnalysisError {
  code: string;    // Error code
  message: string; // Error description
}
```

## Examples

### Audio Visualizer

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

const AudioVisualizer = () => {
  const [frequencyData, setFrequencyData] = useState([]);
  const [volume, setVolume] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
      setFrequencyData(data.frequencyData);
      setVolume(data.volume);
    });

    return () => subscription.remove();
  }, []);

  const toggleAnalysis = async () => {
    try {
      if (isAnalyzing) {
        await RealtimeAudioAnalyzer.stopAnalysis();
        setIsAnalyzing(false);
      } else {
        await RealtimeAudioAnalyzer.startAnalysis({
          fftSize: 1024,
          sampleRate: 44100
        });
        setIsAnalyzing(true);
      }
    } catch (error) {
      console.error('Analysis toggle failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Volume: {(volume * 100).toFixed(1)}%</Text>
      <Text>Frequency Bins: {frequencyData.length}</Text>
      
      {/* Render frequency bars */}
      <View style={{ flexDirection: 'row', height: 200 }}>
        {frequencyData.slice(0, 32).map((magnitude, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: `hsl(${index * 10}, 70%, 50%)`,
              height: magnitude * 200,
              marginHorizontal: 1,
              alignSelf: 'flex-end'
            }}
          />
        ))}
      </View>
      
      <TouchableOpacity onPress={toggleAnalysis}>
        <Text>{isAnalyzing ? 'Stop' : 'Start'} Analysis</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Volume Monitor

```javascript
const VolumeMonitor = () => {
  const [volume, setVolume] = useState(0);
  const [peakVolume, setPeakVolume] = useState(0);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
      setVolume(data.volume);
      setPeakVolume(prev => Math.max(prev, data.volume));
    });

    // Start monitoring
    RealtimeAudioAnalyzer.startAnalysis({ fftSize: 512 });

    return () => {
      subscription.remove();
      RealtimeAudioAnalyzer.stopAnalysis();
    };
  }, []);

  return (
    <View>
      <Text>Current Volume: {(volume * 100).toFixed(1)}%</Text>
      <Text>Peak Volume: {(peakVolume * 100).toFixed(1)}%</Text>
      <View style={{
        width: '100%',
        height: 20,
        backgroundColor: '#ddd',
        borderRadius: 10
      }}>
        <View style={{
          width: `${volume * 100}%`,
          height: '100%',
          backgroundColor: volume > 0.8 ? 'red' : volume > 0.5 ? 'orange' : 'green',
          borderRadius: 10
        }} />
      </View>
    </View>
  );
};
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure the module is properly installed
   - Try cleaning and rebuilding: `npx react-native start --reset-cache`

2. **Permission denied errors**
   - Check microphone permissions are granted
   - Verify Info.plist (iOS) and AndroidManifest.xml (Android) are configured

3. **Audio analysis not starting**
   - Check device audio capabilities
   - Ensure no other apps are using the microphone
   - Verify audio session configuration (iOS)

4. **Build errors**
   - Check NDK installation (Android)
   - Verify minimum SDK versions
   - See [Manual Linking Guide](./MANUAL_LINKING.md) for configuration issues

### Getting Help

- Check our [CLI Usage Guide](./CLI_USAGE.md) for diagnostic tools
- Use `npx rn-module-link diagnose` for automated troubleshooting
- See [Verification Guide](./VERIFICATION.md) for testing your setup

For more detailed troubleshooting, see our [Manual Linking Guide](./MANUAL_LINKING.md).