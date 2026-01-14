import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { PermissionManager, PermissionStatus } from '../types/interfaces';
import NativeRealtimeAudioAnalyzer from '../../NativeRealtimeAudioAnalyzer';

/**
 * Cross-platform Permission Manager for microphone access
 * Handles both Android and iOS permission workflows
 */
export class AudioPermissionManager implements PermissionManager {
  async checkPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'android') {
      return this.checkAndroidPermission();
    } else if (Platform.OS === 'ios') {
      return this.checkIOSPermission();
    }
    return 'undetermined';
  }

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return this.requestAndroidPermission();
    } else if (Platform.OS === 'ios') {
      return this.requestIOSPermission();
    }
    return false;
  }

  openSettings(): void {
    Linking.openSettings();
  }

  getPermissionRationale(): string {
    if (Platform.OS === 'android') {
      return 'This app needs microphone access to analyze audio in real-time. Please enable microphone permission in Settings > Apps > [App Name] > Permissions > Microphone.';
    } else {
      return 'This app needs microphone access to analyze audio in real-time. Please enable microphone access in Settings > Privacy & Security > Microphone > [App Name].';
    }
  }

  private async checkAndroidPermission(): Promise<PermissionStatus> {
    try {
      const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      return result ? 'granted' : 'denied';
    } catch (error) {
      console.warn('Error checking Android permission:', error);
      return 'undetermined';
    }
  }

  private async requestAndroidPermission(): Promise<boolean> {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to analyze audio in real-time.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      // Handle all possible Android permission results
      switch (result) {
        case PermissionsAndroid.RESULTS.GRANTED:
          return true;
        case PermissionsAndroid.RESULTS.DENIED:
        case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
        default:
          return false;
      }
    } catch (error) {
      console.warn('Error requesting Android permission:', error);
      return false;
    }
  }

  private async checkIOSPermission(): Promise<PermissionStatus> {
    try {
      // On iOS, we can check permission status by attempting to get the analysis config
      // If the native module is available, we can infer permission status
      if (!NativeRealtimeAudioAnalyzer) {
        return 'undetermined';
      }

      // Try to get config - this will work if permissions are granted
      // If not granted, the native module will handle permission requests internally
      try {
        await NativeRealtimeAudioAnalyzer.getAnalysisConfig();
        return 'granted';
      } catch (error: any) {
        // Check error type to determine permission status
        if (error?.code === 'E_PERMISSION_DENIED') {
          return 'denied';
        }
        return 'undetermined';
      }
    } catch (error) {
      console.warn('Error checking iOS permission:', error);
      return 'undetermined';
    }
  }

  private async requestIOSPermission(): Promise<boolean> {
    try {
      if (!NativeRealtimeAudioAnalyzer) {
        console.warn('Native audio analyzer module not available');
        return false;
      }

      // On iOS, permission is requested automatically when starting analysis
      // We'll attempt to start with minimal config to trigger permission request
      try {
        await NativeRealtimeAudioAnalyzer.startAnalysis({
          fftSize: 1024,
          sampleRate: 44100
        });
        
        // If start succeeds, permission was granted
        // Stop immediately since this was just for permission check
        await NativeRealtimeAudioAnalyzer.stopAnalysis();
        return true;
      } catch (error: any) {
        if (error?.code === 'E_PERMISSION_DENIED') {
          return false;
        }
        // Other errors might be configuration-related, not permission
        console.warn('Error during iOS permission request:', error);
        return false;
      }
    } catch (error) {
      console.warn('Error requesting iOS permission:', error);
      return false;
    }
  }

  /**
   * Check if permission was permanently denied (Android only)
   * On iOS, users must manually enable in Settings if denied
   */
  async isPermissionBlocked(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // On Android, if permission is denied and we can't request it again,
        // it means the user selected "Don't ask again"
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (hasPermission) {
          return false; // Not blocked if already granted
        }

        // Try to request permission to see if we get NEVER_ASK_AGAIN
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
      } catch (error) {
        console.warn('Error checking if permission is blocked:', error);
        return false;
      }
    }
    
    // On iOS, we can't easily detect if permission is permanently blocked
    // Users must manually enable in Settings if they denied it
    return false;
  }

  /**
   * Get platform-specific instructions for enabling permissions manually
   */
  getManualPermissionInstructions(): string {
    if (Platform.OS === 'android') {
      return 'To enable microphone access:\n1. Open Settings\n2. Go to Apps or Application Manager\n3. Find this app\n4. Tap Permissions\n5. Enable Microphone';
    } else {
      return 'To enable microphone access:\n1. Open Settings\n2. Go to Privacy & Security\n3. Tap Microphone\n4. Find this app and enable it';
    }
  }
}