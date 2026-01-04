"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RealtimeAudioAnalyzer = void 0;
var _reactNative = require("react-native");
// Debug: Log all available native modules
if (__DEV__) {
  console.log('Available NativeModules:', Object.keys(_reactNative.NativeModules));
  console.log('Looking for: RealtimeAudioAnalyzer');
  console.log('Found module:', _reactNative.NativeModules.RealtimeAudioAnalyzer ? 'YES' : 'NO');
}
const LINKING_ERROR = `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n' + (__DEV__ ? `\n\nDebug Info:\n- Available modules: ${Object.keys(_reactNative.NativeModules).join(', ')}\n- Module path: ${_reactNative.Platform.OS === 'android' ? 'android/src/main/java/com/realtimeaudio' : 'ios'}` : '');
const RealtimeAudioAnalyzerModule = _reactNative.NativeModules.RealtimeAudioAnalyzer ? _reactNative.NativeModules.RealtimeAudioAnalyzer : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
const eventEmitter = new _reactNative.NativeEventEmitter(RealtimeAudioAnalyzerModule);
const RealtimeAudioAnalyzer = exports.RealtimeAudioAnalyzer = {
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