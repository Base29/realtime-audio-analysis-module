import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type AnalysisConfig = {
  fftSize?: number;
  sampleRate?: number;
  windowFunction?: 'hanning' | 'hamming' | 'blackman' | 'rectangular';
  smoothing?: number;
};

export interface Spec extends TurboModule {
  // Match your Kotlin @ReactMethod names
  startAnalysis(config: AnalysisConfig): Promise<void>;
  stopAnalysis(): Promise<void>;
  isAnalyzing(): Promise<boolean>;
  getAnalysisConfig(): Promise<AnalysisConfig>;

  // RN EventEmitter requirement
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  // Optional legacy aliases you expose natively
  start(options: AnalysisConfig): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<boolean>;

  // Optional extra controls you expose
  setSmoothing(enabled: boolean, factor: number): Promise<void>;
  setFftConfig(fftSize: number, downsampleBins: number): Promise<void>;
}

/**
 * IMPORTANT:
 * - Use `get` (NOT getEnforcing) while Android is still legacy-registered.
 * - Once you migrate Android to TurboReactPackage and proper Turbo registration,
 *   you can switch back to `getEnforcing` if you want hard guarantees.
 */
const module = TurboModuleRegistry.get<Spec>('RealtimeAudioAnalyzer');

export default module;