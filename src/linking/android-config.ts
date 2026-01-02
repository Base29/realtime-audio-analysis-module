import * as fs from 'fs';
import * as path from 'path';
import { ModuleConfig } from './path-resolver';

export interface AndroidConfigResult {
  success: boolean;
  message: string;
  error?: string;
  modifiedFiles?: string[];
}

export class AndroidConfigManager {
  /**
   * Configures MainApplication file to register the native module package
   */
  public configureMainApplication(
    projectRoot: string, 
    moduleConfig: ModuleConfig
  ): AndroidConfigResult {
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

    } catch (error) {
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
  private findMainApplicationFile(projectRoot: string): string | null {
    const androidAppPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');
    
    if (!fs.existsSync(androidAppPath)) {
      return null;
    }

    // Recursively search for MainApplication files
    const findMainApp = (dir: string): string | null => {
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

  /**
   * Checks if the MainApplication is already configured with the module
   */
  private isAlreadyConfigured(content: string, moduleConfig: ModuleConfig): boolean {
    const importPattern = new RegExp(`import\\s+${moduleConfig.packageName}\\.${moduleConfig.className}`);
    const packagePattern = new RegExp(`${moduleConfig.className}\\(\\)`);
    
    return importPattern.test(content) && packagePattern.test(content);
  }

  /**
   * Modifies the MainApplication content to include the module
   */
  private modifyMainApplicationContent(
    content: string, 
    moduleConfig: ModuleConfig, 
    isKotlin: boolean
  ): string {
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
  private addImportStatement(
    content: string, 
    moduleConfig: ModuleConfig, 
    _isKotlin: boolean
  ): string {
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
    } else {
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
  private addPackageToGetPackages(
    content: string, 
    moduleConfig: ModuleConfig, 
    _isKotlin: boolean
  ): string {
    // Find the getPackages method
    const getPackagesRegex = /override\s+fun\s+getPackages\(\)[\s\S]*?return\s+Arrays\.asList\(([\s\S]*?)\)/;
    const match = content.match(getPackagesRegex);
    
    if (match) {
      const packagesContent = match[1].trim();
      const packageInstance = `${moduleConfig.className}()`;
      
      // Check if packages list is empty or has content
      if (packagesContent === '') {
        // Empty list
        const replacement = match[0].replace(
          /return\s+Arrays\.asList\(\s*\)/,
          `return Arrays.asList(\n        ${packageInstance}\n      )`
        );
        return content.replace(match[0], replacement);
      } else {
        // Add to existing list
        const replacement = match[0].replace(
          packagesContent,
          `${packagesContent},\n        ${packageInstance}`
        );
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
        const replacement = altMatch[0].replace(
          /return\s+Arrays\.asList\(\s*\)/,
          `return Arrays.asList(\n        ${packageInstance}\n      )`
        );
        return content.replace(altMatch[0], replacement);
      } else {
        const replacement = altMatch[0].replace(
          packagesContent,
          `${packagesContent},\n        ${packageInstance}`
        );
        return content.replace(altMatch[0], replacement);
      }
    }

    return content;
  }

  /**
   * Configures Android build files (settings.gradle and app/build.gradle)
   */
  public configureBuildFiles(
    projectRoot: string, 
    moduleConfig: ModuleConfig
  ): AndroidConfigResult {
    try {
      const modifiedFiles: string[] = [];
      
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

    } catch (error) {
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
  private configureSettingsGradle(
    projectRoot: string, 
    moduleConfig: ModuleConfig
  ): AndroidConfigResult {
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
  private configureAppBuildGradle(
    projectRoot: string, 
    moduleConfig: ModuleConfig
  ): AndroidConfigResult {
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
    const modifiedContent = content.replace(
      match[0],
      `dependencies {${newDependenciesContent}\n}`
    );
    
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

/**
 * Convenience function to configure MainApplication
 */
export function configureMainApplication(
  projectRoot: string, 
  moduleConfig: ModuleConfig
): AndroidConfigResult {
  const manager = new AndroidConfigManager();
  return manager.configureMainApplication(projectRoot, moduleConfig);
}

/**
 * Convenience function to configure Android build files
 */
export function configureBuildFiles(
  projectRoot: string, 
  moduleConfig: ModuleConfig
): AndroidConfigResult {
  const manager = new AndroidConfigManager();
  return manager.configureBuildFiles(projectRoot, moduleConfig);
}