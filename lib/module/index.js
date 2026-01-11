import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
const LINKING_ERROR = `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'cd ios && pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

// Get the native module - standardized name across platforms
const RealtimeAudioAnalysisModule = NativeModules.RealtimeAudioAnalyzer;
if (!RealtimeAudioAnalysisModule) {
  console.error('Available NativeModules:', Object.keys(NativeModules).filter(key => key.includes('Audio') || key.includes('Realtime')));
  throw new Error(LINKING_ERROR);
}
// Create event emitter
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule);

// Debug: Log available methods
console.log('RealtimeAudioAnalyzer native methods:', Object.keys(RealtimeAudioAnalysisModule));
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
  removeSubscription: subscription => subscription.remove()
};
export default RealtimeAudioAnalyzer;
//# sourceMappingURL=index.js.mapter.removeAllListeners('RealtimeAudioAnalyzer:onData');
  }
};
//# sourceMappingURL=index.js.map