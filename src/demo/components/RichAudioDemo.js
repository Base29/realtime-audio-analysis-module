import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
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
const RichAudioDemo = (props) => {
    const { autoStart = false, showDebug = false, barCount = 32, onError, } = props;
    // Use the audio levels hook to get real-time audio data
    const audioLevels = useRealtimeAudioLevels();
    // Permission manager for platform-specific handling
    const [permissionManager] = React.useState(() => new AudioPermissionManager());
    // Local state for UI management
    const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
    // Handle errors from the hook
    React.useEffect(() => {
        if (audioLevels.error && onError) {
            onError(new Error(audioLevels.error));
        }
    }, [audioLevels.error, onError]);
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
        if (isRequestingPermission)
            return;
        setIsRequestingPermission(true);
        try {
            const granted = await audioLevels.requestPermission();
            if (!granted && onError) {
                onError(new Error('Microphone permission was denied'));
            }
        }
        catch (error) {
            if (onError) {
                onError(error instanceof Error ? error : new Error('Failed to request permission'));
            }
        }
        finally {
            setIsRequestingPermission(false);
        }
    };
    // Handle opening settings for blocked permissions
    const handleOpenSettings = () => {
        permissionManager.openSettings();
    };
    // Handle start/stop analysis
    const handleStartAnalysis = async () => {
        try {
            await audioLevels.startAnalysis();
        }
        catch (error) {
            if (onError) {
                onError(error instanceof Error ? error : new Error('Failed to start analysis'));
            }
        }
    };
    const handleStopAnalysis = async () => {
        try {
            await audioLevels.stopAnalysis();
        }
        catch (error) {
            if (onError) {
                onError(error instanceof Error ? error : new Error('Failed to stop analysis'));
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
        return (React.createElement(View, { style: styles.permissionContainer },
            React.createElement(Text, { style: styles.permissionTitle }, "Microphone Access Required"),
            React.createElement(Text, { style: styles.permissionMessage }, "This demo needs microphone access to analyze audio in real-time and display frequency spectrum and volume levels."),
            (isBlocked || isDenied) && (React.createElement(Text, { style: styles.permissionGuidance }, permissionManager.getPermissionRationale())),
            React.createElement(View, { style: styles.permissionButtons }, !isBlocked ? (React.createElement(TouchableOpacity, { style: [styles.permissionButton, styles.primaryButton], onPress: handleRequestPermission, disabled: isRequestingPermission },
                React.createElement(Text, { style: styles.primaryButtonText }, isRequestingPermission ? 'Requesting...' : 'Enable Microphone'))) : (React.createElement(TouchableOpacity, { style: [styles.permissionButton, styles.primaryButton], onPress: handleOpenSettings },
                React.createElement(Text, { style: styles.primaryButtonText }, "Open Settings")))),
            Platform.OS === 'ios' && (React.createElement(Text, { style: styles.platformNote }, "Note: On iOS, you may need to restart the app after enabling microphone access."))));
    };
    // Render main controls
    const renderControls = () => {
        if (audioLevels.permissionStatus !== 'granted') {
            return null;
        }
        return (React.createElement(View, { style: styles.controlsContainer },
            React.createElement(TouchableOpacity, { style: [
                    styles.controlButton,
                    audioLevels.isAnalyzing ? styles.stopButton : styles.startButton
                ], onPress: audioLevels.isAnalyzing ? handleStopAnalysis : handleStartAnalysis },
                React.createElement(Text, { style: styles.controlButtonText }, audioLevels.isAnalyzing ? 'Stop Analysis' : 'Start Analysis'))));
    };
    // Render debug information if enabled
    const renderDebugPanel = () => {
        if (!showDebug || audioLevels.permissionStatus !== 'granted') {
            return null;
        }
        return (React.createElement(View, { style: styles.debugContainer },
            React.createElement(Text, { style: styles.debugTitle }, "Debug Information"),
            React.createElement(Text, { style: styles.debugText },
                "Status: ",
                audioLevels.isAnalyzing ? 'Analyzing' : 'Stopped'),
            React.createElement(Text, { style: styles.debugText },
                "RMS: ",
                audioLevels.rms.toFixed(3),
                " (Smoothed: ",
                audioLevels.rmsSmoothed.toFixed(3),
                ")"),
            React.createElement(Text, { style: styles.debugText },
                "Peak: ",
                audioLevels.peak.toFixed(3),
                " (Smoothed: ",
                audioLevels.peakSmoothed.toFixed(3),
                ")"),
            React.createElement(Text, { style: styles.debugText },
                "FFT Size: ",
                audioLevels.fftSize),
            React.createElement(Text, { style: styles.debugText },
                "Sample Rate: ",
                audioLevels.sampleRate,
                " Hz"),
            React.createElement(Text, { style: styles.debugText },
                "Smoothing: ",
                audioLevels.smoothingEnabled ? `Enabled (${audioLevels.smoothingFactor})` : 'Disabled'),
            React.createElement(Text, { style: styles.debugText },
                "Frequency Bins: ",
                audioLevels.frequencyData.length),
            audioLevels.error && (React.createElement(Text, { style: styles.debugError },
                "Error: ",
                audioLevels.error))));
    };
    return (React.createElement(View, { style: styles.container },
        renderPermissionPrompt(),
        audioLevels.permissionStatus === 'granted' && (React.createElement(React.Fragment, null,
            React.createElement(View, { style: styles.visualizerContainer },
                React.createElement(SpectrumVisualizer, { frequencyData: audioLevels.frequencyData, barCount: barCount, isAnalyzing: audioLevels.isAnalyzing })),
            React.createElement(View, { style: styles.levelMeterContainer },
                React.createElement(LevelMeter, { rms: audioLevels.rms, peak: audioLevels.peak, rmsSmoothed: audioLevels.rmsSmoothed, peakSmoothed: audioLevels.peakSmoothed, isAnalyzing: audioLevels.isAnalyzing })),
            renderControls(),
            renderDebugPanel()))));
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 16,
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
    },
    startButton: {
        backgroundColor: '#34C759',
    },
    stopButton: {
        backgroundColor: '#FF3B30',
    },
    controlButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#ccc',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    debugError: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 8,
        fontWeight: 'bold',
    },
});
export default RichAudioDemo;
