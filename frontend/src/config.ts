// API Tester Pro Configuration
// This file manages feature flags and application configuration

export const config = {
    // Development server configuration
    devServer: {
        port: 8080,
        host: 'localhost'
    },

    // Feature flags
    features: {
        jiraIntegration: true,
        bitbucketIntegration: true,
        smartImport: true,
        multiEndpointTesting: true,
        testCodeGeneration: true,
        reporting: true,
        valueSelector: true, // Enable/disable dynamic value selection dropdown
        bddCodeGeneration: true, // BDD framework code generation
        karateFramework: false, // Karate framework support
        
        // UI Section Feature Flags
        enableJiraIntegration: true, // Control Jira Integration UI visibility
        enableBitbucketIntegration: true, // Control Bitbucket Integration UI visibility
        enableCodeGeneration: true, // Control Generated Code Section UI visibility
    },

    // External service configurations (optional)
    integrations: {
        jira: {
            baseUrl: '',
            username: '',
            apiToken: ''
        },
        bitbucket: {
            baseUrl: '',
            username: '',
            appPassword: ''
        }
    },

    // UI Configuration
    ui: {
        theme: 'light', // 'light' | 'dark' | 'auto'
        defaultLanguage: 'en',
        enableAnimations: true
    },

    // OCBC BDD Framework Configuration
    bdd: {
        framework: 'ocbc', // 'ocbc' | 'cucumber' | 'karate'
        language: 'java', // 'java' | 'kotlin'
        basePackage: 'com.ocbc.api',
        useLombok: true, // OCBC uses Lombok for embedded POJOs
        generatePOJOs: false, // POJOs are embedded in service classes
        generateServiceClasses: true,
        generateStepDefinitions: true,
        generateFeatureFiles: true,
        onlySuccessfulTests: true // Only generate code for successful tests
    }
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (featureName: keyof typeof config.features): boolean => {
    return config.features[featureName] || false;
};

// Helper function to get feature configuration
export const getFeatureConfig = () => config.features;

// Helper function to get UI configuration
export const getUIConfig = () => config.ui;

// Helper function to get BDD configuration
export const getBDDConfig = () => config.bdd; 