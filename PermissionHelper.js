import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestAudioPermission = async () => {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions differently
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Audio Recording Permission',
        message: 'This app needs access to your microphone to analyze audio.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Audio permission granted');
      return true;
    } else {
      console.log('Audio permission denied');
      Alert.alert(
        'Permission Required',
        'Audio recording permission is required for this feature to work.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

export const checkAudioPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    return granted;
  } catch (err) {
    console.warn('Permission check error:', err);
    return false;
  }
};