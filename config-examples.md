# Configuration Examples

## Feature Flags for UI Sections

The following feature flags control the visibility of UI sections for demo vs production environments:

### Demo Environment Configuration
```typescript
// src/config.ts - Demo Environment
export const config = {
  features: {
    // Core functionality
    jiraIntegration: true,
    bitbucketIntegration: true,
    smartImport: true,
    multiEndpointTesting: true,
    testCodeGeneration: true,
    standardCodeGeneration: false,
    reporting: true,
    useAllureReports: false,
    valueSelector: false,
    bddCodeGeneration: true,
    karateFramework: false,
    
    // UI Section Feature Flags - DISABLED for demo
    enableJiraIntegration: false,      // Shows "Coming Soon" instead of Jira integration
    enableBitbucketIntegration: false, // Shows "Coming Soon" instead of Bitbucket integration
    enableCodeGeneration: false,       // Shows "Coming Soon" instead of code generation
  }
};
```

### Production Environment Configuration
```typescript
// src/config.ts - Production Environment
export const config = {
  features: {
    // Core functionality
    jiraIntegration: true,
    bitbucketIntegration: true,
    smartImport: true,
    multiEndpointTesting: true,
    testCodeGeneration: true,
    standardCodeGeneration: true,
    reporting: true,
    useAllureReports: false,
    valueSelector: true,
    bddCodeGeneration: true,
    karateFramework: true,
    
    // UI Section Feature Flags - ENABLED for production
    enableJiraIntegration: true,      // Shows actual Jira integration
    enableBitbucketIntegration: true, // Shows actual Bitbucket integration
    enableCodeGeneration: true,       // Shows actual code generation
  }
};
```

### Development Environment Configuration
```typescript
// src/config.ts - Development Environment
export const config = {
  features: {
    // Core functionality
    jiraIntegration: true,
    bitbucketIntegration: true,
    smartImport: true,
    multiEndpointTesting: true,
    testCodeGeneration: true,
    standardCodeGeneration: true,
    reporting: true,
    useAllureReports: true,
    valueSelector: true,
    bddCodeGeneration: true,
    karateFramework: true,
    
    // UI Section Feature Flags - PARTIALLY ENABLED for development
    enableJiraIntegration: false,     // Disabled for testing
    enableBitbucketIntegration: true, // Enabled for testing
    enableCodeGeneration: true,       // Enabled for testing
  }
};
```

## Feature Flag Usage

### 1. Jira Integration
- **When `enableJiraIntegration: false`**: Shows a "Coming Soon" component with Jira branding
- **When `enableJiraIntegration: true`**: Shows the full Jira integration interface

### 2. Bitbucket Integration
- **When `enableBitbucketIntegration: false`**: Shows a "Coming Soon" component with Bitbucket branding
- **When `enableBitbucketIntegration: true`**: Shows the full Bitbucket integration interface

### 3. Code Generation
- **When `enableCodeGeneration: false`**: Shows a "Coming Soon" component for all code generation features
- **When `enableCodeGeneration: true`**: Shows the actual code generation components based on other feature flags

## Coming Soon Component

The `ComingSoon` component provides a consistent user experience when features are disabled:

```typescript
<ComingSoon 
  title="Jira Integration"
  description="Sync your test results directly to Jira issues"
  featureName="Jira"
  variant="compact"
/>
```

### Variants
- **`compact`**: Smaller version for inline use
- **`default`**: Full-size version for standalone sections

## Benefits

1. **Clean Demo Experience**: Features can be disabled without removing code
2. **Future-Proof**: Users can see what's coming without broken functionality
3. **Environment-Specific**: Different configurations for demo, development, and production
4. **Consistent UX**: All disabled features show the same "Coming Soon" pattern
5. **Easy Toggle**: Simple boolean flags to enable/disable features

## Migration Guide

To disable a feature for demo:

1. Set the corresponding `enable*` flag to `false`
2. The feature will automatically show a "Coming Soon" component
3. No code changes needed in the component itself

To enable a feature for production:

1. Set the corresponding `enable*` flag to `true`
2. The feature will show its full functionality
3. Ensure the underlying feature flag is also enabled 