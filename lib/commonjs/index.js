"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "RichAudioDemo", {
  enumerable: true,
  get: function () {
    return _demo.RichAudioDemo;
  }
});
exports.default = void 0;
Object.defineProperty(exports, "useRealtimeAudioLevels", {
  enumerable: true,
  get: function () {
    return _demo.useRealtimeAudioLevels;
  }
});
var _reactNative = require("react-native");
var _NativeRealtimeAudioAnalyzer = _interopRequireDefault(require("./NativeRealtimeAudioAnalyzer"));
var _demo = require("./demo");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Export demo component

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
const EVENT_ON_DATA = 'RealtimeAudioAnalyzer:onData';
const EVENT_COMPAT = 'AudioAnalysisData';

// NativeEventEmitter requires a module instance on iOS; safe to pass on Android too.
const eventEmitter = new _reactNative.NativeEventEmitter(RealtimeAudioAnalysisModule);
/**
 * Backward-compatible listener:
 * - addListener(callback) -> listens to default EVENT_ON_DATA
 * - addListener(eventName, callback) -> listens to custom eventName
 *
 * This prevents: "2nd argument must be a function."
 */
function addListenerCompat(eventOrListener, maybeListener) {
  // Style A: addListener(callback)
  if (typeof eventOrListener === 'function') {
    return eventEmitter.addListener(EVENT_ON_DATA, eventOrListener);
  }

  // Style B: addListener(eventName, callback)
  const eventName = eventOrListener;
  const listener = maybeListener;
  if (typeof listener !== 'function') {
    throw new TypeError(`RealtimeAudioAnalyzer.addListener(eventName, listener): listener must be a function`);
  }
  return eventEmitter.addListener(eventName, listener);
}
function removeListenersCompat(eventOrCount) {
  // If user passes a specific event name
  if (typeof eventOrCount === 'string') {
    eventEmitter.removeAllListeners(eventOrCount);
    return;
  }

  // If user passes a count (RN's old EventEmitter signature)
  // We can't reliably remove by count; remove our known events safely.
  eventEmitter.removeAllListeners(EVENT_ON_DATA);
  eventEmitter.removeAllListeners(EVENT_COMPAT);
}
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
  // Advanced configuration methods
  setSmoothing(enabled, factor) {
    return RealtimeAudioAnalysisModule.setSmoothing(enabled, factor);
  },
  setFftConfig(fftSize, downsampleBins) {
    return RealtimeAudioAnalysisModule.setFftConfig(fftSize, downsampleBins);
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
  // Recommended explicit subscription helper (does not break existing API)
  onData(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('RealtimeAudioAnalyzer.onData(listener): listener must be a function');
    }
    return eventEmitter.addListener(EVENT_ON_DATA, listener);
  },
  // Event emitter API (backward compatible + safer)
  addListener: addListenerCompat,
  removeListeners: removeListenersCompat,
  removeSubscription: subscription => {
    var _subscription$remove;
    return subscription === null || subscription === void 0 || (_subscription$remove = subscription.remove) === null || _subscription$remove === void 0 ? void 0 : _subscription$remove.call(subscription);
  }
};
var _default = exports.default = RealtimeAudioAnalyzer;
//# sourceMappingURL=index.js.map