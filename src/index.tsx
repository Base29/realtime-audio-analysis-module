import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import NativeRealtimeAudioAnalyzer, {
  type AnalysisConfig,
} from './NativeRealtimeAudioAnalyzer';

const LINKING_ERROR =
  `The package 'react-native-realtime-audio-analysis' doesn't seem to be linked. Make sure:\n\n` +
  Platform.select({ ios: "- You have run 'cd ios && pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

type NativeModuleShape = typeof NativeRealtimeAudioAnalyzer;

/**
 * Turbo-first (New Architecture).
 * Legacy fallback: NativeModules.* (Old Architecture / partially migrated setups).
 *
 * In some setups the legacy name may differ, so we try a small set of common keys.
 */
const legacyCandidateNames = [
  'RealtimeAudioAnalyzer', // expected (matches getName())
  'RealtimeAudioAnalyzerModule', // occasional legacy naming
] as const;

const legacyModule = legacyCandidateNames
  .map((name) => (NativeModules as any)[name])
  .find(Boolean) as NativeModuleShape | undefined;

// Prefer Turbo module if it exists, else fallback to legacy
const RealtimeAudioAnalysisModule: NativeModuleShape | undefined =
  (NativeRealtimeAudioAnalyzer as unknown as NativeModuleShape) ?? legacyModule;

if (!RealtimeAudioAnalysisModule) {
  console.error(
    'Available NativeModules:',
    Object.keys(NativeModules).filter(
      (key) =>
        key.includes('Audio') ||
        key.includes('Realtime') ||
        key.includes('Platform') ||
        key.includes('Constants')
    )
  );
  throw new Error(LINKING_ERROR);
}

export type { AnalysisConfig };

export interface AudioAnalysisEvent {
  frequencyData: number[];
  timeData: number[];
  volume: number;
  peak: number;
  timestamp: number;
  rms?: number;
  fft?: number[];
}

/**
 * NativeEventEmitter requires a native module instance on iOS.
 * On Android it’s more lenient, but we pass the module anyway.
 */
const eventEmitter = new NativeEventEmitter(RealtimeAudioAnalysisModule as any);

const RealtimeAudioAnalyzer = {
  // Core methods (keep identical to your current API)
  startAnalysis(config: AnalysisConfig = {}): Promise<void> {
    return RealtimeAudioAnalysisModule.startAnalysis(config);
  },

  stopAnalysis(): Promise<void> {
    return RealtimeAudioAnalysisModule.stopAnalysis();
  },

  isAnalyzing(): Promise<boolean> {
    return RealtimeAudioAnalysisModule.isAnalyzing();
  },

  getAnalysisConfig(): Promise<AnalysisConfig> {
    return RealtimeAudioAnalysisModule.getAnalysisConfig();
  },

  // Backward-compatible aliases (in case older app code calls these)
  start(config: AnalysisConfig = {}): Promise<void> {
    // Your native module already aliases start -> startAnalysis
    const fn = (RealtimeAudioAnalysisModule as any).start ?? RealtimeAudioAnalysisModule.startAnalysis;
    return fn(config);
  },

  stop(): Promise<void> {
    const fn = (RealtimeAudioAnalysisModule as any).stop ?? RealtimeAudioAnalysisModule.stopAnalysis;
    return fn();
  },

  isRunning(): Promise<boolean> {
    const fn = (RealtimeAudioAnalysisModule as any).isRunning ?? RealtimeAudioAnalysisModule.isAnalyzing;
    return fn();
  },

  // Event emitter API (unchanged)
  addListener: eventEmitter.addListener.bind(eventEmitter),
  removeListeners: eventEmitter.removeAllListeners.bind(eventEmitter),
  removeSubscription: (subscription: any) => subscription.remove(),
};

export default RealtimeAudioAnalyzer;