// Allure Reporter for Browser Environment
// This generates Allure-compatible JSON files that can be processed by Allure CLI

interface ValidationRule {
  id: string;
  type: 'status' | 'header' | 'body' | 'responseTime';
  field?: string;
  expectedValue: string;
  result?: 'pass' | 'fail';
  message?: string;
}

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}

interface ExecutionResult {
  endpoint: Endpoint;
  status: 'success' | 'error' | 'pending';
  response?: {
    status: number;
    data: any;
    headers: Record<string, string>;
    time: number;
  };
  error?: string;
  validationResults?: ValidationRule[];
}

interface AllureTestResult {
  uuid: string;
  name: string;
  fullName: string;
  description: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped';
  statusDetails: {
    message?: string;
    trace?: string;
  };
  start: number;
  stop: number;
  duration: number;
  labels: Array<{
    name: string;
    value: string;
  }>;
  parameters: Array<{
    name: string;
    value: string;
  }>;
  steps: Array<{
    name: string;
    status: 'passed' | 'failed' | 'broken' | 'skipped';
    start: number;
    stop: number;
    duration: number;
    parameters: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

export class AllureReporter {
  private resultsDir: string;

  constructor(resultsDir: string = './allure-results') {
    this.resultsDir = resultsDir;
  }

  /**
   * Generate Allure-compatible test results
   */
  async generateReport(
    results: ExecutionResult[],
    collectionName: string = 'API Test Collection'
  ): Promise<string> {
    const timestamp = Date.now();
    const allureResults: AllureTestResult[] = [];

    // Process each test result
    for (const result of results) {
      const testStart = timestamp + allureResults.length * 1000; // Stagger test times
      const testStop = testStart + (result.response?.time || 1000);
      
      const allureTest: AllureTestResult = {
        uuid: this.generateUUID(),
        name: result.endpoint.name,
        fullName: `${result.endpoint.method} ${result.endpoint.url}`,
        description: result.endpoint.description || `Test for ${result.endpoint.method} ${result.endpoint.url}`,
        status: this.mapStatus(result.status),
        statusDetails: {
          message: result.error || undefined,
        },
        start: testStart,
        stop: testStop,
        duration: testStop - testStart,
        labels: [
          { name: 'method', value: result.endpoint.method },
          { name: 'url', value: result.endpoint.url },
          { name: 'endpoint', value: result.endpoint.name },
          { name: 'suite', value: collectionName },
          { name: 'framework', value: 'API Tester Pro' },
          { name: 'language', value: 'javascript' },
          { name: 'severity', value: 'normal' }
        ],
        parameters: [
          { name: 'Method', value: result.endpoint.method },
          { name: 'URL', value: result.endpoint.url },
          { name: 'Headers', value: JSON.stringify(result.endpoint.headers, null, 2) }
        ],
        steps: []
      };

      // Add request body parameter if exists
      if (result.endpoint.body) {
        allureTest.parameters.push({ name: 'Request Body', value: result.endpoint.body });
      }

      // Add request step
      allureTest.steps.push({
        name: 'Send Request',
        status: 'passed',
        start: testStart,
        stop: testStart + 100,
        duration: 100,
        parameters: [
          { name: 'Method', value: result.endpoint.method },
          { name: 'URL', value: result.endpoint.url }
        ]
      });

      if (result.status === 'success' && result.response) {
        // Add response step
        allureTest.steps.push({
          name: 'Receive Response',
          status: 'passed',
          start: testStart + 100,
          stop: testStart + 200,
          duration: 100,
          parameters: [
            { name: 'Status Code', value: result.response.status.toString() },
            { name: 'Response Time', value: `${result.response.time}ms` },
            { name: 'Headers', value: JSON.stringify(result.response.headers, null, 2) },
            { name: 'Response Body', value: JSON.stringify(result.response.data, null, 2) }
          ]
        });

        // Add validation steps
        if (result.validationResults && result.validationResults.length > 0) {
          result.validationResults.forEach((validation, index) => {
            allureTest.steps.push({
              name: `${validation.type} validation`,
              status: validation.result === 'pass' ? 'passed' : 'failed',
              start: testStart + 200 + index * 50,
              stop: testStart + 250 + index * 50,
              duration: 50,
              parameters: [
                { name: 'Expected', value: validation.expectedValue },
                { name: 'Field', value: validation.field || 'N/A' },
                ...(validation.result === 'fail' ? [{ name: 'Error', value: validation.message || 'Validation failed' }] : [])
              ]
            });
          });
        }
      } else {
        // Add error step
        allureTest.steps.push({
          name: 'Request Failed',
          status: 'failed',
          start: testStart + 100,
          stop: testStart + 200,
          duration: 100,
          parameters: [
            { name: 'Error', value: result.error || 'Unknown error occurred' }
          ]
        });
      }

      allureResults.push(allureTest);
    }

    // Create results directory structure
    const resultsDir = `allure-results-${Date.now()}`;
    
    // Save test results
    allureResults.forEach((test, index) => {
      const filename = `${test.uuid}-result.json`;
      this.downloadJSON(test, filename);
    });

    // Create summary
    const summary = {
      collectionName,
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: results.filter(r => r.status === 'success' && 
        (!r.validationResults || r.validationResults.every(v => v.result === 'pass'))).length,
      failed: results.length - results.filter(r => r.status === 'success' && 
        (!r.validationResults || r.validationResults.every(v => v.result === 'pass'))).length,
      executionTime: results.reduce((sum, r) => sum + (r.response?.time || 0), 0),
      allureResults: allureResults.length,
      resultsDir
    };

    this.downloadJSON(summary, 'summary.json');

    return resultsDir;
  }

  /**
   * Map internal status to Allure status
   */
  private mapStatus(status: string): 'passed' | 'failed' | 'broken' | 'skipped' {
    switch (status) {
      case 'success':
        return 'passed';
      case 'error':
        return 'failed';
      case 'pending':
        return 'skipped';
      default:
        return 'broken';
    }
  }

  /**
   * Generate UUID for test results
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Download JSON file (browser-compatible)
   */
  private downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get Allure command to generate HTML report
   */
  getGenerateCommand(resultsDir: string): string {
    return `allure generate ${resultsDir} --clean`;
  }

  /**
   * Get Allure command to serve HTML report
   */
  getServeCommand(resultsDir: string, port: number = 8080): string {
    return `allure serve ${resultsDir} -p ${port}`;
  }
} 