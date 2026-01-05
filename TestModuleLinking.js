import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

// Test the module import
let RealtimeAudioAnalyzer;
let importError = null;

try {
  RealtimeAudioAnalyzer = require('react-native-realtime-audio-analysis').default;
  console.log('✅ Module imported successfully:', RealtimeAudioAnalyzer);
} catch (error) {
  importError = error;
  console.error('❌ Module import failed:', error);
}

const TestModuleLinking = () => {
  const testModule = () => {
    if (importError) {
      Alert.alert('Import Error', `Failed to import module: ${importError.message}`);
      return;
    }

    if (!RealtimeAudioAnalyzer) {
      Alert.alert('Module Error', 'RealtimeAudioAnalyzer is undefined');
      return;
    }

    // Test if module has expected methods
    const methods = ['startAnalysis', 'stopAnalysis', 'isAnalyzing'];
    const missingMethods = methods.filter(method => typeof RealtimeAudioAnalyzer[method] !== 'function');
    
    if (missingMethods.length > 0) {
      Alert.alert('Module Error', `Missing methods: ${missingMethods.join(', ')}`);
      return;
    }

    Alert.alert('Success!', 'Module is properly linked and has all expected methods');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
        Module Linking Test
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Import Status: {importError ? '❌ Failed' : '✅ Success'}
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Module Object: {RealtimeAudioAnalyzer ? '✅ Found' : '❌ Undefined'}
      </Text>
      
      {importError && (
        <Text style={{ color: 'red', marginBottom: 20, textAlign: 'center' }}>
          Error: {importError.message}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={testModule}
        style={{
          backgroundColor: importError ? 'red' : 'green',
          padding: 15,
          borderRadius: 10,
          marginTop: 20
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>
          Test Module Methods
        </Text>
      </TouchableOpacity>
      
      <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'gray' }}>
        If you see errors, the module is not properly linked.{'\n'}
        Check the console for detailed error messages.
      </Text>
    </View>
  );
};

export default TestModuleLinking;