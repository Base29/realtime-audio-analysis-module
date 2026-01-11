#!/usr/bin/env node

/**
 * React Native Module Linking Test Script
 * 
 * This script verifies that the react-native-realtime-audio-analysis module
 * is correctly linked and integrated with a React Native application.
 * 
 * Usage:
 *   node test-module-linking.js
 * 
 * Or from package.json:
 *   npm run test:linking
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test configuration
const config = {
  moduleName: 'react-native-realtime-audio-analysis',
  nativeModuleName: 'RealtimeAudioAnalyzer',
  requiredFiles: {
    ios: [
      'ios/RealtimeAudioAnalyzer.swift',
      'RealtimeAudioAnalyzer.podspec',
    ],
    android: [
      'android/src/main/java/com/realtimeaudio/RealtimeAudioAnalyzerModule.kt',
      'android/src/main/java/com/realtimeaudio/RealtimeAudioAnalyzerPackage.kt',
      'android/build.gradle',
    ],
    javascript: [
      'src/index.tsx',
      'lib/commonjs/index.js',
      'lib/module/index.js',
      'lib/typescript/src/index.d.ts',
    ],
  },
  requiredMethods: [
    'startAnalysis',
    'stopAnalysis',
    'isAnalyzing',
  ],
  eventNames: [
    'AudioAnalysisData',
    'RealtimeAudioAnalyzer:onData',
  ],
};

class LinkingTester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logResult(testName, passed, message = '', details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const statusColor = passed ? 'green' : 'red';
    
    this.log(`${status} ${testName}`, statusColor);
    if (message) {
      this.log(`    ${message}`, 'cyan');
    }
    if (details) {
      this.log(`    ${details}`, 'yellow');
    }
    
    this.results.push({
      name: testName,
      passed,
      message,
      details,
    });
    
    if (!passed) {
      this.errors.push(`${testName}: ${message}`);
    }
  }

  logWarning(message) {
    this.log(`⚠️  WARNING: ${message}`, 'yellow');
    this.warnings.push(message);
  }

  async runTest(testName, testFn) {
    try {
      this.log(`\n🧪 Testing: ${testName}`, 'blue');
      await testFn();
    } catch (error) {
      this.logResult(testName, false, error.message, error.stack);
    }
  }

  // Test 1: Check if we're in a React Native project
  async testReactNativeProject() {
    await this.runTest('React Native Project Detection', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found. Are you in a React Native project?');
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.dependencies || !packageJson.dependencies['react-native']) {
        throw new Error('react-native not found in dependencies');
      }

      const rnVersion = packageJson.dependencies['react-native'];
      this.logResult('React Native Project Detection', true, 
        `Found React Native ${rnVersion}`, 
        'Project structure looks correct');
    });
  }

  // Test 2: Check module installation
  async testModuleInstallation() {
    await this.runTest('Module Installation', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      if (!deps[config.moduleName]) {
        throw new Error(`${config.moduleName} not found in package.json dependencies`);
      }

      // Check if node_modules contains the module
      const nodeModulesPath = path.join(process.cwd(), 'node_modules', config.moduleName);
      if (!fs.existsSync(nodeModulesPath)) {
        throw new Error(`Module not found in node_modules. Run: npm install`);
      }

      this.logResult('Module Installation', true, 
        `Module version: ${deps[config.moduleName]}`,
        'Module found in node_modules');
    });
  }

  // Test 3: Check required files exist
  async testRequiredFiles() {
    await this.runTest('Required Files Check', () => {
      const moduleRoot = path.join(process.cwd(), 'node_modules', config.moduleName);
      let missingFiles = [];
      let foundFiles = [];

      // Check all platform files
      Object.entries(config.requiredFiles).forEach(([platform, files]) => {
        files.forEach(file => {
          const filePath = path.join(moduleRoot, file);
          if (fs.existsSync(filePath)) {
            foundFiles.push(`${platform}/${file}`);
          } else {
            missingFiles.push(`${platform}/${file}`);
          }
        });
      });

      if (missingFiles.length > 0) {
        throw new Error(`Missing files: ${missingFiles.join(', ')}`);
      }

      this.logResult('Required Files Check', true,
        `Found ${foundFiles.length} required files`,
        foundFiles.slice(0, 3).join(', ') + (foundFiles.length > 3 ? '...' : ''));
    });
  }

  // Test 4: Check iOS integration
  async testIOSIntegration() {
    await this.runTest('iOS Integration', () => {
      const iosPath = path.join(process.cwd(), 'ios');
      
      if (!fs.existsSync(iosPath)) {
        this.logWarning('iOS directory not found - iOS platform not configured');
        return;
      }

      // Check for Podfile
      const podfilePath = path.join(iosPath, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        throw new Error('Podfile not found in ios directory');
      }

      // Check if pod install was run
      const podlockPath = path.join(iosPath, 'Podfile.lock');
      if (!fs.existsSync(podlockPath)) {
        throw new Error('Podfile.lock not found. Run: cd ios && pod install');
      }

      // Check Podfile.lock for our module
      const podlockContent = fs.readFileSync(podlockPath, 'utf8');
      if (!podlockContent.includes('RealtimeAudioAnalyzer')) {
        throw new Error('Module not found in Podfile.lock. Run: cd ios && pod install');
      }

      this.logResult('iOS Integration', true,
        'iOS integration looks correct',
        'Podfile.lock contains module reference');
    });
  }

  // Test 5: Check Android integration
  async testAndroidIntegration() {
    await this.runTest('Android Integration', () => {
      const androidPath = path.join(process.cwd(), 'android');
      
      if (!fs.existsSync(androidPath)) {
        this.logWarning('Android directory not found - Android platform not configured');
        return;
      }

      // Check settings.gradle for autolinking
      const settingsGradlePath = path.join(androidPath, 'settings.gradle');
      if (fs.existsSync(settingsGradlePath)) {
        const settingsContent = fs.readFileSync(settingsGradlePath, 'utf8');
        
        // For RN 0.60+ with autolinking, the module should be automatically included
        // We don't need to check for manual includes
        this.logResult('Android Integration', true,
          'Android autolinking should handle module inclusion',
          'settings.gradle found');
      } else {
        throw new Error('settings.gradle not found in android directory');
      }
    });
  }

  // Test 6: Test JavaScript module loading
  async testJavaScriptModule() {
    await this.runTest('JavaScript Module Loading', () => {
      const moduleRoot = path.join(process.cwd(), 'node_modules', config.moduleName);
      
      // Test different entry points
      const entryPoints = [
        path.join(moduleRoot, 'lib/commonjs/index.js'),
        path.join(moduleRoot, 'lib/module/index.js'),
        path.join(moduleRoot, 'src/index.tsx'),
      ];

      let loadableEntryPoints = [];
      let errors = [];

      entryPoints.forEach(entryPoint => {
        if (fs.existsSync(entryPoint)) {
          try {
            // Try to require the module (this won't work fully without React Native runtime)
            const content = fs.readFileSync(entryPoint, 'utf8');
            
            // Check for expected exports
            const hasExpectedExports = config.requiredMethods.some(method => 
              content.includes(method)
            );

            if (hasExpectedExports) {
              loadableEntryPoints.push(path.basename(entryPoint));
            }
          } catch (error) {
            errors.push(`${path.basename(entryPoint)}: ${error.message}`);
          }
        }
      });

      if (loadableEntryPoints.length === 0) {
        throw new Error(`No loadable entry points found. Errors: ${errors.join(', ')}`);
      }

      this.logResult('JavaScript Module Loading', true,
        `Found ${loadableEntryPoints.length} loadable entry points`,
        loadableEntryPoints.join(', '));
    });
  }

  // Test 7: Check TypeScript definitions
  async testTypeScriptDefinitions() {
    await this.runTest('TypeScript Definitions', () => {
      const moduleRoot = path.join(process.cwd(), 'node_modules', config.moduleName);
      const typeDefsPath = path.join(moduleRoot, 'lib/typescript/src/index.d.ts');
      
      if (!fs.existsSync(typeDefsPath)) {
        throw new Error('TypeScript definitions not found');
      }

      const typeDefsContent = fs.readFileSync(typeDefsPath, 'utf8');
      
      // Check for expected type exports
      const hasExpectedTypes = [
        'AudioAnalysisEvent',
        'AnalysisConfig',
      ].every(type => typeDefsContent.includes(type));

      if (!hasExpectedTypes) {
        throw new Error('Expected TypeScript types not found in definitions');
      }

      this.logResult('TypeScript Definitions', true,
        'TypeScript definitions look correct',
        'Found expected interface definitions');
    });
  }

  // Test 8: Check Metro bundler compatibility
  async testMetroCompatibility() {
    await this.runTest('Metro Bundler Compatibility', () => {
      const metroConfigPath = path.join(process.cwd(), 'metro.config.js');
      
      if (!fs.existsSync(metroConfigPath)) {
        this.logWarning('metro.config.js not found - using default Metro configuration');
      }

      // Check if the module can be resolved by Metro
      const moduleRoot = path.join(process.cwd(), 'node_modules', config.moduleName);
      const packageJsonPath = path.join(moduleRoot, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('Module package.json not found');
      }

      const modulePackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check entry points
      const entryPoints = ['main', 'module', 'react-native', 'source'];
      const availableEntryPoints = entryPoints.filter(ep => modulePackageJson[ep]);

      if (availableEntryPoints.length === 0) {
        throw new Error('No valid entry points found in module package.json');
      }

      this.logResult('Metro Bundler Compatibility', true,
        `Found ${availableEntryPoints.length} entry points`,
        availableEntryPoints.join(', '));
    });
  }

  // Test 9: Check autolinking configuration
  async testAutolinkingConfig() {
    await this.runTest('Autolinking Configuration', () => {
      const moduleRoot = path.join(process.cwd(), 'node_modules', config.moduleName);
      const packageJsonPath = path.join(moduleRoot, 'package.json');
      const modulePackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check for React Native autolinking configuration
      if (!modulePackageJson['react-native']) {
        this.logWarning('No react-native field in module package.json - may use default autolinking');
      }

      // Check for platform-specific configurations
      const platforms = ['ios', 'android'];
      let configuredPlatforms = [];

      platforms.forEach(platform => {
        const platformPath = path.join(moduleRoot, platform);
        if (fs.existsSync(platformPath)) {
          configuredPlatforms.push(platform);
        }
      });

      if (configuredPlatforms.length === 0) {
        throw new Error('No platform directories found');
      }

      this.logResult('Autolinking Configuration', true,
        `Configured for ${configuredPlatforms.length} platforms`,
        configuredPlatforms.join(', '));
    });
  }

  // Test 10: Runtime compatibility check
  async testRuntimeCompatibility() {
    await this.runTest('Runtime Compatibility Check', () => {
      // This test checks if the module structure is compatible with React Native runtime
      // We can't actually test runtime without a running RN app, but we can check structure

      const moduleRoot = path.join(process.cwd(), 'node_modules', config.moduleName);
      
      // Check for common compatibility issues
      const issues = [];

      // Check iOS Swift files
      const iosSwiftFiles = this.findFiles(path.join(moduleRoot, 'ios'), '.swift');
      if (iosSwiftFiles.length === 0) {
        issues.push('No Swift files found for iOS');
      }

      // Check Android Kotlin files
      const androidKotlinFiles = this.findFiles(path.join(moduleRoot, 'android'), '.kt');
      if (androidKotlinFiles.length === 0) {
        issues.push('No Kotlin files found for Android');
      }

      // Check for Objective-C bridge files (should not exist in pure Swift implementation)
      const objcBridgeFiles = this.findFiles(path.join(moduleRoot, 'ios'), '.m');
      if (objcBridgeFiles.length > 0) {
        this.logWarning(`Found ${objcBridgeFiles.length} Objective-C files - pure Swift implementation expected`);
      }

      if (issues.length > 0) {
        throw new Error(`Compatibility issues: ${issues.join(', ')}`);
      }

      this.logResult('Runtime Compatibility Check', true,
        'Module structure looks compatible',
        `iOS: ${iosSwiftFiles.length} Swift files, Android: ${androidKotlinFiles.length} Kotlin files`);
    });
  }

  // Helper method to find files with specific extension
  findFiles(dir, extension) {
    if (!fs.existsSync(dir)) return [];
    
    const files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(itemPath, extension));
      } else if (item.endsWith(extension)) {
        files.push(itemPath);
      }
    });
    
    return files;
  }

  // Generate test report
  generateReport() {
    this.log('\n' + '='.repeat(60), 'bright');
    this.log('📊 TEST REPORT', 'bright');
    this.log('='.repeat(60), 'bright');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    this.log(`\n📈 Summary:`, 'bright');
    this.log(`   Total Tests: ${totalTests}`);
    this.log(`   Passed: ${passedTests}`, passedTests > 0 ? 'green' : 'reset');
    this.log(`   Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'reset');
    this.log(`   Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'reset');

    if (failedTests === 0) {
      this.log('\n🎉 ALL TESTS PASSED!', 'green');
      this.log('✅ Module appears to be correctly linked and ready for use.', 'green');
    } else {
      this.log('\n❌ SOME TESTS FAILED', 'red');
      this.log('\n🔧 Issues to fix:', 'red');
      this.errors.forEach(error => {
        this.log(`   • ${error}`, 'red');
      });
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'yellow');
      this.warnings.forEach(warning => {
        this.log(`   • ${warning}`, 'yellow');
      });
    }

    this.log('\n📚 Next Steps:', 'blue');
    if (failedTests === 0) {
      this.log('   1. Import the TestScreen component into your app', 'blue');
      this.log('   2. Run the app and navigate to the test screen', 'blue');
      this.log('   3. Run the interactive tests to verify runtime functionality', 'blue');
    } else {
      this.log('   1. Fix the failed tests listed above', 'blue');
      this.log('   2. Re-run this script to verify fixes', 'blue');
      this.log('   3. Check the module documentation for troubleshooting', 'blue');
    }

    this.log('\n' + '='.repeat(60), 'bright');

    return failedTests === 0;
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 React Native Module Linking Test', 'bright');
    this.log(`📦 Testing module: ${config.moduleName}`, 'cyan');
    this.log(`🏠 Working directory: ${process.cwd()}`, 'cyan');

    const tests = [
      () => this.testReactNativeProject(),
      () => this.testModuleInstallation(),
      () => this.testRequiredFiles(),
      () => this.testIOSIntegration(),
      () => this.testAndroidIntegration(),
      () => this.testJavaScriptModule(),
      () => this.testTypeScriptDefinitions(),
      () => this.testMetroCompatibility(),
      () => this.testAutolinkingConfig(),
      () => this.testRuntimeCompatibility(),
    ];

    for (const test of tests) {
      await test();
    }

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const tester = new LinkingTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { LinkingTester, config };