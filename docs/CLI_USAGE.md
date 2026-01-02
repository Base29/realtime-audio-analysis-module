# React Native Module Linking CLI

A comprehensive command-line tool for linking the `react-native-realtime-audio-analysis` module to React Native projects. This tool provides automated linking, diagnostics, verification, and manual guide generation.

## Installation

The CLI tool is included with the module. After installing the module, you can use the CLI commands:

```bash
npm install react-native-realtime-audio-analysis
# or
yarn add react-native-realtime-audio-analysis
```

## Commands

### `link` - Automated Linking

Automatically configure your React Native project to use the native module.

```bash
npx rn-module-link link [options]
```

**Options:**
- `-p, --platform <platform>` - Target platform: `android`, `ios`, or `both` (default: `both`)
- `-d, --dry-run` - Preview changes without modifying files
- `-v, --verbose` - Enable verbose logging
- `-r, --project-root <path>` - React Native project root directory (default: current directory)
- `-m, --module-path <path>` - Path to the module directory (auto-detected if not specified)
- `-n, --module-name <name>` - Module name to link (default: `react-native-realtime-audio-analysis`)

**Examples:**

```bash
# Link for both platforms
npx rn-module-link link

# Link only for Android
npx rn-module-link link --platform android

# Preview changes without applying them
npx rn-module-link link --dry-run

# Link with verbose output
npx rn-module-link link --verbose

# Link from a specific project directory
npx rn-module-link link --project-root /path/to/my/rn/project

# Link with custom module path
npx rn-module-link link --module-path ../local_modules/react-native-realtime-audio-analysis
```

### `diagnose` - Project Analysis

Analyze your project's current linking status and identify issues.

```bash
npx rn-module-link diagnose [options]
```

**Options:**
- `-v, --verbose` - Enable verbose logging
- `-r, --project-root <path>` - React Native project root directory (default: current directory)
- `-n, --module-name <name>` - Module name to diagnose (default: `react-native-realtime-audio-analysis`)

**Example:**

```bash
npx rn-module-link diagnose
```

**Sample Output:**

```
🔍 React Native Module Linking Diagnostics
Project: /Users/dev/MyReactNativeApp

📦 Module Information:
   ✅ Module found: react-native-realtime-audio-analysis
      Path: /Users/dev/MyReactNativeApp/node_modules/react-native-realtime-audio-analysis
      Platform: both
      Package: com.realtimeaudio
      Class: RealtimeAudioAnalyzerPackage

🤖 Android Configuration:
   MainApplication: ✅ Found
      Path: /Users/dev/MyReactNativeApp/android/app/src/main/java/com/myapp/MainApplication.kt
   Package imported: ❌ No
   Package registered: ❌ No
   settings.gradle: ❌ Not configured
   build.gradle: ❌ Not configured

🍎 iOS Configuration:
   Podfile: ✅ Found
      Path: /Users/dev/MyReactNativeApp/ios/Podfile
   Pod configured: ❌ No
   iOS project valid: ✅ Yes
   ⚠️  pod install may be needed

🔧 Build System:
   React Native: ^0.73.4
   Node.js: v18.17.0

🔍 Running verification...
❌ Module linking verification failed
   Errors:
   - Package import missing in MainApplication.kt
   - Package not registered in getPackages() method
   - Project ':react-native-realtime-audio-analysis' not included in settings.gradle
```

### `verify` - Configuration Verification

Verify that the module is correctly linked and configured.

```bash
npx rn-module-link verify [options]
```

**Options:**
- `-v, --verbose` - Enable verbose logging
- `-r, --project-root <path>` - React Native project root directory (default: current directory)
- `-n, --module-name <name>` - Module name to verify (default: `react-native-realtime-audio-analysis`)

**Example:**

```bash
npx rn-module-link verify
```

### `guide` - Manual Linking Guide

Generate a comprehensive manual linking guide for your project.

```bash
npx rn-module-link guide [options]
```

**Options:**
- `-p, --platform <platform>` - Target platform: `android`, `ios`, or `both` (default: `both`)
- `-f, --format <format>` - Output format: `markdown` or `text` (default: `markdown`)
- `-o, --output <path>` - Output file path (prints to console if not specified)
- `-v, --verbose` - Enable verbose logging
- `-r, --project-root <path>` - React Native project root directory (default: current directory)
- `-n, --module-name <name>` - Module name for guide (default: `react-native-realtime-audio-analysis`)

**Examples:**

```bash
# Generate guide and print to console
npx rn-module-link guide

# Generate Android-only guide
npx rn-module-link guide --platform android

# Save guide to file
npx rn-module-link guide --output LINKING_GUIDE.md

# Generate text format guide
npx rn-module-link guide --format text --output linking-guide.txt

# Generate iOS-specific guide
npx rn-module-link guide --platform ios --output docs/ios-linking.md
```

## Workflow Examples

### Complete Setup Workflow

```bash
# 1. Install the module
npm install react-native-realtime-audio-analysis

# 2. Analyze current state
npx rn-module-link diagnose

# 3. Preview linking changes
npx rn-module-link link --dry-run

# 4. Apply linking configuration
npx rn-module-link link

# 5. Verify the configuration
npx rn-module-link verify

# 6. Build and test your app
npx react-native run-android
npx react-native run-ios
```

### Troubleshooting Workflow

```bash
# 1. Run diagnostics to identify issues
npx rn-module-link diagnose

# 2. Generate a manual guide for reference
npx rn-module-link guide --output troubleshooting-guide.md

# 3. Try automated fixing
npx rn-module-link link

# 4. Verify the fix
npx rn-module-link verify

# 5. If issues persist, check the generated guide
cat troubleshooting-guide.md
```

### Team Setup Workflow

```bash
# Generate guides for team members
npx rn-module-link guide --platform android --output docs/android-linking.md
npx rn-module-link guide --platform ios --output docs/ios-linking.md
npx rn-module-link guide --output docs/complete-linking-guide.md

# Create a verification script for CI/CD
echo "npx rn-module-link verify" > scripts/verify-linking.sh
chmod +x scripts/verify-linking.sh
```

## Integration with Build Systems

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "link-module": "rn-module-link link",
    "verify-linking": "rn-module-link verify",
    "diagnose-linking": "rn-module-link diagnose",
    "generate-linking-guide": "rn-module-link guide --output docs/LINKING_GUIDE.md"
  }
}
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Verify Module Linking
  run: npx rn-module-link verify

# Or as part of build process
- name: Setup Module Linking
  run: |
    npx rn-module-link diagnose
    npx rn-module-link link
    npx rn-module-link verify
```

## Error Handling

The CLI tool provides detailed error messages and exit codes:

- **Exit Code 0**: Success
- **Exit Code 1**: Error or verification failure

Common error scenarios:

1. **Module Not Found**: The module is not installed or not in expected locations
2. **Configuration Errors**: Issues with MainApplication.kt, build files, or Podfile
3. **Build System Issues**: Problems with Gradle or CocoaPods configuration
4. **Permission Errors**: Insufficient permissions to modify project files

## Advanced Usage

### Programmatic Usage

You can also use the CLI functionality programmatically:

```javascript
const { ReactNativeModuleLinkingCLI } = require('react-native-realtime-audio-analysis/lib/commonjs/linking');

const cli = new ReactNativeModuleLinkingCLI();

// Link module
const result = await cli.linkModule({
  platform: 'both',
  projectRoot: '/path/to/project',
  dryRun: false,
  verbose: true
});

// Generate diagnostics
await cli.diagnose({
  projectRoot: '/path/to/project',
  verbose: true
});

// Generate manual guide
await cli.generateGuide({
  platform: 'both',
  projectRoot: '/path/to/project',
  output: './LINKING_GUIDE.md',
  format: 'markdown'
});
```

### Custom Module Configuration

For custom module configurations, you can specify different module names and paths:

```bash
# Link a different module
npx rn-module-link link --module-name my-custom-module --module-path ./local_modules/my-custom-module

# Generate guide for custom module
npx rn-module-link guide --module-name my-custom-module --output custom-guide.md
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   # Check if module is installed
   npm list react-native-realtime-audio-analysis
   
   # Try specifying the path explicitly
   npx rn-module-link link --module-path ./node_modules/react-native-realtime-audio-analysis
   ```

2. **Permission errors**
   ```bash
   # Ensure you have write permissions to project files
   ls -la android/app/src/main/java/com/yourapp/MainApplication.kt
   ```

3. **Build configuration issues**
   ```bash
   # Run diagnostics for detailed analysis
   npx rn-module-link diagnose
   
   # Clean and rebuild
   cd android && ./gradlew clean && cd ..
   cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
   ```

### Getting Help

- Run `npx rn-module-link --help` for command overview
- Run `npx rn-module-link <command> --help` for command-specific help
- Use `--verbose` flag for detailed logging
- Check the generated manual guides for step-by-step instructions

## Contributing

The CLI tool is part of the react-native-realtime-audio-analysis module. For issues, feature requests, or contributions, please visit the project repository.