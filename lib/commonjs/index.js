"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _NativeRealtimeAudioAnalyzer = _interopRequireDefault(require("./NativeRealtimeAudioAnalyzer"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const LINKING_ERROR = `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure:\n\n` + _reactNative.Platform.select({
  ios: "- You have run 'cd ios && pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
const legacyCandidateNames = ['RealtimeAudioAnalyzer',
// expected (matches getName())
'RealtimeAudioAnalyzerModule' // occasional legacy naming
];
function getLegacyModule() {
  for (const name of legacyCandidateNames) {
    const m = _reactNative.NativeModules[name];
    if (m) return m;
  }
  return null;
}

// Turbo module can be null until Android is truly Turbo-registered
const turboModule = _NativeRealtimeAudioAnalyzer.default !== null && _NativeRealtimeAudioAnalyzer.default !== void 0 ? _NativeRealtimeAudioAnalyzer.default : null;
const legacyModule = getLegacyModule();

// Prefer turbo when available, otherwise legacy
const RealtimeAudioAnalysisModule = turboModule !== null && turboModule !== void 0 ? turboModule : legacyModule;
if (!RealtimeAudioAnalysisModule) {
  console.error('Available NativeModules:', Object.keys(_reactNative.NativeModules).filter(key => key.includes('Audio') || key.includes('Realtime') || key.includes('Platform') || key.includes('Constants')));
  throw new Error(LINKING_ERROR);
}
const eventEmitter = new _reactNative.NativeEventEmitter(RealtimeAudioAnalysisModule);
const RealtimeAudioAnalyzer = {
  // Core methods
  startAnalysis(config = {}) {
    return RealtimeAudioAnalysisModule.startAnalysis(config);
  },
  stopAnalysis() {
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },
  isAnalyzing() {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },
  getAnalysisConfig() {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },
  // Backward-compatible aliases
  start(config = {}) {
    var _RealtimeAudioAnalysi;
    const fn = (_RealtimeAudioAnalysi = RealtimeAudioAnalysisModule.start) !== null && _RealtimeAudioAnalysi !== void 0 ? _RealtimeAudioAnalysi : RealtimeAudioAnalysisModule.startAnalysis;
    return fn(config);
  },
  stop() {
    var _RealtimeAudioAnalysi2;
    const fn = (_RealtimeAudioAnalysi2 = RealtimeAudioAnalysisModule.stop) !== null && _RealtimeAudioAnalysi2 !== void 0 ? _RealtimeAudioAnalysi2 : RealtimeAudioAnalysisModule.stopAnalysis;
    return fn();
  },
  isRunning() {
    var _RealtimeAudioAnalysi3;
    const fn = (_RealtimeAudioAnalysi3 = RealtimeAudioAnalysisModule.isRunning) !== null && _RealtimeAudioAnalysi3 !== void 0 ? _RealtimeAudioAnalysi3 : RealtimeAudioAnalysisModule.isAnalyzing;
    return fn();
  },
  // Event emitter API
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: subscription => subscription.remove()
};
var _default = exports.default = RealtimeAudioAnalyzer;
//# sourceMappingURL=index.js.map