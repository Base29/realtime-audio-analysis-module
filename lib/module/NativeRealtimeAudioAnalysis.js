// DISABLED: TurboModule interface causing conflicts with traditional NativeModules approach
// This file is disabled to prevent TurboModule registry conflicts
// The module uses traditional NativeModules approach in src/index.tsx

/*
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startAnalysis(config: Object): Promise<void>;
  stopAnalysis(): Promise<void>;
  isAnalyzing(): Promise<boolean>;
  getAnalysisConfig(): Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RealtimeAudioAnalysis');
*/

// Export null to prevent import errors
export default null;
//# sourceMappingURL=NativeRealtimeAudioAnalysis.js.map