# BDD Framework Code Generation Feature

## Overview

The BDD (Behavior-Driven Development) Framework Code Generation feature is an optional component that generates complete test automation code for popular BDD frameworks like Cucumber and Karate. This feature can be toggled on/off via configuration settings.

## Features

### ✅ **Configurable Feature**
- **Toggle Control**: Enable/disable via `REACT_APP_BDD_CODE_GENERATION=true` environment variable
- **Framework Selection**: Choose between Cucumber and Karate
- **Language Support**: Java and Kotlin
- **Lombok Integration**: Optional Lombok annotations for cleaner POJOs

### ✅ **Generated Components**

#### 1. **Feature Files** (.feature)
- Gherkin syntax with Given/When/Then scenarios
- Positive and negative test cases
- Proper tagging for test filtering (@positive, @negative, @smoke)
- Organized by endpoint and HTTP method

#### 2. **Step Definitions** (.java)
- Java/Kotlin step implementation
- Integration with service classes
- Comprehensive assertions and validations
- Error handling and status code validation

#### 3. **Service Classes** (.java)
- REST API interaction logic
- Request/response handling
- Status code tracking
- Error message management

#### 4. **POJO Models** (.java)
- Request and response data models
- Lombok annotations (optional)
- JSON serialization/deserialization support
- Builder pattern for request objects

## Configuration

### Environment Variables

```bash
# Enable BDD code generation
REACT_APP_BDD_CODE_GENERATION=true

# Framework selection
REACT_APP_BDD_FRAMEWORK=cucumber  # or 'karate'

# Language selection
REACT_APP_BDD_LANGUAGE=java        # or 'kotlin'

# Base package for generated code
REACT_APP_BDD_BASE_PACKAGE=com.example.api

# Lombok usage
REACT_APP_BDD_USE_LOMBOK=true      # or 'false'
```

### Feature Configuration

```typescript
// src/config.ts
export const config = {
  features: {
    bddCodeGeneration: true,  // Enable by default
    // ... other features
  },
  bdd: {
    framework: 'cucumber',
    language: 'java',
    basePackage: 'com.example.api',
    useLombok: true,
    // ... other BDD settings
  }
};
```

## Usage

### 1. **Manual Testing Mode**
- Make API requests in the main interface
- BDD code generation appears automatically in the response panel
- Generates code based on the actual request/response data

### 2. **Standalone BDD Test Page**
- Navigate to `/bdd-test` route
- Test with sample endpoints
- Configure generation settings
- Preview generated code

### 3. **API Integration**
```typescript
import { BDDCodeGenerator } from '@/utils/bddCodeGenerator';

const generator = new BDDCodeGenerator();
const code = generator.generateCode(endpoints);
```

## Generated Code Examples

### Feature File Example
```gherkin
Feature: POST /api/users

  @post @users
  Scenario: Successfully create a user with valid data
    Given I prepare a valid users create payload
    When I send a POST request to "/api/users"
    Then the response status code should be 201
    And the response should contain the correct users details

  @post @users @negative
  Scenario: Fail to create a user with invalid data
    Given I prepare an invalid users create payload
    When I send a POST request to "/api/users"
    Then the response status code should be 400
    And the response should contain an error message
```

### Step Definitions Example
```java
package com.example.api.steps;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import static org.junit.Assert.*;

import com.example.api.service.CreateUserService;
import com.example.api.model.CreateUserRequest;
import com.example.api.model.CreateUserResponse;

public class CreateUserSteps {

    private CreateUserService createUserService = new CreateUserService();
    private CreateUserRequest request;
    private CreateUserResponse response;

    @Given("I prepare a valid users create payload")
    public void prepareValidPayload() {
        request = CreateUserRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .age(30)
                .build();
    }

    @When("I send a POST request to {string}")
    public void sendPostRequest(String endpoint) {
        response = createUserService.createUser(endpoint, request);
    }

    @Then("the response status code should be {int}")
    public void validateStatusCode(int expectedStatus) {
        assertEquals(expectedStatus, createUserService.getLastStatusCode());
    }

    @Then("the response should contain the correct users details")
    public void validateUserDetails() {
        assertNotNull(response);
        assertEquals("John Doe", response.getName());
        assertEquals("john@example.com", response.getEmail());
    }
}
```

### Service Class Example
```java
package com.example.api.service;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.http.ContentType;
import com.example.api.model.CreateUserRequest;
import com.example.api.model.CreateUserResponse;

public class CreateUserService {

    private int lastStatusCode;
    private String lastErrorMessage;

    public CreateUserResponse createUser(String endpoint, CreateUserRequest request) {
        Response response = RestAssured
                .given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post(endpoint);

        this.lastStatusCode = response.getStatusCode();
        
        if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
            return response.as(CreateUserResponse.class);
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
}
```

### POJO Example (with Lombok)
```java
package com.example.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

public class CreateUserRequest {
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserRequest {
        private String name;
        private String email;
        private Integer age;
    }
}
```

## File Structure

Generated code follows standard Maven/Gradle project structure:

```
src/
├── main/java/com/example/api/
│   ├── model/
│   │   ├── CreateUserRequest.java
│   │   └── CreateUserResponse.java
│   └── service/
│       └── CreateUserService.java
└── test/java/com/example/api/
    └── steps/
        └── CreateUserSteps.java

features/
└── create_user.feature
```

## Download Options

### 1. **Individual Files**
- Preview generated code in tabs
- Copy specific files to clipboard
- Download individual components

### 2. **Complete ZIP Package**
- All files organized in proper directory structure
- Ready-to-use Maven/Gradle project
- Includes all dependencies and configuration

## Integration Points

### 1. **Response Panel Integration**
- Automatically appears after API requests
- Uses actual request/response data
- Configurable via feature flags

### 2. **Smart Import Integration**
- Works with imported Swagger/OpenAPI specs
- Generates code for all imported endpoints
- Maintains endpoint relationships

### 3. **Multi-Endpoint Testing**
- Supports bulk code generation
- Consistent naming conventions
- Shared service patterns

## Customization Options

### 1. **Framework Configuration**
```typescript
const config = {
  framework: 'cucumber',     // 'cucumber' | 'karate'
  language: 'java',          // 'java' | 'kotlin'
  basePackage: 'com.example.api',
  useLombok: true,
  generatePOJOs: true,
  generateServiceClasses: true,
  generateStepDefinitions: true,
  generateFeatureFiles: true,
};
```

### 2. **Code Templates**
- Customizable step definitions
- Configurable service patterns
- Flexible POJO generation

### 3. **Assertion Patterns**
- Status code validation
- Response body assertions
- Error message handling
- Custom validation rules

## Benefits

### ✅ **Time Savings**
- Generate complete test suites in seconds
- Consistent code patterns across projects
- Reduced manual coding effort

### ✅ **Quality Assurance**
- Standardized test structure
- Comprehensive coverage patterns
- Built-in best practices

### ✅ **Maintainability**
- Clear separation of concerns
- Reusable components
- Easy to extend and modify

### ✅ **Team Collaboration**
- Consistent coding standards
- Shared understanding of test structure
- Easy onboarding for new team members

## Troubleshooting

### Common Issues

1. **Feature Not Visible**
   - Check `REACT_APP_BDD_CODE_GENERATION=true`
   - Verify feature flag in configuration

2. **Generation Errors**
   - Ensure valid request/response data
   - Check endpoint structure
   - Validate JSON format

3. **Download Issues**
   - Check browser download settings
   - Verify JSZip dependency
   - Clear browser cache

### Debug Mode

Enable debug logging:
```typescript
// Add to browser console
localStorage.setItem('debug', 'bdd-generator');
```

## Future Enhancements

### Planned Features
- [ ] Karate framework support
- [ ] Kotlin language support
- [ ] Custom assertion templates
- [ ] Integration with CI/CD pipelines
- [ ] Test data generation
- [ ] Performance testing scenarios

### Extension Points
- Custom code templates
- Framework-specific configurations
- Advanced validation patterns
- Multi-language support

## Conclusion

The BDD Framework Code Generation feature provides a powerful, configurable solution for generating comprehensive test automation code. It follows BDD best practices and integrates seamlessly with existing API testing workflows.

For more information, visit the BDD test page at `/bdd-test` or refer to the configuration documentation. 