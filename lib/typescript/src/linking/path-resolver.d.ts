export interface ModuleConfig {
    name: string;
    packageName: string;
    className: string;
    modulePath: string;
    platform: 'android' | 'ios' | 'both';
}
export interface PathResolutionResult {
    success: boolean;
    modulePath?: string;
    androidProjectPath?: string;
    iosProjectPath?: string;
    error?: string;
}
export declare class PathResolver {
    private readonly MODULE_NAME;
    /**
     * Detects the installation location of the module
     * Checks common locations: node_modules, local_modules, and absolute paths
     */
    detectModuleLocation(projectRoot: string, moduleName?: string): PathResolutionResult;
    /**
     * Validates that a given path contains a valid React Native module
     * with the required Android project structure
     */
    validateModulePath(modulePath: string): PathResolutionResult;
    /**
     * Validates Android project structure exists and contains required files
     */
    private validateAndroidProjectStructure;
    /**
     * Validates iOS project structure exists and contains required files
     */
    private validateIosProjectStructure;
    /**
     * Resolves the absolute path for different installation types
     */
    resolveModulePath(projectRoot: string, pathInput: string): PathResolutionResult;
    /**
     * Creates a module configuration object from a resolved path
     */
    createModuleConfig(pathResult: PathResolutionResult): ModuleConfig | null;
}
/**
 * Convenience function to detect and validate module installation
 */
export declare function detectModule(projectRoot: string, moduleName?: string): PathResolutionResult;
/**
 * Convenience function to resolve a module path from various input formats
 */
export declare function resolveModulePath(projectRoot: string, pathInput: string): PathResolutionResult;
