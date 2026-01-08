import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Debug: First, let's see what native modules are actually available
console.log('🔍 All available NativeModules:');
console.log(Object.keys(NativeModules));

console.log('\n🔍 Audio-related modules:');
const audioModules = Object.keys(NativeModules).filter(key => 
  key.toLowerCase().includes('audio') || 
  key.toLowerCase().includes('realtime') ||
  key.toLowerCase().includes('analyzer')
);
console.log('Audio modules found:', audioModules);

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
let foundModule = null;
let foundName = null;

possibleNames.forEach(name => {
  const module = NativeModules[name];
  if (module) {
    console.log(`✅ Found: ${name}`);
    console.log(`   Methods: ${Object.keys(module)}`);
    if (!foundModule) {
      foundModule = module;
      foundName = name;
    }
  } else {
    console.log(`❌ Not found: ${name}`);
  }
});

const LINKING_ERROR =
  "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n' +
  '\nAvailable modules: ' + Object.keys(NativeModules).join(', ');

// Get the native module - try all possible names
const RealtimeAudioAnalysisModule = foundModule;

if (!RealtimeAudioAnalysisModule) {
  console.error('\n❌ Module not found with any name!');
  console.error('Available modules:', Object.keys(NativeModules));
  throw new Error(LINKING_ERROR);
} else {
  console.log(`\n✅ Module found as: ${foundName}`);
  console.log('Module methods:', Object.keys(RealtimeAudioAnalysisModule));
}

// Create event emitter
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule);

const RealtimeAudioAnalyzer = {
  // Core methods with better error handling
  async startAnalysis(config = {}) {
    console.log('Calling startAnalysis with config:', config);
    try {
      const result = await RealtimeAudioAnalysisModule.startAnalysis(config);
      console.log('✅ startAnalysis successful');
      return result;
    } catch (error) {
      console.error('❌ startAnalysis failed:', error.message);
      
      // Provide specific error messages
      if (error.message.includes('Permission denied')) {
        throw new Error('Microphone permission denied. Please grant audio recording permission.');
      } else if (error.message.includes('AudioRecord initialization failed')) {
        throw new Error('Audio initialization failed. Please ensure no other app is using the microphone and try again.');
      } else {
        throw error;
      }
    }
  },

  async stopAnalysis() {
    console.log('Calling stopAnalysis');
    try {
      const result = await RealtimeAudioAnalysisModule.stopAnalysis();
      console.log('✅ stopAnalysis successful');
      return result;
    } catch (error) {
      console.error('❌ stopAnalysis failed:', error.message);
      throw error;
    }
  },

  async isAnalyzing() {
    try {
      return await RealtimeAudioAnalysisModule.isAnalyzing();
    } catch (error) {
      console.error('❌ isAnalyzing failed:', error.message);
      return false;
    }
  },

  async getAnalysisConfig() {
    try {
      return await RealtimeAudioAnalysisModule.getAnalysisConfig();
    } catch (error) {
      console.error('❌ getAnalysisConfig failed:', error.message);
      throw error;
    }
  },

  // Event emitter methods
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;