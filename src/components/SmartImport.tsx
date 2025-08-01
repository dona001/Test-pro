import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, List, Settings, Shield, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseImportedFile } from '@/utils/fileParser';
import { MultiEndpointExecution } from './MultiEndpointExecution';
import { EndpointConfigModal } from './EndpointConfigModal';
import { EndpointValidationModal } from './EndpointValidationModal';
import { TestCodeGenerator } from './TestCodeGenerator';
import { ResponsePanel } from './ResponsePanel';
import { proxyApiCall } from '@/api/proxy';
import { ValidationRule } from '@/types/validation';
import { isFeatureEnabled } from '@/config';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}


interface SmartImportProps {
  onEndpointSelected: (endpoint: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({ onEndpointSelected }) => {
  const [importType, setImportType] = useState<string>('');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  
  // Single endpoint execution state
  const [singleEndpointConfig, setSingleEndpointConfig] = useState<Endpoint | null>(null);
  const [singleEndpointValidation, setSingleEndpointValidation] = useState<ValidationRule[]>([]);
  const [isExecutingSingle, setIsExecutingSingle] = useState(false);
  const [singleExecutionResult, setSingleExecutionResult] = useState<any>(null);
  const [singleEndpointResponse, setSingleEndpointResponse] = useState<any>(null);
  
  // Modal states
  const [configModalEndpoint, setConfigModalEndpoint] = useState<Endpoint | null>(null);
  const [validationModalEndpoint, setValidationModalEndpoint] = useState<Endpoint | null>(null);
  
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileLoaded(false);
    
    try {
      const text = await file.text();
      const parsedEndpoints = await parseImportedFile(text, file.name);
      
      setEndpoints(parsedEndpoints);
      setFileLoaded(true);
      setFileName(file.name);
      
      toast({
        title: "File imported successfully",
        description: `Found ${parsedEndpoints.length} endpoints`,
      });
    } catch (error) {
      console.error('File parsing error:', error);
      setFileLoaded(false);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEndpointSelection = (endpointId: string) => {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      setSelectedEndpoint(endpointId);
      setSingleEndpointConfig(endpoint);
      setSingleEndpointValidation([]);
      setSingleExecutionResult(null);
      
      onEndpointSelected({
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        body: endpoint.body,
      });
      
      toast({
        title: "Endpoint loaded",
        description: `${endpoint.method} ${endpoint.name}`,
      });
    }
  };

  const handleConfigureEndpoint = () => {
    if (singleEndpointConfig) {
      setConfigModalEndpoint(singleEndpointConfig);
    }
  };

  const handleValidateEndpoint = () => {
    if (singleEndpointConfig) {
      setValidationModalEndpoint(singleEndpointConfig);
    }
  };

  const handleSaveEndpointConfig = (updatedEndpoint: Endpoint) => {
    setSingleEndpointConfig(updatedEndpoint);
    
    onEndpointSelected({
      method: updatedEndpoint.method,
      url: updatedEndpoint.url,
      headers: updatedEndpoint.headers,
      body: updatedEndpoint.body,
    });
    
    toast({
      title: "Configuration saved",
      description: `Updated settings for ${updatedEndpoint.name}`,
    });
  };

  const handleSaveValidationRules = (endpointId: string, rules: ValidationRule[]) => {
    setSingleEndpointValidation(rules);
    
    toast({
      title: "Validation rules saved",
      description: `Added ${rules.length} validation rules`,
    });
  };

  const executeSingleEndpoint = async () => {
    if (!singleEndpointConfig) return;

    setIsExecutingSingle(true);
    setSingleExecutionResult(null);
    setSingleEndpointResponse(null);
    
    try {
      const startTime = performance.now();
      
      const response = await proxyApiCall({
        method: singleEndpointConfig.method,
        url: singleEndpointConfig.url,
        headers: singleEndpointConfig.headers,
        body: singleEndpointConfig.body,
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Store the response for display
      const apiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers || {},
        data: response.data,
        responseTime,
      };
      setSingleEndpointResponse(apiResponse);

      // Run validations if any are defined
      let validationResults: ValidationRule[] = [];
      if (singleEndpointValidation.length > 0) {
        validationResults = validateResponse(response, singleEndpointValidation);
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        responseTime,
        success: response.status >= 200 && response.status < 300,
        data: response.data,
        validationResults,
        validationPassed: validationResults.filter(r => r.result === 'pass').length,
        validationTotal: validationResults.length,
      };

      setSingleExecutionResult(result);
      
      const validationMessage = validationResults.length > 0 
        ? `. ${result.validationPassed}/${result.validationTotal} validations passed`
        : '';
      
      toast({
        title: result.success ? "Request successful" : "Request failed",
        description: `${response.status} ${response.statusText} (${responseTime}ms)${validationMessage}`,
        variant: result.success ? "default" : "destructive",
      });

    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        validationResults: [],
        validationPassed: 0,
        validationTotal: singleEndpointValidation.length,
      };
      
      setSingleExecutionResult(result);
      
      toast({
        title: "Request failed",
        description: result.error,
        variant: "destructive",
      });
    } finally {
      setIsExecutingSingle(false);
    }
  };

  const validateResponse = (response: any, rules: ValidationRule[]): ValidationRule[] => {
    return rules.map(rule => {
      let result: 'pass' | 'fail' = 'fail';
      let message = '';

      switch (rule.type) {
        case 'status':
          const expectedStatus = parseInt(rule.expectedValue || '200');
          result = response.status === expectedStatus ? 'pass' : 'fail';
          message = result === 'pass' 
            ? `Status ${response.status} matches expected ${expectedStatus}`
            : `Status ${response.status} does not match expected ${expectedStatus}`;
          break;

        case 'value':
          const actualValue = getNestedValue(response.data, rule.field);
          const expectedValue = rule.expectedValue;
          let convertedExpected: any = expectedValue;
          if (expectedValue === 'true') convertedExpected = true;
          if (expectedValue === 'false') convertedExpected = false;
          
          result = actualValue == convertedExpected ? 'pass' : 'fail';
          message = result === 'pass'
            ? `${rule.field} equals ${expectedValue}`
            : `${rule.field} is ${JSON.stringify(actualValue)}, expected ${expectedValue}`;
          break;

        case 'exists':
          const value = getNestedValue(response.data, rule.field);
          result = value !== undefined && value !== null ? 'pass' : 'fail';
          message = result === 'pass'
            ? `${rule.field} exists`
            : `${rule.field} does not exist`;
          break;

        case 'header':
          const headerValue = response.headers[rule.field || ''];
          result = headerValue === rule.expectedValue ? 'pass' : 'fail';
          message = result === 'pass'
            ? `Header ${rule.field} equals ${rule.expectedValue}`
            : `Header ${rule.field} is ${headerValue}, expected ${rule.expectedValue}`;
          break;

        case 'body':
          const bodyValue = getNestedValue(response.data, rule.field || '');
          result = bodyValue === rule.expectedValue ? 'pass' : 'fail';
          message = result === 'pass'
            ? `Body ${rule.field} equals ${rule.expectedValue}`
            : `Body ${rule.field} is ${bodyValue}, expected ${rule.expectedValue}`;
          break;

        case 'responseTime':
          const maxTime = parseInt(rule.expectedValue || '1000');
          result = response.responseTime <= maxTime ? 'pass' : 'fail';
          message = result === 'pass'
            ? `Response time ${response.responseTime}ms is within ${maxTime}ms`
            : `Response time ${response.responseTime}ms exceeds ${maxTime}ms`;
          break;
      }

      return { ...rule, result, message };
    });
  };

  const getNestedValue = (obj: any, path: string): any => {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    } catch {
      return undefined;
    }
  };

  const handleCodeGeneration = (selectedEndpoints: Endpoint[]) => {
    toast({
      title: "Code generation requested",
      description: `Ready to generate test code for ${selectedEndpoints.length} endpoints`,
    });
  };

  const getRequestConfig = () => {
    if (!singleEndpointConfig) return null;
    
    return {
      method: singleEndpointConfig.method,
      url: singleEndpointConfig.url,
      headers: singleEndpointConfig.headers,
      body: singleEndpointConfig.body,
    };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Smart Import</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-type">Import Type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select import type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postman">Postman Collection</SelectItem>
                <SelectItem value="swagger">Swagger/OpenAPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {importType && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept={importType === 'postman' ? '.json' : '.json,.yaml,.yml'}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {fileLoaded && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Loaded</span>
                  </div>
                )}
              </div>
              {fileLoaded && fileName && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{fileName}</span>
                  </span>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <List className="w-3 h-3" />
                    <span>{endpoints.length} endpoints</span>
                  </Badge>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {importType === 'postman' 
                  ? 'Supports Postman Collection v2.0 and v2.1 (.json)'
                  : 'Supports OpenAPI 3.x and Swagger 2.0 (.json, .yaml, .yml)'
                }
              </p>
            </div>
          )}

          {endpoints.length > 0 && (
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Endpoint</TabsTrigger>
                <TabsTrigger value="multi">Multi Execution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Panel - Configuration */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="endpoint-select" className="flex items-center space-x-2">
                        <span>Select Endpoint</span>
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <List className="w-3 h-3" />
                          <span>{endpoints.length} available</span>
                        </Badge>
                      </Label>
                      <Select value={selectedEndpoint} onValueChange={handleEndpointSelection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an endpoint..." />
                        </SelectTrigger>
                        <SelectContent>
                          {endpoints.map((endpoint) => (
                            <SelectItem key={endpoint.id} value={endpoint.id}>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  {endpoint.method}
                                </span>
                                <span>{endpoint.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEndpoint && singleEndpointConfig && (
                      <div className="space-y-4">
                        {/* Endpoint Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleConfigureEndpoint}
                            className="flex items-center space-x-1"
                          >
                            <Settings className="w-3 h-3" />
                            <span>Configure</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleValidateEndpoint}
                            className="flex items-center space-x-1"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Validation ({singleEndpointValidation.length})</span>
                          </Button>
                          
                          <Button
                            onClick={executeSingleEndpoint}
                            disabled={isExecutingSingle}
                            className="flex items-center space-x-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>{isExecutingSingle ? 'Running...' : 'Execute'}</span>
                          </Button>
                        </div>

                        {/* Test Code Generation */}
                        {isFeatureEnabled('testCodeGeneration') && (
                          <TestCodeGenerator 
                            requestConfig={getRequestConfig()}
                            validationRules={singleEndpointValidation as any}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Panel - Response */}
                  <div className="space-y-4">
                    {selectedEndpoint && (
                      <Card className="min-h-[400px]">
                        <CardHeader>
                          <CardTitle className="text-lg">Response</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ResponsePanel
                            response={singleEndpointResponse}
                            loading={isExecutingSingle}
                            requestConfig={getRequestConfig()}
                            validationRules={singleEndpointValidation}
                            onValidationRulesChange={(rules) => setSingleEndpointValidation(rules)}
                            showResponse={true}
                            showValidation={false}
                            showCodeGen={false}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="multi">
                <MultiEndpointExecution 
                  endpoints={endpoints}
                  onCodeGeneration={handleCodeGeneration}
                />
              </TabsContent>
            </Tabs>
          )}

          {isUploading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Parsing file...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      {configModalEndpoint && (
        <EndpointConfigModal
          endpoint={configModalEndpoint}
          isOpen={true}
          onClose={() => setConfigModalEndpoint(null)}
          onSave={handleSaveEndpointConfig}
        />
      )}

      {/* Validation Modal */}
      {validationModalEndpoint && (
        <EndpointValidationModal
          endpoint={validationModalEndpoint}
          existingRules={singleEndpointValidation}
          isOpen={true}
          onClose={() => setValidationModalEndpoint(null)}
          onSave={(rules) => handleSaveValidationRules(validationModalEndpoint.id, rules as any)}
        />
      )}
    </>
  );
};
