# Documentation Index

Complete documentation for the react-native-realtime-audio-analysis module.

## 📚 Documentation Overview

### 🚀 Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in minutes
- **[Usage Guide](USAGE.md)** - Complete usage guide for Android and iOS
- **[API Reference](API_REFERENCE.md)** - Full API documentation with examples

### 🔧 Installation & Setup
- **[Autolinking Guide](AUTOLINKING.md)** - React Native autolinking compatibility and troubleshooting
- **[Manual Linking Guide](MANUAL_LINKING.md)** - Step-by-step manual linking for both platforms
- **[Local Installation Guide](LOCAL_INSTALL.md)** - Installing as a local package
- **[Path Configuration](PATH_CONFIGURATION.md)** - Configuring paths for manual linking

### 🛠 CLI Tools & Automation
- **[CLI Usage Guide](CLI_USAGE.md)** - Automated linking and diagnostic tools
- **[Verification Guide](VERIFICATION.md)** - Testing and verifying your setup

### 🐛 Troubleshooting
- **[Quick Fix Guide](QUICK_FIX.md)** - Quick solutions for common issues
- **[Linking Fix Summary](LINKING_FIX_SUMMARY.md)** - Summary of linking fixes
- **[Verify Linking](VERIFY_LINKING.md)** - Detailed linking verification

## 📖 Documentation by Use Case

### I'm New to This Module
1. Start with [Quick Start Guide](QUICK_START.md)
2. Read [Usage Guide](USAGE.md) for complete setup
3. Check [API Reference](API_REFERENCE.md) for detailed methods

### I Have Linking Issues
1. Try [Quick Fix Guide](QUICK_FIX.md) first
2. Use [CLI Usage Guide](CLI_USAGE.md) for automated fixes
3. Follow [Manual Linking Guide](MANUAL_LINKING.md) if needed
4. Use [Verification Guide](VERIFICATION.md) to test your setup

### I'm Installing Locally
1. Follow [Local Installation Guide](LOCAL_INSTALL.md)
2. Check [Path Configuration](PATH_CONFIGURATION.md) for path setup
3. Use [Verification Guide](VERIFICATION.md) to confirm installation

### I Need Advanced Configuration
1. Read [Usage Guide](USAGE.md) for platform-specific setup
2. Check [API Reference](API_REFERENCE.md) for all configuration options
3. See [examples/](../examples/) for implementation examples

## 🔍 Quick Reference

### Essential Commands
```bash
# Install module
npm install react-native-realtime-audio-analysis

# Auto-link (if needed)
npx rn-module-link link

# Diagnose issues
npx rn-module-link diagnose

# Verify setup
npx rn-module-link verify
```

### Basic Usage
```javascript
import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';

// Start analysis
await RealtimeAudioAnalyzer.startAnalysis({
  fftSize: 1024,
  sampleRate: 44100
});

// Listen for data
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzer);
eventEmitter.addListener('AudioAnalysisData', (data) => {
  console.log('Volume:', data.volume);
  console.log('Frequency data:', data.frequencyData);
});

// Stop analysis
await RealtimeAudioAnalyzer.stopAnalysis();
```

### Platform Requirements

**Android:**
- API level 21+
- RECORD_AUDIO permission
- NDK for native processing

**iOS:**
- iOS 11.0+
- NSMicrophoneUsageDescription in Info.plist
- AVAudioEngine support

## 🆘 Getting Help

### Common Issues
1. **Module not found** → [Quick Fix Guide](QUICK_FIX.md)
2. **Build errors** → [Manual Linking Guide](MANUAL_LINKING.md)
3. **Permission denied** → [Usage Guide](USAGE.md#permissions)
4. **No audio data** → [Verification Guide](VERIFICATION.md)

### Diagnostic Tools
```bash
# Run full diagnostics
npx rn-module-link diagnose

# Check linking status
npx rn-module-link verify

# Generate manual guide
npx rn-module-link generate-guide
```

### Support Resources
- Check existing [GitHub Issues](https://github.com/your-repo/react-native-realtime-audio-analysis/issues)
- Search [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native) with `react-native` tag
- Review [examples/](../examples/) for working implementations

## 📝 Contributing to Documentation

Found an issue or want to improve the docs?

1. **Report Issues**: Open a GitHub issue for documentation problems
2. **Suggest Improvements**: Submit PRs for documentation updates
3. **Add Examples**: Contribute new usage examples
4. **Update Guides**: Help keep guides current with new React Native versions

### Documentation Structure
```
docs/
├── README.md              # This index file
├── QUICK_START.md         # Quick start guide
├── USAGE.md               # Complete usage guide
├── API_REFERENCE.md       # Full API documentation
├── MANUAL_LINKING.md      # Manual linking instructions
├── CLI_USAGE.md           # CLI tools documentation
├── VERIFICATION.md        # Setup verification guide
└── [other guides...]      # Additional guides
```

## 🔄 Documentation Updates

This documentation is maintained alongside the module. Check the [changelog](../CHANGELOG.md) for documentation updates with each release.

**Last Updated**: January 2026
**Module Version**: 1.0.0
**React Native Compatibility**: 0.60+