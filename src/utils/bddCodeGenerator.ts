import { getBDDConfig } from '@/config';

// BDD Framework specific configuration
export interface BDDConfig {
  framework: 'cucumber' | 'karate';
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
    type: string;
    field?: string;
    expectedValue: string;
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
      result.pojos.push(...endpointCode.pojos);
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
      pojos: this.generatePOJOs(endpoint, className),
    };
  }

  private generateClassName(name: string): string {
    return name
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private generateFeatureName(name: string): string {
    return name.toLowerCase().replace(/[-_\s]/g, '_');
  }

  private generateFeatureFile(endpoint: Endpoint, featureName: string) {
    const method = endpoint.method.toUpperCase();
    const path = endpoint.path;
    const description = endpoint.description || `${method} ${path}`;

    let content = `Feature: ${description}

  @${method.toLowerCase()} @${this.getTagFromPath(path)}
  Scenario: Successfully ${this.getActionFromMethod(method)} ${this.getResourceFromPath(path)} - Positive
    Given I prepare a valid ${this.getResourceFromPath(path)} ${this.getActionFromMethod(method)} payload
    When I send a ${method} request to "${path}"
    Then the response status code should be ${this.getExpectedStatus(method)}
    And the response should contain the correct ${this.getResourceFromPath(path)} details

  @${method.toLowerCase()} @${this.getTagFromPath(path)} @negative
  Scenario: Fail to ${this.getActionFromMethod(method)} ${this.getResourceFromPath(path)} with invalid data
    Given I prepare an invalid ${this.getResourceFromPath(path)} ${this.getActionFromMethod(method)} payload
    When I send a ${method} request to "${path}"
    Then the response status code should be 400
    And the response should contain an error message
`;

    if (method === 'GET' && path.includes('{')) {
      content += `
  @${method.toLowerCase()} @${this.getTagFromPath(path)}
  Scenario: Successfully ${this.getActionFromMethod(method)} ${this.getResourceFromPath(path)} by ID
    Given I have a valid ${this.getResourceFromPath(path)} ID
    When I send a ${method} request to "${path}"
    Then the response status code should be 200
    And the response should contain the ${this.getResourceFromPath(path)} details
`;
    }

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

    const content = `package ${this.config.basePackage}.steps;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import static org.junit.Assert.*;

import ${this.config.basePackage}.service.${serviceClass};
import ${this.config.basePackage}.model.${requestClass};
import ${this.config.basePackage}.model.${responseClass};

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

    ${method === 'GET' && endpoint.path.includes('{') ? `
    @Given("I have a valid ${resource} ID")
    public void haveValidId() {
        // Set up valid ID for testing
        // This can be customized based on your test data
    }
    ` : ''}

    @When("I send a ${method} request to {string}")
    public void send${method}Request(String endpoint) {
        response = ${this.camelCase(serviceClass)}.${this.getMethodName(method, resource)}(endpoint, request);
    }

    @Then("the response status code should be {int}")
    public void validateStatusCode(int expectedStatus) {
        assertEquals(expectedStatus, ${this.camelCase(serviceClass)}.getLastStatusCode());
    }

    @Then("the response should contain the correct ${resource} details")
    public void validate${className}Details() {
        assertNotNull(response);
        ${this.generateResponseAssertions(endpoint)}
    }

    ${this.generateValidationSteps(endpoint)}

    @Then("the response should contain an error message")
    public void validateError() {
        assertTrue(${this.camelCase(serviceClass)}.getLastErrorMessage().contains("error"));
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

    const content = `package ${this.config.basePackage}.service;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.http.ContentType;
import ${this.config.basePackage}.model.${requestClass};
import ${this.config.basePackage}.model.${responseClass};

public class ${className}Service {

    private int lastStatusCode;
    private String lastErrorMessage;

    public ${responseClass} ${this.getMethodName(method, resource)}(String endpoint, ${requestClass} request) {
        Response response = RestAssured
                .given()
                .contentType(ContentType.JSON)
                ${method !== 'GET' ? '.body(request)' : ''}
                .when()
                .${method.toLowerCase()}(endpoint);

        this.lastStatusCode = response.getStatusCode();
        
        if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
            return response.as(${responseClass}.class);
        } else {
            this.lastErrorMessage = response.getBody().asString();
            return null;
        }
    }

    public int getLastStatusCode() {
        return lastStatusCode;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }
}`;

    return {
      name: `${className}Service.java`,
      content,
    };
  }

  private generatePOJOs(endpoint: Endpoint, className: string) {
    const pojos = [];
    
    // Use real request data if available, otherwise fall back to sample data
    const requestData = endpoint.requestBody || 
                       (endpoint.actualResponse ? this.extractRequestDataFromResponse(endpoint) : this.generateDefaultRequestFields(endpoint));
    
    // Generate Request POJO
    if (requestData || endpoint.method.toUpperCase() !== 'GET') {
      const requestContent = this.generatePOJOClass(
        `${className}Request`,
        requestData,
        true
      );
      pojos.push({
        name: `${className}Request.java`,
        content: requestContent,
      });
    }

    // Use real response data if available
    const responseData = endpoint.actualResponse?.data || endpoint.responseBody;
    if (responseData) {
      const responseContent = this.generatePOJOClass(
        `${className}Response`,
        responseData,
        false
      );
      pojos.push({
        name: `${className}Response.java`,
        content: responseContent,
      });
    }

    return pojos;
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

  private generatePOJOClass(className: string, data: any, isRequest: boolean) {
    const fields = this.extractFields(data);
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
        `    private ${fieldType} ${this.camelCase(fieldName)};` : 
        annotation;
    }).join('\n');

    const gettersSetters = this.config.useLombok ? '' : this.generateGettersSetters(fields);

    return `package ${this.config.basePackage}.model;

import com.fasterxml.jackson.annotation.JsonProperty;${lombokImports}

public class ${className} {${lombokAnnotations}
${fieldsCode}${gettersSetters}
}`;
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
      case 'string': return 'String';
      case 'number': return 'Integer';
      case 'boolean': return 'Boolean';
      case 'object': return 'Object';
      default: return 'String';
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
      const assertionValue = typeof value === 'string' ? `"${value}"` : value;
      return `        assertEquals(${assertionValue}, response.get${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}());`;
    }).join('\n');
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
        return `the response status should be ${rule.expectedValue}`;
      case 'header':
        return `the response should have header "${rule.field}" with value "${rule.expectedValue}"`;
      case 'body':
        return `the response body should contain "${rule.expectedValue}"`;
      case 'responseTime':
        return `the response time should be less than ${rule.expectedValue}ms`;
      default:
        return `the response should match validation rule "${rule.type}"`;
    }
  }

  private generateValidationAssertion(rule: any): string {
    switch (rule.type) {
      case 'status':
        return `assertEquals(${rule.expectedValue}, ${this.camelCase(rule.field || 'statusCode')});`;
      case 'header':
        return `assertTrue(responseHeaders.containsKey("${rule.field}"));`;
      case 'body':
        return `assertTrue(responseBody.contains("${rule.expectedValue}"));`;
      case 'responseTime':
        return `assertTrue(responseTime < ${rule.expectedValue});`;
      default:
        return `// Custom validation for ${rule.type}`;
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
      case 'GET': return 'get';
      case 'POST': return 'create';
      case 'PUT': return 'update';
      case 'DELETE': return 'delete';
      case 'PATCH': return 'patch';
      default: return 'process';
    }
  }

  private getExpectedStatus(method: string): string {
    switch (method) {
      case 'GET': return '200';
      case 'POST': return '201';
      case 'PUT': return '200';
      case 'DELETE': return '204';
      case 'PATCH': return '200';
      default: return '200';
    }
  }

  private getMethodName(method: string, resource: string): string {
    const action = this.getActionFromMethod(method);
    return `${action}${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
} 