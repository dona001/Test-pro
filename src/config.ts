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
    useAllureReports: false // Toggle between Extent (false) and Allure (true)
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