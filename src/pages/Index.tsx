import { useState } from "react";
import { Zap } from "lucide-react";
import { Header } from "@/components/Header";
import { RequestPanel } from "@/components/RequestPanel";
import { ResponsePanel } from "@/components/ResponsePanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card } from "@/components/ui/card";
import { ValidationRule } from "@/types/validation";
import { JiraIntegration } from "@/components/JiraIntegration";
import { BitbucketIntegration } from "@/components/BitbucketIntegration";
import { isFeatureEnabled } from "@/config";
import { fetchWithCORS, CORSProxy } from "@/api/corsProxy";

const Index = () => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [requestConfig, setRequestConfig] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Helper function to get nested values from objects
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const handleRequest = async (requestData: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => {
    setLoading(true);
    setRequestConfig(requestData);
    try {
      // Make the API request
      const fetchOptions: RequestInit = {
        method: requestData.method,
        headers: {
          'Content-Type': 'application/json',
          ...requestData.headers,
        },
      };

      if (requestData.body && ['POST', 'PUT', 'PATCH'].includes(requestData.method)) {
        fetchOptions.body = requestData.body;
      }

      let response;
      try {
        response = await fetchWithCORS(requestData.url, fetchOptions);
      } catch (error) {
        // Handle backend proxy errors
        setResponse({
          status: 0,
          statusText: 'Backend Proxy Error',
          headers: {},
          data: {
            error: `Backend proxy failed for ${requestData.url}`,
            solutions: [
              'Ensure the backend proxy server is running: cd backend && npm start',
              'Check if the proxy server is accessible at http://localhost:3001/health',
              'Verify the proxy server is running on port 3001',
              'Check network connectivity to localhost:3001',
              'Restart the backend proxy server if needed'
            ],
            originalError: error instanceof Error ? error.message : 'Unknown error'
          },
          responseTime: Date.now(),
        });
        setLoading(false);
        return;
      }

      const responseData = await response.text();
      
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      // Handle backend proxy response format
      const apiResponse = {
        status: parsedData.success ? parsedData.status : response.status,
        statusText: parsedData.success ? parsedData.statusText : response.statusText,
        headers: parsedData.success ? parsedData.headers : Object.fromEntries(response.headers.entries()),
        data: parsedData.success ? parsedData.data : parsedData,
        responseTime: parsedData.success ? parsedData.proxyInfo?.responseTime || Date.now() : Date.now(),
      };
      
      setResponse(apiResponse);
      
      // Validate rules against response
      const validatedRules = validationRules.map(rule => {
        let result: 'pass' | 'fail' = 'pass';
        let message = '';
        
        try {
          switch (rule.type) {
            case 'status':
              result = apiResponse.status.toString() === rule.expectedValue ? 'pass' : 'fail';
              message = result === 'pass' 
                ? `Status code ${apiResponse.status} matches expected ${rule.expectedValue}`
                : `Status code ${apiResponse.status} does not match expected ${rule.expectedValue}`;
              break;
            case 'header':
              const headerValue = apiResponse.headers[rule.field!];
              result = headerValue === rule.expectedValue ? 'pass' : 'fail';
              message = result === 'pass'
                ? `Header "${rule.field}" has expected value`
                : `Header "${rule.field}" value "${headerValue}" does not match expected "${rule.expectedValue}"`;
              break;
            case 'body':
            case 'value':
              const data = JSON.stringify(apiResponse.data);
              result = data.includes(rule.expectedValue!) ? 'pass' : 'fail';
              message = result === 'pass'
                ? `Response contains expected value "${rule.expectedValue}"`
                : `Response does not contain expected value "${rule.expectedValue}"`;
              break;
            case 'exists':
              const exists = rule.field ? getNestedValue(apiResponse.data, rule.field) !== undefined : false;
              result = exists ? 'pass' : 'fail';
              message = result === 'pass'
                ? `Field "${rule.field}" exists in response`
                : `Field "${rule.field}" does not exist in response`;
              break;
            case 'responseTime':
              const responseTime = Date.now() - apiResponse.responseTime;
              const expectedTime = parseInt(rule.expectedValue!);
              result = responseTime <= expectedTime ? 'pass' : 'fail';
              message = result === 'pass'
                ? `Response time ${responseTime}ms is within expected ${expectedTime}ms`
                : `Response time ${responseTime}ms exceeds expected ${expectedTime}ms`;
              break;
          }
        } catch (error) {
          result = 'fail';
          message = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        
        return { ...rule, result, message };
      });

      // Create execution result for integrations
      setExecutionResult({
        endpoint: {
          id: 'manual-test',
          name: 'Manual API Test',
          method: requestData.method,
          url: requestData.url,
          headers: requestData.headers,
          body: requestData.body,
          description: `Manual test of ${requestData.method} ${requestData.url}`
        },
        status: response.ok ? 'success' : 'error',
        response: apiResponse,
        validationResults: validatedRules
      });
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        time: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="border-b bg-white/90 backdrop-blur-sm shadow-sm dark:bg-slate-800/90 dark:border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Manual API Testing</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Test, Debug, Validate APIs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test an API Manually</h2>
            <RequestPanel onApiCall={handleRequest} loading={loading} />
          </Card>
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Response</h2>
              <ErrorBoundary>
                <ResponsePanel 
                  response={response} 
                  loading={loading}
                  requestConfig={requestConfig}
                  validationRules={validationRules}
                  onValidationRulesChange={setValidationRules}
                  showResponse={true}
                  showValidation={true}
                  showCodeGen={isFeatureEnabled('testCodeGeneration')}
                  executionResult={executionResult}
                />
              </ErrorBoundary>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;