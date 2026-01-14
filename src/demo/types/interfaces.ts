// Core TypeScript interfaces for Rich Audio Demo

export interface RichAudioDemoProps {
  /** Auto-start analysis on mount */
  autoStart?: boolean;
  /** Show debug panel */
  showDebug?: boolean;
  /** Number of spectrum bars (default: 32) */
  barCount?: number;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface AudioLevelsHook {
  // Permission state
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'blocked';
  requestPermission: () => Promise<boolean>;
  
  // Audio data
  isAnalyzing: boolean;
  rms: number;
  peak: number;
  rmsSmoothed: number;
  peakSmoothed: number;
  frequencyData: number[];
  
  // Configuration
  sampleRate: number;
  fftSize: number;
  smoothingEnabled: boolean;
  smoothingFactor: number;
  
  // Controls
  startAnalysis: (config?: AnalysisConfig) => Promise<void>;
  stopAnalysis: () => Promise<void>;
  setSmoothing: (enabled: boolean, factor: number) => Promise<void>;
  setFftConfig: (fftSize: number, downsampleBins: number) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

export interface AnalysisConfig {
  fftSize?: number;                    // FFT size (512, 1024, 2048, 4096)
  sampleRate?: number;                 // Sample rate (44100, 48000)
  windowFunction?: WindowFunction;     // Window function type
  smoothing?: number;                  // Smoothing factor (0.0-1.0)
}

export type WindowFunction = 'hanning' | 'hamming' | 'blackman' | 'rectangular';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface PermissionManager {
  checkPermission(): Promise<PermissionStatus>;
  requestPermission(): Promise<boolean>;
  openSettings(): void;
  getPermissionRationale(): string;
  isPermissionBlocked(): Promise<boolean>;
  getManualPermissionInstructions(): string;
}

export interface AudioAnalysisEvent {
  frequencyData: number[];    // FFT magnitude spectrum (0.0-1.0)
  timeData: number[];        // Time domain samples
  volume: number;            // RMS volume level (0.0-1.0)
  peak: number;             // Peak amplitude (0.0-1.0)
  timestamp: number;        // Event timestamp
  rms?: number;             // Alternative RMS field
  fft?: number[];           // Alternative FFT field
}

export interface SpectrumVisualizerProps {
  frequencyData: number[];
  barCount: number;
  isAnalyzing: boolean;
}

export interface LevelMeterProps {
  rms: number;
  peak: number;
  rmsSmoothed: number;
  peakSmoothed: number;
  isAnalyzing: boolean;
}

export interface PermissionPromptProps {
  permissionStatus: PermissionStatus;
  onRequestPermission: () => Promise<boolean>;
  onOpenSettings: () => void;
}

export interface ControlPanelProps {
  isAnalyzing: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  smoothingEnabled: boolean;
  smoothingFactor: number;
  onSmoothingChange: (enabled: boolean, factor: number) => Promise<void>;
  fftSize: number;
  onFftConfigChange: (fftSize: number, downsampleBins: number) => Promise<void>;
}

export interface DebugPanelProps {
  visible: boolean;
  rms: number;
  peak: number;
  rmsSmoothed: number;
  peakSmoothed: number;
  frequencyData: number[];
  sampleRate: number;
  fftSize: number;
  smoothingEnabled: boolean;
  smoothingFactor: number;
  error: string | null;
}

export interface RingBufferInterface<T> {
  push(value: T): void;
  getLatest(count: number): T[];
  size(): number;
  clear(): void;
}