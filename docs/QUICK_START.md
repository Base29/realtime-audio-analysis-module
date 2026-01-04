# Quick Start Guide

Get up and running with react-native-realtime-audio-analysis in minutes.

## Installation

### 1. Install the Package

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

### 2. Auto-Link (React Native 0.60+)

For most projects, the module will auto-link. If you encounter issues:

```bash
npx rn-module-link link
```

### 3. Platform Setup

**Android**: Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**iOS**: Add to `ios/YourProject/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for audio analysis</string>
```

## Basic Usage

### Simple Volume Monitor

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

const VolumeMonitor = () => {
  const [volume, setVolume] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
      setVolume(data.volume);
    });

    return () => subscription.remove();
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const toggleAnalysis = async () => {
    try {
      if (isAnalyzing) {
        await RealtimeAudioAnalyzer.stopAnalysis();
        setIsAnalyzing(false);
      } else {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          alert('Microphone permission required');
          return;
        }

        await RealtimeAudioAnalyzer.startAnalysis({
          fftSize: 1024,
          sampleRate: 44100
        });
        setIsAnalyzing(true);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Volume: {(volume * 100).toFixed(1)}%
      </Text>
      
      <View style={{
        width: 200,
        height: 20,
        backgroundColor: '#ddd',
        borderRadius: 10,
        marginBottom: 20
      }}>
        <View style={{
          width: `${volume * 100}%`,
          height: '100%',
          backgroundColor: volume > 0.7 ? 'red' : volume > 0.4 ? 'orange' : 'green',
          borderRadius: 10
        }} />
      </View>

      <TouchableOpacity
        onPress={toggleAnalysis}
        style={{
          backgroundColor: isAnalyzing ? 'red' : 'green',
          padding: 15,
          borderRadius: 10
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>
          {isAnalyzing ? 'Stop' : 'Start'} Analysis
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VolumeMonitor;
```

### Simple Frequency Visualizer

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeEventEmitter } from 'react-native';
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

const FrequencyVisualizer = () => {
  const [frequencyData, setFrequencyData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
      // Take first 32 frequency bins for visualization
      setFrequencyData(data.frequencyData.slice(0, 32));
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
      console.error('Analysis error:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 20 }}>
        Frequency Spectrum
      </Text>

      <View style={{ 
        flexDirection: 'row', 
        height: 200, 
        alignItems: 'flex-end',
        marginBottom: 20
      }}>
        {frequencyData.map((magnitude, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: `hsl(${index * 8}, 70%, 50%)`,
              height: Math.max(magnitude * 200, 2),
              marginHorizontal: 1,
              borderRadius: 2
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={toggleAnalysis}
        style={{
          backgroundColor: isAnalyzing ? 'red' : 'blue',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>
          {isAnalyzing ? 'Stop' : 'Start'} Analysis
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FrequencyVisualizer;
```

## Next Steps

1. **Read the [Usage Guide](./USAGE.md)** for complete API documentation
2. **Check the [API Reference](./API_REFERENCE.md)** for detailed method descriptions
3. **See [Examples](../examples/)** for more complex implementations
4. **Use [CLI Tools](./CLI_USAGE.md)** for troubleshooting

## Troubleshooting

### Module Not Found
```bash
# Clean and rebuild
npx react-native start --reset-cache
npx react-native run-android  # or run-ios
```

### Permission Issues
- **Android**: Check AndroidManifest.xml has RECORD_AUDIO permission
- **iOS**: Check Info.plist has NSMicrophoneUsageDescription

### Linking Issues
```bash
# Use our CLI tool
npx rn-module-link diagnose
npx rn-module-link link
```

### Build Errors
See our [Manual Linking Guide](./MANUAL_LINKING.md) for platform-specific setup.

## Common Configurations

### High Performance (60 FPS)
```javascript
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 512,        // Smaller FFT for faster processing
  sampleRate: 44100,
  smoothing: 0.9       // Higher smoothing for stable display
});
```

### High Quality Analysis
```javascript
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 4096,       // Larger FFT for better frequency resolution
  sampleRate: 48000,   // Higher sample rate
  windowFunction: 'blackman'  // Better frequency separation
});
```

### Battery Optimized
```javascript
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 512,
  sampleRate: 22050,   // Lower sample rate
  enableTimeData: false,  // Disable time domain data
  smoothing: 0.95      // More smoothing = less CPU
});
```