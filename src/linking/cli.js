#!/usr/bin/env node
import { Command } from 'commander';
import * as chalk from 'chalk';
import { PathResolver, detectModule } from './path-resolver';
import { verifyModuleLinking, generateDiagnostics } from './verification';
import { ManualLinkingGuideGenerator } from './manual-guide';
import { ReactNativeModuleLinkingOrchestrator, linkReactNativeModule } from './orchestrator';
class ReactNativeModuleLinkingCLI {
    pathResolver;
    guideGenerator;
    verbose = false;
    constructor() {
        this.pathResolver = new PathResolver();
        this.guideGenerator = new ManualLinkingGuideGenerator();
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
            this.log(chalk.blue('🔗 React Native Module Linking Tool'));
            this.log(chalk.gray(`Project: ${projectRoot}`));
            this.log(chalk.gray(`Platform: ${platform}`));
            this.log(chalk.gray(`Mode: ${dryRun ? 'Dry Run' : 'Execute'}`));
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
            const orchestratorResult = await linkReactNativeModule(projectRoot, orchestratorOptions);
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
                this.log(chalk.green(`🎉 ${result.message}`));
            }
            else {
                this.log(chalk.red(`❌ ${result.message}`));
            }
            // Summary
            this.printSummary(result, dryRun);
        }
        catch (error) {
            result.errors.push(error instanceof Error ? error.message : String(error));
            result.message = 'Unexpected error during linking process';
            this.log(chalk.red(`💥 ${result.message}: ${result.errors[result.errors.length - 1]}`));
        }
        return result;
    }
    /**
     * Resolves the module location based on CLI options
     */
    async resolveModuleLocation(projectRoot, options) {
        if (options.modulePath) {
            this.verbose && this.log(chalk.gray(`   Using provided path: ${options.modulePath}`));
            return this.pathResolver.resolveModulePath(projectRoot, options.modulePath);
        }
        else {
            const moduleName = options.moduleName || 'react-native-realtime-audio-analysis';
            this.verbose && this.log(chalk.gray(`   Detecting module: ${moduleName}`));
            return detectModule(projectRoot, moduleName);
        }
    }
    /**
     * Prints a summary of the linking results
     */
    printSummary(result, dryRun) {
        this.log(chalk.blue('📋 Summary:'));
        if (result.modifiedFiles.length > 0) {
            this.log(chalk.green(`   Files modified: ${result.modifiedFiles.length}`));
            if (this.verbose) {
                result.modifiedFiles.forEach(file => {
                    this.log(chalk.gray(`   - ${file}`));
                });
            }
        }
        else if (!dryRun) {
            this.log(chalk.yellow('   No files were modified (already configured)'));
        }
        if (result.warnings.length > 0) {
            this.log(chalk.yellow(`   Warnings: ${result.warnings.length}`));
            if (this.verbose) {
                result.warnings.forEach(warning => {
                    this.log(chalk.yellow(`   ⚠️  ${warning}`));
                });
            }
        }
        if (result.errors.length > 0) {
            this.log(chalk.red(`   Errors: ${result.errors.length}`));
            result.errors.forEach(error => {
                this.log(chalk.red(`   ❌ ${error}`));
            });
        }
        if (!dryRun && result.success) {
            this.log('');
            this.log(chalk.blue('🚀 Next steps:'));
            if (result.androidResult?.success) {
                this.log(chalk.gray('   - For Android: Run "cd android && ./gradlew clean" to clean build cache'));
            }
            if (result.iosResult?.success) {
                this.log(chalk.gray('   - For iOS: Run "cd ios && pod install" to install pod dependencies'));
            }
            this.log(chalk.gray('   - Rebuild your React Native app'));
            this.log(chalk.gray('   - Test the module import in your JavaScript code'));
        }
    }
    /**
     * Diagnostic command to analyze current linking status
     */
    async diagnose(options) {
        const projectRoot = options.projectRoot || process.cwd();
        this.verbose = options.verbose || false;
        this.log(chalk.blue('🔍 React Native Module Linking Diagnostics'));
        this.log(chalk.gray(`Project: ${projectRoot}`));
        this.log('');
        try {
            const diagnostics = await generateDiagnostics(projectRoot, options.moduleName);
            // Module information
            this.log(chalk.yellow('📦 Module Information:'));
            if (diagnostics.moduleConfig) {
                this.log(chalk.green(`   ✅ Module found: ${diagnostics.moduleConfig.name}`));
                this.log(chalk.gray(`      Path: ${diagnostics.moduleConfig.modulePath}`));
                this.log(chalk.gray(`      Platform: ${diagnostics.moduleConfig.platform}`));
                this.log(chalk.gray(`      Package: ${diagnostics.moduleConfig.packageName}`));
                this.log(chalk.gray(`      Class: ${diagnostics.moduleConfig.className}`));
            }
            else {
                this.log(chalk.red('   ❌ Module not found'));
            }
            this.log('');
            // Android diagnostics
            if (diagnostics.androidDetails) {
                this.log(chalk.yellow('🤖 Android Configuration:'));
                this.log(`   MainApplication: ${diagnostics.androidDetails.mainApplicationFound ? chalk.green('✅ Found') : chalk.red('❌ Not found')}`);
                if (diagnostics.androidDetails.mainApplicationPath) {
                    this.log(chalk.gray(`      Path: ${diagnostics.androidDetails.mainApplicationPath}`));
                }
                this.log(`   Package imported: ${diagnostics.androidDetails.packageImported ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
                this.log(`   Package registered: ${diagnostics.androidDetails.packageRegistered ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
                this.log(`   settings.gradle: ${diagnostics.androidDetails.settingsGradleConfigured ? chalk.green('✅ Configured') : chalk.red('❌ Not configured')}`);
                this.log(`   build.gradle: ${diagnostics.androidDetails.buildGradleConfigured ? chalk.green('✅ Configured') : chalk.red('❌ Not configured')}`);
                this.log('');
            }
            // iOS diagnostics
            if (diagnostics.iosDetails) {
                this.log(chalk.yellow('🍎 iOS Configuration:'));
                this.log(`   Podfile: ${diagnostics.iosDetails.podfileFound ? chalk.green('✅ Found') : chalk.red('❌ Not found')}`);
                if (diagnostics.iosDetails.podfilePath) {
                    this.log(chalk.gray(`      Path: ${diagnostics.iosDetails.podfilePath}`));
                }
                this.log(`   Pod configured: ${diagnostics.iosDetails.podConfigured ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
                this.log(`   iOS project valid: ${diagnostics.iosDetails.iosProjectValid ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
                if (diagnostics.iosDetails.podInstallNeeded) {
                    this.log(chalk.yellow('   ⚠️  pod install may be needed'));
                }
                this.log('');
            }
            // Build system information
            if (diagnostics.buildSystemInfo) {
                this.log(chalk.yellow('🔧 Build System:'));
                if (diagnostics.buildSystemInfo.reactNativeVersion) {
                    this.log(chalk.gray(`   React Native: ${diagnostics.buildSystemInfo.reactNativeVersion}`));
                }
                if (diagnostics.buildSystemInfo.nodeVersion) {
                    this.log(chalk.gray(`   Node.js: ${diagnostics.buildSystemInfo.nodeVersion}`));
                }
                this.log('');
            }
            // Run verification
            this.log(chalk.yellow('🔍 Running verification...'));
            const verification = await verifyModuleLinking(projectRoot, options.moduleName);
            if (verification.success) {
                this.log(chalk.green('✅ Module linking verification passed'));
            }
            else {
                this.log(chalk.red('❌ Module linking verification failed'));
                if (verification.errors) {
                    this.log(chalk.red('   Errors:'));
                    verification.errors.forEach(error => {
                        this.log(chalk.red(`   - ${error}`));
                    });
                }
                if (verification.warnings) {
                    this.log(chalk.yellow('   Warnings:'));
                    verification.warnings.forEach(warning => {
                        this.log(chalk.yellow(`   - ${warning}`));
                    });
                }
            }
        }
        catch (error) {
            this.log(chalk.red(`💥 Diagnostics failed: ${error instanceof Error ? error.message : String(error)}`));
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
        this.log(chalk.blue('📖 Generating Manual Linking Guide'));
        this.log(chalk.gray(`Project: ${projectRoot}`));
        this.log(chalk.gray(`Platform: ${platform}`));
        this.log(chalk.gray(`Format: ${format}`));
        this.log('');
        try {
            // Resolve module configuration
            const pathResult = await this.resolveModuleLocation(projectRoot, options);
            if (!pathResult.success || !pathResult.modulePath) {
                this.log(chalk.red(`❌ Module not found: ${pathResult.error}`));
                return;
            }
            const moduleConfig = this.pathResolver.createModuleConfig(pathResult);
            if (!moduleConfig) {
                this.log(chalk.red('❌ Failed to create module configuration'));
                return;
            }
            this.log(chalk.green(`✅ Module found: ${moduleConfig.modulePath}`));
            this.log(chalk.gray(`   Platforms: ${moduleConfig.platform}`));
            this.log('');
            // Generate guide
            this.log(chalk.yellow('📝 Generating guide...'));
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
                this.log(chalk.green(`✅ Guide saved to: ${options.output}`));
            }
            else {
                this.log(chalk.blue('📋 Generated Manual Linking Guide:'));
                this.log('');
                console.log(guide);
            }
        }
        catch (error) {
            this.log(chalk.red(`💥 Guide generation failed: ${error instanceof Error ? error.message : String(error)}`));
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
function setupCLI() {
    const program = new Command();
    const cli = new ReactNativeModuleLinkingCLI();
    program
        .name('rn-module-link')
        .description('React Native Module Linking Tool for react-native-realtime-audio-analysis')
        .version('1.0.0');
    // Link command
    program
        .command('link')
        .description('Link the React Native module to your project')
        .option('-p, --platform <platform>', 'Target platform (android, ios, both)', 'both')
        .option('-d, --dry-run', 'Preview changes without modifying files', false)
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-r, --project-root <path>', 'React Native project root directory', process.cwd())
        .option('-m, --module-path <path>', 'Path to the module directory')
        .option('-n, --module-name <name>', 'Module name to link', 'react-native-realtime-audio-analysis')
        .action(async (options) => {
        const result = await cli.linkModule(options);
        process.exit(result.success ? 0 : 1);
    });
    // Diagnose command
    program
        .command('diagnose')
        .description('Diagnose current module linking status')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-r, --project-root <path>', 'React Native project root directory', process.cwd())
        .option('-n, --module-name <name>', 'Module name to diagnose', 'react-native-realtime-audio-analysis')
        .action(async (options) => {
        await cli.diagnose(options);
    });
    // Verify command
    program
        .command('verify')
        .description('Verify module linking configuration')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-r, --project-root <path>', 'React Native project root directory', process.cwd())
        .option('-n, --module-name <name>', 'Module name to verify', 'react-native-realtime-audio-analysis')
        .action(async (options) => {
        try {
            const verification = await verifyModuleLinking(options.projectRoot || process.cwd(), options.moduleName);
            console.log(chalk.blue('🔍 Module Linking Verification'));
            console.log('');
            if (verification.success) {
                console.log(chalk.green('✅ Verification passed'));
                console.log(chalk.gray(`   ${verification.message}`));
            }
            else {
                console.log(chalk.red('❌ Verification failed'));
                console.log(chalk.gray(`   ${verification.message}`));
                if (verification.errors) {
                    console.log(chalk.red('   Errors:'));
                    verification.errors.forEach(error => {
                        console.log(chalk.red(`   - ${error}`));
                    });
                }
                if (verification.warnings) {
                    console.log(chalk.yellow('   Warnings:'));
                    verification.warnings.forEach(warning => {
                        console.log(chalk.yellow(`   - ${warning}`));
                    });
                }
            }
            process.exit(verification.success ? 0 : 1);
        }
        catch (error) {
            console.log(chalk.red(`💥 Verification failed: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
    // Guide command
    program
        .command('guide')
        .description('Generate manual linking guide')
        .option('-p, --platform <platform>', 'Target platform (android, ios, both)', 'both')
        .option('-f, --format <format>', 'Output format (markdown, text)', 'markdown')
        .option('-o, --output <path>', 'Output file path (prints to console if not specified)')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-r, --project-root <path>', 'React Native project root directory', process.cwd())
        .option('-n, --module-name <name>', 'Module name for guide', 'react-native-realtime-audio-analysis')
        .action(async (options) => {
        await cli.generateGuide(options);
    });
    // Rollback command
    program
        .command('rollback')
        .description('Rollback previous linking changes')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .action(async (_options) => {
        try {
            console.log(chalk.blue('🔄 Rolling back module linking changes...'));
            console.log('');
            const orchestrator = new ReactNativeModuleLinkingOrchestrator();
            const rollbackResult = await orchestrator.performRollback();
            if (rollbackResult.success) {
                console.log(chalk.green('✅ Rollback completed successfully'));
                console.log(chalk.gray(`   ${rollbackResult.message}`));
            }
            else {
                console.log(chalk.red('❌ Rollback failed'));
                console.log(chalk.gray(`   ${rollbackResult.message}`));
                if (rollbackResult.errors) {
                    console.log(chalk.red('   Errors:'));
                    rollbackResult.errors.forEach(error => {
                        console.log(chalk.red(`   - ${error}`));
                    });
                }
            }
            process.exit(rollbackResult.success ? 0 : 1);
        }
        catch (error) {
            console.log(chalk.red(`💥 Rollback failed: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });
    program.parse();
}
// Run CLI if this file is executed directly
if (require.main === module) {
    setupCLI();
}
export { ReactNativeModuleLinkingCLI, setupCLI };
