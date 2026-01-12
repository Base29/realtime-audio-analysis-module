"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ModuleLinkingVerifier = void 0;
exports.generateDiagnostics = generateDiagnostics;
exports.verifyModuleLinking = verifyModuleLinking;
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
var _pathResolver = require("./path-resolver");
var _iosConfig = require("./ios-config");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class ModuleLinkingVerifier {
  constructor() {
    _defineProperty(this, "pathResolver", void 0);
    _defineProperty(this, "iosManager", void 0);
    this.pathResolver = new _pathResolver.PathResolver();
    this.iosManager = new _iosConfig.IOSConfigManager();
  }

  /**
   * Performs comprehensive verification of module linking
   */
  async verifyModuleLinking(projectRoot, moduleName) {
    const errors = [];
    const warnings = [];
    try {
      // Step 1: Detect module location
      const pathResult = this.pathResolver.detectModuleLocation(projectRoot, moduleName);
      if (!pathResult.success) {
        return {
          success: false,
          message: 'Module not found',
          details: this.createEmptyDetails(),
          errors: [pathResult.error || 'Unknown path resolution error']
        };
      }
      const moduleConfig = this.pathResolver.createModuleConfig(pathResult);
      if (!moduleConfig) {
        return {
          success: false,
          message: 'Failed to create module configuration',
          details: this.createEmptyDetails(),
          errors: ['Could not create module configuration from path result']
        };
      }

      // Step 2: Verify Android configuration
      const androidVerification = await this.verifyAndroidConfiguration(projectRoot, moduleConfig);

      // Step 3: Verify iOS configuration  
      const iosVerification = await this.verifyIOSConfiguration(projectRoot, moduleConfig);

      // Step 4: Test basic module import
      const importTest = await this.testModuleImport(projectRoot, moduleConfig);

      // Compile results
      const details = {
        moduleFound: true,
        androidConfigured: androidVerification.configured,
        iosConfigured: iosVerification.configured,
        buildConfigValid: androidVerification.buildValid && iosVerification.buildValid,
        importTestPassed: importTest.success,
        registrationVerified: androidVerification.registered || iosVerification.registered
      };

      // Collect errors and warnings
      errors.push(...androidVerification.errors, ...iosVerification.errors, ...importTest.errors);
      warnings.push(...androidVerification.warnings, ...iosVerification.warnings, ...importTest.warnings);
      const overallSuccess = details.moduleFound && (details.androidConfigured || details.iosConfigured) && details.buildConfigValid && details.registrationVerified;
      return {
        success: overallSuccess,
        message: overallSuccess ? 'Module linking verification passed' : 'Module linking verification failed',
        details,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: 'Verification process failed',
        details: this.createEmptyDetails(),
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Verifies Android platform configuration
   */
  async verifyAndroidConfiguration(projectRoot, moduleConfig) {
    const errors = [];
    const warnings = [];
    try {
      // Check if Android platform is supported
      if (moduleConfig.platform === 'ios') {
        return {
          configured: false,
          registered: false,
          buildValid: true,
          // Not applicable
          errors: [],
          warnings: ['Module does not support Android platform']
        };
      }

      // Verify MainApplication configuration
      const mainAppPath = this.findMainApplicationFile(projectRoot);
      if (!mainAppPath) {
        errors.push('MainApplication file not found');
        return {
          configured: false,
          registered: false,
          buildValid: false,
          errors,
          warnings
        };
      }
      const mainAppContent = fs.readFileSync(mainAppPath, 'utf8');
      const isImported = this.checkPackageImported(mainAppContent, moduleConfig);
      const isRegistered = this.checkPackageRegistered(mainAppContent, moduleConfig);
      if (!isImported) {
        errors.push(`Package import missing in ${path.basename(mainAppPath)}`);
      }
      if (!isRegistered) {
        errors.push(`Package not registered in getPackages() method`);
      }

      // Verify build configuration
      const buildConfigValid = this.verifyAndroidBuildConfiguration(projectRoot, moduleConfig);
      if (!buildConfigValid.valid) {
        errors.push(...buildConfigValid.errors);
      }
      const configured = isImported && isRegistered;
      const registered = isRegistered;
      return {
        configured,
        registered,
        buildValid: buildConfigValid.valid,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Android verification failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        configured: false,
        registered: false,
        buildValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Verifies iOS platform configuration
   */
  async verifyIOSConfiguration(projectRoot, moduleConfig) {
    const errors = [];
    const warnings = [];
    try {
      var _podfileInfo$pods;
      // Check if iOS platform is supported
      if (moduleConfig.platform === 'android') {
        return {
          configured: false,
          registered: false,
          buildValid: true,
          // Not applicable
          errors: [],
          warnings: ['Module does not support iOS platform']
        };
      }

      // Verify Podfile configuration
      const podfileInfo = this.iosManager.getPodfileInfo(projectRoot);
      if (!podfileInfo.exists) {
        errors.push('Podfile not found');
        return {
          configured: false,
          registered: false,
          buildValid: false,
          errors,
          warnings
        };
      }
      const isPodConfigured = ((_podfileInfo$pods = podfileInfo.pods) === null || _podfileInfo$pods === void 0 ? void 0 : _podfileInfo$pods.includes(moduleConfig.name)) || false;
      if (!isPodConfigured) {
        errors.push(`Pod '${moduleConfig.name}' not found in Podfile`);
      }

      // Check if pod install is needed
      const podlockPath = path.join(projectRoot, 'ios', 'Podfile.lock');
      const podInstallNeeded = !fs.existsSync(podlockPath);
      if (podInstallNeeded) {
        warnings.push('pod install may be needed - Podfile.lock not found');
      }
      return {
        configured: isPodConfigured,
        registered: isPodConfigured,
        // For iOS, configured means registered
        buildValid: true,
        // iOS build validation is more complex and typically handled by Xcode
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`iOS verification failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        configured: false,
        registered: false,
        buildValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Tests basic module import functionality
   */
  async testModuleImport(projectRoot, moduleConfig) {
    const errors = [];
    const warnings = [];
    try {
      var _packageJson$dependen, _packageJson$devDepen, _packageJson$peerDepe;
      // Check if the module can be imported from JavaScript
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        errors.push('package.json not found in project root');
        return {
          success: false,
          errors,
          warnings
        };
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Check if module is listed in dependencies
      const isInDependencies = ((_packageJson$dependen = packageJson.dependencies) === null || _packageJson$dependen === void 0 ? void 0 : _packageJson$dependen[moduleConfig.name]) || ((_packageJson$devDepen = packageJson.devDependencies) === null || _packageJson$devDepen === void 0 ? void 0 : _packageJson$devDepen[moduleConfig.name]) || ((_packageJson$peerDepe = packageJson.peerDependencies) === null || _packageJson$peerDepe === void 0 ? void 0 : _packageJson$peerDepe[moduleConfig.name]);
      if (!isInDependencies) {
        warnings.push(`Module '${moduleConfig.name}' not found in package.json dependencies`);
      }

      // Try to resolve the module's main entry point
      const moduleIndexPath = path.join(moduleConfig.modulePath, 'index.js');
      const modulePackageJsonPath = path.join(moduleConfig.modulePath, 'package.json');
      let mainEntryExists = false;
      if (fs.existsSync(modulePackageJsonPath)) {
        try {
          const modulePackageJson = JSON.parse(fs.readFileSync(modulePackageJsonPath, 'utf8'));
          const mainEntry = modulePackageJson.main || 'index.js';
          const mainEntryPath = path.join(moduleConfig.modulePath, mainEntry);
          mainEntryExists = fs.existsSync(mainEntryPath);
        } catch (error) {
          warnings.push('Could not parse module package.json');
        }
      } else if (fs.existsSync(moduleIndexPath)) {
        mainEntryExists = true;
      }
      if (!mainEntryExists) {
        errors.push('Module main entry point not found');
      }

      // Check for TypeScript definitions if applicable
      const hasTypeDefinitions = fs.existsSync(path.join(moduleConfig.modulePath, 'index.d.ts')) || fs.existsSync(path.join(moduleConfig.modulePath, 'lib', 'typescript'));
      if (!hasTypeDefinitions) {
        warnings.push('TypeScript definitions not found - may cause import issues in TypeScript projects');
      }
      return {
        success: mainEntryExists && errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Import test failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Generates comprehensive diagnostic information
   */
  async generateDiagnostics(projectRoot, moduleName) {
    const diagnostics = {
      projectRoot
    };
    try {
      var _diagnostics$moduleCo, _diagnostics$moduleCo2;
      // Get module configuration
      const pathResult = this.pathResolver.detectModuleLocation(projectRoot, moduleName);
      if (pathResult.success) {
        diagnostics.moduleConfig = this.pathResolver.createModuleConfig(pathResult) || undefined;
      }

      // Android diagnostics
      if (((_diagnostics$moduleCo = diagnostics.moduleConfig) === null || _diagnostics$moduleCo === void 0 ? void 0 : _diagnostics$moduleCo.platform) !== 'ios') {
        diagnostics.androidDetails = await this.generateAndroidDiagnostics(projectRoot, diagnostics.moduleConfig);
      }

      // iOS diagnostics
      if (((_diagnostics$moduleCo2 = diagnostics.moduleConfig) === null || _diagnostics$moduleCo2 === void 0 ? void 0 : _diagnostics$moduleCo2.platform) !== 'android') {
        diagnostics.iosDetails = await this.generateIOSDiagnostics(projectRoot, diagnostics.moduleConfig);
      }

      // Build system information
      diagnostics.buildSystemInfo = await this.generateBuildSystemInfo(projectRoot);
    } catch (error) {
      // Diagnostics should not fail completely, just log what we can
      console.warn('Error generating diagnostics:', error);
    }
    return diagnostics;
  }

  /**
   * Helper methods
   */
  createEmptyDetails() {
    return {
      moduleFound: false,
      androidConfigured: false,
      iosConfigured: false,
      buildConfigValid: false,
      importTestPassed: false,
      registrationVerified: false
    };
  }
  findMainApplicationFile(projectRoot) {
    const androidAppPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');
    if (!fs.existsSync(androidAppPath)) {
      return null;
    }
    const findMainApp = dir => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const result = findMainApp(filePath);
          if (result) return result;
        } else if (file === 'MainApplication.kt' || file === 'MainApplication.java') {
          return filePath;
        }
      }
      return null;
    };
    return findMainApp(androidAppPath);
  }
  checkPackageImported(content, moduleConfig) {
    const importPattern = new RegExp(`import\\s+${moduleConfig.packageName}\\.${moduleConfig.className}`);
    return importPattern.test(content);
  }
  checkPackageRegistered(content, moduleConfig) {
    const packagePattern = new RegExp(`${moduleConfig.className}\\(\\)`);
    return packagePattern.test(content);
  }
  verifyAndroidBuildConfiguration(projectRoot, moduleConfig) {
    const errors = [];

    // Check settings.gradle
    const settingsPath = path.join(projectRoot, 'android', 'settings.gradle');
    if (fs.existsSync(settingsPath)) {
      const settingsContent = fs.readFileSync(settingsPath, 'utf8');
      const projectName = `:${moduleConfig.name}`;
      if (!settingsContent.includes(projectName)) {
        errors.push(`Project '${projectName}' not included in settings.gradle`);
      }
    } else {
      errors.push('settings.gradle not found');
    }

    // Check app/build.gradle
    const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    if (fs.existsSync(buildGradlePath)) {
      const buildContent = fs.readFileSync(buildGradlePath, 'utf8');
      const dependencyStatement = `implementation project(':${moduleConfig.name}')`;
      if (!buildContent.includes(dependencyStatement)) {
        errors.push(`Dependency '${dependencyStatement}' not found in app/build.gradle`);
      }
    } else {
      errors.push('app/build.gradle not found');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
  async generateAndroidDiagnostics(projectRoot, moduleConfig) {
    const mainApplicationPath = this.findMainApplicationFile(projectRoot);
    const mainApplicationFound = !!mainApplicationPath;
    let packageImported = false;
    let packageRegistered = false;
    if (mainApplicationPath && moduleConfig) {
      const content = fs.readFileSync(mainApplicationPath, 'utf8');
      packageImported = this.checkPackageImported(content, moduleConfig);
      packageRegistered = this.checkPackageRegistered(content, moduleConfig);
    }
    let settingsGradleConfigured = false;
    let buildGradleConfigured = false;
    if (moduleConfig) {
      const buildConfig = this.verifyAndroidBuildConfiguration(projectRoot, moduleConfig);
      settingsGradleConfigured = !buildConfig.errors.some(e => e.includes('settings.gradle'));
      buildGradleConfigured = !buildConfig.errors.some(e => e.includes('build.gradle'));
    }
    return {
      mainApplicationFound,
      mainApplicationPath: mainApplicationPath || undefined,
      packageImported,
      packageRegistered,
      settingsGradleConfigured,
      buildGradleConfigured,
      buildFilesValid: settingsGradleConfigured && buildGradleConfigured
    };
  }
  async generateIOSDiagnostics(projectRoot, moduleConfig) {
    var _podfileInfo$pods2;
    const podfileInfo = this.iosManager.getPodfileInfo(projectRoot);
    const podConfigured = moduleConfig ? ((_podfileInfo$pods2 = podfileInfo.pods) === null || _podfileInfo$pods2 === void 0 ? void 0 : _podfileInfo$pods2.includes(moduleConfig.name)) || false : false;
    const iosProjectValid = this.iosManager.validateIOSProject(projectRoot).success;
    const podInstallNeeded = !fs.existsSync(path.join(projectRoot, 'ios', 'Podfile.lock'));
    return {
      podfileFound: podfileInfo.exists,
      podfilePath: podfileInfo.path,
      podConfigured,
      iosProjectValid,
      podInstallNeeded
    };
  }
  async generateBuildSystemInfo(projectRoot) {
    const info = {};
    try {
      // Get React Native version
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        var _packageJson$dependen2, _packageJson$devDepen2;
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        info.reactNativeVersion = ((_packageJson$dependen2 = packageJson.dependencies) === null || _packageJson$dependen2 === void 0 ? void 0 : _packageJson$dependen2['react-native']) || ((_packageJson$devDepen2 = packageJson.devDependencies) === null || _packageJson$devDepen2 === void 0 ? void 0 : _packageJson$devDepen2['react-native']);
      }

      // Get Node version
      info.nodeVersion = process.version;
    } catch (error) {
      // Ignore errors in build system info gathering
    }
    return info;
  }
}

/**
 * Convenience function to verify module linking
 */
exports.ModuleLinkingVerifier = ModuleLinkingVerifier;
async function verifyModuleLinking(projectRoot, moduleName) {
  const verifier = new ModuleLinkingVerifier();
  return verifier.verifyModuleLinking(projectRoot, moduleName);
}

/**
 * Convenience function to generate diagnostics
 */
async function generateDiagnostics(projectRoot, moduleName) {
  const verifier = new ModuleLinkingVerifier();
  return verifier.generateDiagnostics(projectRoot, moduleName);
}
//# sourceMappingURL=verification.js.map