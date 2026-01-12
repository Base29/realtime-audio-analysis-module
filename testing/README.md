# Testing Components

This directory contains test components and examples for the React Native Realtime Audio Analysis module.

## Files

### `TestScreen.tsx`
Comprehensive test screen with relative imports (for development/testing within the module).

### `TestScreen-for-app.tsx`
Same test screen but with proper module imports for use in your React Native app after installation.

**Usage in your React Native app:**
```typescript
// Copy this file to your project first
cp node_modules/react-native-realtime-audio-analysis/testing/TestScreen-for-app.tsx ./src/components/TestScreen.tsx

// Then import and use
import TestScreen from './src/components/TestScreen';

export default function App() {
  return <TestScreen />;
}
```

### `example-usage.tsx`
Simple, clean usage example with relative imports (for development/testing within the module).

## Installation Notes

These test files are **excluded from the npm package** to avoid build issues during installation. They use relative imports to the source files and are designed to be copied into your React Native project for testing.

## Alternative Usage

If you prefer to copy the files directly:

1. **Copy the test files to your project:**
   ```bash
   cp node_modules/react-native-realtime-audio-analysis/testing/* ./src/components/
   ```

2. **Update the imports to use the installed module:**
   ```typescript
   // Change from:
   import RealtimeAudioAnalyzer from '../src/index';
   
   // To:
   import RealtimeAudioAnalyzer from 'react-native-realtime-audio-analysis';
   ```

3. **Use in your app:**
   ```typescript
   import TestScreen from './src/components/TestScreen';
   import SimpleAudioExample from './src/components/example-usage';
   ```

## Troubleshooting

If you encounter import issues:

1. **Verify module installation:**
   ```bash
   npm run test:linking
   ```

2. **Check module availability:**
   ```typescript
   import { NativeModules } from 'react-native';
   console.log('Module available:', !!NativeModules.RealtimeAudioAnalyzer);
   ```

3. **Rebuild your app:**
   ```bash
   # iOS
   cd ios && pod install && cd ..
   npx react-native run-ios
   
   # Android
   npx react-native run-android
   ```