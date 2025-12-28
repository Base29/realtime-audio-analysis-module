import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    PermissionsAndroid,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import {
    RealtimeAudioAnalyzer,
    AudioAnalysisEvent,
} from 'react-native-realtime-audio-analysis';

// Configuration
const FFT_SIZE = 1024;
const BAR_COUNT = 32; // Number of bars to display
const MIN_DB = -60; // Noise floor for normalization
const MAX_DB = 0;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * A reusable Audio Visualizer component.
 * 
 * Features:
 * - Real-time frequency spectrum (Bar Chart)
 * - RMS Volume Indicator (Pulsing Circle)
 * - Start/Stop Controls
 * - Auto-permission handling
 */
export const AudioVisualizer = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [fftData, setFftData] = useState<number[]>(new Array(BAR_COUNT).fill(0));
    const [rms, setRms] = useState(0);
    const [peak, setPeak] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();
        return () => stopAnalysis();
    }, []);

    const checkPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Permission',
                    message: 'Needed for audio analysis.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                setHasPermission(true);
                return true;
            } else {
                console.warn('Microphone permission denied');
                setHasPermission(false);
                return false;
            }
        } else {
            // iOS permissions are handled by the module start() automatically 
            // or check AVAudioSession manually. Module handles rejection gracefully.
            setHasPermission(true);
            return true;
        }
    };

    const startAnalysis = async () => {
        try {
            setError(null);
            
            if (!hasPermission) {
                const granted = await checkPermissions();
                if (!granted) {
                    setError('Microphone permission is required');
                    return;
                }
            }

            // 1. Subscribe to events
            RealtimeAudioAnalyzer.addListener(onAudioData);

            // 2. Start the engine
            // We request downsampling to BAR_COUNT natively for performance!
            await RealtimeAudioAnalyzer.start({
                bufferSize: FFT_SIZE,
                sampleRate: 44100,
                callbackRateHz: 30, // 30 FPS is good for UI
                emitFft: true,
            });

            // 3. Configure specific DSP settings
            await RealtimeAudioAnalyzer.setFftConfig(FFT_SIZE, BAR_COUNT);
            await RealtimeAudioAnalyzer.setSmoothing(true, 0.5); // Smooth out jitter

            setIsRecording(true);
        } catch (e: any) {
            const errorMsg = e?.message || 'Failed to start audio analysis';
            console.error('Failed to start analysis:', e);
            setError(errorMsg);
            setIsRecording(false);
        }
    };

    const stopAnalysis = async () => {
        try {
            await RealtimeAudioAnalyzer.stop();
            RealtimeAudioAnalyzer.removeAllListeners();
            setIsRecording(false);
            // Reset visuals
            setRms(0);
            setPeak(0);
            setFftData(new Array(BAR_COUNT).fill(0));
        } catch (e) {
            console.error('Failed to stop:', e);
        }
    };

    const onAudioData = useCallback((data: AudioAnalysisEvent) => {
        setRms(data.rms);
        setPeak(data.peak);

        // Data.fft is an array of 0.0 - 1.0 (linear magnitude)
        // We can use it directly for bar heights
        if (data.fft && data.fft.length > 0) {
            setFftData(data.fft);
        }
    }, []);

    // --- Render Helpers ---

    const renderBars = () => {
        const barWidth = (SCREEN_WIDTH - 40) / BAR_COUNT - 2; // Spacing logic

        return (
            <View style={styles.spectrumContainer}>
                {fftData.map((magnitude, index) => {
                    // Amplify low signals for better visibility
                    const height = Math.min(magnitude * 250, 200);

                    // Color gradient logic based on index or height
                    const opacity = 0.5 + magnitude * 0.5;
                    const green = 255 - (index / BAR_COUNT) * 100;
                    const blue = (index / BAR_COUNT) * 255;
                    const color = `rgba(0, ${green}, ${blue}, 1)`;

                    return (
                        <View
                            key={index}
                            style={[
                                styles.bar,
                                {
                                    width: barWidth,
                                    height: Math.max(height, 2), // Min height
                                    backgroundColor: color,
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Real-Time Audio Analyzer</Text>
            
            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* 1. RMS / Peak Circle Indicator */}
            <View style={styles.meterContainer}>
                <View
                    style={[
                        styles.rmsCircle,
                        {
                            // Scale circle by RMS (0.0 - 1.0)
                            transform: [{ scale: 1 + rms * 3 }], // Amplify for visual effect
                            opacity: 0.3 + peak * 0.7,
                        },
                    ]}
                />
                <Text style={styles.statText}>RMS: {rms.toFixed(3)}</Text>
                <Text style={styles.statText}>Peak: {peak.toFixed(3)}</Text>
            </View>

            {/* 2. Frequency Spectrum */}
            {renderBars()}

            {/* 3. Controls */}
            <View style={styles.controls}>
                {!isRecording ? (
                    <TouchableOpacity
                        style={[styles.button, styles.startBtn]}
                        onPress={startAnalysis}
                    >
                        <Text style={styles.btnText}>START</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, styles.stopBtn]}
                        onPress={stopAnalysis}
                    >
                        <Text style={styles.btnText}>STOP</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 20,
    },
    meterContainer: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    rmsCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#00ffaa',
        position: 'absolute',
    },
    statText: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 100, // Push below circle
    },
    spectrumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: 200,
        width: '100%',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        marginBottom: 30,
    },
    bar: {
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        marginHorizontal: 1,
    },
    controls: {
        flexDirection: 'row',
        marginTop: 20,
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        minWidth: 150,
        alignItems: 'center',
    },
    startBtn: {
        backgroundColor: '#00ffaa',
        shadowColor: '#00ffaa',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    stopBtn: {
        backgroundColor: '#ff4444',
    },
    btnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorContainer: {
        backgroundColor: '#ff4444',
        padding: 10,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 5,
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
});
