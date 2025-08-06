
import JSZip from 'jszip';

interface TestGenerationConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  validationRules: Array<{
    type: 'status' | 'value' | 'existence';
    field?: string;
    expectedValue?: string;
    condition?: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_null' | 'is_not_null';
  }>;
}

const generateCucumberFeature = (config: TestGenerationConfig): string => {
  const endpoint = new URL(config.url).pathname.replace(/\//g, '_').replace(/^_/, '') || 'api_test';
  const scenarioName = `${config.method.toUpperCase()} ${config.url}`;
  
  let feature = `Feature: API Testing
  As a developer
  I want to test API endpoints
  So that I can ensure they work correctly

Scenario: ${scenarioName}
  Given the API endpoint "${config.url}"
  When I send a ${config.method.toUpperCase()} request`;

  if (Object.keys(config.headers).length > 0) {
    feature += '\n  And I set the following headers:';
    Object.entries(config.headers).forEach(([key, value]) => {
      feature += `\n    | ${key} | ${value} |`;
    });
  }

  if (config.body) {
    feature += '\n  And I set the request body to:';
    feature += '\n    """';
    feature += `\n    ${config.body}`;
    feature += '\n    """';
  }

  feature += '\n  Then the response should be received';

  config.validationRules.forEach(rule => {
    switch (rule.type) {
      case 'status':
        feature += `\n  And the response status should be ${rule.expectedValue || '200'}`;
        break;
      case 'value':
        const condition = rule.condition || 'equals';
        feature += `\n  And the response field "${rule.field}" should ${condition} "${rule.expectedValue}"`;
        break;
      case 'existence':
        const existenceCondition = rule.condition || 'is_not_empty';
        feature += `\n  And the response field "${rule.field}" should ${existenceCondition}`;
        break;
    }
  });

  return feature;
};

const generateCucumberStepDefinitions = (config: TestGenerationConfig): string => {
  const className = new URL(config.url).pathname.replace(/\//g, '_').replace(/^_/, '') || 'ApiTest';
  const capitalizedClassName = className.charAt(0).toUpperCase() + className.slice(1) + 'Steps';

  return `package com.example.steps;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.And;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.Assert.*;
import io.cucumber.datatable.DataTable;

public class ${capitalizedClassName} {
    private RequestSpecification request;
    private Response response;
    private String endpoint;

    @Given("the API endpoint {string}")
    public void setApiEndpoint(String url) {
        this.endpoint = url;
        this.request = given();
    }

    @When("I send a ${config.method.toUpperCase()} request")
    public void sendRequest() {
        this.response = request.${config.method.toLowerCase()}(endpoint);
    }

    @And("I set the following headers:")
    public void setHeaders(DataTable dataTable) {
        dataTable.asMaps().forEach(row -> {
            request.header(row.get("header"), row.get("value"));
        });
    }

    @And("I set the request body to:")
    public void setRequestBody(String body) {
        request.body(body);
        request.contentType("application/json");
    }

    @Then("the response should be received")
    public void responseReceived() {
        assertNotNull("Response should not be null", response);
    }

    @And("the response status should be {int}")
    public void validateStatus(int expectedStatus) {
        assertEquals("Status code should match", expectedStatus, response.getStatusCode());
    }

    @And("the response field {string} should equal {string}")
    public void validateFieldValue(String fieldPath, String expectedValue) {
        String actualValue = response.jsonPath().getString(fieldPath);
        assertEquals("Field value should match", expectedValue, actualValue);
    }

    @And("the response should contain field {string}")
    public void validateFieldExists(String fieldPath) {
        Object value = response.jsonPath().get(fieldPath);
        assertNotNull("Field should exist", value);
    }
}`;
};

const generateKarateFeature = (config: TestGenerationConfig): string => {
  const scenarioName = `${config.method.toUpperCase()} ${config.url}`;
  
  let feature = `Feature: API Testing

Scenario: ${scenarioName}
  Given url '${config.url}'`;

  if (Object.keys(config.headers).length > 0) {
    feature += '\n  And headers';
    feature += '\n    """';
    feature += `\n    ${JSON.stringify(config.headers, null, 4)}`;
    feature += '\n    """';
  }

  if (config.body) {
    feature += '\n  And request';
    feature += '\n    """';
    feature += `\n    ${config.body}`;
    feature += '\n    """';
  }

  feature += `\n  When method ${config.method.toLowerCase()}`;

  config.validationRules.forEach(rule => {
    switch (rule.type) {
      case 'status':
        feature += `\n  Then status ${rule.expectedValue || '200'}`;
        break;
      case 'body':
      case 'value':
        const value = isNaN(Number(rule.expectedValue)) ? `'${rule.expectedValue}'` : rule.expectedValue;
        feature += `\n  And match response.${rule.field} == ${value}`;
        break;
      case 'header':
        feature += `\n  And match responseHeaders['${rule.field}'] == '${rule.expectedValue}'`;
        break;
      case 'responseTime':
        feature += `\n  And match responseTime < ${rule.expectedValue}`;
        break;
      case 'exists':
        feature += `\n  And match response.${rule.field} == '#present'`;
        break;
    }
  });

  return feature;
};

const generatePomXml = (config: TestGenerationConfig): string => {
  const endpoint = new URL(config.url).pathname.replace(/\//g, '_').replace(/^_/, '') || 'api_test';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>${endpoint}-api-tests</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cucumber.version>7.14.0</cucumber.version>
        <rest-assured.version>5.3.2</rest-assured.version>
        <junit.version>4.13.2</junit.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>io.cucumber</groupId>
            <artifactId>cucumber-java</artifactId>
            <version>\${cucumber.version}</version>
        </dependency>
        <dependency>
            <groupId>io.cucumber</groupId>
            <artifactId>cucumber-junit</artifactId>
            <version>\${cucumber.version}</version>
        </dependency>
        <dependency>
            <groupId>io.rest-assured</groupId>
            <artifactId>rest-assured</artifactId>
            <version>\${rest-assured.version}</version>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>\${junit.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M9</version>
                <configuration>
                    <includes>
                        <include>**/*Runner.java</include>
                    </includes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;
};

const generateTestRunner = (config: TestGenerationConfig): string => {
  const endpoint = new URL(config.url).pathname.replace(/\//g, '_').replace(/^_/, '') || 'api_test';
  const capitalizedClassName = endpoint.charAt(0).toUpperCase() + endpoint.slice(1) + 'Runner';

  return `package com.example.runner;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

@RunWith(Cucumber.class)
@CucumberOptions(
        features = "src/test/resources/features",
        glue = "com.example.steps",
        plugin = {
                "pretty",
                "html:target/cucumber-reports",
                "json:target/cucumber-reports/Cucumber.json"
        }
)
public class ${capitalizedClassName} {
}`;
};

export const generateTestCode = (format: 'cucumber' | 'karate', config: TestGenerationConfig) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const endpoint = new URL(config.url).pathname.replace(/\//g, '_').replace(/^_/, '') || 'api_test';
  
  if (format === 'cucumber') {
    const feature = generateCucumberFeature(config);
    const stepDefinitions = generateCucumberStepDefinitions(config);
    const pomXml = generatePomXml(config);
    const testRunner = generateTestRunner(config);
    
    return {
      files: [
        {
          name: `src/test/resources/features/${endpoint}_${timestamp}.feature`,
          content: feature,
          type: 'text/plain'
        },
        {
          name: `src/test/java/com/example/steps/${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}Steps_${timestamp}.java`,
          content: stepDefinitions,
          type: 'text/plain'
        },
        {
          name: `src/test/java/com/example/runner/${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}Runner_${timestamp}.java`,
          content: testRunner,
          type: 'text/plain'
        },
        {
          name: `pom.xml`,
          content: pomXml,
          type: 'text/plain'
        }
      ]
    };
  } else {
    const feature = generateKarateFeature(config);
    
    return {
      files: [
        {
          name: `${endpoint}_${timestamp}.feature`,
          content: feature,
          type: 'text/plain'
        }
      ]
    };
  }
};

export const downloadFiles = async (files: Array<{name: string, content: string, type: string}>) => {
  if (files.length === 1) {
    // Single file download
    const file = files[0];
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Multiple files - create ZIP
    const zip = new JSZip();
    
    files.forEach(file => {
      zip.file(file.name, file.content);
    });
    
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cucumber-java-tests-${new Date().toISOString().slice(0, 10)}.zip`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create ZIP file:', error);
      // Fallback to individual downloads with delay
      for (let i = 0; i < files.length; i++) {
        setTimeout(() => {
          const file = files[i];
          const blob = new Blob([file.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name.replace(/\//g, '_');
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, i * 500); // 500ms delay between downloads
      }
    }
  }
};
