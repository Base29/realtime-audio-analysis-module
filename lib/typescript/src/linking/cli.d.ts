#!/usr/bin/env node
interface CLIOptions {
    platform?: 'android' | 'ios' | 'both';
    dryRun?: boolean;
    verbose?: boolean;
    projectRoot?: string;
    modulePath?: string;
    moduleName?: string;
    output?: string;
    format?: 'markdown' | 'text';
}
interface CLILinkingResult {
    success: boolean;
    message: string;
    androidResult?: {
        success: boolean;
        message: string;
        modifiedFiles?: string[];
    };
    iosResult?: {
        success: boolean;
        message: string;
        modifiedFiles?: string[];
    };
    modifiedFiles: string[];
    errors: string[];
    warnings: string[];
}
declare class ReactNativeModuleLinkingCLI {
    private pathResolver;
    private guideGenerator;
    private verbose;
    constructor();
    /**
     * Main linking command that orchestrates the entire process using the orchestrator
     */
    linkModule(options: CLIOptions): Promise<CLILinkingResult>;
    /**
     * Resolves the module location based on CLI options
     */
    private resolveModuleLocation;
    /**
     * Prints a summary of the linking results
     */
    private printSummary;
    /**
     * Diagnostic command to analyze current linking status
     */
    diagnose(options: CLIOptions): Promise<void>;
    /**
     * Generates a manual linking guide
     */
    generateGuide(options: CLIOptions): Promise<void>;
    /**
     * Utility method for logging with verbose control
     */
    private log;
}
/**
 * CLI Program Setup
 */
declare function setupCLI(): void;
export { ReactNativeModuleLinkingCLI, setupCLI };
export type { CLIOptions, CLILinkingResult };
//# sourceMappingURL=cli.d.ts.map