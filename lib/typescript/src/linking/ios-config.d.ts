import { ModuleConfig } from './path-resolver';
export interface IOSConfigResult {
    success: boolean;
    message: string;
    error?: string;
    modifiedFiles?: string[];
}
export declare class IOSConfigManager {
    /**
     * Configures Podfile to include the native module pod
     */
    configurePodfile(projectRoot: string, moduleConfig: ModuleConfig): IOSConfigResult;
    /**
     * Finds the Podfile in the iOS project
     */
    private findPodfile;
    /**
     * Checks if the Podfile is already configured with the module
     */
    private isAlreadyConfigured;
    /**
     * Modifies the Podfile content to include the module pod
     */
    private modifyPodfileContent;
    /**
     * Validates that the iOS project structure is ready for pod configuration
     */
    validateIOSProject(projectRoot: string): IOSConfigResult;
    /**
     * Gets information about the current Podfile configuration
     */
    getPodfileInfo(projectRoot: string): {
        exists: boolean;
        path?: string;
        content?: string;
        pods?: string[];
    };
}
/**
 * Convenience function to configure Podfile
 */
export declare function configurePodfile(projectRoot: string, moduleConfig: ModuleConfig): IOSConfigResult;
/**
 * Convenience function to validate iOS project
 */
export declare function validateIOSProject(projectRoot: string): IOSConfigResult;
