#!/bin/bash

echo "🔧 Fixing and updating React Native module..."

# Get the current directory (should be the module directory)
MODULE_DIR=$(pwd)
echo "📁 Module directory: $MODULE_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "react-native-realtime-audio-analysis" package.json; then
    echo "❌ Error: This script must be run from the react-native-realtime-audio-analysis module directory"
    exit 1
fi

echo ""
echo "1️⃣ Cleaning old build files..."
rm -rf lib/commonjs lib/module lib/typescript 2>/dev/null || true

echo ""
echo "2️⃣ Creating lib directories..."
mkdir -p lib/commonjs lib/module lib/typescript/src

echo ""
echo "3️⃣ Creating clean CommonJS build..."
cat > lib/commonjs/index.js << 'EOF'
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");

const LINKING_ERROR = `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'cd ios && pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

// Get the native module - try both possible names
const RealtimeAudioAnalysisModule = _reactNative.NativeModules.RealtimeAudioAnalysis || _reactNative.NativeModules.RealtimeAudioAnalyzer;

if (!RealtimeAudioAnalysisModule) {
  console.error('Available NativeModules:', Object.keys(_reactNative.NativeModules).filter(key => key.includes('Audio') || key.includes('Realtime')));
  throw new Error(LINKING_ERROR);
}

// Create event emitter
const eventEmitter = new _reactNative.NativeEventEmitter(RealtimeAudioAnalysisModule);

// Debug: Log available methods
console.log('RealtimeAudioAnalysis native methods:', Object.keys(RealtimeAudioAnalysisModule));

const RealtimeAudioAnalyzer = {
  // Core methods
  startAnalysis(config) {
    console.log('Calling startAnalysis with config:', config);
    return RealtimeAudioAnalysisModule.startAnalysis(config || {});
  },

  stopAnalysis() {
    console.log('Calling stopAnalysis');
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },

  isAnalyzing() {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },

  getAnalysisConfig() {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },

  // Event emitter methods
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription) => subscription.remove(),
};

var _default = exports.default = RealtimeAudioAnalyzer;
EOF

echo ""
echo "4️⃣ Creating TypeScript definitions..."
cat > lib/typescript/src/index.d.ts << 'EOF'
export interface AnalysisConfig {
    fftSize?: number;
    sampleRate?: number;
    windowFunction?: 'hanning' | 'hamming' | 'blackman' | 'rectangular';
    smoothing?: number;
}
export interface AudioAnalysisEvent {
    frequencyData: number[];
    timeData: number[];
    volume: number;
    peak: number;
    timestamp: number;
    rms?: number;
    fft?: number[];
}
declare const RealtimeAudioAnalyzer: {
    startAnalysis(config?: AnalysisConfig): Promise<void>;
    stopAnalysis(): Promise<void>;
    isAnalyzing(): Promise<boolean>;
    getAnalysisConfig(): Promise<AnalysisConfig>;
    addListener: any;
    removeListeners: any;
    removeSubscription: (subscription: any) => any;
};
export default RealtimeAudioAnalyzer;
EOF

echo ""
echo "5️⃣ Creating ES Module build..."
cp lib/commonjs/index.js lib/module/index.js

echo ""
echo "6️⃣ Testing the build..."
node -e "
try {
  const fs = require('fs');
  const content = fs.readFileSync('lib/commonjs/index.js', 'utf8');
  console.log('✅ Build file created successfully');
  console.log('📊 File size:', content.length, 'bytes');
  
  // Basic syntax check
  eval('(function() { ' + content + ' })');
  console.log('✅ Syntax check passed');
} catch (error) {
  console.log('❌ Build verification failed:', error.message);
  process.exit(1);
}
"

echo ""
echo "✅ Module build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the module in your React Native app:"
echo "   cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp"
echo "   rm -rf node_modules/react-native-realtime-audio-analysis"
echo "   npm install file:local_modules/realtime-audio-analysis-module"
echo ""
echo "2. Test the module:"
echo "   node test-module-import.js"
echo "   node quick-test.js"
echo ""
echo "3. Rebuild your React Native app:"
echo "   cd android && ./gradlew clean && cd .."
echo "   npx react-native run-android"