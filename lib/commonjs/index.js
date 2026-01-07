"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _reactNative = require("react-native");

const LINKING_ERROR = "The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure: \n\n" + _reactNative.Platform.select({
  ios: "- You have run 'cd ios && pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';

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