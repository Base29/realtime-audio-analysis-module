# Module Linking Verification

This document describes the verification and diagnostic tools for React Native module linking.

## Overview

The verification system provides comprehensive tools to check if the `react-native-realtime-audio-analysis` module is properly linked in a React Native project. It validates both Android and iOS configurations and provides detailed diagnostic information.

## Features

### 1. Module Linking Verification

The `verifyModuleLinking` function performs a complete check of the module linking status:

```typescript
import { verifyModuleLinking } from 'react-native-realtime-audio-analysis/linking';

const result = await verifyModuleLinking('/path/to/react-native-project');

console.log('Verification result:', result);
```

#### Verification Checks

- **Module Detection**: Confirms the module is installed and accessible
- **Android Configuration**: Verifies MainApplication.kt registration and build configuration
- **iOS Configuration**: Checks Podfile configuration and iOS project setup
- **Build System**: Validates gradle and pod configurations
- **Import Testing**: Tests basic module import functionality
- **Registration**: Confirms the native module is properly registered

#### Result Structure

```typescript
interface VerificationResult {
  success: boolean;
  message: string;
  details: {
    moduleFound: boolean;
    androidConfigured: boolean;
    iosConfigured: boolean;
    buildConfigValid: boolean;
    importTestPassed: boolean;
    registrationVerified: boolean;
  };
  errors?: string[];
  warnings?: string[];
}
```

### 2. Diagnostic Information

The `generateDiagnostics` function provides detailed information about the project and module configuration:

```typescript
import { generateDiagnostics } from 'react-native-realtime-audio-analysis/linking';

const diagnostics = await generateDiagnostics('/path/to/react-native-project');

console.log('Diagnostics:', diagnostics);
```

#### Diagnostic Data

- **Module Configuration**: Path, platform support, package details
- **Android Details**: MainApplication status, build file configuration
- **iOS Details**: Podfile status, pod configuration, project validity
- **Build System Info**: React Native version, Node.js version, tool versions

## Usage Examples

### Basic Verification

```typescript
import { verifyModuleLinking } from 'react-native-realtime-audio-analysis/linking';

async function checkLinking() {
  const result = await verifyModuleLinking(process.cwd());
  
  if (result.success) {
    console.log('✅ Module is properly linked!');
  } else {
    console.log('❌ Linking issues found:');
    result.errors?.forEach(error => console.log(`  - ${error}`));
  }
}
```

### Detailed Diagnostics

```typescript
import { generateDiagnostics } from 'react-native-realtime-audio-analysis/linking';

async function showDiagnostics() {
  const diagnostics = await generateDiagnostics(process.cwd());
  
  console.log('Project:', diagnostics.projectRoot);
  console.log('Module:', diagnostics.moduleConfig?.name);
  console.log('Platform:', diagnostics.moduleConfig?.platform);
  
  if (diagnostics.androidDetails) {
    console.log('Android configured:', diagnostics.androidDetails.packageRegistered);
  }
  
  if (diagnostics.iosDetails) {
    console.log('iOS configured:', diagnostics.iosDetails.podConfigured);
  }
}
```

### Command Line Usage

Use the provided example scripts for command-line verification:

```bash
# JavaScript version
node examples/verify-linking.js /path/to/project

# TypeScript version (requires ts-node)
npx ts-node examples/verify-linking.ts /path/to/project

# With custom module name
node examples/verify-linking.js /path/to/project custom-module-name
```

## Error Handling

The verification system handles various error conditions gracefully:

- **Module Not Found**: When the module is not installed or not accessible
- **Configuration Errors**: Missing or incorrect MainApplication/Podfile configuration
- **Build System Issues**: Problems with gradle or pod configurations
- **Import Failures**: Issues with module entry points or dependencies

All errors are collected and reported in the verification result, allowing for comprehensive troubleshooting.

## Integration

The verification tools can be integrated into:

- **Development Workflows**: Automated checks during development
- **CI/CD Pipelines**: Validation before builds
- **Troubleshooting Scripts**: Diagnostic tools for support
- **Setup Automation**: Verification after automatic linking

## API Reference

### Functions

#### `verifyModuleLinking(projectRoot: string, moduleName?: string): Promise<VerificationResult>`

Performs comprehensive module linking verification.

- `projectRoot`: Path to the React Native project root
- `moduleName`: Optional custom module name (defaults to 'react-native-realtime-audio-analysis')
- Returns: Promise resolving to verification result

#### `generateDiagnostics(projectRoot: string, moduleName?: string): Promise<DiagnosticInfo>`

Generates detailed diagnostic information.

- `projectRoot`: Path to the React Native project root  
- `moduleName`: Optional custom module name
- Returns: Promise resolving to diagnostic information

### Classes

#### `ModuleLinkingVerifier`

Main verification class providing all verification functionality.

```typescript
const verifier = new ModuleLinkingVerifier();
const result = await verifier.verifyModuleLinking('/path/to/project');
const diagnostics = await verifier.generateDiagnostics('/path/to/project');
```

## Requirements Validation

This verification system validates the following requirements:

- **Requirement 5.4**: Module linking verification functionality
  - ✅ Checks if module is properly registered
  - ✅ Verifies build configuration is correct  
  - ✅ Tests basic module import functionality
  - ✅ Provides comprehensive diagnostic information
  - ✅ Handles error conditions gracefully
  - ✅ Supports both Android and iOS platforms