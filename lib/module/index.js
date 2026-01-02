import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Debug: Log all available native modules
if (__DEV__) {
  console.log('Available NativeModules:', Object.keys(NativeModules));
  console.log('Looking for: RealtimeAudioAnalyzer');
  console.log('Found module:', NativeModules.RealtimeAudioAnalyzer ? 'YES' : 'NO');
}
const LINKING_ERROR = `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n' + (__DEV__ ? `\n\nDebug Info:\n- Available modules: ${Object.keys(NativeModules).join(', ')}\n- Module path: ${Platform.OS === 'android' ? 'android/src/main/java/com/realtimeaudio' : 'ios'}` : '');
const RealtimeAudioAnalyzerModule = NativeModules.RealtimeAudioAnalyzer ? NativeModules.RealtimeAudioAnalyzer : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalyzerModule);
export const RealtimeAudioAnalyzer = {
  start(options = {}) {
    return RealtimeAudioAnalyzerModule.start(options);
  },
  stop() {
    return RealtimeAudioAnalyzerModule.stop();
  },
  isRunning() {
    return RealtimeAudioAnalyzerModule.isRunning();
  },
  setSmoothing(enabled, factor = 0.5) {
    return RealtimeAudioAnalyzerModule.setSmoothing(enabled, factor);
  },
  setFftConfig(fftSize, downsampleBins = -1) {
    return RealtimeAudioAnalyzerModule.setFftConfig(fftSize, downsampleBins);
  },
  addListener(callback) {
    return eventEmitter.addListener('RealtimeAudioAnalyzer:onData', callback);
  },
  removeAllListeners() {
    eventEmitter.removeAllListeners('RealtimeAudioAnalyzer:onData');
  }
};
//# sourceMappingURL=index.js.map