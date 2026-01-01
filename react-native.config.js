module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.realtimeaudio.RealtimeAudioAnalyzerPackage;',
      },
      ios: {
        podspecPath: './RealtimeAudioAnalyzer.podspec',
      },
    },
  },
};

