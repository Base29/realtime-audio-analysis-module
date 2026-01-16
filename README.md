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
  - **iOS**: built on `AVAudioEngine` + Apple **Accelerate Framework** (vDSP) with **Pure Swift Bridge**.
- **Efficient Bridge**: Tunable data emission rates (e.g., 30/60 FPS) and native downsampling to minimize bridge traffic.
- **Pure Swift iOS Implementation**: No Objective-C bridge files required - modern Swift-only React Native integration.

## 📦 Installation

```bash
npm install react-native-realtime-audio-analysis
```

**iOS**:
```bash
cd ios && pod install
```

**Testing Integration**:
```bash
# After installation, run from your React Native project root:
node node_modules/react-native-realtime-audio-analysis/test-module-linking.js
```

**Quick Test**:
```typescript
// Add to your App.tsx for testing
import TestScreen from 'react-native-realtime-audio-analysis/testing/TestScreen';
export default function App() { return <TestScreen />; }
```

**Permissions**:
Requires microphone access. See [Integration Guide](INTEGRATION_GUIDE.md) for complete setup instructions.

## 📱 Rich Audio Demo Component

**[🚀 Complete Demo Documentation](docs/demo/README.md)** - Ready-to-use React Native component with enhanced visuals

The Rich Audio Demo is a comprehensive, production-ready component featuring:
- **Real-time dB Value Display** with professional audio level indicators
- **Enhanced Spectrum Visualizer** with frequency labels and dB scale markers  
- **Session Statistics** tracking min/max/average values over time
- **Cross-platform Permission Handling** with user-friendly prompts
- **Performance Optimized** rendering with configurable quality settings

### Quick Demo Setup

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

**📚 Demo Documentation:**
- **[Quick Start Guide](docs/demo/QUICK_START.md)** - Get running in minutes
- **[Enhanced Features](docs/demo/ENHANCED_FEATURES.md)** - New dB display and visual improvements
- **[Customization Examples](docs/demo/CUSTOMIZATION_EXAMPLES.md)** - Themes and layouts
- **[Performance Guide](docs/demo/PERFORMANCE_GUIDE.md)** - Optimization strategies

## 📖 Documentation

**[📚 Complete Documentation Index](docs/README.md)** - Browse all available documentation

### Getting Started
- **[Integration Guide](INTEGRATION_GUIDE.md)**: Complete setup, testing, and troubleshooting guide
- **[Quick Start Guide](docs/QUICK_START.md)**: Get up and running in minutes with simple examples
- **[Usage Guide](docs/USAGE.md)**: Complete guide for using the module with Android and iOS
- **[API Reference](docs/API_REFERENCE.md)**: Full API documentation with examples and type definitions
- **[Manual Linking Guide](docs/MANUAL_LINKING.md)**: Step-by-step manual linking instructions for both platforms

### Demo Component
- **[📱 Rich Audio Demo Documentation](docs/demo/README.md)**: Complete guide for the enhanced demo component with visual improvements
- **[Quick Start](docs/demo/QUICK_START.md)**: Get the demo running in minutes
- **[Enhanced Features](docs/demo/ENHANCED_FEATURES.md)**: New dB value display and visual enhancements
- **[Customization Examples](docs/demo/CUSTOMIZATION_EXAMPLES.md)**: Copy-paste examples for different themes and layouts
- **[Performance Guide](docs/demo/PERFORMANCE_GUIDE.md)**: Optimization strategies and best practices

### CLI Tools & Automation
- **[Autolinking Guide](docs/AUTOLINKING.md)**: React Native autolinking compatibility and troubleshooting
- **[CLI Usage Guide](docs/CLI_USAGE.md)**: Automated linking and diagnostic tools
- **[Verification Guide](docs/VERIFICATION.md)**: Testing and verifying your module setup

### Installation & Setup
- **[Local Installation Guide](docs/LOCAL_INSTALL.md)**: Installing and using this module as a local package
- **[Path Configuration](docs/PATH_CONFIGURATION.md)**: Configuring correct paths for manual linking
- **[Pure Swift Bridge Implementation](docs/SWIFT_BRIDGE_IMPLEMENTATION.md)**: iOS pure Swift implementation details and migration guide

### Examples & Troubleshooting
- **[Audio Visualizer Example](examples/AudioVisualizer.tsx)**: Complete React Native spectrum analyzer component
- **[Quick Fix Guide](docs/QUICK_FIX.md)**: Quick steps to fix common module linking issues
- **[Linking Fix Summary](docs/LINKING_FIX_SUMMARY.md)**: Summary of linking fixes and changes

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
