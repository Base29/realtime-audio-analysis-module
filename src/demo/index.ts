// Rich Audio Demo - Main export
export { default as RichAudioDemo } from './components/RichAudioDemo';
export { default as SpectrumVisualizer } from './components/SpectrumVisualizer';
export { default as LevelMeter } from './components/LevelMeter';
export type { 
  RichAudioDemoProps, 
  LevelMeterProps, 
  SpectrumVisualizerProps,
  AudioLevelsHook,
  AnalysisConfig,
  PermissionStatus
} from './types/interfaces';
export { useRealtimeAudioLevels } from './hooks/useRealtimeAudioLevels';
export { AudioPermissionManager } from './utils/PermissionManager';
export { RingBuffer } from './utils/RingBuffer';

// Default export for simple integration
export { default } from './components/RichAudioDemo';