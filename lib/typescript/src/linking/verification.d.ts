import { ModuleConfig } from './path-resolver';
export interface VerificationResult {
    success: boolean;
    message: string;
    details: VerificationDetails;
    errors?: string[];
    warnings?: string[];
}
export interface VerificationDetails {
    moduleFound: boolean;
    androidConfigured: boolean;
    iosConfigured: boolean;
    buildConfigValid: boolean;
    importTestPassed: boolean;
    registrationVerified: boolean;
}
export interface DiagnosticInfo {
    projectRoot: string;
    moduleConfig?: ModuleConfig;
    androidDetails?: AndroidDiagnostics;
    iosDetails?: IOSDiagnostics;
    buildSystemInfo?: BuildSystemInfo;
}
export interface AndroidDiagnostics {
    mainApplicationFound: boolean;
    mainApplicationPath?: string;
    packageImported: boolean;
    packageRegistered: boolean;
    settingsGradleConfigured: boolean;
    buildGradleConfigured: boolean;
    buildFilesValid: boolean;
}
export interface IOSDiagnostics {
    podfileFound: boolean;
    podfilePath?: string;
    podConfigured: boolean;
    iosProjectValid: boolean;
    podInstallNeeded: boolean;
}
export interface BuildSystemInfo {
    gradleVersion?: string;
    podVersion?: string;
    reactNativeVersion?: string;
    nodeVersion?: string;
}
export declare class ModuleLinkingVerifier {
    private pathResolver;
    private iosManager;
    constructor();
    /**
     * Performs comprehensive verification of module linking
     */
    verifyModuleLinking(projectRoot: string, moduleName?: string): Promise<VerificationResult>;
    /**
     * Verifies Android platform configuration
     */
    private verifyAndroidConfiguration;
    /**
     * Verifies iOS platform configuration
     */
    private verifyIOSConfiguration;
    /**
     * Tests basic module import functionality
     */
    private testModuleImport;
    /**
     * Generates comprehensive diagnostic information
     */
    generateDiagnostics(projectRoot: string, moduleName?: string): Promise<DiagnosticInfo>;
    /**
     * Helper methods
     */
    private createEmptyDetails;
    private findMainApplicationFile;
    private checkPackageImported;
    private checkPackageRegistered;
    private verifyAndroidBuildConfiguration;
    private generateAndroidDiagnostics;
    private generateIOSDiagnostics;
    private generateBuildSystemInfo;
}
/**
 * Convenience function to verify module linking
 */
export declare function verifyModuleLinking(projectRoot: string, moduleName?: string): Promise<VerificationResult>;
/**
 * Convenience function to generate diagnostics
 */
export declare function generateDiagnostics(projectRoot: string, moduleName?: string): Promise<DiagnosticInfo>;
