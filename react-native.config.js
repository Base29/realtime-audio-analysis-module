module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: '../node_modules/react-native-realtime-audio-analysis/android/',
        packageImportPath: 'import com.realtimeaudio.RealtimeAudioAnalyzerPackage;',
      },
      ios: {
        podspecPath: '../node_modules/react-native-realtime-audio-analysis/RealtimeAudioAnalyzer.podspec',
      },
    },
  },
};