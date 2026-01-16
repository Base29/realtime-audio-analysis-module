import React from 'react';
import { render } from '@testing-library/react-native';
import RichAudioDemo from '../RichAudioDemo';

// Mock the audio analyzer module
jest.mock('../../../index', () => ({
  startAnalysis: jest.fn().mockResolvedValue(undefined),
  stopAnalysis: jest.fn().mockResolvedValue(undefined),
  onData: jest.fn().mockReturnValue({ remove: jest.fn() }),
  setSmoothing: jest.fn().mockResolvedValue(undefined),
  setFftConfig: jest.fn().mockResolvedValue(undefined),
}));

// Mock the permission manager
jest.mock('../../utils/PermissionManager', () => ({
  AudioPermissionManager: jest.fn().mockImplementation(() => ({
    checkPermission: jest.fn().mockResolvedValue('granted'),
    requestPermission: jest.fn().mockResolvedValue(true),
    openSettings: jest.fn(),
    getPermissionRationale: jest.fn().mockReturnValue('Test rationale'),
  })),
}));

// Mock the audio levels hook
jest.mock('../../hooks/useRealtimeAudioLevels', () => ({
  useRealtimeAudioLevels: () => ({
    permissionStatus: 'granted',
    requestPermission: jest.fn().mockResolvedValue(true),
    isAnalyzing: true,
    rms: 0.5,
    peak: 0.8,
    rmsSmoothed: 0.45,
    peakSmoothed: 0.75,
    frequencyData: new Array(32).fill(0).map((_, i) => Math.random() * 0.8),
    sampleRate: 44100,
    fftSize: 1024,
    smoothingEnabled: true,
    smoothingFactor: 0.8,
    startAnalysis: jest.fn().mockResolvedValue(undefined),
    stopAnalysis: jest.fn().mockResolvedValue(undefined),
    setSmoothing: jest.fn().mockResolvedValue(undefined),
    setFftConfig: jest.fn().mockResolvedValue(undefined),
    error: null,
    clearError: jest.fn(),
    retryLastOperation: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('RichAudioDemo Enhanced Features', () => {
  it('renders without crashing with enhanced features', () => {
    const { getByText } = render(<RichAudioDemo />);
    
    // Check if the enhanced audio level display is present
    expect(getByText('Audio Levels')).toBeTruthy();
  });

  it('displays dB values correctly', () => {
    const { getByText } = render(<RichAudioDemo />);
    
    // Should display RMS and Peak labels
    expect(getByText('RMS Level')).toBeTruthy();
    expect(getByText('Peak Level')).toBeTruthy();
  });

  it('shows session statistics when analyzing', () => {
    const { getByText } = render(<RichAudioDemo />);
    
    // Should show statistics section
    expect(getByText('Session Statistics')).toBeTruthy();
  });

  it('displays smoothed values when smoothing is enabled', () => {
    const { getByText } = render(<RichAudioDemo />);
    
    // Should show smoothed values section
    expect(getByText('Smoothed Values')).toBeTruthy();
  });

  it('handles debug mode correctly', () => {
    const { getByText } = render(<RichAudioDemo showDebug={true} />);
    
    // Should show debug information
    expect(getByText('Debug Information')).toBeTruthy();
  });
});