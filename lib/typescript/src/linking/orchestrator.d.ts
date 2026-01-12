export interface LinkingOptions {
    projectRoot: string;
    moduleName?: string;
    modulePath?: string;
    platforms?: ('android' | 'ios')[];
    dryRun?: boolean;
    verbose?: boolean;
    skipVerification?: boolean;
    createBackups?: boolean;
}
export interface LinkingResult {
    success: boolean;
    message: string;
    details: LinkingDetails;
    errors?: string[];
    warnings?: string[];
    modifiedFiles?: string[];
    backupFiles?: string[];
}
export interface LinkingDetails {
    moduleResolved: boolean;
    androidConfigured: boolean;
    iosConfigured: boolean;
    verificationPassed: boolean;
    rollbackAvailable: boolean;
}
export interface RollbackInfo {
    backupFiles: Map<string, string>;
    createdFiles: string[];
    timestamp: Date;
}
export declare class ReactNativeModuleLinkingOrchestrator {
    private pathResolver;
    private androidManager;
    private iosManager;
    private verifier;
    private logger;
    private rollbackInfo;
    constructor();
    /**
     * Main orchestration method that coordinates the entire linking process
     */
    linkModule(options: LinkingOptions): Promise<LinkingResult>;
    /**
     * Performs rollback of all changes made during the linking process
     */
    performRollback(): Promise<{
        success: boolean;
        message: string;
        errors?: string[];
    }>;
    /**
     * Resolves module configuration from options
     */
    private resolveModuleConfiguration;
    /**
     * Determines which platforms to configure based on options and module support
     */
    private determinePlatforms;
    /**
     * Configures Android platform
     */
    private configureAndroidPlatform;
    /**
     * Configures iOS platform
     */
    private configureIOSPlatform;
    /**
     * Performs verification of the linking configuration
     */
    private performVerification;
    /**
     * Creates a standardized failure result
     */
    private createFailureResult;
}
/**
 * Convenience function to link a module with default options
 */
export declare function linkReactNativeModule(projectRoot: string, options?: Partial<LinkingOptions>): Promise<LinkingResult>;
/**
 * Convenience function to perform rollback
 */
export declare function rollbackLinking(): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
}>;
