import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Switch, ScrollView } from 'react-native';
import { RichAudioDemoProps } from '../types/interfaces';
import { useRealtimeAudioLevels } from '../hooks/useRealtimeAudioLevels';
import { AudioPermissionManager } from '../utils/PermissionManager';
import SpectrumVisualizer from './SpectrumVisualizer';
import LevelMeter from './LevelMeter';

/**
 * Rich Audio Demo Component - Main container
 * Showcases full functionality of the realtime-audio-analysis library
 * 
 * Features:
 * - Cross-platform permission handling with UI prompts
 * - Integration of spectrum visualizer and level meter
 * - Auto-start capability
 * - Error handling and user feedback
 * - Platform-specific guidance for permissions
 */
const RichAudioDemo: React.FC<RichAudioDemoProps> = (props) => {
  const {
    autoStart = false,
    showDebug = false,
    barCount = 32,
    onError,
  } = props;

  // Use the audio levels hook to get real-time audio data
  const audioLevels = useRealtimeAudioLevels();
  
  // Permission manager for platform-specific handling
  const [permissionManager] = React.useState(() => new AudioPermissionManager());
  
  // Local state for UI management
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = React.useState(false);
  const [performanceMetrics, setPerformanceMetrics] = React.useState({
    updateCount: 0,
    lastUpdateTime: 0,
    averageFps: 0,
  });
  
  // Enhanced audio statistics tracking
  const [audioStats, setAudioStats] = React.useState({
    rmsMin: 0,
    rmsMax: 0,
    rmsAvg: 0,
    peakMin: 0,
    peakMax: 0,
    peakAvg: 0,
    sampleCount: 0,
  });
  
  // Error state management
  const [displayError, setDisplayError] = React.useState<{
    type: 'permission' | 'analysis' | 'runtime' | 'performance';
    message: string;
    details?: string;
    recoverable: boolean;
  } | null>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);

  // Handle errors from the hook with categorization
  React.useEffect(() => {
    if (audioLevels.error) {
      // Categorize error type based on error message
      let errorType: 'permission' | 'analysis' | 'runtime' | 'performance' = 'runtime';
      let userMessage = audioLevels.error;
      let recoverable = true;
      let details: string | undefined;
      
      if (audioLevels.error.toLowerCase().includes('permission')) {
        errorType = 'permission';
        userMessage = 'Microphone access is required';
        details = 'Please grant microphone permission to use audio analysis features.';
      } else if (audioLevels.error.toLowerCase().includes('start') || 
                 audioLevels.error.toLowerCase().includes('analysis')) {
        errorType = 'analysis';
        userMessage = 'Failed to start audio analysis';
        details = 'There was a problem initializing the audio engine. Try restarting the analysis.';
      } else if (audioLevels.error.toLowerCase().includes('module') || 
                 audioLevels.error.toLowerCase().includes('native')) {
        errorType = 'runtime';
        userMessage = 'Audio module not available';
        details = 'The native audio module could not be loaded. Please ensure the library is properly linked.';
        recoverable = false;
      } else if (audioLevels.error.toLowerCase().includes('config') || 
                 audioLevels.error.toLowerCase().includes('fft') ||
                 audioLevels.error.toLowerCase().includes('smoothing')) {
        errorType = 'analysis';
        userMessage = 'Configuration error';
        details = 'The audio configuration could not be applied. Try resetting to default settings.';
      }
      
      setDisplayError({
        type: errorType,
        message: userMessage,
        details,
        recoverable,
      });
      
      // Also call the onError callback if provided
      if (onError) {
        onError(new Error(audioLevels.error));
      }
    } else {
      // Clear display error when hook error is cleared
      setDisplayError(null);
    }
  }, [audioLevels.error, onError]);

  // Track performance metrics for debug display and performance degradation detection
  React.useEffect(() => {
    if (audioLevels.isAnalyzing) {
      const now = Date.now();
      setPerformanceMetrics(prev => {
        const timeDiff = now - prev.lastUpdateTime;
        const newUpdateCount = prev.updateCount + 1;
        
        // Calculate rolling average FPS over last 10 updates
        const fps = timeDiff > 0 ? 1000 / timeDiff : 0;
        const avgFps = prev.averageFps === 0 ? fps : (prev.averageFps * 0.9 + fps * 0.1);
        
        // Detect performance issues - if FPS drops below 15, show performance warning
        if (avgFps > 0 && avgFps < 15 && newUpdateCount > 30) {
          setDisplayError({
            type: 'performance',
            message: 'Performance degradation detected',
            details: `Frame rate has dropped to ${avgFps.toFixed(1)} FPS. Consider reducing bar count or disabling advanced features.`,
            recoverable: true,
          });
        }
        
        return {
          updateCount: newUpdateCount,
          lastUpdateTime: now,
          averageFps: avgFps,
        };
      });
      
      // Update audio statistics
      setAudioStats(prev => {
        const currentRms = audioLevels.rms;
        const currentPeak = audioLevels.peak;
        const newSampleCount = prev.sampleCount + 1;
        
        return {
          rmsMin: prev.sampleCount === 0 ? currentRms : Math.min(prev.rmsMin, currentRms),
          rmsMax: prev.sampleCount === 0 ? currentRms : Math.max(prev.rmsMax, currentRms),
          rmsAvg: (prev.rmsAvg * prev.sampleCount + currentRms) / newSampleCount,
          peakMin: prev.sampleCount === 0 ? currentPeak : Math.min(prev.peakMin, currentPeak),
          peakMax: prev.sampleCount === 0 ? currentPeak : Math.max(prev.peakMax, currentPeak),
          peakAvg: (prev.peakAvg * prev.sampleCount + currentPeak) / newSampleCount,
          sampleCount: newSampleCount,
        };
      });
    } else {
      // Reset metrics when not analyzing
      setPerformanceMetrics({
        updateCount: 0,
        lastUpdateTime: 0,
        averageFps: 0,
      });
      
      // Reset audio statistics
      setAudioStats({
        rmsMin: 0,
        rmsMax: 0,
        rmsAvg: 0,
        peakMin: 0,
        peakMax: 0,
        peakAvg: 0,
        sampleCount: 0,
      });
    }
  }, [audioLevels.rms, audioLevels.peak, audioLevels.isAnalyzing]);

  // Auto-start analysis if requested and permission is granted
  React.useEffect(() => {
    if (autoStart && audioLevels.permissionStatus === 'granted' && !audioLevels.isAnalyzing) {
      audioLevels.startAnalysis().catch((error) => {
        if (onError) {
          onError(error);
        }
      });
    }
  }, [autoStart, audioLevels.permissionStatus, audioLevels.isAnalyzing, audioLevels.startAnalysis, onError]);

  // Handle permission request
  const handleRequestPermission = async () => {
    if (isRequestingPermission) return;
    
    setIsRequestingPermission(true);
    setDisplayError(null); // Clear any previous errors
    
    try {
      const granted = await audioLevels.requestPermission();
      if (!granted) {
        setDisplayError({
          type: 'permission',
          message: 'Microphone permission denied',
          details: 'Audio analysis requires microphone access. Please grant permission to continue.',
          recoverable: true,
        });
        
        if (onError) {
          onError(new Error('Microphone permission was denied'));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setDisplayError({
        type: 'permission',
        message: 'Permission request failed',
        details: errorMessage,
        recoverable: true,
      });
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Handle opening settings for blocked permissions
  const handleOpenSettings = () => {
    permissionManager.openSettings();
  };
  
  // Error recovery handlers
  const handleRetryAnalysis = async () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    setDisplayError(null);
    
    try {
      // Stop any existing analysis first
      if (audioLevels.isAnalyzing) {
        await audioLevels.stopAnalysis();
      }
      
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retry starting analysis
      await audioLevels.startAnalysis();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      setDisplayError({
        type: 'analysis',
        message: 'Retry failed',
        details: errorMessage,
        recoverable: true,
      });
    } finally {
      setIsRecovering(false);
    }
  };
  
  const handleResetConfiguration = async () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    setDisplayError(null);
    
    try {
      // Stop analysis if running
      if (audioLevels.isAnalyzing) {
        await audioLevels.stopAnalysis();
      }
      
      // Reset to default configuration
      await audioLevels.setSmoothing(false, 0.8);
      await audioLevels.setFftConfig(1024, 0);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Restart with default config
      await audioLevels.startAnalysis({
        fftSize: 1024,
        sampleRate: 44100,
        smoothing: 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reset failed';
      setDisplayError({
        type: 'analysis',
        message: 'Configuration reset failed',
        details: errorMessage,
        recoverable: true,
      });
    } finally {
      setIsRecovering(false);
    }
  };
  
  const handleDismissError = () => {
    setDisplayError(null);
    audioLevels.clearError();
  };

  // Utility functions for dB conversion and formatting
  const linearToDb = (linearValue: number): number => {
    if (linearValue <= 0) return -Infinity;
    return 20 * Math.log10(linearValue);
  };

  const formatDbValue = (dbValue: number): string => {
    if (dbValue === -Infinity) return '-∞ dB';
    if (dbValue > 0) return `+${dbValue.toFixed(1)} dB`;
    return `${dbValue.toFixed(1)} dB`;
  };

  const getDbColor = (dbValue: number): string => {
    if (dbValue === -Infinity || dbValue < -40) return '#4ade80'; // Green for low levels
    if (dbValue < -20) return '#fbbf24'; // Yellow for medium levels
    if (dbValue < -6) return '#f59e0b'; // Orange for high levels
    return '#ef4444'; // Red for very high levels
  };

  // Handle start/stop analysis with comprehensive error handling
  const handleStartAnalysis = async () => {
    setDisplayError(null); // Clear any previous errors
    
    try {
      await audioLevels.startAnalysis();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start analysis';
      setDisplayError({
        type: 'analysis',
        message: 'Failed to start audio analysis',
        details: errorMessage,
        recoverable: true,
      });
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  };

  const handleStopAnalysis = async () => {
    try {
      await audioLevels.stopAnalysis();
      // Clear performance errors when stopping
      if (displayError?.type === 'performance') {
        setDisplayError(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop analysis';
      setDisplayError({
        type: 'analysis',
        message: 'Failed to stop audio analysis',
        details: errorMessage,
        recoverable: true,
      });
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  };

  // Render permission prompt UI based on permission status
  const renderPermissionPrompt = () => {
    if (audioLevels.permissionStatus === 'granted') {
      return null;
    }

    const isBlocked = audioLevels.permissionStatus === 'blocked';
    const isDenied = audioLevels.permissionStatus === 'denied';
    
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>
          Microphone Access Required
        </Text>
        
        <Text style={styles.permissionMessage}>
          This demo needs microphone access to analyze audio in real-time and display 
          frequency spectrum and volume levels.
        </Text>
        
        {(isBlocked || isDenied) && (
          <Text style={styles.permissionGuidance}>
            {permissionManager.getPermissionRationale()}
          </Text>
        )}
        
        <View style={styles.permissionButtons}>
          {!isBlocked ? (
            <TouchableOpacity
              style={[styles.permissionButton, styles.primaryButton]}
              onPress={handleRequestPermission}
              disabled={isRequestingPermission}
            >
              <Text style={styles.primaryButtonText}>
                {isRequestingPermission ? 'Requesting...' : 'Enable Microphone'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.permissionButton, styles.primaryButton]}
              onPress={handleOpenSettings}
            >
              <Text style={styles.primaryButtonText}>
                Open Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {Platform.OS === 'ios' && (
          <Text style={styles.platformNote}>
            Note: On iOS, you may need to restart the app after enabling microphone access.
          </Text>
        )}
      </View>
    );
  };
  
  // Render error display with recovery options
  const renderErrorDisplay = () => {
    if (!displayError) {
      return null;
    }
    
    const getErrorIcon = () => {
      switch (displayError.type) {
        case 'permission':
          return '🔒';
        case 'analysis':
          return '⚠️';
        case 'runtime':
          return '❌';
        case 'performance':
          return '⚡';
        default:
          return '⚠️';
      }
    };
    
    const getErrorColor = () => {
      switch (displayError.type) {
        case 'permission':
          return '#FF9500'; // Orange
        case 'analysis':
          return '#FF3B30'; // Red
        case 'runtime':
          return '#FF3B30'; // Red
        case 'performance':
          return '#FFCC00'; // Yellow
        default:
          return '#FF3B30';
      }
    };
    
    return (
      <View style={[styles.errorContainer, { borderLeftColor: getErrorColor() }]}>
        <View style={styles.errorHeader}>
          <Text style={styles.errorIcon}>{getErrorIcon()}</Text>
          <Text style={styles.errorTitle}>{displayError.message}</Text>
        </View>
        
        {displayError.details && (
          <Text style={styles.errorDetails}>{displayError.details}</Text>
        )}
        
        {displayError.recoverable && (
          <View style={styles.errorActions}>
            {displayError.type === 'permission' && (
              <TouchableOpacity
                style={[styles.errorButton, styles.errorButtonPrimary]}
                onPress={handleRequestPermission}
                disabled={isRequestingPermission}
              >
                <Text style={styles.errorButtonText}>
                  {isRequestingPermission ? 'Requesting...' : 'Grant Permission'}
                </Text>
              </TouchableOpacity>
            )}
            
            {displayError.type === 'analysis' && (
              <>
                <TouchableOpacity
                  style={[styles.errorButton, styles.errorButtonPrimary]}
                  onPress={handleRetryAnalysis}
                  disabled={isRecovering}
                >
                  <Text style={styles.errorButtonText}>
                    {isRecovering ? 'Retrying...' : 'Retry'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.errorButton, styles.errorButtonSecondary]}
                  onPress={handleResetConfiguration}
                  disabled={isRecovering}
                >
                  <Text style={styles.errorButtonTextSecondary}>
                    Reset Config
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            {displayError.type === 'performance' && (
              <TouchableOpacity
                style={[styles.errorButton, styles.errorButtonSecondary]}
                onPress={handleStopAnalysis}
              >
                <Text style={styles.errorButtonTextSecondary}>
                  Stop Analysis
                </Text>
              </TouchableOpacity>
            )}
            
            {displayError.type === 'runtime' && (
              <Text style={styles.errorHelpText}>
                Please ensure the library is properly linked. See documentation for linking instructions.
              </Text>
            )}
            
            <TouchableOpacity
              style={[styles.errorButton, styles.errorButtonDismiss]}
              onPress={handleDismissError}
            >
              <Text style={styles.errorButtonTextDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!displayError.recoverable && (
          <View style={styles.errorActions}>
            <Text style={styles.errorHelpText}>
              This error cannot be automatically recovered. Please check the documentation or contact support.
            </Text>
            <TouchableOpacity
              style={[styles.errorButton, styles.errorButtonDismiss]}
              onPress={handleDismissError}
            >
              <Text style={styles.errorButtonTextDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render main controls
  const renderControls = () => {
    if (audioLevels.permissionStatus !== 'granted') {
      return null;
    }

    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            audioLevels.isAnalyzing ? styles.stopButton : styles.startButton
          ]}
          onPress={audioLevels.isAnalyzing ? handleStopAnalysis : handleStartAnalysis}
        >
          <Text style={styles.controlButtonText}>
            {audioLevels.isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.secondaryButton]}
          onPress={() => setShowAdvancedControls(!showAdvancedControls)}
        >
          <Text style={styles.secondaryButtonText}>
            {showAdvancedControls ? 'Hide Advanced' : 'Show Advanced'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render advanced controls panel
  const renderAdvancedControls = () => {
    if (!showAdvancedControls || audioLevels.permissionStatus !== 'granted') {
      return null;
    }

    const handleSmoothingToggle = async (enabled: boolean) => {
      try {
        await audioLevels.setSmoothing(enabled, audioLevels.smoothingFactor);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to toggle smoothing';
        setDisplayError({
          type: 'analysis',
          message: 'Failed to update smoothing',
          details: errorMessage,
          recoverable: true,
        });
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    };

    const handleSmoothingFactorChange = async (factor: number) => {
      try {
        await audioLevels.setSmoothing(audioLevels.smoothingEnabled, factor);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to change smoothing factor';
        setDisplayError({
          type: 'analysis',
          message: 'Failed to update smoothing factor',
          details: errorMessage,
          recoverable: true,
        });
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    };

    const handleFftSizeChange = async (newSize: number) => {
      try {
        await audioLevels.setFftConfig(newSize, 0); // downsampleBins not used yet
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to change FFT size';
        setDisplayError({
          type: 'analysis',
          message: 'Failed to update FFT configuration',
          details: errorMessage,
          recoverable: true,
        });
        
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    };

    const fftSizeOptions = [256, 512, 1024, 2048, 4096];
    const smoothingFactorOptions = [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9];

    return (
      <View style={styles.advancedControlsContainer}>
        <Text style={styles.advancedControlsTitle}>Advanced Controls</Text>
        
        {/* Smoothing Controls */}
        <View style={styles.controlSection}>
          <Text style={styles.controlSectionTitle}>Audio Smoothing</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Enable Smoothing</Text>
            <Switch
              value={audioLevels.smoothingEnabled}
              onValueChange={handleSmoothingToggle}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={audioLevels.smoothingEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {audioLevels.smoothingEnabled && (
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Smoothing Factor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                {smoothingFactorOptions.map((factor) => (
                  <TouchableOpacity
                    key={factor}
                    style={[
                      styles.optionButton,
                      Math.abs(audioLevels.smoothingFactor - factor) < 0.01 && styles.selectedOption
                    ]}
                    onPress={() => handleSmoothingFactorChange(factor)}
                  >
                    <Text style={[
                      styles.optionText,
                      Math.abs(audioLevels.smoothingFactor - factor) < 0.01 && styles.selectedOptionText
                    ]}>
                      {factor.toFixed(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* FFT Configuration */}
        <View style={styles.controlSection}>
          <Text style={styles.controlSectionTitle}>FFT Configuration</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>FFT Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {fftSizeOptions.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionButton,
                    audioLevels.fftSize === size && styles.selectedOption
                  ]}
                  onPress={() => handleFftSizeChange(size)}
                >
                  <Text style={[
                    styles.optionText,
                    audioLevels.fftSize === size && styles.selectedOptionText
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Current Configuration Display */}
        <View style={styles.controlSection}>
          <Text style={styles.controlSectionTitle}>Current Configuration</Text>
          
          <View style={styles.configDisplay}>
            <Text style={styles.configText}>Sample Rate: {audioLevels.sampleRate} Hz</Text>
            <Text style={styles.configText}>FFT Size: {audioLevels.fftSize}</Text>
            <Text style={styles.configText}>Window Function: Hanning</Text>
            <Text style={styles.configText}>
              Smoothing: {audioLevels.smoothingEnabled ? `Enabled (${audioLevels.smoothingFactor.toFixed(1)})` : 'Disabled'}
            </Text>
            <Text style={styles.configText}>Frequency Bins: {audioLevels.frequencyData.length}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render debug information if enabled
  const renderDebugPanel = () => {
    if (!showDebug || audioLevels.permissionStatus !== 'granted') {
      return null;
    }

    // Calculate frequency data statistics for debug display
    const freqStats = audioLevels.frequencyData.length > 0 ? {
      min: Math.min(...audioLevels.frequencyData),
      max: Math.max(...audioLevels.frequencyData),
      avg: audioLevels.frequencyData.reduce((sum, val) => sum + val, 0) / audioLevels.frequencyData.length,
    } : { min: 0, max: 0, avg: 0 };

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information</Text>
        
        {/* Analysis Status */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Analysis Status</Text>
          <Text style={styles.debugText}>Status: {audioLevels.isAnalyzing ? 'Analyzing' : 'Stopped'}</Text>
          <Text style={styles.debugText}>Permission: {audioLevels.permissionStatus}</Text>
          <Text style={styles.debugText}>Updates: {performanceMetrics.updateCount}</Text>
          <Text style={styles.debugText}>Avg FPS: {performanceMetrics.averageFps.toFixed(1)}</Text>
        </View>

        {/* Raw vs Smoothed Audio Values */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Audio Levels (Raw vs Smoothed)</Text>
          <View style={styles.debugValueRow}>
            <View style={styles.debugValueColumn}>
              <Text style={styles.debugValueLabel}>RMS</Text>
              <Text style={styles.debugText}>Raw: {audioLevels.rms.toFixed(4)}</Text>
              <Text style={styles.debugText}>Smoothed: {audioLevels.rmsSmoothed.toFixed(4)}</Text>
              <Text style={styles.debugText}>Diff: {Math.abs(audioLevels.rms - audioLevels.rmsSmoothed).toFixed(4)}</Text>
            </View>
            <View style={styles.debugValueColumn}>
              <Text style={styles.debugValueLabel}>Peak</Text>
              <Text style={styles.debugText}>Raw: {audioLevels.peak.toFixed(4)}</Text>
              <Text style={styles.debugText}>Smoothed: {audioLevels.peakSmoothed.toFixed(4)}</Text>
              <Text style={styles.debugText}>Diff: {Math.abs(audioLevels.peak - audioLevels.peakSmoothed).toFixed(4)}</Text>
            </View>
          </View>
        </View>

        {/* Frequency Data Statistics */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Frequency Data</Text>
          <Text style={styles.debugText}>Bins: {audioLevels.frequencyData.length}</Text>
          <Text style={styles.debugText}>Min: {freqStats.min.toFixed(4)}</Text>
          <Text style={styles.debugText}>Max: {freqStats.max.toFixed(4)}</Text>
          <Text style={styles.debugText}>Avg: {freqStats.avg.toFixed(4)}</Text>
        </View>

        {/* Current Configuration */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Configuration</Text>
          <Text style={styles.debugText}>FFT Size: {audioLevels.fftSize}</Text>
          <Text style={styles.debugText}>Sample Rate: {audioLevels.sampleRate} Hz</Text>
          <Text style={styles.debugText}>Smoothing: {audioLevels.smoothingEnabled ? `Enabled (${audioLevels.smoothingFactor.toFixed(2)})` : 'Disabled'}</Text>
          <Text style={styles.debugText}>Window: Hanning</Text>
        </View>

        {/* Performance Metrics */}
        <View style={styles.debugSection}>
          <Text style={styles.debugSectionTitle}>Performance</Text>
          <Text style={styles.debugText}>Memory Usage: Ring Buffer (bounded)</Text>
          <Text style={styles.debugText}>Throttling: ~60 FPS target</Text>
          <Text style={styles.debugText}>Last Update: {performanceMetrics.lastUpdateTime > 0 ? new Date(performanceMetrics.lastUpdateTime).toLocaleTimeString() : 'Never'}</Text>
        </View>

        {/* Error Display */}
        {audioLevels.error && (
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Error</Text>
            <Text style={styles.debugError}>{audioLevels.error}</Text>
            <TouchableOpacity
              style={styles.clearErrorButton}
              onPress={audioLevels.clearError}
            >
              <Text style={styles.clearErrorText}>Clear Error</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render enhanced audio level display with dB values and statistics
  const renderAudioLevelDisplay = () => {
    if (audioLevels.permissionStatus !== 'granted') {
      return null;
    }

    const rmsDb = linearToDb(audioLevels.rms);
    const peakDb = linearToDb(audioLevels.peak);
    const rmsSmoothedDb = linearToDb(audioLevels.rmsSmoothed);
    const peakSmoothedDb = linearToDb(audioLevels.peakSmoothed);

    return (
      <View style={styles.audioLevelDisplay}>
        <Text style={styles.audioLevelTitle}>Audio Levels</Text>
        
        {/* Current dB Values */}
        <View style={styles.dbValuesContainer}>
          <View style={styles.dbValueItem}>
            <Text style={styles.dbValueLabel}>RMS Level</Text>
            <Text style={[styles.dbValueText, { color: getDbColor(rmsDb) }]}>
              {formatDbValue(rmsDb)}
            </Text>
            <Text style={styles.dbValueSubtext}>
              Linear: {audioLevels.rms.toFixed(3)}
            </Text>
          </View>
          
          <View style={styles.dbValueItem}>
            <Text style={styles.dbValueLabel}>Peak Level</Text>
            <Text style={[styles.dbValueText, { color: getDbColor(peakDb) }]}>
              {formatDbValue(peakDb)}
            </Text>
            <Text style={styles.dbValueSubtext}>
              Linear: {audioLevels.peak.toFixed(3)}
            </Text>
          </View>
        </View>

        {/* Smoothed Values (if smoothing is enabled) */}
        {audioLevels.smoothingEnabled && (
          <View style={styles.smoothedValuesContainer}>
            <Text style={styles.smoothedValuesTitle}>Smoothed Values</Text>
            <View style={styles.dbValuesContainer}>
              <View style={styles.dbValueItem}>
                <Text style={styles.dbValueLabel}>RMS (Smoothed)</Text>
                <Text style={[styles.dbValueTextSmall, { color: getDbColor(rmsSmoothedDb) }]}>
                  {formatDbValue(rmsSmoothedDb)}
                </Text>
              </View>
              
              <View style={styles.dbValueItem}>
                <Text style={styles.dbValueLabel}>Peak (Smoothed)</Text>
                <Text style={[styles.dbValueTextSmall, { color: getDbColor(peakSmoothedDb) }]}>
                  {formatDbValue(peakSmoothedDb)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Audio Statistics */}
        {audioStats.sampleCount > 0 && (
          <View style={styles.audioStatsContainer}>
            <Text style={styles.audioStatsTitle}>Session Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>RMS Min</Text>
                <Text style={styles.statValue}>{formatDbValue(linearToDb(audioStats.rmsMin))}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>RMS Max</Text>
                <Text style={styles.statValue}>{formatDbValue(linearToDb(audioStats.rmsMax))}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>RMS Avg</Text>
                <Text style={styles.statValue}>{formatDbValue(linearToDb(audioStats.rmsAvg))}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Peak Max</Text>
                <Text style={styles.statValue}>{formatDbValue(linearToDb(audioStats.peakMax))}</Text>
              </View>
            </View>
            <Text style={styles.sampleCountText}>
              Samples: {audioStats.sampleCount.toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Error Display - shown at top when errors occur */}
      {renderErrorDisplay()}
      
      {/* Permission prompt - shown when permission not granted */}
      {renderPermissionPrompt()}
      
      {/* Main audio visualization - shown when permission granted */}
      {audioLevels.permissionStatus === 'granted' && (
        <>
          {/* Enhanced Audio Level Display with dB values */}
          {renderAudioLevelDisplay()}
          
          {/* Spectrum Visualizer */}
          <View style={styles.visualizerContainer}>
            <SpectrumVisualizer
              frequencyData={audioLevels.frequencyData}
              barCount={barCount}
              isAnalyzing={audioLevels.isAnalyzing}
            />
          </View>
          
          {/* Level Meter - RMS and Peak Indicators */}
          <View style={styles.levelMeterContainer}>
            <LevelMeter
              rms={audioLevels.rms}
              peak={audioLevels.peak}
              rmsSmoothed={audioLevels.rmsSmoothed}
              peakSmoothed={audioLevels.peakSmoothed}
              isAnalyzing={audioLevels.isAnalyzing}
            />
          </View>
          
          {/* Controls */}
          {renderControls()}
          
          {/* Advanced Controls */}
          {renderAdvancedControls()}
          
          {/* Debug Panel */}
          {renderDebugPanel()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  
  // Error Display styles
  errorContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  errorDetails: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  errorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  errorButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  errorButtonSecondary: {
    backgroundColor: '#555',
    borderWidth: 1,
    borderColor: '#777',
  },
  errorButtonDismiss: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorButtonTextSecondary: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  errorButtonTextDismiss: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  errorHelpText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
    flex: 1,
  },
  
  // Permission UI styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  permissionGuidance: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  permissionButtons: {
    width: '100%',
    alignItems: 'center',
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  platformNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  
  // Main visualization styles
  visualizerContainer: {
    flex: 2,
    marginBottom: 20,
  },
  levelMeterContainer: {
    flex: 1,
    marginBottom: 20,
  },
  
  // Controls styles
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#555',
    borderWidth: 1,
    borderColor: '#777',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Advanced Controls styles
  advancedControlsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  advancedControlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  controlSection: {
    marginBottom: 20,
  },
  controlSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  optionScroll: {
    flex: 2,
    marginLeft: 16,
  },
  optionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  configDisplay: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    padding: 12,
  },
  configText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Debug panel styles
  debugContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 6,
  },
  debugValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debugValueColumn: {
    flex: 1,
    marginRight: 8,
  },
  debugValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  debugText: {
    fontSize: 11,
    color: '#ccc',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  debugError: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  clearErrorButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  clearErrorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Enhanced Audio Level Display styles
  audioLevelDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  audioLevelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  dbValuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dbValueItem: {
    alignItems: 'center',
    flex: 1,
  },
  dbValueLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
    textAlign: 'center',
  },
  dbValueText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dbValueTextSmall: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dbValueSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  smoothedValuesContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  smoothedValuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  audioStatsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
  },
  audioStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#ccc',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sampleCountText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default RichAudioDemo;