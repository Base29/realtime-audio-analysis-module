import { ModuleConfig } from './path-resolver';
export interface AndroidConfigResult {
    success: boolean;
    message: string;
    error?: string;
    modifiedFiles?: string[];
}
export declare class AndroidConfigManager {
    /**
     * Configures MainApplication file to register the native module package
     */
    configureMainApplication(projectRoot: string, moduleConfig: ModuleConfig): AndroidConfigResult;
    /**
     * Finds the MainApplication file in the Android project
     */
    private findMainApplicationFile;
    /**
     * Checks if the MainApplication is already configured with the module
     */
    private isAlreadyConfigured;
    /**
     * Modifies the MainApplication content to include the module
     */
    private modifyMainApplicationContent;
    /**
     * Adds the import statement for the module package
     */
    private addImportStatement;
    /**
     * Adds the package to the getPackages method
     */
    private addPackageToGetPackages;
    /**
     * Configures Android build files (settings.gradle and app/build.gradle)
     */
    configureBuildFiles(projectRoot: string, moduleConfig: ModuleConfig): AndroidConfigResult;
    /**
     * Configures settings.gradle to include the module project
     */
    private configureSettingsGradle;
    /**
     * Configures app/build.gradle to add the module dependency
     */
    private configureAppBuildGradle;
}
/**
 * Convenience function to configure MainApplication
 */
export declare function configureMainApplication(projectRoot: string, moduleConfig: ModuleConfig): AndroidConfigResult;
/**
 * Convenience function to configure Android build files
 */
export declare function configureBuildFiles(projectRoot: string, moduleConfig: ModuleConfig): AndroidConfigResult;
//# sourceMappingURL=android-config.d.ts.map