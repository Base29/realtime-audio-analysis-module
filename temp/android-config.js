"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidConfigManager = void 0;
exports.configureMainApplication = configureMainApplication;
exports.configureBuildFiles = configureBuildFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AndroidConfigManager {
    /**
     * Configures MainApplication file to register the native module package
     */
    configureMainApplication(projectRoot, moduleConfig) {
        try {
            const mainAppPath = this.findMainApplicationFile(projectRoot);
            if (!mainAppPath) {
                return {
                    success: false,
                    message: 'MainApplication file not found',
                    error: 'Could not locate MainApplication.kt or MainApplication.java file'
                };
            }
            const isKotlin = mainAppPath.endsWith('.kt');
            const content = fs.readFileSync(mainAppPath, 'utf8');
            // Check if already configured
            if (this.isAlreadyConfigured(content, moduleConfig)) {
                return {
                    success: true,
                    message: 'MainApplication already configured',
                    modifiedFiles: []
                };
            }
            const modifiedContent = this.modifyMainApplicationContent(content, moduleConfig, isKotlin);
            // Create backup
            const backupPath = `${mainAppPath}.backup`;
            fs.writeFileSync(backupPath, content);
            // Write modified content
            fs.writeFileSync(mainAppPath, modifiedContent);
            return {
                success: true,
                message: `Successfully configured ${path.basename(mainAppPath)}`,
                modifiedFiles: [mainAppPath]
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to configure MainApplication',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Finds the MainApplication file in the Android project
     */
    findMainApplicationFile(projectRoot) {
        const androidAppPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');
        if (!fs.existsSync(androidAppPath)) {
            return null;
        }
        // Recursively search for MainApplication files
        const findMainApp = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    const result = findMainApp(filePath);
                    if (result)
                        return result;
                }
                else if (file === 'MainApplication.kt' || file === 'MainApplication.java') {
                    return filePath;
                }
            }
            return null;
        };
        return findMainApp(androidAppPath);
    }
    /**
     * Checks if the MainApplication is already configured with the module
     */
    isAlreadyConfigured(content, moduleConfig) {
        const importPattern = new RegExp(`import\\s+${moduleConfig.packageName}\\.${moduleConfig.className}`);
        const packagePattern = new RegExp(`${moduleConfig.className}\\(\\)`);
        return importPattern.test(content) && packagePattern.test(content);
    }
    /**
     * Modifies the MainApplication content to include the module
     */
    modifyMainApplicationContent(content, moduleConfig, isKotlin) {
        let modifiedContent = content;
        // Add import statement
        modifiedContent = this.addImportStatement(modifiedContent, moduleConfig, isKotlin);
        // Add package to getPackages method
        modifiedContent = this.addPackageToGetPackages(modifiedContent, moduleConfig, isKotlin);
        return modifiedContent;
    }
    /**
     * Adds the import statement for the module package
     */
    addImportStatement(content, moduleConfig, _isKotlin) {
        const importStatement = `import ${moduleConfig.packageName}.${moduleConfig.className}`;
        // Find the last import statement
        const importRegex = /import\s+[^;]+[;\n]/g;
        const imports = content.match(importRegex);
        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = content.lastIndexOf(lastImport);
            const insertIndex = lastImportIndex + lastImport.length;
            return content.slice(0, insertIndex) +
                importStatement + '\n' +
                content.slice(insertIndex);
        }
        else {
            // If no imports found, add after package declaration
            const packageRegex = /package\s+[^;]+[;\n]/;
            const packageMatch = content.match(packageRegex);
            if (packageMatch) {
                const packageIndex = content.indexOf(packageMatch[0]) + packageMatch[0].length;
                return content.slice(0, packageIndex) +
                    '\n' + importStatement + '\n' +
                    content.slice(packageIndex);
            }
        }
        return content;
    }
    /**
     * Adds the package to the getPackages method
     */
    addPackageToGetPackages(content, moduleConfig, _isKotlin) {
        // Find the getPackages method
        const getPackagesRegex = /override\s+fun\s+getPackages\(\)[\s\S]*?return\s+Arrays\.asList\(([\s\S]*?)\)/;
        const match = content.match(getPackagesRegex);
        if (match) {
            const packagesContent = match[1].trim();
            const packageInstance = `${moduleConfig.className}()`;
            // Check if packages list is empty or has content
            if (packagesContent === '') {
                // Empty list
                const replacement = match[0].replace(/return\s+Arrays\.asList\(\s*\)/, `return Arrays.asList(\n        ${packageInstance}\n      )`);
                return content.replace(match[0], replacement);
            }
            else {
                // Add to existing list
                const replacement = match[0].replace(packagesContent, `${packagesContent},\n        ${packageInstance}`);
                return content.replace(match[0], replacement);
            }
        }
        // If getPackages method not found in expected format, try alternative patterns
        const alternativeRegex = /getPackages\(\)[\s\S]*?return\s+Arrays\.asList\(([\s\S]*?)\)/;
        const altMatch = content.match(alternativeRegex);
        if (altMatch) {
            const packagesContent = altMatch[1].trim();
            const packageInstance = `${moduleConfig.className}()`;
            if (packagesContent === '') {
                const replacement = altMatch[0].replace(/return\s+Arrays\.asList\(\s*\)/, `return Arrays.asList(\n        ${packageInstance}\n      )`);
                return content.replace(altMatch[0], replacement);
            }
            else {
                const replacement = altMatch[0].replace(packagesContent, `${packagesContent},\n        ${packageInstance}`);
                return content.replace(altMatch[0], replacement);
            }
        }
        return content;
    }
    /**
     * Configures Android build files (settings.gradle and app/build.gradle)
     */
    configureBuildFiles(projectRoot, moduleConfig) {
        try {
            const modifiedFiles = [];
            // Configure settings.gradle
            const settingsResult = this.configureSettingsGradle(projectRoot, moduleConfig);
            if (!settingsResult.success) {
                return settingsResult;
            }
            if (settingsResult.modifiedFiles) {
                modifiedFiles.push(...settingsResult.modifiedFiles);
            }
            // Configure app/build.gradle
            const buildResult = this.configureAppBuildGradle(projectRoot, moduleConfig);
            if (!buildResult.success) {
                return buildResult;
            }
            if (buildResult.modifiedFiles) {
                modifiedFiles.push(...buildResult.modifiedFiles);
            }
            return {
                success: true,
                message: 'Successfully configured Android build files',
                modifiedFiles
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to configure Android build files',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Configures settings.gradle to include the module project
     */
    configureSettingsGradle(projectRoot, moduleConfig) {
        const settingsPath = path.join(projectRoot, 'android', 'settings.gradle');
        if (!fs.existsSync(settingsPath)) {
            return {
                success: false,
                message: 'settings.gradle not found',
                error: `File not found: ${settingsPath}`
            };
        }
        const content = fs.readFileSync(settingsPath, 'utf8');
        const projectName = `:${moduleConfig.name}`;
        // Check if already configured
        if (content.includes(projectName)) {
            return {
                success: true,
                message: 'settings.gradle already configured',
                modifiedFiles: []
            };
        }
        // Calculate relative path from android directory to module
        const androidDir = path.join(projectRoot, 'android');
        const relativePath = path.relative(androidDir, path.join(moduleConfig.modulePath, 'android'));
        // Add project inclusion
        const includeStatement = `include '${projectName}'`;
        const projectStatement = `project('${projectName}').projectDir = new File('${relativePath}')`;
        const modifiedContent = content + '\n' + includeStatement + '\n' + projectStatement + '\n';
        // Create backup
        const backupPath = `${settingsPath}.backup`;
        fs.writeFileSync(backupPath, content);
        // Write modified content
        fs.writeFileSync(settingsPath, modifiedContent);
        return {
            success: true,
            message: 'Successfully configured settings.gradle',
            modifiedFiles: [settingsPath]
        };
    }
    /**
     * Configures app/build.gradle to add the module dependency
     */
    configureAppBuildGradle(projectRoot, moduleConfig) {
        const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
        if (!fs.existsSync(buildGradlePath)) {
            return {
                success: false,
                message: 'app/build.gradle not found',
                error: `File not found: ${buildGradlePath}`
            };
        }
        const content = fs.readFileSync(buildGradlePath, 'utf8');
        const projectName = `:${moduleConfig.name}`;
        const dependencyStatement = `implementation project('${projectName}')`;
        // Check if already configured
        if (content.includes(dependencyStatement)) {
            return {
                success: true,
                message: 'app/build.gradle already configured',
                modifiedFiles: []
            };
        }
        // Find dependencies block
        const dependenciesRegex = /dependencies\s*\{([\s\S]*?)\n\}/;
        const match = content.match(dependenciesRegex);
        if (!match) {
            return {
                success: false,
                message: 'Dependencies block not found in app/build.gradle',
                error: 'Could not locate dependencies block'
            };
        }
        // Add dependency to the dependencies block
        const dependenciesContent = match[1];
        const newDependenciesContent = dependenciesContent + `\n    ${dependencyStatement}`;
        const modifiedContent = content.replace(match[0], `dependencies {${newDependenciesContent}\n}`);
        // Create backup
        const backupPath = `${buildGradlePath}.backup`;
        fs.writeFileSync(backupPath, content);
        // Write modified content
        fs.writeFileSync(buildGradlePath, modifiedContent);
        return {
            success: true,
            message: 'Successfully configured app/build.gradle',
            modifiedFiles: [buildGradlePath]
        };
    }
}
exports.AndroidConfigManager = AndroidConfigManager;
/**
 * Convenience function to configure MainApplication
 */
function configureMainApplication(projectRoot, moduleConfig) {
    const manager = new AndroidConfigManager();
    return manager.configureMainApplication(projectRoot, moduleConfig);
}
/**
 * Convenience function to configure Android build files
 */
function configureBuildFiles(projectRoot, moduleConfig) {
    const manager = new AndroidConfigManager();
    return manager.configureBuildFiles(projectRoot, moduleConfig);
}
