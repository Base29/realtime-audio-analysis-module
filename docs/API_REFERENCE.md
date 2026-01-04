# API Reference

Complete API reference for the react-native-realtime-audio-analysis module.

## Table of Contents

- [Module Import](#module-import)
- [Methods](#methods)
- [Events](#events)
- [Types](#types)
- [Constants](#constants)
- [Error Codes](#error-codes)

## Module Import

```javascript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';
```

## Methods

### `startAnalysis(config?: AnalysisConfig): Promise<void>`

Starts real-time audio analysis with optional configuration.

**Parameters:**
- `config` (optional): Configuration object for audio analysis

**Returns:** Promise that resolves when analysis starts successfully

**Example:**
```javascript
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 1024,
  sampleRate: 44100,
  windowFunction: 'hanning',
  smoothing: 0.8
});
```

**Throws:**
- `PERMISSION_DENIED`: Microphone permission not granted
- `AUDIO_SESSION_ERROR`: Failed to configure audio session
- `ALREADY_ANALYZING`: Analysis is already running

---

### `stopAnalysis(): Promise<void>`

Stops audio analysis and releases all audio resources.

**Returns:** Promise that resolves when analysis stops successfully

**Example:**
```javascript
await RealtimeAudioAnalyzer.stopAnalysis();
```

**Throws:**
- `NOT_ANALYZING`: Analysis is not currently running
- `STOP_FAILED`: Failed to stop analysis properly

---

### `isAnalyzing(): Promise<boolean>`

Checks if audio analysis is currently active.

**Returns:** Promise that resolves to boolean indicating analysis state

**Example:**
```javascript
const analyzing = await RealtimeAudioAnalyzer.isAnalyzing();
console.log('Currently analyzing:', analyzing);
```

---

### `getAnalysisConfig(): Promise<AnalysisConfig>`

Returns the current analysis configuration.

**Returns:** Promise that resolves to the current configuration object

**Example:**
```javascript
const config = await RealtimeAudioAnalyzer.getAnalysisConfig();
console.log('FFT Size:', config.fftSize);
```

---

### `setAnalysisConfig(config: Partial<AnalysisConfig>): Promise<void>`

Updates the analysis configuration. Analysis must be stopped before changing configuration.

**Parameters:**
- `config`: Partial configuration object with properties to update

**Returns:** Promise that resolves when configuration is updated

**Example:**
```javascript
await RealtimeAudioAnalyzer.setAnalysisConfig({
  fftSize: 2048,
  smoothing: 0.9
});
```

**Throws:**
- `ANALYSIS_RUNNING`: Cannot change config while analysis is running
- `INVALID_CONFIG`: Invalid configuration values

---

### `getAvailableSampleRates(): Promise<number[]>`

Returns array of supported sample rates for the current device.

**Returns:** Promise that resolves to array of supported sample rates

**Example:**
```javascript
const rates = await RealtimeAudioAnalyzer.getAvailableSampleRates();
console.log('Supported rates:', rates); // [8000, 16000, 44100, 48000]
```

---

### `configureAudioSession(config: AudioSessionConfig): Promise<void>` (iOS only)

Configures the iOS audio session with custom settings.

**Parameters:**
- `config`: Audio session configuration object

**Returns:** Promise that resolves when session is configured

**Example:**
```javascript
await RealtimeAudioAnalyzer.configureAudioSession({
  category: 'record',
  mode: 'measurement',
  options: ['allowBluetooth', 'defaultToSpeaker']
});
```

---

### `requestPermissions(): Promise<boolean>`

Requests microphone permissions (Android only - iOS uses Info.plist).

**Returns:** Promise that resolves to boolean indicating if permission was granted

**Example:**
```javascript
const granted = await RealtimeAudioAnalyzer.requestPermissions();
if (!granted) {
  console.log('Microphone permission denied');
}
```

## Events

### `AudioAnalysisData`

Emitted continuously during analysis with real-time audio data.

**Event Data:**
```typescript
interface AudioAnalysisEvent {
  frequencyData: number[];  // Frequency spectrum (0-1 normalized)
  timeData: number[];       // Time domain data (-1 to 1)
  volume: number;           // RMS volume level (0-1)
  peak: number;             // Peak volume level (0-1)
  timestamp: number;        // Event timestamp (milliseconds)
  sampleRate: number;       // Current sample rate
  fftSize: number;          // Current FFT size
}
```

**Usage:**
```javascript
import { NativeEventEmitter } from 'react-native';

const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);

const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
  console.log('Frequency bins:', data.frequencyData.length);
  console.log('Current volume:', data.volume);
  console.log('Peak level:', data.peak);
});

// Remove listener when done
subscription.remove();
```

---

### `AudioAnalysisError`

Emitted when an error occurs during analysis.

**Event Data:**
```typescript
interface AudioAnalysisError {
  code: string;           // Error code (see Error Codes section)
  message: string;        // Human-readable error description
  timestamp: number;      // Error timestamp
  recoverable: boolean;   // Whether analysis can continue
}
```

**Usage:**
```javascript
eventEmitter.addListener('AudioAnalysisError', (error) => {
  console.error('Analysis error:', error.code, error.message);
  
  if (!error.recoverable) {
    // Stop analysis and handle critical error
    RealtimeAudioAnalyzer.stopAnalysis();
  }
});
```

---

### `AudioSessionInterruption` (iOS only)

Emitted when the audio session is interrupted (phone calls, other apps, etc.).

**Event Data:**
```typescript
interface AudioSessionInterruption {
  type: 'began' | 'ended';
  reason?: string;
  timestamp: number;
}
```

**Usage:**
```javascript
eventEmitter.addListener('AudioSessionInterruption', (interruption) => {
  if (interruption.type === 'began') {
    console.log('Audio session interrupted:', interruption.reason);
  } else {
    console.log('Audio session resumed');
    // Optionally restart analysis
  }
});
```

## Types

### `AnalysisConfig`

Configuration object for audio analysis.

```typescript
interface AnalysisConfig {
  fftSize?: number;           // FFT size: 512, 1024, 2048, 4096 (default: 1024)
  sampleRate?: number;        // Sample rate in Hz (default: 44100)
  windowFunction?: WindowFunction; // Window function type (default: 'hanning')
  smoothing?: number;         // Smoothing factor 0.0-1.0 (default: 0.8)
  bufferSize?: number;        // Audio buffer size (default: auto)
  enableTimeData?: boolean;   // Include time domain data (default: true)
  enableVolumeData?: boolean; // Include volume calculations (default: true)
}
```

### `WindowFunction`

Available window functions for FFT analysis.

```typescript
type WindowFunction = 
  | 'hanning'     // Hann window (default, good general purpose)
  | 'hamming'     // Hamming window (similar to Hann)
  | 'blackman'    // Blackman window (better frequency resolution)
  | 'rectangular' // Rectangular window (no windowing)
  | 'kaiser';     // Kaiser window (adjustable parameters)
```

### `AudioSessionConfig` (iOS only)

iOS audio session configuration.

```typescript
interface AudioSessionConfig {
  category: AudioSessionCategory;
  mode?: AudioSessionMode;
  options?: AudioSessionOption[];
}

type AudioSessionCategory = 
  | 'ambient'
  | 'soloAmbient'
  | 'playback'
  | 'record'
  | 'playAndRecord'
  | 'multiRoute';

type AudioSessionMode =
  | 'default'
  | 'voiceChat'
  | 'gameChat'
  | 'videoRecording'
  | 'measurement'
  | 'moviePlayback'
  | 'videoChat';

type AudioSessionOption =
  | 'mixWithOthers'
  | 'duckOthers'
  | 'allowBluetooth'
  | 'defaultToSpeaker'
  | 'interruptSpokenAudioAndMixWithOthers'
  | 'allowBluetoothA2DP'
  | 'allowAirPlay';
```

## Constants

### FFT Sizes

```javascript
RealtimeAudioAnalyzer.FFT_SIZE_512 = 512;
RealtimeAudioAnalyzer.FFT_SIZE_1024 = 1024;
RealtimeAudioAnalyzer.FFT_SIZE_2048 = 2048;
RealtimeAudioAnalyzer.FFT_SIZE_4096 = 4096;
```

### Sample Rates

```javascript
RealtimeAudioAnalyzer.SAMPLE_RATE_8000 = 8000;
RealtimeAudioAnalyzer.SAMPLE_RATE_16000 = 16000;
RealtimeAudioAnalyzer.SAMPLE_RATE_22050 = 22050;
RealtimeAudioAnalyzer.SAMPLE_RATE_44100 = 44100;
RealtimeAudioAnalyzer.SAMPLE_RATE_48000 = 48000;
```

### Window Functions

```javascript
RealtimeAudioAnalyzer.WINDOW_HANNING = 'hanning';
RealtimeAudioAnalyzer.WINDOW_HAMMING = 'hamming';
RealtimeAudioAnalyzer.WINDOW_BLACKMAN = 'blackman';
RealtimeAudioAnalyzer.WINDOW_RECTANGULAR = 'rectangular';
RealtimeAudioAnalyzer.WINDOW_KAISER = 'kaiser';
```

## Error Codes

### Permission Errors
- `PERMISSION_DENIED`: Microphone permission not granted
- `PERMISSION_RESTRICTED`: Microphone access restricted by system

### Configuration Errors
- `INVALID_CONFIG`: Invalid configuration parameters
- `UNSUPPORTED_SAMPLE_RATE`: Sample rate not supported by device
- `UNSUPPORTED_FFT_SIZE`: FFT size not supported

### Runtime Errors
- `AUDIO_SESSION_ERROR`: Failed to configure audio session
- `MICROPHONE_UNAVAILABLE`: Microphone is being used by another app
- `HARDWARE_ERROR`: Audio hardware error
- `BUFFER_OVERFLOW`: Audio buffer overflow (reduce buffer size)
- `ANALYSIS_FAILED`: General analysis failure

### State Errors
- `ALREADY_ANALYZING`: Analysis is already running
- `NOT_ANALYZING`: Analysis is not currently running
- `STOP_FAILED`: Failed to stop analysis properly

### System Errors
- `MEMORY_ERROR`: Insufficient memory for analysis
- `THREAD_ERROR`: Audio processing thread error
- `NATIVE_ERROR`: Native module error

## Usage Examples

### Basic Frequency Analysis

```javascript
import { NativeEventEmitter } from 'react-native';

const startFrequencyAnalysis = async () => {
  try {
    await RealtimeAudioAnalyzer.startAnalysis({
      fftSize: 1024,
      sampleRate: 44100,
      windowFunction: 'hanning'
    });

    const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
    
    const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
      // Get frequency data (0 Hz to Nyquist frequency)
      const frequencies = data.frequencyData;
      
      // Calculate frequency resolution
      const resolution = data.sampleRate / (2 * data.fftSize);
      
      // Find dominant frequency
      let maxIndex = 0;
      let maxValue = 0;
      
      for (let i = 0; i < frequencies.length; i++) {
        if (frequencies[i] > maxValue) {
          maxValue = frequencies[i];
          maxIndex = i;
        }
      }
      
      const dominantFreq = maxIndex * resolution;
      console.log(`Dominant frequency: ${dominantFreq.toFixed(1)} Hz`);
    });

    return subscription;
  } catch (error) {
    console.error('Failed to start analysis:', error);
  }
};
```

### Volume Monitoring with Thresholds

```javascript
const monitorVolume = async () => {
  await RealtimeAudioAnalyzer.startAnalysis({
    fftSize: 512,  // Smaller FFT for faster updates
    enableTimeData: false,  // Don't need time data
    enableVolumeData: true
  });

  const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
  
  eventEmitter.addListener('AudioAnalysisData', (data) => {
    const { volume, peak } = data;
    
    // Volume thresholds
    if (volume > 0.8) {
      console.log('LOUD!');
    } else if (volume > 0.5) {
      console.log('Moderate');
    } else if (volume > 0.1) {
      console.log('Quiet');
    } else {
      console.log('Silent');
    }
    
    // Peak detection
    if (peak > 0.95) {
      console.warn('Audio clipping detected!');
    }
  });
};
```

### Error Handling

```javascript
const robustAnalysis = async () => {
  const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
  
  // Handle errors
  eventEmitter.addListener('AudioAnalysisError', async (error) => {
    console.error('Analysis error:', error);
    
    switch (error.code) {
      case 'MICROPHONE_UNAVAILABLE':
        console.log('Microphone busy, retrying in 5 seconds...');
        setTimeout(() => {
          RealtimeAudioAnalyzer.startAnalysis();
        }, 5000);
        break;
        
      case 'BUFFER_OVERFLOW':
        console.log('Buffer overflow, reducing buffer size...');
        await RealtimeAudioAnalyzer.setAnalysisConfig({
          bufferSize: 512
        });
        await RealtimeAudioAnalyzer.startAnalysis();
        break;
        
      default:
        if (!error.recoverable) {
          console.log('Critical error, stopping analysis');
          await RealtimeAudioAnalyzer.stopAnalysis();
        }
    }
  });
  
  try {
    await RealtimeAudioAnalyzer.startAnalysis();
  } catch (error) {
    console.error('Failed to start:', error);
  }
};
```