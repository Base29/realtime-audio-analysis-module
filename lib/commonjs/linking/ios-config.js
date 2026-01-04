"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IOSConfigManager = void 0;
exports.configurePodfile = configurePodfile;
exports.validateIOSProject = validateIOSProject;
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
class IOSConfigManager {
  /**
   * Configures Podfile to include the native module pod
   */
  configurePodfile(projectRoot, moduleConfig) {
    try {
      const podfilePath = this.findPodfile(projectRoot);
      if (!podfilePath) {
        return {
          success: false,
          message: 'Podfile not found',
          error: 'Could not locate Podfile in iOS project directory'
        };
      }
      const content = fs.readFileSync(podfilePath, 'utf8');
      // Check if already configured
      if (this.isAlreadyConfigured(content, moduleConfig)) {
        return {
          success: true,
          message: 'Podfile already configured',
          modifiedFiles: []
        };
      }
      const modifiedContent = this.modifyPodfileContent(content, moduleConfig, projectRoot);
      // Create backup
      const backupPath = `${podfilePath}.backup`;
      fs.writeFileSync(backupPath, content);
      // Write modified content
      fs.writeFileSync(podfilePath, modifiedContent);
      return {
        success: true,
        message: `Successfully configured ${path.basename(podfilePath)}`,
        modifiedFiles: [podfilePath]
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to configure Podfile',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Finds the Podfile in the iOS project
   */
  findPodfile(projectRoot) {
    const iosPath = path.join(projectRoot, 'ios');
    if (!fs.existsSync(iosPath)) {
      return null;
    }
    const podfilePath = path.join(iosPath, 'Podfile');
    if (fs.existsSync(podfilePath)) {
      return podfilePath;
    }
    return null;
  }
  /**
   * Checks if the Podfile is already configured with the module
   */
  isAlreadyConfigured(content, moduleConfig) {
    // Look for pod reference with the module name
    const podPattern = new RegExp(`pod\\s+['"]${moduleConfig.name}['"]`);
    return podPattern.test(content);
  }
  /**
   * Modifies the Podfile content to include the module pod
   */
  modifyPodfileContent(content, moduleConfig, projectRoot) {
    // Calculate relative path from iOS directory to module
    const iosDir = path.join(projectRoot, 'ios');
    const relativePath = path.relative(iosDir, moduleConfig.modulePath);
    // Create pod statement with path
    const podStatement = `  pod '${moduleConfig.name}', :path => '${relativePath}'`;
    // Find the target block to add the pod to
    const targetRegex = /target\s+['"][^'"]+['"]\s+do([\s\S]*?)end/;
    const match = content.match(targetRegex);
    if (match) {
      // Add pod to the target block
      const targetContent = match[1];
      const newTargetContent = targetContent + '\n' + podStatement + '\n';
      const modifiedContent = content.replace(match[0], match[0].replace(targetContent, newTargetContent));
      return modifiedContent;
    } else {
      // If no target block found, try to find a general location to add the pod
      // Look for existing pod statements and add after them
      const podRegex = /pod\s+['"][^'"]+['"][^\n]*\n/g;
      const pods = content.match(podRegex);
      if (pods && pods.length > 0) {
        const lastPod = pods[pods.length - 1];
        const lastPodIndex = content.lastIndexOf(lastPod);
        const insertIndex = lastPodIndex + lastPod.length;
        return content.slice(0, insertIndex) + podStatement + '\n' + content.slice(insertIndex);
      } else {
        // If no pods found, add at the end of the file
        return content + '\n' + podStatement + '\n';
      }
    }
  }
  /**
   * Validates that the iOS project structure is ready for pod configuration
   */
  validateIOSProject(projectRoot) {
    const iosPath = path.join(projectRoot, 'ios');
    if (!fs.existsSync(iosPath)) {
      return {
        success: false,
        message: 'iOS project directory not found',
        error: `Directory not found: ${iosPath}`
      };
    }
    const podfilePath = path.join(iosPath, 'Podfile');
    if (!fs.existsSync(podfilePath)) {
      return {
        success: false,
        message: 'Podfile not found',
        error: `Podfile not found at: ${podfilePath}`
      };
    }
    // Check if Podfile is readable
    try {
      fs.readFileSync(podfilePath, 'utf8');
    } catch (error) {
      return {
        success: false,
        message: 'Podfile is not readable',
        error: error instanceof Error ? error.message : String(error)
      };
    }
    return {
      success: true,
      message: 'iOS project is ready for configuration'
    };
  }
  /**
   * Gets information about the current Podfile configuration
   */
  getPodfileInfo(projectRoot) {
    const podfilePath = this.findPodfile(projectRoot);
    if (!podfilePath) {
      return {
        exists: false
      };
    }
    try {
      const content = fs.readFileSync(podfilePath, 'utf8');
      // Extract existing pod declarations
      const podRegex = /pod\s+['"]([^'"]+)['"][^\n]*/g;
      const pods = [];
      let match;
      while ((match = podRegex.exec(content)) !== null) {
        pods.push(match[1]);
      }
      return {
        exists: true,
        path: podfilePath,
        content,
        pods
      };
    } catch (error) {
      return {
        exists: true,
        path: podfilePath
      };
    }
  }
}
/**
 * Convenience function to configure Podfile
 */
exports.IOSConfigManager = IOSConfigManager;
function configurePodfile(projectRoot, moduleConfig) {
  const manager = new IOSConfigManager();
  return manager.configurePodfile(projectRoot, moduleConfig);
}
/**
 * Convenience function to validate iOS project
 */
function validateIOSProject(projectRoot) {
  const manager = new IOSConfigManager();
  return manager.validateIOSProject(projectRoot);
}
//# sourceMappingURL=ios-config.js.map-config.js.map