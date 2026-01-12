function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import * as fs from 'fs';
import * as path from 'path';
export class PathResolver {
  constructor() {
    _defineProperty(this, "MODULE_NAME", 'react-native-realtime-audio-analysis');
  }
  /**
   * Detects the installation location of the module
   * Checks common locations: node_modules, local_modules, and absolute paths
   */
  detectModuleLocation(projectRoot, moduleName) {
    const targetModule = moduleName || this.MODULE_NAME;
    // Define possible installation locations in order of preference
    const possiblePaths = [
    // node_modules (standard npm install)
    path.join(projectRoot, 'node_modules', targetModule),
    // local_modules (local development)
    path.join(projectRoot, 'local_modules', targetModule),
    // Direct sibling directory (common for local development)
    path.join(path.dirname(projectRoot), targetModule),
    // Current directory (if running from within the module)
    projectRoot];
    for (const modulePath of possiblePaths) {
      const result = this.validateModulePath(modulePath);
      if (result.success) {
        return result;
      }
    }
    return {
      success: false,
      error: `Module '${targetModule}' not found in any of the expected locations: ${possiblePaths.join(', ')}`
    };
  }
  /**
   * Validates that a given path contains a valid React Native module
   * with the required Android project structure
   */
  validateModulePath(modulePath) {
    try {
      // Check if the module directory exists
      if (!fs.existsSync(modulePath)) {
        return {
          success: false,
          error: `Module path does not exist: ${modulePath}`
        };
      }
      // Check if it's a directory
      const stats = fs.statSync(modulePath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: `Module path is not a directory: ${modulePath}`
        };
      }
      // Validate Android project structure
      const androidProjectPath = path.join(modulePath, 'android');
      const androidValidation = this.validateAndroidProjectStructure(androidProjectPath);
      // Validate iOS project structure
      const iosProjectPath = path.join(modulePath, 'ios');
      const iosValidation = this.validateIosProjectStructure(iosProjectPath);
      // At least one platform must be valid
      if (!androidValidation.isValid && !iosValidation.isValid) {
        return {
          success: false,
          error: `No valid platform projects found. Android: ${androidValidation.error}, iOS: ${iosValidation.error}`
        };
      }
      return {
        success: true,
        modulePath,
        androidProjectPath: androidValidation.isValid ? androidProjectPath : undefined,
        iosProjectPath: iosValidation.isValid ? iosProjectPath : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Error validating module path: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Validates Android project structure exists and contains required files
   */
  validateAndroidProjectStructure(androidPath) {
    if (!fs.existsSync(androidPath)) {
      return {
        isValid: false,
        error: 'Android directory not found'
      };
    }
    // Check for build.gradle file
    const buildGradlePath = path.join(androidPath, 'build.gradle');
    if (!fs.existsSync(buildGradlePath)) {
      return {
        isValid: false,
        error: 'Android build.gradle not found'
      };
    }
    // Check for source directory structure
    const srcMainPath = path.join(androidPath, 'src', 'main');
    if (!fs.existsSync(srcMainPath)) {
      return {
        isValid: false,
        error: 'Android src/main directory not found'
      };
    }
    // Check for Java/Kotlin source files
    const javaPath = path.join(srcMainPath, 'java');
    const kotlinPath = path.join(srcMainPath, 'kotlin');
    if (!fs.existsSync(javaPath) && !fs.existsSync(kotlinPath)) {
      return {
        isValid: false,
        error: 'No Java or Kotlin source directories found'
      };
    }
    return {
      isValid: true
    };
  }
  /**
   * Validates iOS project structure exists and contains required files
   */
  validateIosProjectStructure(iosPath) {
    if (!fs.existsSync(iosPath)) {
      return {
        isValid: false,
        error: 'iOS directory not found'
      };
    }
    // Check for at least one iOS source file (.m, .swift, .h)
    const files = fs.readdirSync(iosPath);
    const hasIosFiles = files.some(file => file.endsWith('.m') || file.endsWith('.swift') || file.endsWith('.h') || file.endsWith('.mm'));
    if (!hasIosFiles) {
      return {
        isValid: false,
        error: 'No iOS source files found'
      };
    }
    return {
      isValid: true
    };
  }
  /**
   * Resolves the absolute path for different installation types
   */
  resolveModulePath(projectRoot, pathInput) {
    let resolvedPath;
    // Handle different path formats
    if (path.isAbsolute(pathInput)) {
      // Absolute path
      resolvedPath = pathInput;
    } else if (pathInput.startsWith('./') || pathInput.startsWith('../')) {
      // Relative path
      resolvedPath = path.resolve(projectRoot, pathInput);
    } else {
      // Assume it's a module name, try to detect location
      return this.detectModuleLocation(projectRoot, pathInput);
    }
    return this.validateModulePath(resolvedPath);
  }
  /**
   * Creates a module configuration object from a resolved path
   */
  createModuleConfig(pathResult) {
    if (!pathResult.success || !pathResult.modulePath) {
      return null;
    }
    // Determine platform support
    let platform = 'both';
    if (pathResult.androidProjectPath && !pathResult.iosProjectPath) {
      platform = 'android';
    } else if (pathResult.iosProjectPath && !pathResult.androidProjectPath) {
      platform = 'ios';
    }
    return {
      name: this.MODULE_NAME,
      packageName: 'com.realtimeaudio',
      className: 'RealtimeAudioAnalyzerPackage',
      modulePath: pathResult.modulePath,
      platform
    };
  }
}
/**
 * Convenience function to detect and validate module installation
 */
export function detectModule(projectRoot, moduleName) {
  const resolver = new PathResolver();
  return resolver.detectModuleLocation(projectRoot, moduleName);
}
/**
 * Convenience function to resolve a module path from various input formats
 */
export function resolveModulePath(projectRoot, pathInput) {
  const resolver = new PathResolver();
  return resolver.resolveModulePath(projectRoot, pathInput);
}
//# sourceMappingURL=path-resolver.js.map