
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, Globe, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { ResponseValidation } from './ResponseValidation';
import { useToast } from '@/hooks/use-toast';
import { TestCodeGenerator } from './TestCodeGenerator';
import { ValidationRule } from '@/types/validation';
import { JiraIntegration } from './JiraIntegration';
import { isFeatureEnabled } from '@/config';
import { CORSErrorDisplay } from './CORSErrorDisplay';

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
}


interface ResponsePanelProps {
  response: ApiResponse | null;
  loading: boolean;
  requestConfig?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  } | null;
  validationRules?: ValidationRule[];
  onValidationRulesChange?: (rules: ValidationRule[]) => void;
  showResponse?: boolean;
  showValidation?: boolean;
  showCodeGen?: boolean;
  executionResult?: any;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ 
  response, 
  loading, 
  requestConfig = null,
  validationRules = [],
  onValidationRulesChange,
  showResponse = true,
  showValidation = true,
  showCodeGen = true,
  executionResult
}) => {
  const { toast } = useToast();

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const validateResponseData = (response: any): boolean => {
    return response && 
           typeof response === 'object' && 
           response !== null &&
           (response.status !== undefined || response.data !== undefined);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyResponseBody = () => {
    if (response) {
      copyToClipboard(formatJson(response.data), "Response body");
    }
  };

  const copyHeaders = () => {
    if (response && response.headers && typeof response.headers === 'object') {
      const headersText = Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      copyToClipboard(headersText, "Response headers");
    } else {
      toast({
        title: "No headers available",
        description: "Cannot copy headers due to CORS restrictions or network errors",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sending Request</h3>
          <p className="text-gray-500">Please wait while we process your API call...</p>
        </div>
      </div>
    );
  }

  if (!response && showResponse) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test APIs</h3>
          <p className="text-gray-500 mb-6">Configure your request in the left panel and click "Call Request" to see the response here.</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Import from Postman/OpenAPI</p>
            <p>• Add validation rules</p>
            <p>• Generate test code</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Response Content */}
      {showResponse && response && validateResponseData(response) ? (
        <div className="flex-1 p-6">
          <Tabs defaultValue="body" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="body">Response Body</TabsTrigger>
              <TabsTrigger value="headers">Headers ({response.headers && typeof response.headers === 'object' ? Object.keys(response.headers).length : 0})</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="jira">Jira Integration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="body" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Response Body</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyResponseBody}
                  className="flex items-center hover:bg-blue-50"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy JSON
                </Button>
              </div>
              {/* Fixed height scrollable container for response body */}
              <div className="flex-1 border rounded-lg bg-gray-50/50 overflow-hidden">
                <ScrollArea className="h-[400px] p-4">
                  {response.status === 0 && response.data?.error ? (
                    <CORSErrorDisplay 
                      errorData={response.data} 
                      url={requestConfig?.url || 'Unknown URL'} 
                    />
                  ) : response.data?.success ? (
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
                      {formatJson(response.data.data)}
                    </pre>
                  ) : (
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">
                      {formatJson(response.data)}
                    </pre>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="headers" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Response Headers</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHeaders}
                  className="flex items-center hover:bg-blue-50"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Headers
                </Button>
              </div>
              {/* Fixed height scrollable container for headers */}
              <div className="flex-1 border rounded-lg bg-gray-50/50 overflow-hidden">
                <ScrollArea className="h-[400px] p-4">
                  {response.headers && typeof response.headers === 'object' && Object.entries(response.headers).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-1 p-3 bg-white rounded border-l-4 border-l-blue-200">
                          <code className="font-mono text-sm font-semibold text-blue-700">
                            {key}
                          </code>
                          <code className="font-mono text-sm text-gray-600 break-all">
                            {value}
                          </code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No headers available</p>
                      <p className="text-sm mt-2">This may be due to CORS restrictions or network errors</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="validation" className="flex-1 flex flex-col">
              <div className="flex-1">
                {showValidation ? (
                  <ResponseValidation response={response} onRulesChange={onValidationRulesChange} />
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <p>Validation panel</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="jira" className="flex-1 flex flex-col">
              <div className="flex-1">
                {executionResult && executionResult.status === 'success' ? (
                  <JiraIntegration results={[executionResult]} />
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    <p>Jira integration is available after a successful test execution</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : showResponse && response && !validateResponseData(response) ? (
        <div className="flex-1 p-6">
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Response Data</h3>
            <p className="text-sm mb-2">The response data is not in the expected format.</p>
            <p className="text-xs text-gray-400">
              This might be due to network errors, CORS issues, or malformed API responses.
            </p>
          </div>
        </div>
      ) : null}

      {/* Code Generation Panel */}
      {showCodeGen && isFeatureEnabled('testCodeGeneration') && (
        <div className="p-6">
          <TestCodeGenerator 
            requestConfig={requestConfig} 
            validationRules={validationRules as any}
          />
        </div>
      )}
    </div>
  );
};
