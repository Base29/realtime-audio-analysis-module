#!/usr/bin/env node

/**
 * Creates a clean, working version of the module for your React Native app
 * Run this script and then copy the output to your React Native app
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Creating clean working module...\n');

// Create the working JavaScript module
const moduleCode = `
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \\n\\n" +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\\n", default: '' }) +
  '- You rebuilt the app after installing the package\\n' +
  '- You are not using Expo Go\\n';

// Get the native module - try both possible names
const RealtimeAudioAnalysisModule = NativeModules.RealtimeAudioAnalysis || NativeModules.RealtimeAudioAnalyzer;

if (!RealtimeAudioAnalysisModule) {
  console.error('Available NativeModules:', Object.keys(NativeModules).filter(key => key.includes('Audio') || key.includes('Realtime')));
  throw new Error(LINKING_ERROR);
}

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
  // Additional properties from native module
  rms?: number;
  fft?: number[];
}

// Create event emitter
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule);

// Debug: Log available methods
console.log('RealtimeAudioAnalysis native methods:', Object.keys(RealtimeAudioAnalysisModule));

const RealtimeAudioAnalyzer = {
  // Core methods
  startAnalysis(config?: AnalysisConfig): Promise<void> {
    console.log('Calling startAnalysis with config:', config);
    return RealtimeAudioAnalysisModule.startAnalysis(config || {});
  },

  stopAnalysis(): Promise<void> {
    console.log('Calling stopAnalysis');
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },

  isAnalyzing(): Promise<boolean> {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },

  getAnalysisConfig(): Promise<AnalysisConfig> {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },

  // Event emitter methods
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription: any) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;
`;

// Create the CommonJS version
const commonJSCode = `
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactNative = require("react-native");

const LINKING_ERROR = "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \\n\\n" + _reactNative.Platform.select({
  ios: "- You have run 'cd ios && pod install'\\n",
  default: ''
}) + '- You rebuilt the app after installing the package\\n' + '- You are not using Expo Go\\n';

const RealtimeAudioAnalysisModule = _reactNative.NativeModules.RealtimeAudioAnalysis || _reactNative.NativeModules.RealtimeAudioAnalyzer;

if (!RealtimeAudioAnalysisModule) {
  console.error('Available NativeModules:', Object.keys(_reactNative.NativeModules).filter(function(key) {
    return key.includes('Audio') || key.includes('Realtime');
  }));
  throw new Error(LINKING_ERROR);
}

const eventEmitter = new _reactNative.NativeEventEmitter(RealtimeAudioAnalysisModule);

console.log('RealtimeAudioAnalysis native methods:', Object.keys(RealtimeAudioAnalysisModule));

const RealtimeAudioAnalyzer = {
  startAnalysis: function(config) {
    console.log('Calling startAnalysis with config:', config);
    return RealtimeAudioAnalysisModule.startAnalysis(config || {});
  },
  stopAnalysis: function() {
    console.log('Calling stopAnalysis');
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },
  isAnalyzing: function() {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },
  getAnalysisConfig: function() {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: function(subscription) {
    return subscription.remove();
  }
};

exports.default = RealtimeAudioAnalyzer;
`;

// Create TypeScript definitions
const typeDefinitions = `
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
`;

// Write the files
try {
  // Ensure directories exist
  if (!fs.existsSync('lib')) fs.mkdirSync('lib');
  if (!fs.existsSync('lib/commonjs')) fs.mkdirSync('lib/commonjs');
  if (!fs.existsSync('lib/module')) fs.mkdirSync('lib/module');
  if (!fs.existsSync('lib/typescript')) fs.mkdirSync('lib/typescript');
  if (!fs.existsSync('lib/typescript/src')) fs.mkdirSync('lib/typescript/src');

  // Write source file
  fs.writeFileSync('src/index.tsx', moduleCode.trim());
  console.log('✅ Created src/index.tsx');

  // Write CommonJS build
  fs.writeFileSync('lib/commonjs/index.js', commonJSCode.trim());
  console.log('✅ Created lib/commonjs/index.js');

  // Write ES Module build
  fs.writeFileSync('lib/module/index.js', commonJSCode.trim());
  console.log('✅ Created lib/module/index.js');

  // Write TypeScript definitions
  fs.writeFileSync('lib/typescript/src/index.d.ts', typeDefinitions.trim());
  console.log('✅ Created lib/typescript/src/index.d.ts');

  console.log('\\n🎉 Clean module created successfully!');
  console.log('\\n📋 Next steps:');
  console.log('1. Update in your React Native app:');
  console.log('   cd /Users/faisalhussain/ReactNativeApps/AudioAnalysisApp');
  console.log('   rm -rf node_modules/react-native-realtime-audio-analysis');
  console.log('   npm install file:local_modules/realtime-audio-analysis-module');
  console.log('');
  console.log('2. Test the module:');
  console.log('   node quick-test.js');
  console.log('');
  console.log('3. Test in React Native app with TestAudioModule.js');

} catch (error) {
  console.error('❌ Error creating module:', error.message);
  process.exit(1);
}
`;

fs.writeFileSync('create-working-module.js', moduleCode);
console.log('✅ Created create-working-module.js script');