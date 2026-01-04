#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactNativeModuleLinkingCLI = void 0;
exports.setupCLI = setupCLI;
var _commander = require("commander");
var _chalk = _interopRequireDefault(require("chalk"));
var _pathResolver = require("./path-resolver");
var _verification = require("./verification");
var _manualGuide = require("./manual-guide");
var _orchestrator = require("./orchestrator");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class ReactNativeModuleLinkingCLI {
  verbose = false;
  constructor() {
    this.pathResolver = new _pathResolver.PathResolver();
    this.guideGenerator = new _manualGuide.ManualLinkingGuideGenerator();
  }

  /**
   * Main linking command that orchestrates the entire process using the orchestrator
   */
  async linkModule(options) {
    const result = {
      success: false,
      message: '',
      modifiedFiles: [],
      errors: [],
      warnings: []
    };
    this.verbose = options.verbose || false;
    const projectRoot = options.projectRoot || process.cwd();
    const platform = options.platform || 'both';
    const dryRun = options.dryRun || false;
    try {
      this.log(_chalk.default.blue('🔗 React Native Module Linking Tool'));
      this.log(_chalk.default.gray(`Project: ${projectRoot}`));
      this.log(_chalk.default.gray(`Platform: ${platform}`));
      this.log(_chalk.default.gray(`Mode: ${dryRun ? 'Dry Run' : 'Execute'}`));
      this.log('');

      // Use the orchestrator for the linking process
      const orchestratorOptions = {
        projectRoot,
        moduleName: options.moduleName,
        modulePath: options.modulePath,
        platforms: platform === 'both' ? ['android', 'ios'] : [platform],
        dryRun,
        verbose: this.verbose,
        skipVerification: false,
        createBackups: true
      };
      const orchestratorResult = await (0, _orchestrator.linkReactNativeModule)(projectRoot, orchestratorOptions);

      // Convert orchestrator result to CLI result format
      result.success = orchestratorResult.success;
      result.message = orchestratorResult.message;
      result.modifiedFiles = orchestratorResult.modifiedFiles || [];
      result.errors = orchestratorResult.errors || [];
      result.warnings = orchestratorResult.warnings || [];

      // Map orchestrator details to CLI result format
      if (orchestratorResult.details.androidConfigured) {
        result.androidResult = {
          success: true,
          message: 'Android configuration completed',
          modifiedFiles: result.modifiedFiles.filter(f => f.includes('android'))
        };
      }
      if (orchestratorResult.details.iosConfigured) {
        result.iosResult = {
          success: true,
          message: 'iOS configuration completed',
          modifiedFiles: result.modifiedFiles.filter(f => f.includes('ios'))
        };
      }

      // Print results using orchestrator's built-in logging
      if (result.success) {
        this.log(_chalk.default.green(`🎉 ${result.message}`));
      } else {
        this.log(_chalk.default.red(`❌ ${result.message}`));
      }

      // Summary
      this.printSummary(result, dryRun);
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.message = 'Unexpected error during linking process';
      this.log(_chalk.default.red(`💥 ${result.message}: ${result.errors[result.errors.length - 1]}`));
    }
    return result;
  }

  /**
   * Resolves the module location based on CLI options
   */
  async resolveModuleLocation(projectRoot, options) {
    if (options.modulePath) {
      this.verbose && this.log(_chalk.default.gray(`   Using provided path: ${options.modulePath}`));
      return this.pathResolver.resolveModulePath(projectRoot, options.modulePath);
    } else {
      const moduleName = options.moduleName || 'react-native-realtime-audio-analysis';
      this.verbose && this.log(_chalk.default.gray(`   Detecting module: ${moduleName}`));
      return (0, _pathResolver.detectModule)(projectRoot, moduleName);
    }
  }

  /**
   * Prints a summary of the linking results
   */
  printSummary(result, dryRun) {
    this.log(_chalk.default.blue('📋 Summary:'));
    if (result.modifiedFiles.length > 0) {
      this.log(_chalk.default.green(`   Files modified: ${result.modifiedFiles.length}`));
      if (this.verbose) {
        result.modifiedFiles.forEach(file => {
          this.log(_chalk.default.gray(`   - ${file}`));
        });
      }
    } else if (!dryRun) {
      this.log(_chalk.default.yellow('   No files were modified (already configured)'));
    }
    if (result.warnings.length > 0) {
      this.log(_chalk.default.yellow(`   Warnings: ${result.warnings.length}`));
      if (this.verbose) {
        result.warnings.forEach(warning => {
          this.log(_chalk.default.yellow(`   ⚠️  ${warning}`));
        });
      }
    }
    if (result.errors.length > 0) {
      this.log(_chalk.default.red(`   Errors: ${result.errors.length}`));
      result.errors.forEach(error => {
        this.log(_chalk.default.red(`   ❌ ${error}`));
      });
    }
    if (!dryRun && result.success) {
      this.log('');
      this.log(_chalk.default.blue('🚀 Next steps:'));
      if (result.androidResult?.success) {
        this.log(_chalk.default.gray('   - For Android: Run "cd android && ./gradlew clean" to clean build cache'));
      }
      if (result.iosResult?.success) {
        this.log(_chalk.default.gray('   - For iOS: Run "cd ios && pod install" to install pod dependencies'));
      }
      this.log(_chalk.default.gray('   - Rebuild your React Native app'));
      this.log(_chalk.default.gray('   - Test the module import in your JavaScript code'));
    }
  }

  /**
   * Diagnostic command to analyze current linking status
   */
  async diagnose(options) {
    const projectRoot = options.projectRoot || process.cwd();
    this.verbose = options.verbose || false;
    this.log(_chalk.default.blue('🔍 React Native Module Linking Diagnostics'));
    this.log(_chalk.default.gray(`Project: ${projectRoot}`));
    this.log('');
    try {
      const diagnostics = await (0, _verification.generateDiagnostics)(projectRoot, options.moduleName);

      // Module information
      this.log(_chalk.default.yellow('📦 Module Information:'));
      if (diagnostics.moduleConfig) {
        this.log(_chalk.default.green(`   ✅ Module found: ${diagnostics.moduleConfig.name}`));
        this.log(_chalk.default.gray(`      Path: ${diagnostics.moduleConfig.modulePath}`));
        this.log(_chalk.default.gray(`      Platform: ${diagnostics.moduleConfig.platform}`));
        this.log(_chalk.default.gray(`      Package: ${diagnostics.moduleConfig.packageName}`));
        this.log(_chalk.default.gray(`      Class: ${diagnostics.moduleConfig.className}`));
      } else {
        this.log(_chalk.default.red('   ❌ Module not found'));
      }
      this.log('');

      // Android diagnostics
      if (diagnostics.androidDetails) {
        this.log(_chalk.default.yellow('🤖 Android Configuration:'));
        this.log(`   MainApplication: ${diagnostics.androidDetails.mainApplicationFound ? _chalk.default.green('✅ Found') : _chalk.default.red('❌ Not found')}`);
        if (diagnostics.androidDetails.mainApplicationPath) {
          this.log(_chalk.default.gray(`      Path: ${diagnostics.androidDetails.mainApplicationPath}`));
        }
        this.log(`   Package imported: ${diagnostics.androidDetails.packageImported ? _chalk.default.green('✅ Yes') : _chalk.default.red('❌ No')}`);
        this.log(`   Package registered: ${diagnostics.androidDetails.packageRegistered ? _chalk.default.green('✅ Yes') : _chalk.default.red('❌ No')}`);
        this.log(`   settings.gradle: ${diagnostics.androidDetails.settingsGradleConfigured ? _chalk.default.green('✅ Configured') : _chalk.default.red('❌ Not configured')}`);
        this.log(`   build.gradle: ${diagnostics.androidDetails.buildGradleConfigured ? _chalk.default.green('✅ Configured') : _chalk.default.red('❌ Not configured')}`);
        this.log('');
      }

      // iOS diagnostics
      if (diagnostics.iosDetails) {
        this.log(_chalk.default.yellow('🍎 iOS Configuration:'));
        this.log(`   Podfile: ${diagnostics.iosDetails.podfileFound ? _chalk.default.green('✅ Found') : _chalk.default.red('❌ Not found')}`);
        if (diagnostics.iosDetails.podfilePath) {
          this.log(_chalk.default.gray(`      Path: ${diagnostics.iosDetails.podfilePath}`));
        }
        this.log(`   Pod configured: ${diagnostics.iosDetails.podConfigured ? _chalk.default.green('✅ Yes') : _chalk.default.red('❌ No')}`);
        this.log(`   iOS project valid: ${diagnostics.iosDetails.iosProjectValid ? _chalk.default.green('✅ Yes') : _chalk.default.red('❌ No')}`);
        if (diagnostics.iosDetails.podInstallNeeded) {
          this.log(_chalk.default.yellow('   ⚠️  pod install may be needed'));
        }
        this.log('');
      }

      // Build system information
      if (diagnostics.buildSystemInfo) {
        this.log(_chalk.default.yellow('🔧 Build System:'));
        if (diagnostics.buildSystemInfo.reactNativeVersion) {
          this.log(_chalk.default.gray(`   React Native: ${diagnostics.buildSystemInfo.reactNativeVersion}`));
        }
        if (diagnostics.buildSystemInfo.nodeVersion) {
          this.log(_chalk.default.gray(`   Node.js: ${diagnostics.buildSystemInfo.nodeVersion}`));
        }
        this.log('');
      }

      // Run verification
      this.log(_chalk.default.yellow('🔍 Running verification...'));
      const verification = await (0, _verification.verifyModuleLinking)(projectRoot, options.moduleName);
      if (verification.success) {
        this.log(_chalk.default.green('✅ Module linking verification passed'));
      } else {
        this.log(_chalk.default.red('❌ Module linking verification failed'));
        if (verification.errors) {
          this.log(_chalk.default.red('   Errors:'));
          verification.errors.forEach(error => {
            this.log(_chalk.default.red(`   - ${error}`));
          });
        }
        if (verification.warnings) {
          this.log(_chalk.default.yellow('   Warnings:'));
          verification.warnings.forEach(warning => {
            this.log(_chalk.default.yellow(`   - ${warning}`));
          });
        }
      }
    } catch (error) {
      this.log(_chalk.default.red(`💥 Diagnostics failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * Generates a manual linking guide
   */
  async generateGuide(options) {
    const projectRoot = options.projectRoot || process.cwd();
    const platform = options.platform || 'both';
    const format = options.format || 'markdown';
    this.verbose = options.verbose || false;
    this.log(_chalk.default.blue('📖 Generating Manual Linking Guide'));
    this.log(_chalk.default.gray(`Project: ${projectRoot}`));
    this.log(_chalk.default.gray(`Platform: ${platform}`));
    this.log(_chalk.default.gray(`Format: ${format}`));
    this.log('');
    try {
      // Resolve module configuration
      const pathResult = await this.resolveModuleLocation(projectRoot, options);
      if (!pathResult.success || !pathResult.modulePath) {
        this.log(_chalk.default.red(`❌ Module not found: ${pathResult.error}`));
        return;
      }
      const moduleConfig = this.pathResolver.createModuleConfig(pathResult);
      if (!moduleConfig) {
        this.log(_chalk.default.red('❌ Failed to create module configuration'));
        return;
      }
      this.log(_chalk.default.green(`✅ Module found: ${moduleConfig.modulePath}`));
      this.log(_chalk.default.gray(`   Platforms: ${moduleConfig.platform}`));
      this.log('');

      // Generate guide
      this.log(_chalk.default.yellow('📝 Generating guide...'));
      const guideOptions = {
        platform,
        projectRoot,
        moduleConfig,
        outputFormat: format,
        includeVerification: true,
        includeTroubleshooting: true
      };
      const guide = this.guideGenerator.generateGuide(guideOptions);

      // Output guide
      if (options.output) {
        this.guideGenerator.saveGuide(guide, options.output);
        this.log(_chalk.default.green(`✅ Guide saved to: ${options.output}`));
      } else {
        this.log(_chalk.default.blue('📋 Generated Manual Linking Guide:'));
        this.log('');
        console.log(guide);
      }
    } catch (error) {
      this.log(_chalk.default.red(`💥 Guide generation failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * Utility method for logging with verbose control
   */
  log(message) {
    console.log(message);
  }
}

/**
 * CLI Program Setup
 */
exports.ReactNativeModuleLinkingCLI = ReactNativeModuleLinkingCLI;
function setupCLI() {
  const program = new _commander.Command();
  const cli = new ReactNativeModuleLinkingCLI();
  program.name('rn-module-link').description('React Native Module Linking Tool for react-native-realtime-audio-analysis').version('1.0.0');

  // Link command
  program.command('link').description('Link the React Native module to your project').option('-p, --platform <platform>', 'Target platform (android, ios, both)', 'both').option('-d, --dry-run', 'Preview changes without modifying files', false).option('-v, --verbose', 'Enable verbose logging', false).option('-r, --project-root <path>', 'React Native project root directory', process.cwd()).option('-m, --module-path <path>', 'Path to the module directory').option('-n, --module-name <name>', 'Module name to link', 'react-native-realtime-audio-analysis').action(async options => {
    const result = await cli.linkModule(options);
    process.exit(result.success ? 0 : 1);
  });

  // Diagnose command
  program.command('diagnose').description('Diagnose current module linking status').option('-v, --verbose', 'Enable verbose logging', false).option('-r, --project-root <path>', 'React Native project root directory', process.cwd()).option('-n, --module-name <name>', 'Module name to diagnose', 'react-native-realtime-audio-analysis').action(async options => {
    await cli.diagnose(options);
  });

  // Verify command
  program.command('verify').description('Verify module linking configuration').option('-v, --verbose', 'Enable verbose logging', false).option('-r, --project-root <path>', 'React Native project root directory', process.cwd()).option('-n, --module-name <name>', 'Module name to verify', 'react-native-realtime-audio-analysis').action(async options => {
    try {
      const verification = await (0, _verification.verifyModuleLinking)(options.projectRoot || process.cwd(), options.moduleName);
      console.log(_chalk.default.blue('🔍 Module Linking Verification'));
      console.log('');
      if (verification.success) {
        console.log(_chalk.default.green('✅ Verification passed'));
        console.log(_chalk.default.gray(`   ${verification.message}`));
      } else {
        console.log(_chalk.default.red('❌ Verification failed'));
        console.log(_chalk.default.gray(`   ${verification.message}`));
        if (verification.errors) {
          console.log(_chalk.default.red('   Errors:'));
          verification.errors.forEach(error => {
            console.log(_chalk.default.red(`   - ${error}`));
          });
        }
        if (verification.warnings) {
          console.log(_chalk.default.yellow('   Warnings:'));
          verification.warnings.forEach(warning => {
            console.log(_chalk.default.yellow(`   - ${warning}`));
          });
        }
      }
      process.exit(verification.success ? 0 : 1);
    } catch (error) {
      console.log(_chalk.default.red(`💥 Verification failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

  // Guide command
  program.command('guide').description('Generate manual linking guide').option('-p, --platform <platform>', 'Target platform (android, ios, both)', 'both').option('-f, --format <format>', 'Output format (markdown, text)', 'markdown').option('-o, --output <path>', 'Output file path (prints to console if not specified)').option('-v, --verbose', 'Enable verbose logging', false).option('-r, --project-root <path>', 'React Native project root directory', process.cwd()).option('-n, --module-name <name>', 'Module name for guide', 'react-native-realtime-audio-analysis').action(async options => {
    await cli.generateGuide(options);
  });

  // Rollback command
  program.command('rollback').description('Rollback previous linking changes').option('-v, --verbose', 'Enable verbose logging', false).action(async _options => {
    try {
      console.log(_chalk.default.blue('🔄 Rolling back module linking changes...'));
      console.log('');
      const orchestrator = new _orchestrator.ReactNativeModuleLinkingOrchestrator();
      const rollbackResult = await orchestrator.performRollback();
      if (rollbackResult.success) {
        console.log(_chalk.default.green('✅ Rollback completed successfully'));
        console.log(_chalk.default.gray(`   ${rollbackResult.message}`));
      } else {
        console.log(_chalk.default.red('❌ Rollback failed'));
        console.log(_chalk.default.gray(`   ${rollbackResult.message}`));
        if (rollbackResult.errors) {
          console.log(_chalk.default.red('   Errors:'));
          rollbackResult.errors.forEach(error => {
            console.log(_chalk.default.red(`   - ${error}`));
          });
        }
      }
      process.exit(rollbackResult.success ? 0 : 1);
    } catch (error) {
      console.log(_chalk.default.red(`💥 Rollback failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
  program.parse();
}

// Run CLI if this file is executed directly
if (require.main === module) {
  setupCLI();
}
//# sourceMappingURL=cli.js.map