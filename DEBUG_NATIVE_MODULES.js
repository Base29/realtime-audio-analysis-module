import { NativeModules } from 'react-native';

const LINKING_ERROR =
  "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n" +
  "- You have rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n";

// Debug: First, let's see what native modules are actually available
console.log('🔍 All available NativeModules:');
console.log(Object.keys(NativeModules));

console.log('\n🔍 Audio-related modules:');
const audioModules = Object.keys(NativeModules).filter(key => 
  key.toLowerCase().includes('audio') || 
  key.toLowerCase().includes('realtime') ||
  key.toLowerCase().includes('analyzer')
);
console.log(audioModules);

// Try to find our module with different possible names
const possibleNames = [
  'RealtimeAudioAnalysis',
  'RealtimeAudioAnalyzer', 
  'RealtimeAudioAnalysisModule',
  'RealtimeAudioAnalyzerModule',
  'AudioAnalysis',
  'AudioAnalyzer'
];

console.log('\n🔍 Checking possible module names:');
possibleNames.forEach(name => {
  const module = NativeModules[name];
  if (module) {
    console.log(`✅ Found: ${name}`);
    console.log(`   Methods: ${Object.keys(module)}`);
  } else {
    console.log(`❌ Not found: ${name}`);
  }
});

// Get the native module - try all possible names
const RealtimeAudioAnalysisModule = 
  NativeModules.RealtimeAudioAnalysis || 
  NativeModules.RealtimeAudioAnalyzer ||
  NativeModules.RealtimeAudioAnalysisModule ||
  NativeModules.RealtimeAudioAnalyzerModule ||
  NativeModules.AudioAnalysis ||
  NativeModules.AudioAnalyzer;

if (!RealtimeAudioAnalysisModule) {
  console.error('\n❌ Module not found with any name!');
  console.error('Available modules:', Object.keys(NativeModules));
  throw new Error(LINKING_ERROR);
} else {
  console.log('\n✅ Module found!');
  console.log('Module methods:', Object.keys(RealtimeAudioAnalysisModule));
}

const RealtimeAudioAnalyzer = {
  startAnalysis(config = {}) {
    console.log('Calling startAnalysis with config:', config);
    return RealtimeAudioAnalysisModule.startAnalysis(config);
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
};

export default RealtimeAudioAnalyzer;