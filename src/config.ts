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
        standardCodeGeneration: false, // Standard test code generation (separate from BDD)
        reporting: true,
        useAllureReports: false, // Toggle between Extent (false) and Allure (true)
        valueSelector: false, // Enable/disable dynamic value selection dropdown
        bddCodeGeneration: true, // BDD framework code generation
        karateFramework: false // Karate framework support
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

    // BDD Framework Configuration
    bdd: {
        framework: 'cucumber', // 'cucumber' | 'karate'
        language: 'java', // 'java' | 'kotlin'
        basePackage: 'com.example.api',
        useLombok: true,
        generatePOJOs: true,
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