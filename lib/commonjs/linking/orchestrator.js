"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactNativeModuleLinkingOrchestrator = void 0;
exports.linkReactNativeModule = linkReactNativeModule;
exports.rollbackLinking = rollbackLinking;
var fs = _interopRequireWildcard(require("fs"));
var _pathResolver = require("./path-resolver");
var _androidConfig = require("./android-config");
var _iosConfig = require("./ios-config");
var _verification = require("./verification");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Logger class for consistent logging throughout the linking process
 */
class LinkingLogger {
  constructor() {
    _defineProperty(this, "verbose", false);
  }
  setVerbose(verbose) {
    this.verbose = verbose;
  }
  info(message) {
    console.log(`[INFO] ${message}`);
  }
  success(message) {
    console.log(`[SUCCESS] ${message}`);
  }
  warn(message) {
    console.warn(`[WARN] ${message}`);
  }
  error(message) {
    console.error(`[ERROR] ${message}`);
  }
  debug(message) {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }
}
class ReactNativeModuleLinkingOrchestrator {
  constructor() {
    _defineProperty(this, "pathResolver", void 0);
    _defineProperty(this, "androidManager", void 0);
    _defineProperty(this, "iosManager", void 0);
    _defineProperty(this, "verifier", void 0);
    _defineProperty(this, "logger", void 0);
    _defineProperty(this, "rollbackInfo", null);
    this.pathResolver = new _pathResolver.PathResolver();
    this.androidManager = new _androidConfig.AndroidConfigManager();
    this.iosManager = new _iosConfig.IOSConfigManager();
    this.verifier = new _verification.ModuleLinkingVerifier();
    this.logger = new LinkingLogger();
  }
  /**
   * Main orchestration method that coordinates the entire linking process
   */
  async linkModule(options) {
    const startTime = Date.now();
    this.logger.setVerbose(options.verbose || false);
    this.logger.info('Starting React Native module linking process...');
    // Initialize rollback tracking
    this.rollbackInfo = {
      backupFiles: new Map(),
      createdFiles: [],
      timestamp: new Date()
    };
    const errors = [];
    const warnings = [];
    const modifiedFiles = [];
    const backupFiles = [];
    try {
      // Step 1: Resolve module path and configuration
      this.logger.info('Step 1: Resolving module path and configuration...');
      const moduleResolution = await this.resolveModuleConfiguration(options);
      if (!moduleResolution.success || !moduleResolution.moduleConfig) {
        return this.createFailureResult('Module resolution failed', moduleResolution.error ? [moduleResolution.error] : ['Unknown module resolution error'], {
          moduleResolved: false,
          androidConfigured: false,
          iosConfigured: false,
          verificationPassed: false,
          rollbackAvailable: false
        });
      }
      this.logger.success(`Module resolved: ${moduleResolution.moduleConfig.name} at ${moduleResolution.moduleConfig.modulePath}`);
      this.logger.info(`Supported platforms: ${moduleResolution.moduleConfig.platform}`);
      // Step 2: Determine target platforms
      const targetPlatforms = this.determinePlatforms(options, moduleResolution.moduleConfig);
      this.logger.info(`Target platforms: ${targetPlatforms.join(', ')}`);
      // Step 3: Configure Android (if requested and supported)
      let androidConfigured = false;
      if (targetPlatforms.includes('android') && moduleResolution.moduleConfig.platform !== 'ios') {
        this.logger.info('Step 2a: Configuring Android platform...');
        const androidResult = await this.configureAndroidPlatform(options, moduleResolution.moduleConfig);
        if (androidResult.success) {
          androidConfigured = true;
          if (androidResult.modifiedFiles) {
            modifiedFiles.push(...androidResult.modifiedFiles);
          }
          if (androidResult.backupFiles) {
            backupFiles.push(...androidResult.backupFiles);
          }
          this.logger.success('Android configuration completed successfully');
        } else {
          errors.push(...(androidResult.errors || [androidResult.message]));
          this.logger.error(`Android configuration failed: ${androidResult.message}`);
          // If Android fails and it's the only platform, abort
          if (targetPlatforms.length === 1) {
            await this.performRollback();
            return this.createFailureResult('Android configuration failed', errors, {
              moduleResolved: true,
              androidConfigured: false,
              iosConfigured: false,
              verificationPassed: false,
              rollbackAvailable: true
            });
          }
        }
      }
      // Step 4: Configure iOS (if requested and supported)
      let iosConfigured = false;
      if (targetPlatforms.includes('ios') && moduleResolution.moduleConfig.platform !== 'android') {
        this.logger.info('Step 2b: Configuring iOS platform...');
        const iosResult = await this.configureIOSPlatform(options, moduleResolution.moduleConfig);
        if (iosResult.success) {
          iosConfigured = true;
          if (iosResult.modifiedFiles) {
            modifiedFiles.push(...iosResult.modifiedFiles);
          }
          if (iosResult.backupFiles) {
            backupFiles.push(...iosResult.backupFiles);
          }
          this.logger.success('iOS configuration completed successfully');
        } else {
          errors.push(...(iosResult.errors || [iosResult.message]));
          this.logger.error(`iOS configuration failed: ${iosResult.message}`);
          // If iOS fails and it's the only platform, abort
          if (targetPlatforms.length === 1) {
            await this.performRollback();
            return this.createFailureResult('iOS configuration failed', errors, {
              moduleResolved: true,
              androidConfigured: androidConfigured,
              iosConfigured: false,
              verificationPassed: false,
              rollbackAvailable: true
            });
          }
        }
      }
      // Check if at least one platform was configured
      if (!androidConfigured && !iosConfigured) {
        await this.performRollback();
        return this.createFailureResult('No platforms were successfully configured', errors.length > 0 ? errors : ['No supported platforms found or all platform configurations failed'], {
          moduleResolved: true,
          androidConfigured: false,
          iosConfigured: false,
          verificationPassed: false,
          rollbackAvailable: true
        });
      }
      // Step 5: Verification (if not skipped)
      let verificationPassed = true;
      if (!options.skipVerification) {
        this.logger.info('Step 3: Verifying module linking...');
        const verificationResult = await this.performVerification(options, moduleResolution.moduleConfig);
        if (verificationResult.success) {
          this.logger.success('Module linking verification passed');
        } else {
          verificationPassed = false;
          if (verificationResult.errors) {
            errors.push(...verificationResult.errors);
          }
          if (verificationResult.warnings) {
            warnings.push(...verificationResult.warnings);
          }
          this.logger.warn('Module linking verification failed, but configuration was applied');
        }
      }
      // Step 6: Final summary
      const duration = Date.now() - startTime;
      this.logger.info(`Linking process completed in ${duration}ms`);
      if (modifiedFiles.length > 0) {
        this.logger.info('Modified files:');
        modifiedFiles.forEach(file => this.logger.info(`  - ${file}`));
      }
      if (backupFiles.length > 0) {
        this.logger.info('Backup files created:');
        backupFiles.forEach(file => this.logger.info(`  - ${file}`));
      }
      const overallSuccess = (androidConfigured || iosConfigured) && errors.length === 0;
      return {
        success: overallSuccess,
        message: overallSuccess ? `Module linking completed successfully for ${targetPlatforms.filter((_, i) => i === 0 ? androidConfigured : iosConfigured).join(', ')}` : 'Module linking completed with errors',
        details: {
          moduleResolved: true,
          androidConfigured,
          iosConfigured,
          verificationPassed,
          rollbackAvailable: this.rollbackInfo !== null
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : undefined,
        backupFiles: backupFiles.length > 0 ? backupFiles : undefined
      };
    } catch (error) {
      this.logger.error(`Unexpected error during linking process: ${error instanceof Error ? error.message : String(error)}`);
      // Attempt rollback on unexpected errors
      await this.performRollback();
      return this.createFailureResult('Linking process failed with unexpected error', [error instanceof Error ? error.message : String(error)], {
        moduleResolved: false,
        androidConfigured: false,
        iosConfigured: false,
        verificationPassed: false,
        rollbackAvailable: true
      });
    }
  }
  /**
   * Performs rollback of all changes made during the linking process
   */
  async performRollback() {
    if (!this.rollbackInfo) {
      return {
        success: false,
        message: 'No rollback information available'
      };
    }
    this.logger.info('Performing rollback of changes...');
    const errors = [];
    try {
      // Restore backed up files
      this.rollbackInfo.backupFiles.forEach((backupFile, originalFile) => {
        try {
          if (fs.existsSync(backupFile)) {
            fs.copyFileSync(backupFile, originalFile);
            fs.unlinkSync(backupFile); // Clean up backup
            this.logger.info(`Restored: ${originalFile}`);
          }
        } catch (error) {
          const errorMsg = `Failed to restore ${originalFile}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      });
      // Remove any files that were created during the process
      for (const createdFile of this.rollbackInfo.createdFiles) {
        try {
          if (fs.existsSync(createdFile)) {
            fs.unlinkSync(createdFile);
            this.logger.info(`Removed: ${createdFile}`);
          }
        } catch (error) {
          const errorMsg = `Failed to remove ${createdFile}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }
      // Clear rollback info
      this.rollbackInfo = null;
      if (errors.length === 0) {
        this.logger.success('Rollback completed successfully');
        return {
          success: true,
          message: 'All changes have been rolled back successfully'
        };
      } else {
        return {
          success: false,
          message: 'Rollback completed with some errors',
          errors
        };
      }
    } catch (error) {
      const errorMsg = `Rollback process failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
        errors: [errorMsg]
      };
    }
  }
  /**
   * Resolves module configuration from options
   */
  async resolveModuleConfiguration(options) {
    try {
      let pathResult;
      if (options.modulePath) {
        // Use provided module path
        pathResult = this.pathResolver.resolveModulePath(options.projectRoot, options.modulePath);
      } else {
        // Auto-detect module location
        pathResult = this.pathResolver.detectModuleLocation(options.projectRoot, options.moduleName);
      }
      if (!pathResult.success) {
        return {
          success: false,
          error: pathResult.error
        };
      }
      const moduleConfig = this.pathResolver.createModuleConfig(pathResult);
      if (!moduleConfig) {
        return {
          success: false,
          error: 'Failed to create module configuration from resolved path'
        };
      }
      return {
        success: true,
        moduleConfig
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Determines which platforms to configure based on options and module support
   */
  determinePlatforms(options, moduleConfig) {
    if (options.platforms && options.platforms.length > 0) {
      // Filter requested platforms by what the module supports
      return options.platforms.filter(platform => {
        if (moduleConfig.platform === 'both') return true;
        return moduleConfig.platform === platform;
      });
    }
    // Default to all supported platforms
    if (moduleConfig.platform === 'both') {
      return ['android', 'ios'];
    } else {
      return [moduleConfig.platform];
    }
  }
  /**
   * Configures Android platform
   */
  async configureAndroidPlatform(options, moduleConfig) {
    const errors = [];
    const modifiedFiles = [];
    const backupFiles = [];
    try {
      if (options.dryRun) {
        this.logger.info('[DRY RUN] Would configure Android MainApplication and build files');
        return {
          success: true,
          message: 'Android configuration (dry run)'
        };
      }
      // Configure MainApplication
      this.logger.info('Configuring MainApplication...');
      const mainAppResult = this.androidManager.configureMainApplication(options.projectRoot, moduleConfig);
      if (!mainAppResult.success) {
        errors.push(mainAppResult.error || mainAppResult.message);
      } else {
        if (mainAppResult.modifiedFiles) {
          modifiedFiles.push(...mainAppResult.modifiedFiles);
          // Track backups
          mainAppResult.modifiedFiles.forEach(file => {
            const backupFile = `${file}.backup`;
            if (fs.existsSync(backupFile)) {
              var _this$rollbackInfo;
              backupFiles.push(backupFile);
              (_this$rollbackInfo = this.rollbackInfo) === null || _this$rollbackInfo === void 0 || _this$rollbackInfo.backupFiles.set(file, backupFile);
            }
          });
        }
        this.logger.info('MainApplication configured successfully');
      }
      // Configure build files
      this.logger.info('Configuring Android build files...');
      const buildResult = this.androidManager.configureBuildFiles(options.projectRoot, moduleConfig);
      if (!buildResult.success) {
        errors.push(buildResult.error || buildResult.message);
      } else {
        if (buildResult.modifiedFiles) {
          modifiedFiles.push(...buildResult.modifiedFiles);
          // Track backups
          buildResult.modifiedFiles.forEach(file => {
            const backupFile = `${file}.backup`;
            if (fs.existsSync(backupFile)) {
              var _this$rollbackInfo2;
              backupFiles.push(backupFile);
              (_this$rollbackInfo2 = this.rollbackInfo) === null || _this$rollbackInfo2 === void 0 || _this$rollbackInfo2.backupFiles.set(file, backupFile);
            }
          });
        }
        this.logger.info('Android build files configured successfully');
      }
      return {
        success: errors.length === 0,
        message: errors.length === 0 ? 'Android configuration completed' : 'Android configuration failed',
        errors: errors.length > 0 ? errors : undefined,
        modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : undefined,
        backupFiles: backupFiles.length > 0 ? backupFiles : undefined
      };
    } catch (error) {
      const errorMsg = `Android configuration error: ${error instanceof Error ? error.message : String(error)}`;
      return {
        success: false,
        message: errorMsg,
        errors: [errorMsg]
      };
    }
  }
  /**
   * Configures iOS platform
   */
  async configureIOSPlatform(options, moduleConfig) {
    const errors = [];
    const modifiedFiles = [];
    const backupFiles = [];
    try {
      if (options.dryRun) {
        this.logger.info('[DRY RUN] Would configure iOS Podfile');
        return {
          success: true,
          message: 'iOS configuration (dry run)'
        };
      }
      // Validate iOS project first
      this.logger.info('Validating iOS project...');
      const validationResult = this.iosManager.validateIOSProject(options.projectRoot);
      if (!validationResult.success) {
        return {
          success: false,
          message: validationResult.message,
          errors: [validationResult.error || validationResult.message]
        };
      }
      // Configure Podfile
      this.logger.info('Configuring Podfile...');
      const podfileResult = this.iosManager.configurePodfile(options.projectRoot, moduleConfig);
      if (!podfileResult.success) {
        errors.push(podfileResult.error || podfileResult.message);
      } else {
        if (podfileResult.modifiedFiles) {
          modifiedFiles.push(...podfileResult.modifiedFiles);
          // Track backups
          podfileResult.modifiedFiles.forEach(file => {
            const backupFile = `${file}.backup`;
            if (fs.existsSync(backupFile)) {
              var _this$rollbackInfo3;
              backupFiles.push(backupFile);
              (_this$rollbackInfo3 = this.rollbackInfo) === null || _this$rollbackInfo3 === void 0 || _this$rollbackInfo3.backupFiles.set(file, backupFile);
            }
          });
        }
        this.logger.info('Podfile configured successfully');
        this.logger.info('Note: Run "cd ios && pod install" to install the pod dependencies');
      }
      return {
        success: errors.length === 0,
        message: errors.length === 0 ? 'iOS configuration completed' : 'iOS configuration failed',
        errors: errors.length > 0 ? errors : undefined,
        modifiedFiles: modifiedFiles.length > 0 ? modifiedFiles : undefined,
        backupFiles: backupFiles.length > 0 ? backupFiles : undefined
      };
    } catch (error) {
      const errorMsg = `iOS configuration error: ${error instanceof Error ? error.message : String(error)}`;
      return {
        success: false,
        message: errorMsg,
        errors: [errorMsg]
      };
    }
  }
  /**
   * Performs verification of the linking configuration
   */
  async performVerification(options, moduleConfig) {
    try {
      if (options.dryRun) {
        this.logger.info('[DRY RUN] Would verify module linking');
        return {
          success: true,
          message: 'Verification (dry run)',
          details: {
            moduleFound: true,
            androidConfigured: true,
            iosConfigured: true,
            buildConfigValid: true,
            importTestPassed: true,
            registrationVerified: true
          }
        };
      }
      return await this.verifier.verifyModuleLinking(options.projectRoot, moduleConfig.name);
    } catch (error) {
      return {
        success: false,
        message: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          moduleFound: false,
          androidConfigured: false,
          iosConfigured: false,
          buildConfigValid: false,
          importTestPassed: false,
          registrationVerified: false
        },
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  /**
   * Creates a standardized failure result
   */
  createFailureResult(message, errors, details) {
    return {
      success: false,
      message,
      details,
      errors
    };
  }
}
/**
 * Convenience function to link a module with default options
 */
exports.ReactNativeModuleLinkingOrchestrator = ReactNativeModuleLinkingOrchestrator;
async function linkReactNativeModule(projectRoot, options = {}) {
  const orchestrator = new ReactNativeModuleLinkingOrchestrator();
  return orchestrator.linkModule({
    projectRoot,
    ...options
  });
}
/**
 * Convenience function to perform rollback
 */
async function rollbackLinking() {
  const orchestrator = new ReactNativeModuleLinkingOrchestrator();
  return orchestrator.performRollback();
}
//# sourceMappingURL=orchestrator.js.mappingURL=orchestrator.js.map