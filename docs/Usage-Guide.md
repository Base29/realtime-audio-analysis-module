# Usage Guide: Real-Time Audio Analysis Module

This guide provides instructions on how to integrate and use the `react-native-realtime-audio-analysis` module in your React Native application.

## 1. Installation

Assuming you have the package added to your project:

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

### iOS Setup
Install the native pods:
```bash
cd ios && pod install
```

### Android Setup
No additional setup is usually required for Autolinking. Ensure your `minSdkVersion` is at least 21.

## 2. Permissions (Critical)

Your app **must** request microphone permissions before the audio engine can start.

### iOS (`Info.plist`)
Add the following key to your `ios/YourApp/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app analyzes audio in real-time to visualize sound patterns.</string>
```

### Android (`AndroidManifest.xml`)
Add the record permission to your `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

> **Note**: On Android 6.0+, you must also request this permission at runtime using `PermissionsAndroid` or a library like `react-native-permissions`. The module will fail with `E_PERMISSION_DENIED` if permission is not granted.

## 3. API Reference

### `start(options: StartOptions): Promise<void>`
Initializes the audio engine and begins processing.

| Option | Type | Default | Description |
|---|---|---|---|
| `bufferSize` | number | `1024` | Size of the audio buffer (frames). |
| `sampleRate` | number | `44100` | Preferred sample rate (Hz). Actual rate depends on hardware. |
| `callbackRateHz`| number | `30` | How many times per second to emit an event (throttling). |
| `emitFft` | boolean | `true` | Whether to include FFT data in the event. |

### `stop(): Promise<void>`
Stops the audio engine and releases native resources. It is safe to call this multiple times.

### `setSmoothing(enabled: boolean, factor: number): Promise<void>`
Configures the exponential smoothing for RMS and Peak values.
- `factor`: `0.0` (no smoothing) to `1.0` (max smoothing). Default is `0.5`.

### `setFftConfig(fftSize: number, downsampleBins?: number): Promise<void>`
Updates FFT configuration.
- `fftSize`: Number of bins (must be power of 2, e.g., 1024, 2048).
- `downsampleBins`: If positive, the native side will average the FFT into this many bins (e.g., 32 or 64 for a bar visualizer).

## 4. Events

Subscribe to data updates using `addListener`.

**Event Name**: `RealtimeAudioAnalyzer:onData`

**Payload**:
```typescript
interface AudioAnalysisEvent {
  timestamp: number;    // Ms since epoch
  rms: number;          // Root Mean Square amplitude (0.0 - 1.0)
  peak: number;         // Peak amplitude (0.0 - 1.0)
  fft: number[];        // Array of magnitude values (normalized 0.0 - 1.0)
  sampleRate: number;   // Actual hardware sample rate
  bufferSize: number;   // Actual buffer size used
}
```

## 5. Complete Example Component

Here is a full, copy-pasteable component that implements a **Spectrum Analyzer** (Bar Chart) and **Volume Meter**.

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  RealtimeAudioAnalyzer,
  AudioAnalysisEvent,
} from 'react-native-realtime-audio-analysis';

// Configuration
const FFT_SIZE = 1024;
const BAR_COUNT = 32; // Number of bars to display

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * A reusable Audio Visualizer component.
 * Features:
 * - Real-time frequency spectrum (Bar Chart)
 * - RMS Volume Indicator (Pulsing Circle)
 */
export const AudioVisualizer = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [fftData, setFftData] = useState<number[]>(new Array(BAR_COUNT).fill(0));
  const [rms, setRms] = useState(0);
  const [peak, setPeak] = useState(0);

  useEffect(() => {
    checkPermissions();
    return () => stopAnalysis();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Needed for audio analysis.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setHasPermission(true);
      } else {
        console.warn('Microphone permission denied');
      }
    } else {
      setHasPermission(true);
    }
  };

  const startAnalysis = async () => {
    try {
      if (!hasPermission) await checkPermissions();
      
      // 1. Subscribe to events
      RealtimeAudioAnalyzer.addListener(onAudioData);

      // 2. Start the engine
      // We request downsampling to BAR_COUNT natively for performance!
      await RealtimeAudioAnalyzer.start({
        bufferSize: FFT_SIZE,
        sampleRate: 44100,
        callbackRateHz: 30, // 30 FPS is good for UI
        emitFft: true,
      });
      
      // 3. Configure specific DSP settings
      await RealtimeAudioAnalyzer.setFftConfig(FFT_SIZE, BAR_COUNT);
      await RealtimeAudioAnalyzer.setSmoothing(true, 0.5);

      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start analysis:', e);
    }
  };

  const stopAnalysis = async () => {
    try {
      await RealtimeAudioAnalyzer.stop();
      RealtimeAudioAnalyzer.removeAllListeners();
      setIsRecording(false);
      setRms(0);
      setPeak(0);
      setFftData(new Array(BAR_COUNT).fill(0));
    } catch (e) {
      console.error('Failed to stop:', e);
    }
  };

  const onAudioData = useCallback((data: AudioAnalysisEvent) => {
    setRms(data.rms);
    setPeak(data.peak);
    if (data.fft && data.fft.length > 0) {
      setFftData(data.fft);
    }
  }, []);

  const renderBars = () => {
    const barWidth = (SCREEN_WIDTH - 40) / BAR_COUNT - 2;
    return (
      <View style={styles.spectrumContainer}>
        {fftData.map((magnitude, index) => {
          const height = Math.min(magnitude * 250, 200); 
          const green = 255 - (index / BAR_COUNT) * 100;
          const blue = (index / BAR_COUNT) * 255;
          const color = `rgba(0, ${green}, ${blue}, 1)`;

          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: Math.max(height, 2),
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Real-Time Audio Analyzer</Text>
      
      {/* RMS / Peak Circle Indicator */}
      <View style={styles.meterContainer}>
        <View
          style={[
            styles.rmsCircle,
            {
              transform: [{ scale: 1 + rms * 3 }],
              opacity: 0.3 + peak * 0.7,
            },
          ]}
        />
        <Text style={styles.statText}>RMS: {rms.toFixed(3)}</Text>
        <Text style={styles.statText}>Peak: {peak.toFixed(3)}</Text>
      </View>

      {/* Frequency Spectrum */}
      {renderBars()}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity style={[styles.button, styles.startBtn]} onPress={startAnalysis}>
            <Text style={styles.btnText}>START</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.stopBtn]} onPress={stopAnalysis}>
            <Text style={styles.btnText}>STOP</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  meterContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  rmsCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00ffaa',
    position: 'absolute',
  },
  statText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 100,
  },
  spectrumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 200,
    width: '100%',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 30,
  },
  bar: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginHorizontal: 1,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#00ffaa',
    shadowColor: '#00ffaa',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  stopBtn: {
    backgroundColor: '#ff4444',
  },
  btnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
```

## Best Practices

1. **Cleanup**: Always call `stop()` and remove listeners when your component unmounts to prevent battery drain.
2. **Performance**: Only request `emitFft: true` if you need the spectrum. RMS/Peak only is much cheaper.
3. **Visualization**: Use `downsampleBins` (e.g., 32 or 64) if you are rendering a bar chart to minimize bridging overhead.
4. **Smoothing**: Use `setSmoothing(true, 0.3)` to make visuals less jittery.
