# Complete API Reference - React Native Realtime Audio Analysis

This document provides a comprehensive list of all methods, components, hooks, and utilities exposed by the `react-native-realtime-audio-analysis` module.

## Quick Reference List

### Core Methods (RealtimeAudioAnalyzer)
```
startAnalysis(config?)
stopAnalysis()
isAnalyzing()
getAnalysisConfig()
setSmoothing(enabled, factor)
setFftConfig(fftSize, downsampleBins)
start(config?)
stop()
isRunning()
onData(listener)
addListener(callback)
addListener(eventName, callback)
removeListeners(eventName?)
removeSubscription(subscription)
```

### Components
```
RichAudioDemo
SpectrumVisualizer
LevelMeter
```

### Hooks
```
useRealtimeAudioLevels()
```

### Utility Classes
```
AudioPermissionManager
  - checkPermission()
  - requestPermission()
  - openSettings()
  - getPermissionRationale()
  - isPermissionBlocked()
  - getManualPermissionInstructions()

RingBuffer<T>
  - constructor(size, defaultValue)
  - push(value)
  - getLatest(count)
  - size()
  - clear()
```

### Hook Properties (useRealtimeAudioLevels)
```
permissionStatus
requestPermission
isAnalyzing
rms
peak
rmsSmoothed
peakSmoothed
frequencyData
sampleRate
fftSize
smoothingEnabled
smoothingFactor
startAnalysis
stopAnalysis
setSmoothing
setFftConfig
error
clearError
retryLastOperation
```

## Table of Contents

1. [Core Audio Analysis API](#core-audio-analysis-api)
2. [Demo Components](#demo-components)
3. [React Hooks](#react-hooks)
4. [Utility Classes](#utility-classes)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [Event System](#event-system)
7. [Error Handling](#error-handling)

---

## Core Audio Analysis API

### Main Module: `RealtimeAudioAnalyzer`

The primary interface for audio analysis functionality.

#### Methods

##### `startAnalysis(config?: AnalysisConfig): Promise<void>`
Starts real-time audio analysis with optional configuration.

**Parameters:**
- `config` (optional): Configuration object for audio analysis

**Example:**
```typescript
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 1024,
  sampleRate: 44100,
  windowFunction: 'hanning',
  smoothing: 0.8
});
```

##### `stopAnalysis(): Promise<void>`
Stops audio analysis and releases all audio resources.

**Example:**
```typescript
await RealtimeAudioAnalyzer.stopAnalysis();
```

##### `isAnalyzing(): Promise<boolean>`
Checks if audio analysis is currently active.

**Example:**
```typescript
const analyzing = await RealtimeAudioAnalyzer.isAnalyzing();
```

##### `getAnalysisConfig(): Promise<AnalysisConfig>`
Returns the current analysis configuration.

**Example:**
```typescript
const config = await RealtimeAudioAnalyzer.getAnalysisConfig();
```

##### `setSmoothing(enabled: boolean, factor: number): Promise<void>`
Configures audio data smoothing.

**Parameters:**
- `enabled`: Whether to enable smoothing
- `factor`: Smoothing factor (0.0-1.0)

**Example:**
```typescript
await RealtimeAudioAnalyzer.setSmoothing(true, 0.8);
```

##### `setFftConfig(fftSize: number, downsampleBins: number): Promise<void>`
Configures FFT analysis parameters.

**Parameters:**
- `fftSize`: FFT size (512, 1024, 2048, 4096)
- `downsampleBins`: Number of bins to downsample to

**Example:**
```typescript
await RealtimeAudioAnalyzer.setFftConfig(2048, 64);
```

#### Backward-Compatible Aliases

##### `start(config?: AnalysisConfig): Promise<void>`
Alias for `startAnalysis()`.

##### `stop(): Promise<void>`
Alias for `stopAnalysis()`.

##### `isRunning(): Promise<boolean>`
Alias for `isAnalyzing()`.

#### Event Subscription Methods

##### `onData(listener: (event: AudioAnalysisEvent) => void): Subscription`
Subscribe to audio data events (recommended method).

**Example:**
```typescript
const subscription = RealtimeAudioAnalyzer.onData((data) => {
  console.log('RMS:', data.volume, 'Peak:', data.peak);
});

// Later: subscription.remove();
```

##### `addListener(callback: (event: AudioAnalysisEvent) => void): Subscription`
##### `addListener(eventName: string, callback: (event: AudioAnalysisEvent) => void): Subscription`
Flexible event listener registration (backward compatible).

**Example:**
```typescript
// Style A: Default event
const sub1 = RealtimeAudioAnalyzer.addListener((data) => {
  console.log('Audio data:', data);
});

// Style B: Custom event name
const sub2 = RealtimeAudioAnalyzer.addListener('AudioAnalysisData', (data) => {
  console.log('Audio data:', data);
});
```

##### `removeListeners(eventName?: string): void`
Remove event listeners.

**Example:**
```typescript
RealtimeAudioAnalyzer.removeListeners(); // Remove all
RealtimeAudioAnalyzer.removeListeners('AudioAnalysisData'); // Remove specific
```

##### `removeSubscription(subscription: Subscription): void`
Remove a specific subscription.

**Example:**
```typescript
const sub = RealtimeAudioAnalyzer.onData(callback);
RealtimeAudioAnalyzer.removeSubscription(sub);
```

---

## Demo Components

### `RichAudioDemo`

A comprehensive, production-ready audio visualization component.

#### Props Interface: `RichAudioDemoProps`

```typescript
interface RichAudioDemoProps {
  autoStart?: boolean;        // Auto-start analysis on mount (default: false)
  showDebug?: boolean;        // Show debug panel (default: false)
  barCount?: number;          // Number of spectrum bars (default: 32)
  onError?: (error: Error) => void; // Error callback
}
```

#### Usage Example

```typescript
import { RichAudioDemo } from 'react-native-realtime-audio-analysis';

<RichAudioDemo
  autoStart={true}
  showDebug={false}
  barCount={32}
  onError={(error) => console.error('Audio error:', error)}
/>
```

### `SpectrumVisualizer`

Frequency spectrum visualization component.

#### Props Interface: `SpectrumVisualizerProps`

```typescript
interface SpectrumVisualizerProps {
  frequencyData: number[];    // FFT magnitude data (0.0-1.0)
  barCount: number;           // Number of bars to display
  isAnalyzing: boolean;       // Whether analysis is active
}
```

#### Usage Example

```typescript
import { SpectrumVisualizer } from 'react-native-realtime-audio-analysis';

<SpectrumVisualizer 
  frequencyData={frequencyData}
  barCount={32}
  isAnalyzing={isAnalyzing}
/>
```

### `LevelMeter`

Audio level meter component with RMS and peak indicators.

#### Props Interface: `LevelMeterProps`

```typescript
interface LevelMeterProps {
  rms: number;                // RMS level (0.0-1.0)
  peak: number;               // Peak level (0.0-1.0)
  rmsSmoothed: number;        // Smoothed RMS level (0.0-1.0)
  peakSmoothed: number;       // Smoothed peak level (0.0-1.0)
  isAnalyzing: boolean;       // Whether analysis is active
}
```

#### Usage Example

```typescript
import { LevelMeter } from 'react-native-realtime-audio-analysis';

<LevelMeter 
  rms={rms}
  peak={peak}
  rmsSmoothed={rmsSmoothed}
  peakSmoothed={peakSmoothed}
  isAnalyzing={isAnalyzing}
/>
```

---

## React Hooks

### `useRealtimeAudioLevels()`

A comprehensive React hook for managing audio analysis lifecycle and data.

#### Return Interface: `AudioLevelsHook`

```typescript
interface AudioLevelsHook {
  // Permission state
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'blocked';
  requestPermission: () => Promise<boolean>;
  
  // Audio data
  isAnalyzing: boolean;
  rms: number;                // Current RMS level (0.0-1.0)
  peak: number;               // Current peak level (0.0-1.0)
  rmsSmoothed: number;        // Smoothed RMS level (0.0-1.0)
  peakSmoothed: number;       // Smoothed peak level (0.0-1.0)
  frequencyData: number[];    // FFT magnitude spectrum (0.0-1.0)
  
  // Configuration
  sampleRate: number;         // Current sample rate (Hz)
  fftSize: number;            // Current FFT size
  smoothingEnabled: boolean;  // Whether smoothing is enabled
  smoothingFactor: number;    // Current smoothing factor (0.0-1.0)
  
  // Controls
  startAnalysis: (config?: AnalysisConfig) => Promise<void>;
  stopAnalysis: () => Promise<void>;
  setSmoothing: (enabled: boolean, factor: number) => Promise<void>;
  setFftConfig: (fftSize: number, downsampleBins: number) => Promise<void>;
  
  // Error handling
  error: string | null;       // Current error message
  clearError: () => void;     // Clear current error
  retryLastOperation: () => Promise<void>; // Retry last failed operation
}
```

#### Usage Example

```typescript
import { useRealtimeAudioLevels } from 'react-native-realtime-audio-analysis';

const MyComponent = () => {
  const {
    isAnalyzing,
    rms,
    peak,
    frequencyData,
    startAnalysis,
    stopAnalysis,
    permissionStatus,
    error
  } = useRealtimeAudioLevels();

  const handleToggle = async () => {
    if (isAnalyzing) {
      await stopAnalysis();
    } else {
      await startAnalysis({ fftSize: 1024 });
    }
  };

  return (
    <View>
      <Text>Permission: {permissionStatus}</Text>
      <Text>RMS: {rms.toFixed(3)}</Text>
      <Text>Peak: {peak.toFixed(3)}</Text>
      <Button 
        title={isAnalyzing ? 'Stop' : 'Start'} 
        onPress={handleToggle} 
      />
      {error && <Text style={{color: 'red'}}>{error}</Text>}
    </View>
  );
};
```

---

## Utility Classes

### `AudioPermissionManager`

Cross-platform permission management utility.

#### Methods

##### `checkPermission(): Promise<PermissionStatus>`
Check current microphone permission status.

**Returns:** `'granted' | 'denied' | 'undetermined' | 'blocked'`

##### `requestPermission(): Promise<boolean>`
Request microphone permission from user.

**Returns:** `true` if granted, `false` if denied

##### `openSettings(): void`
Open device settings for manual permission configuration.

##### `getPermissionRationale(): string`
Get platform-specific permission explanation text.

##### `isPermissionBlocked(): Promise<boolean>`
Check if permission is permanently blocked (Android only).

##### `getManualPermissionInstructions(): string`
Get step-by-step instructions for manual permission setup.

#### Usage Example

```typescript
import { AudioPermissionManager } from 'react-native-realtime-audio-analysis';

const permissionManager = new AudioPermissionManager();

const checkPermissions = async () => {
  const status = await permissionManager.checkPermission();
  
  if (status !== 'granted') {
    const granted = await permissionManager.requestPermission();
    
    if (!granted) {
      console.log(permissionManager.getPermissionRationale());
      permissionManager.openSettings();
    }
  }
};
```

### `RingBuffer<T>`

Fixed-size circular buffer for memory-efficient data storage.

#### Methods

##### `constructor(size: number, defaultValue: T)`
Create a new ring buffer with specified size and default value.

##### `push(value: T): void`
Add a new value to the buffer (overwrites oldest if full).

##### `getLatest(count: number): T[]`
Get the most recent N values from the buffer.

##### `size(): number`
Get current number of items in buffer.

##### `clear(): void`
Clear all items from buffer.

#### Usage Example

```typescript
import { RingBuffer } from 'react-native-realtime-audio-analysis';

// Create buffer for storing last 100 RMS values
const rmsHistory = new RingBuffer<number>(100, 0);

// Add new values
rmsHistory.push(0.5);
rmsHistory.push(0.7);

// Get last 10 values
const recent = rmsHistory.getLatest(10);
console.log('Recent RMS values:', recent);
```

---

## TypeScript Interfaces

### Core Configuration Types

#### `AnalysisConfig`

```typescript
interface AnalysisConfig {
  fftSize?: number;                    // FFT size: 512, 1024, 2048, 4096
  sampleRate?: number;                 // Sample rate: 44100, 48000, etc.
  windowFunction?: WindowFunction;     // Window function type
  smoothing?: number;                  // Smoothing factor (0.0-1.0)
}
```

#### `WindowFunction`

```typescript
type WindowFunction = 'hanning' | 'hamming' | 'blackman' | 'rectangular';
```

#### `PermissionStatus`

```typescript
type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';
```

### Event Data Types

#### `AudioAnalysisEvent`

```typescript
interface AudioAnalysisEvent {
  frequencyData: number[];    // FFT magnitude spectrum (0.0-1.0)
  timeData: number[];        // Time domain samples
  volume: number;            // RMS volume level (0.0-1.0)
  peak: number;             // Peak amplitude (0.0-1.0)
  timestamp: number;        // Event timestamp (milliseconds)
  rms?: number;             // Alternative RMS field (backward compatibility)
  fft?: number[];           // Alternative FFT field (backward compatibility)
}
```

### Component Prop Types

All component prop interfaces are exported for TypeScript users:

- `RichAudioDemoProps`
- `SpectrumVisualizerProps`
- `LevelMeterProps`
- `PermissionPromptProps`
- `ControlPanelProps`
- `DebugPanelProps`

### Utility Interfaces

#### `RingBufferInterface<T>`

```typescript
interface RingBufferInterface<T> {
  push(value: T): void;
  getLatest(count: number): T[];
  size(): number;
  clear(): void;
}
```

#### `PermissionManager`

```typescript
interface PermissionManager {
  checkPermission(): Promise<PermissionStatus>;
  requestPermission(): Promise<boolean>;
  openSettings(): void;
  getPermissionRationale(): string;
  isPermissionBlocked(): Promise<boolean>;
  getManualPermissionInstructions(): string;
}
```

---

## Event System

### Event Names

- `'RealtimeAudioAnalyzer:onData'` - Primary audio data event (recommended)
- `'AudioAnalysisData'` - Backward compatibility event name

### Event Subscription Patterns

#### Recommended Pattern (Modern)

```typescript
const subscription = RealtimeAudioAnalyzer.onData((data) => {
  // Handle audio data
});

// Cleanup
subscription.remove();
```

#### Legacy Pattern (Backward Compatible)

```typescript
import { NativeEventEmitter } from 'react-native';

const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
const subscription = eventEmitter.addListener('AudioAnalysisData', (data) => {
  // Handle audio data
});

// Cleanup
subscription.remove();
```

#### Hook Pattern (React)

```typescript
const { frequencyData, rms, peak } = useRealtimeAudioLevels();
// Data automatically managed by hook
```

---

## Error Handling

### Error Types

The module can throw various types of errors:

#### Permission Errors
- `'Microphone permission required'`
- `'Permission denied'`
- `'Permission blocked'`

#### Configuration Errors
- `'Invalid FFT size'`
- `'Invalid sample rate'`
- `'Invalid configuration'`

#### Runtime Errors
- `'Failed to start analysis'`
- `'Failed to stop analysis'`
- `'Analysis already running'`
- `'Analysis not running'`

#### Native Module Errors
- `'Native module not found'`
- `'Native module not linked'`
- `'Audio session error'`

### Error Handling Patterns

#### Try-Catch Pattern

```typescript
try {
  await RealtimeAudioAnalyzer.startAnalysis();
} catch (error) {
  console.error('Analysis failed:', error.message);
  
  if (error.message.includes('permission')) {
    // Handle permission error
  } else if (error.message.includes('module')) {
    // Handle linking error
  }
}
```

#### Hook Error Handling

```typescript
const { error, clearError, retryLastOperation } = useRealtimeAudioLevels();

useEffect(() => {
  if (error) {
    console.error('Audio error:', error);
    
    // Auto-retry after 3 seconds
    setTimeout(async () => {
      clearError();
      await retryLastOperation();
    }, 3000);
  }
}, [error]);
```

#### Component Error Handling

```typescript
<RichAudioDemo
  onError={(error) => {
    console.error('Demo error:', error);
    
    // Show user-friendly error message
    Alert.alert('Audio Error', error.message);
  }}
/>
```

---

## Complete Import Reference

### Default Import (Core Module)

```typescript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';
```

### Named Imports (Components & Utilities)

```typescript
import {
  // Components
  RichAudioDemo,
  SpectrumVisualizer,
  LevelMeter,
  
  // Hooks
  useRealtimeAudioLevels,
  
  // Utilities
  AudioPermissionManager,
  RingBuffer,
  
  // Types
  type RichAudioDemoProps,
  type SpectrumVisualizerProps,
  type LevelMeterProps,
  type AudioLevelsHook,
  type AnalysisConfig,
  type PermissionStatus,
  type AudioAnalysisEvent
} from 'react-native-realtime-audio-analysis';
```

### Mixed Import Pattern

```typescript
import RealtimeAudioAnalyzer, {
  RichAudioDemo,
  useRealtimeAudioLevels,
  type AnalysisConfig
} from 'react-native-realtime-audio-analysis';
```

---

## Summary

The `react-native-realtime-audio-analysis` module provides:

- **1 Core Module** (`RealtimeAudioAnalyzer`) with 12+ methods
- **3 React Components** (`RichAudioDemo`, `SpectrumVisualizer`, `LevelMeter`)
- **1 React Hook** (`useRealtimeAudioLevels`) with comprehensive audio management
- **2 Utility Classes** (`AudioPermissionManager`, `RingBuffer`)
- **10+ TypeScript Interfaces** for type safety
- **Comprehensive Event System** with multiple subscription patterns
- **Cross-platform Permission Handling** for iOS and Android
- **Memory-efficient Data Management** with ring buffers
- **Professional Audio Features** including dB conversion, smoothing, and statistics

All APIs are designed for production use with comprehensive error handling, TypeScript support, and backward compatibility.