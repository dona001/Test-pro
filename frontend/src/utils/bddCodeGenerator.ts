import {getBDDConfig} from '@/config';

// BDD Framework specific configuration
export interface BDDConfig {
    framework: 'ocbc' | 'cucumber' | 'karate';
    language: 'java' | 'kotlin';
    basePackage: string;
    useLombok: boolean;
    generatePOJOs: boolean;
    generateServiceClasses: boolean;
    generateStepDefinitions: boolean;
    generateFeatureFiles: boolean;
}

export interface Endpoint {
    method: string;
    path: string;
    name: string;
    description?: string;
    requestBody?: any;
    responseBody?: any;
    parameters?: Array<{
        name: string;
        type: string;
        required: boolean;
        description?: string;
    }>;
    // Real API data
    url?: string;
    headers?: Record<string, string>;
    actualResponse?: {
        status: number;
        data: any;
        headers: Record<string, any>;
        responseTime: number;
    };
    validationRules?: Array<{
        type: 'status' | 'value' | 'existence';
        field?: string;
        expectedValue?: string;
        condition?: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_null' | 'is_not_null';
    }>;
}

export interface GeneratedCode {
    featureFiles: Array<{ name: string; content: string }>;
    stepDefinitions: Array<{ name: string; content: string }>;
    serviceClasses: Array<{ name: string; content: string }>;
    pojos: Array<{ name: string; content: string }>;
}

export class BDDCodeGenerator {
    private config: BDDConfig;

    constructor() {
        this.config = getBDDConfig() as BDDConfig;
    }

    generateCode(endpoints: Endpoint[]): GeneratedCode {
        const result: GeneratedCode = {
            featureFiles: [],
            stepDefinitions: [],
            serviceClasses: [],
            pojos: [],
        };

        for (const endpoint of endpoints) {
            const endpointCode = this.generateEndpointCode(endpoint);

            result.featureFiles.push(...endpointCode.featureFiles);
            result.stepDefinitions.push(...endpointCode.stepDefinitions);
            result.serviceClasses.push(...endpointCode.serviceClasses);
            // POJOs are now embedded in service classes, so we don't add them separately
        }

        return result;
    }

    private generateEndpointCode(endpoint: Endpoint) {
        const className = this.generateClassName(endpoint.name);
        const featureName = this.generateFeatureName(endpoint.name);

        return {
            featureFiles: [this.generateFeatureFile(endpoint, featureName)],
            stepDefinitions: [this.generateStepDefinitions(endpoint, className)],
            serviceClasses: [this.generateServiceClass(endpoint, className)],
            pojos: [], // POJOs are now embedded in service classes
        };
    }

    private generateClassName(name: string): string {
        // Remove numeric suffixes and clean the name
        let cleanedName = name
            .replace(/\d+$/, '') // Remove trailing numbers
            .replace(/^\d+/, '') // Remove leading numbers
            .replace(/[-_\s]+/g, ' ') // Replace multiple separators with space
            .trim();
        
        // If name is empty after cleaning, use a default
        if (!cleanedName) {
            cleanedName = 'ApiEndpoint';
        }
        
        // Convert to PascalCase
        return cleanedName
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private generateFeatureName(name: string): string {
        // Remove numeric suffixes and clean the name
        let cleanedName = name
            .replace(/\d+$/, '') // Remove trailing numbers
            .replace(/^\d+/, '') // Remove leading numbers
            .replace(/[-_\s]+/g, '_') // Replace multiple separators with underscore
            .toLowerCase()
            .trim();
        
        // If name is empty after cleaning, use a default
        if (!cleanedName) {
            cleanedName = 'api_endpoint';
        }
        
        return cleanedName;
    }

    private generateFeatureFile(endpoint: Endpoint, featureName: string) {
        const method = endpoint.method.toUpperCase();
        const path = endpoint.path;
        const description = endpoint.description || `${method} ${this.getResourceFromPath(path)}`;
        const resource = this.getResourceFromPath(path);
        const action = this.getActionFromMethod(method);

        // Use OCBC enterprise framework
        return this.generateOCBCFeatureFile(endpoint, featureName, description, method, resource, action);
    }

    private generateOCBCFeatureFile(endpoint: Endpoint, featureName: string, description: string, method: string, resource: string, action: string) {
        const responseData = endpoint.actualResponse?.data || endpoint.responseBody;
        const hasResponseData = responseData && Object.keys(responseData).length > 0;
        const hasValidationRules = endpoint.validationRules && endpoint.validationRules.length > 0;
        
        // Combine response data and validation rules for examples
        const exampleData = this.generateExampleData(endpoint, responseData);
        
        let content = `Feature: ${description}

  @${method.toLowerCase()} @${this.getTagFromPath(endpoint.path)} @ocbc
  Scenario Outline: Successfully ${action} ${resource} - Positive
    Given I prepare a valid ${resource} ${action} payload
    When I send a ${method} request for ${resource.toLowerCase().replace(/\s+/g, '_')}
${this.generateFeatureValidationSteps(endpoint)}
    Examples:
      | ${this.generateExampleHeaders(exampleData)} |
      | ${this.generateExampleValues(exampleData)} |
`;

        // Add negative scenario
        content += `
  @${method.toLowerCase()} @${this.getTagFromPath(endpoint.path)} @negative @ocbc
  Scenario: Fail to ${action} ${resource} with invalid data
    Given I prepare an invalid ${resource} ${action} payload
    When I send a ${method} request for ${resource.toLowerCase().replace(/\s+/g, '_')}
    Then the response status code should be 400
    And the response should contain an error message
`;

        return {
            name: `${featureName}.feature`,
            content,
        };
    }

    private generateStepDefinitions(endpoint: Endpoint, className: string) {
        const method = endpoint.method.toUpperCase();
        const resource = this.getResourceFromPath(endpoint.path);
        const requestClass = `${className}Request`;
        const responseClass = `${className}Response`;
        const serviceClass = `${className}Service`;

        // Use OCBC enterprise framework
        return this.generateOCBCStepDefinitions(endpoint, className, method, resource, requestClass, responseClass, serviceClass);
    }

    private generateOCBCStepDefinitions(endpoint: Endpoint, className: string, method: string, resource: string, requestClass: string, responseClass: string, serviceClass: string) {
        const resourceMethod = resource.toLowerCase().replace(/\s+/g, '_');
        const hasHeaders = endpoint.headers && Object.keys(endpoint.headers).length > 0;
        const headersMap = hasHeaders ? this.generateHeadersMap(endpoint.headers) : 'null';
        
        const content = `package ${this.config.basePackage}.steps;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import static org.testng.Assert.*;
import java.util.HashMap;
import java.util.Map;

import ${this.config.basePackage}.service.${serviceClass};
import ${this.config.basePackage}.service.${serviceClass}.${requestClass};
import ${this.config.basePackage}.service.${serviceClass}.${responseClass};

public class ${className}Steps {

    private ${serviceClass} ${this.camelCase(serviceClass)} = new ${serviceClass}();
    private ${requestClass} request;
    private ${responseClass} response;

    @Given("I prepare a valid ${resource} ${this.getActionFromMethod(method)} payload")
    public void prepareValidPayload() {
        request = ${requestClass}.builder()
                ${this.generateRequestBuilder(endpoint)}
                .build();
    }

    @Given("I prepare an invalid ${resource} ${this.getActionFromMethod(method)} payload")
    public void prepareInvalidPayload() {
        request = ${requestClass}.builder()
                ${this.generateInvalidRequestBuilder(endpoint)}
                .build();
    }

    @When("I send a ${method} request for ${resourceMethod}")
    public void send${method}Request() {
        response = ${this.camelCase(serviceClass)}.${method.toLowerCase()}(request);
    }

    @Then("the response status code should be {int}")
    public void validateStatusCode(int expectedStatus) {
        assertEquals(response.getStatusCode(), expectedStatus);
    }

    @Then("the response should contain the correct ${resource} details")
    public void validate${className}Details(${this.generateValidationParameters(endpoint)}) {
        assertNotNull(response);
        ${this.generateValidationAssertions(endpoint)}
    }

    ${this.generateValidationSteps(endpoint)}

    @Then("the response should contain an error message")
    public void validateError() {
        assertTrue(response.getBody().asString().contains("error"));
    }
}`;

        return {
            name: `${className}Steps.java`,
            content,
        };
    }

    private generateServiceClass(endpoint: Endpoint, className: string) {
        const method = endpoint.method.toUpperCase();
        const resource = this.getResourceFromPath(endpoint.path);
        const requestClass = `${className}Request`;
        const responseClass = `${className}Response`;

        // Use OCBC enterprise framework with embedded POJOs
        return this.generateOCBCServiceClass(endpoint, className, method, resource, requestClass, responseClass);
    }

    private generateOCBCServiceClass(endpoint: Endpoint, className: string, method: string, resource: string, requestClass: string, responseClass: string) {
        const hasHeaders = endpoint.headers && Object.keys(endpoint.headers).length > 0;
        const headersMap = hasHeaders ? this.generateHeadersMap(endpoint.headers) : 'null';
        
        // Generate embedded POJOs
        const requestData = endpoint.requestBody ||
            (endpoint.actualResponse ? this.extractRequestDataFromResponse(endpoint) : this.generateDefaultRequestFields(endpoint));
        const responseData = endpoint.actualResponse?.data || endpoint.responseBody;
        
        const embeddedRequestPOJO = requestData || endpoint.method.toUpperCase() !== 'GET' ? 
            this.generateEmbeddedPOJOClass(requestClass, requestData, true) : '';
        const embeddedResponsePOJO = responseData ? 
            this.generateEmbeddedPOJOClass(responseClass, responseData, false) : '';
        
        const content = `package ${this.config.basePackage}.service;

import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import io.restassured.http.Headers;
import io.restassured.http.Header;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URL;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Map;${this.config.useLombok ? `
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;` : ''}

public class ${className}Service extends BaseRestService {

    private URL hostAddress;
    private Map<String, String> customHeaders = ${headersMap};

    public ${className}Service() {
        try {
            String appUrl = appConfig.get("internetbanking", "msBaseUrl");
            hostAddress = new URL(appUrl);
        } catch (MalformedURLException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    private List<Header> setupHeaders() {
        List<Header> headers = new ArrayList<>();
        
        // Add default Content-Type if no custom headers provided
        if (customHeaders == null || customHeaders.isEmpty()) {
            headers.add(new Header("Content-Type", "application/json"));
            System.out.println("No custom headers provided, using default Content-Type");
        } else {
            // Add all custom headers from frontend
            System.out.println("Adding custom headers from frontend:");
            for (Map.Entry<String, String> entry : customHeaders.entrySet()) {
                Header header = new Header(entry.getKey(), entry.getValue());
                headers.add(header);
                System.out.println("  - " + entry.getKey() + ": " + entry.getValue());
            }
        }
        
        System.out.println("Total headers created: " + headers.size());
        return headers;
    }

    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }

    public Response ${method.toLowerCase()}(${requestClass} requestBody) {
        // Create headers list with custom headers from frontend
        List<Header> headers = setupHeaders();
        
        // Build request specification with custom headers
        RequestSpecification requestSpec = baseRequestSpec()
                .headers(new Headers(headers));
        
        if (requestBody != null) {
            requestSpec = requestSpec.body(requestBody, ObjectMapperType.GSON);
        }
        
        return requestSpec.when().${method.toLowerCase()}(hostAddress.toString());
    }

    public Response ${method.toLowerCase()}(${requestClass} requestBody, String endPointURL) {
        // Create headers list with custom headers from frontend
        List<Header> headers = setupHeaders();
        
        // Build request specification with custom headers
        RequestSpecification requestSpec = baseRequestSpec()
                .headers(new Headers(headers));
        
        if (requestBody != null) {
            requestSpec = requestSpec.body(requestBody, ObjectMapperType.GSON);
        }
        
        return requestSpec.when().${method.toLowerCase()}(endPointURL);
    }

    // Embedded POJO Classes
${embeddedRequestPOJO}
${embeddedResponsePOJO}
}`;

        return {
            name: `${className}Service.java`,
            content,
        };
    }

    private generateEmbeddedPOJOClass(className: string, data: any, isRequest: boolean): string {
        if (!data) return '';
        
        const fields = this.extractFields(data);
        if (fields.length === 0) return '';

        const lombokImports = this.config.useLombok ? `
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;` : '';

        const lombokAnnotations = this.config.useLombok ? `
@Data
${isRequest ? '@Builder' : ''}
@NoArgsConstructor
@AllArgsConstructor` : '';

        const fieldsCode = fields.map(field => {
            const fieldType = this.getJavaType(field.type);
            const fieldName = field.name;
            const annotation = this.config.useLombok ? '' : `
        @JsonProperty("${fieldName}")
        private ${fieldType} ${this.camelCase(fieldName)};`;

            return this.config.useLombok ?
                `        private ${fieldType} ${this.camelCase(fieldName)};` :
                annotation;
        }).join('\n');

        const gettersSetters = this.config.useLombok ? '' : this.generateGettersSetters(fields);

        return `

    public static class ${className} {${lombokAnnotations}
${fieldsCode}${gettersSetters}
    }`;
    }

    private generatePOJOs(endpoint: Endpoint, className: string) {
        // POJOs are now embedded in service classes, so return empty array
        return [];
    }

    private extractRequestDataFromResponse(endpoint: Endpoint): any {
        // Try to extract request data from the actual API call
        if (endpoint.actualResponse?.data) {
            // For POST/PUT requests, the response might contain the created/updated object
            // which can give us clues about the request structure
            return this.inferRequestStructureFromResponse(endpoint.actualResponse.data);
        }
        return this.generateDefaultRequestFields(endpoint);
    }

    private inferRequestStructureFromResponse(responseData: any): any {
        // Infer request structure from response data
        // This is a simple heuristic - in practice, you might want more sophisticated logic
        if (typeof responseData === 'object' && responseData !== null) {
            const inferredRequest: any = {};

            // Common patterns: if response has id, name, email, etc., request likely has similar fields
            if (responseData.id !== undefined) {
                // Don't include id in request (it's usually generated)
            }
            if (responseData.name !== undefined) {
                inferredRequest.name = "string";
            }
            if (responseData.email !== undefined) {
                inferredRequest.email = "string";
            }
            if (responseData.age !== undefined) {
                inferredRequest.age = "number";
            }
            if (responseData.description !== undefined) {
                inferredRequest.description = "string";
            }

            return Object.keys(inferredRequest).length > 0 ? inferredRequest : null;
        }
        return null;
    }

    private extractFields(data: any): Array<{ name: string; type: string }> {
        if (!data || typeof data !== 'object') {
            return [];
        }

        return Object.entries(data).map(([key, value]) => ({
            name: key,
            type: this.getJavaType(typeof value),
        }));
    }

    private getJavaType(jsType: string): string {
        switch (jsType) {
            case 'string':
                return 'String';
            case 'number':
                return 'Integer';
            case 'boolean':
                return 'Boolean';
            case 'object':
                return 'Object';
            default:
                return 'String';
        }
    }

    private generateGettersSetters(fields: Array<{ name: string; type: string }>): string {
        return fields.map(field => {
            const fieldName = this.camelCase(field.name);
            const fieldType = field.type;
            const getterName = field.type === 'Boolean' ? `is${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}` : `get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
            const setterName = `set${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;

            return `

        public ${fieldType} ${getterName}() {
            return ${fieldName};
        }

        public void ${setterName}(${fieldType} ${fieldName}) {
            this.${fieldName} = ${fieldName};
        }`;
        }).join('');
    }

    private generateRequestBuilder(endpoint: Endpoint): string {
        if (!endpoint.requestBody) {
            return this.generateDefaultRequestBuilder(endpoint);
        }

        return Object.entries(endpoint.requestBody).map(([key, value]) => {
            const fieldName = this.camelCase(key);
            const fieldValue = typeof value === 'string' ? `"${value}"` : value;
            return `                .${fieldName}(${fieldValue})`;
        }).join('\n');
    }

    private generateInvalidRequestBuilder(endpoint: Endpoint): string {
        return Object.entries(endpoint.requestBody || {}).map(([key, value]) => {
            const fieldName = this.camelCase(key);
            return `                .${fieldName}(null)`;
        }).join('\n');
    }

    private generateResponseAssertions(endpoint: Endpoint): string {
        const responseData = endpoint.actualResponse?.data || endpoint.responseBody;
        if (!responseData) {
            return '// Add specific assertions based on your response structure';
        }

        return Object.entries(responseData).map(([key, value]) => {
            const fieldName = this.camelCase(key);
            const parameterName = fieldName.toLowerCase();
            return `        assertEquals(response.get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}(), ${parameterName});`;
        }).join('\n');
    }

    private generateResponseParameters(endpoint: Endpoint): string {
        const responseData = endpoint.actualResponse?.data || endpoint.responseBody;
        if (!responseData) {
            return '';
        }

        return Object.entries(responseData).map(([key, value]) => {
            const fieldName = this.camelCase(key);
            const fieldType = this.getJavaType(typeof value);
            const parameterName = fieldName.toLowerCase();
            return `${fieldType} ${parameterName}`;
        }).join(', ');
    }

    private generateValidationParameters(endpoint: Endpoint): string {
        const parameters: string[] = [];
        
        // Add parameters for validation rules only
        if (endpoint.validationRules) {
            endpoint.validationRules.forEach(rule => {
                if (rule.type === 'value' && rule.field) {
                    // Handle both simple field names and JSON paths
                    let fieldName = rule.field;
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    const camelCaseFieldName = this.camelCase(fieldName);
                    const fieldType = this.getJavaType(typeof rule.expectedValue || 'string');
                    const parameterName = camelCaseFieldName.toLowerCase();
                    parameters.push(`${fieldType} ${parameterName}`);
                }
            });
        }
        
        return parameters.join(', ');
    }

    private generateValidationAssertions(endpoint: Endpoint): string {
        const assertions: string[] = [];
        
        // Add assertions for validation rules only
        if (endpoint.validationRules) {
            endpoint.validationRules.forEach(rule => {
                if (rule.type === 'value' && rule.field) {
                    // Handle both simple field names and JSON paths
                    let fieldName = rule.field;
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    const camelCaseFieldName = this.camelCase(fieldName);
                    const parameterName = camelCaseFieldName.toLowerCase();
                    assertions.push(`        assertEquals(response.get${camelCaseFieldName.charAt(0).toUpperCase() + camelCaseFieldName.slice(1)}(), ${parameterName});`);
                } else if (rule.type === 'existence' && rule.field) {
                    // Handle both simple field names and JSON paths
                    let fieldName = rule.field;
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    const camelCaseFieldName = this.camelCase(fieldName);
                    const condition = rule.condition || 'is_not_empty';
                    assertions.push(`        assertThat(response.get${camelCaseFieldName.charAt(0).toUpperCase() + camelCaseFieldName.slice(1)}(), ${this.getExistenceAssertionMethod(condition)}());`);
                }
            });
        }
        
        return assertions.join('\n');
    }

    private generateResponseExampleHeaders(responseData: any): string {
        return Object.keys(responseData).map(key => {
            const fieldName = this.camelCase(key);
            return fieldName.toLowerCase();
        }).join(' | ');
    }

    private generateResponseExampleValues(responseData: any): string {
        return Object.entries(responseData).map(([key, value]) => {
            // Use actual values from response data
            if (typeof value === 'string') {
                return `"${value}"`;
            } else if (typeof value === 'number') {
                return value.toString();
            } else if (typeof value === 'boolean') {
                return value.toString();
            } else {
                return '""'; // Default for other types
            }
        }).join(' | ');
    }

    private generateExampleData(endpoint: Endpoint, responseData: any): any {
        const exampleData: any = {};
        
        // Add expected status code
        exampleData.expected_status = this.getExpectedStatus(endpoint.method);
        
        // Add validation rule values only
        if (endpoint.validationRules) {
            endpoint.validationRules.forEach(rule => {
                if (rule.type === 'status') {
                    exampleData.expected_status = rule.expectedValue || this.getExpectedStatus(endpoint.method);
                } else if (rule.type === 'value' && rule.field) {
                    // Handle both simple field names and JSON paths
                    let fieldName = rule.field.toLowerCase();
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    // Use expectedValue if provided, otherwise use a placeholder
                    exampleData[fieldName] = rule.expectedValue || '""';
                } else if (rule.type === 'existence' && rule.field) {
                    // Handle both simple field names and JSON paths
                    let fieldName = rule.field.toLowerCase();
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    // For existence rules, we don't need example values, but we need the field in headers
                    exampleData[fieldName] = '""';
                }
            });
        }
        
        return exampleData;
    }

    private generateExampleHeaders(exampleData: any): string {
        return Object.keys(exampleData).join(' | ');
    }

    private generateExampleValues(exampleData: any): string {
        return Object.entries(exampleData).map(([key, value]) => {
            if (typeof value === 'string') {
                return `"${value}"`;
            } else if (typeof value === 'number') {
                return value.toString();
            } else if (typeof value === 'boolean') {
                return value.toString();
            } else {
                return '""';
            }
        }).join(' | ');
    }

    private generateFeatureValidationSteps(endpoint: Endpoint): string {
        const steps: string[] = [];
        
        // Always add status code step
        steps.push('    Then the response status code should be <expected_status>');
        
        // Add steps for each validation rule only
        if (endpoint.validationRules) {
            console.log('Processing validation rules:', endpoint.validationRules);
            endpoint.validationRules.forEach(rule => {
                console.log('Processing rule:', rule);
                if (rule.type === 'status') {
                    // Status code is already handled above
                    console.log('Skipping status rule as it\'s handled above');
                    return;
                } else if (rule.type === 'value' && rule.field) {
                    // Handle both simple field names and JSON paths
                    let fieldName = rule.field.toLowerCase();
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    console.log('Adding value rule step for field:', fieldName);
                    steps.push(`    Then the response ${fieldName} should be <${fieldName}>`);
                } else if (rule.type === 'existence' && rule.field) {
                    let fieldName = rule.field.toLowerCase();
                    
                    // If it's a JSON path, extract the last part
                    if (fieldName.includes('.')) {
                        fieldName = fieldName.split('.').pop() || fieldName;
                    }
                    
                    const condition = rule.condition || 'is_not_empty';
                    console.log('Adding existence rule step for field:', fieldName, 'condition:', condition);
                    steps.push(`    Then the response ${fieldName} should ${condition}`);
                } else {
                    console.log('Rule not processed:', rule);
                }
            });
        }
        
        console.log('Generated steps:', steps);
        return steps.join('\n');
    }

    private generateValidationSteps(endpoint: Endpoint): string {
        if (!endpoint.validationRules || endpoint.validationRules.length === 0) {
            return '';
        }

        return endpoint.validationRules.map((rule, index) => {
            const stepName = this.generateValidationStepName(rule);
            const assertion = this.generateValidationAssertion(rule);
            return `
    @Then("${stepName}")
    public void validate${index + 1}() {
        ${assertion}
    }`;
        }).join('');
    }

    private generateValidationStepName(rule: any): string {
        switch (rule.type) {
            case 'status':
                return `the response status should be ${rule.expectedValue || '200'}`;
            case 'value':
                const condition = rule.condition || 'equals';
                return `the response field "${rule.field}" should ${condition} "${rule.expectedValue}"`;
            case 'existence':
                const existenceCondition = rule.condition || 'is_not_empty';
                return `the response field "${rule.field}" should ${existenceCondition}`;
            default:
                return `the response should match validation rule "${rule.type}"`;
        }
    }

    private generateValidationAssertion(rule: any): string {
        switch (rule.type) {
            case 'status':
                return `assertEquals(response.getStatusCode(), ${rule.expectedValue || '200'});`;
            case 'value':
                const condition = rule.condition || 'equals';
                const fieldPath = rule.field?.split('.').join('().') || 'data';
                return `assertThat(response.jsonPath().get("${fieldPath}"), ${this.getAssertionMethod(condition)}("${rule.expectedValue}"));`;
            case 'existence':
                const existenceCondition = rule.condition || 'is_not_empty';
                const fieldPath2 = rule.field?.split('.').join('().') || 'data';
                return `assertThat(response.jsonPath().get("${fieldPath2}"), ${this.getExistenceAssertionMethod(existenceCondition)}());`;
            default:
                return `// Custom validation for ${rule.type}`;
        }
    }

    private getAssertionMethod(condition: string): string {
        switch (condition) {
            case 'equals':
                return 'is';
            case 'not_equals':
                return 'isNot';
            case 'contains':
                return 'containsString';
            case 'starts_with':
                return 'startsWith';
            case 'ends_with':
                return 'endsWith';
            default:
                return 'is';
        }
    }

    private getExistenceAssertionMethod(condition: string): string {
        switch (condition) {
            case 'is_empty':
                return 'isEmpty';
            case 'is_not_empty':
                return 'isNotEmpty';
            case 'is_null':
                return 'isNull';
            case 'is_not_null':
                return 'isNotNull';
            default:
                return 'isNotEmpty';
        }
    }

    private generateDefaultRequestFields(endpoint: Endpoint): any {
        // Generate default fields based on endpoint path
        const resource = this.getResourceFromPath(endpoint.path);
        return {
            id: 1,
            name: "Test Name",
            email: "test@example.com",
        };
    }

    private generateDefaultRequestBuilder(endpoint: Endpoint): string {
        const resource = this.getResourceFromPath(endpoint.path);
        return `                .name("Test ${resource}")
                .email("test@example.com")`;
    }

    // Helper methods
    private getTagFromPath(path: string): string {
        const parts = path.split('/').filter(p => p);
        return parts[0] || 'api';
    }

    private getResourceFromPath(path: string): string {
        const parts = path.split('/').filter(p => p);
        return parts[parts.length - 1] || 'resource';
    }

    private getActionFromMethod(method: string): string {
        switch (method) {
            case 'GET':
                return 'get';
            case 'POST':
                return 'create';
            case 'PUT':
                return 'update';
            case 'DELETE':
                return 'delete';
            case 'PATCH':
                return 'patch';
            default:
                return 'process';
        }
    }

    private getExpectedStatus(method: string): string {
        switch (method) {
            case 'GET':
                return '200';
            case 'POST':
                return '201';
            case 'PUT':
                return '200';
            case 'DELETE':
                return '204';
            case 'PATCH':
                return '200';
            default:
                return '200';
        }
    }

    private getMethodName(method: string, resource: string): string {
        const action = this.getActionFromMethod(method);
        return `${action}${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
    }

    private camelCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    private generateHeadersMap(headers: Record<string, string>): string {
        console.log('Headers received in BDD generator:', headers);
        
        if (!headers || Object.keys(headers).length === 0) {
            console.log('No headers found, returning null');
            return 'null';
        }

        const headerEntries = Object.entries(headers)
            .map(([key, value]) => `put("${key}", "${value}")`)
            .join('\n                .');

        console.log('Generated header map:', headerEntries);
        
        return `new HashMap<String, String>() {{
                .${headerEntries};
            }}`;
    }
} 