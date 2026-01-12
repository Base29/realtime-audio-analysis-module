import { ModuleConfig } from './path-resolver';
export interface ManualGuideOptions {
    platform: 'android' | 'ios' | 'both';
    projectRoot: string;
    moduleConfig: ModuleConfig;
    outputFormat: 'markdown' | 'text';
    includeVerification: boolean;
    includeTroubleshooting: boolean;
}
export interface GuideSection {
    title: string;
    content: string;
    platform?: 'android' | 'ios';
    optional?: boolean;
}
export declare class ManualLinkingGuideGenerator {
    private pathResolver;
    constructor();
    /**
     * Generates a complete manual linking guide
     */
    generateGuide(options: ManualGuideOptions): string;
    /**
     * Generates introduction section
     */
    private generateIntroduction;
    /**
     * Generates prerequisites section
     */
    private generatePrerequisites;
    /**
     * Generates Android-specific sections
     */
    private generateAndroidSections;
    /**
     * Generates Android MainApplication configuration guide
     */
    private generateAndroidMainApplicationGuide;
    /**
     * Generates Android build configuration guide
     */
    private generateAndroidBuildGuide;
    /**
     * Generates iOS-specific sections
     */
    private generateIOSSections;
    /**
     * Generates iOS Podfile configuration guide
     */
    private generateIOSPodfileGuide;
    /**
     * Generates verification section
     */
    private generateVerificationSection;
    /**
     * Generates troubleshooting section
     */
    private generateTroubleshootingSection;
    /**
     * Generates next steps section
     */
    private generateNextStepsSection;
    /**
     * Formats the guide sections into the final output
     */
    private formatGuide;
    /**
     * Formats guide as Markdown
     */
    private formatAsMarkdown;
    /**
     * Formats guide as plain text
     */
    private formatAsText;
    /**
     * Saves the guide to a file
     */
    saveGuide(guide: string, outputPath: string): void;
    /**
     * Generates a guide for a specific project
     */
    generateProjectGuide(projectRoot: string, platform?: 'android' | 'ios' | 'both', outputPath?: string): string;
}
/**
 * Convenience function to generate a manual linking guide
 */
export declare function generateManualGuide(projectRoot: string, platform?: 'android' | 'ios' | 'both', outputPath?: string): string;
