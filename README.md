# React Native Real-Time Audio Analysis

A production-grade, native audio analysis engine for React Native (iOS & Android). 
Designed for performance-critical applications requiring real-time visualization, metering, or audio-reactive UI.

## 🚀 Features

- **Real-Time Analysis**: Captures audio and computes DSP metrics on the fly.
- **Micro-Latency**: DSP runs on high-priority native threads (AudioThread/GC-free).
- **Core Metrics**:
  - **RMS** (Root Mean Square) for volume/loudness.
  - **Peak** amplitude for clipping detection.
  - **FFT** (Fast Fourier Transform) magnitude spectrum for frequency visualization.
- **Cross-Platform Native Engines**:
  - **Android**: built on `AudioRecord` + NDK (C++) using **KissFFT**.
  - **iOS**: built on `AVAudioEngine` + Apple **Accelerate Framework** (vDSP).
- **Efficient Bridge**: Tunable data emission rates (e.g., 30/60 FPS) and native downsampling to minimize bridge traffic.

## 📦 Installation

```bash
npm install react-native-realtime-audio-analysis
```

**iOS**:
```bash
cd ios && pod install
```

**Permissions**:
Requires microphone access. See [Usage Guide](docs/Usage-Guide.md#2-permissions-critical) for details.

## 📖 Documentation

### Getting Started
- **[Usage Guide](docs/Usage-Guide.md)**: Full API reference, permission handling, and configuration details.
- **[Local Installation Guide](docs/LOCAL_INSTALL.md)**: Step-by-step guide for installing and using this module as a local package.
- **[Example Visualizer](examples/AudioVisualizer.tsx)**: A complete, copy-pasteable React Native component for a Spectrum Analyzer and Volume Meter.

### Troubleshooting & Linking
- **[Quick Fix Guide](docs/QUICK_FIX.md)**: Quick steps to fix module linking issues (most common problem).
- **[Linking Fix Summary](docs/LINKING_FIX_SUMMARY.md)**: Complete summary of linking fixes and what was changed.
- **[Verify Linking](docs/VERIFY_LINKING.md)**: Detailed step-by-step guide to verify and troubleshoot module linking.
- **[Path Configuration](docs/PATH_CONFIGURATION.md)**: Guide for configuring correct paths when linking manually (especially for local packages).

## ⚡ Quick Start

```typescript
import { RealtimeAudioAnalyzer } from 'react-native-realtime-audio-analysis';

// 1. Listen for data
const subscription = RealtimeAudioAnalyzer.addListener((data) => {
  console.log(`Volume: ${data.rms}, Freq Bins: ${data.fft.length}`);
});

// 2. Start Engine
await RealtimeAudioAnalyzer.start({
  bufferSize: 1024,
  emitFft: true,
  callbackRateHz: 30
});

// ... later
await RealtimeAudioAnalyzer.stop();
subscription.remove();
```

## 🛠 Tech Stack

- **Javascript/TypeScript**: React Native Bridge interface.
- **Kotlin**: Android AudioEngine orchestration.
- **C++ (NDK)**: Android DSP and FFT computation.
- **Swift**: iOS AudioEngine and Bridge.
- **Objective-C**: iOS Macro exports.

## License

MIT
