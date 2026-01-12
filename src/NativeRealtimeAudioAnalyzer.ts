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

  // RN EventEmitter requirement (you already have these)
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  // Optional legacy aliases you still expose natively
  start(options: AnalysisConfig): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<boolean>;

  // Optional extra controls you expose
  setSmoothing(enabled: boolean, factor: number): Promise<void>;
  setFftConfig(fftSize: number, downsampleBins: number): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RealtimeAudioAnalyzer');