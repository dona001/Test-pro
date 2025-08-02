import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Download, CheckCircle, AlertCircle, Clock, FileCode, Settings, Eye, Shield, Coffee, Archive, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { proxyApiCall } from '@/api/proxy';
import { EndpointConfigModal } from './EndpointConfigModal';
import { EndpointValidationModal } from './EndpointValidationModal';
import { ResponsePanel } from './ResponsePanel';
import { TestReportPanel } from './TestReportPanel';
import { JiraIntegration } from './JiraIntegration';
import { BitbucketIntegration } from './BitbucketIntegration';
import { isFeatureEnabled } from '@/config';
import { generateTestCode, downloadFiles } from '@/utils/testCodeGenerator';
import { getMethodColor } from '@/lib/utils';

import { ValidationRule, Endpoint } from '@/types/validation';

// Local ExecutionResult interface for this component
interface ExecutionResult {
  endpoint: Endpoint;
  status: 'success' | 'failed' | 'pending';
  response?: {
    status: number;
    data: any;
    headers: Record<string, any>;
    responseTime: number;
  };
  error?: string;
  validationResults?: ValidationRule[];
  executionTime?: number;
}

interface MultiEndpointExecutionProps {
  endpoints: Endpoint[];
  onCodeGeneration: (selectedEndpoints: Endpoint[]) => void;
}

export const MultiEndpointExecution: React.FC<MultiEndpointExecutionProps> = ({
  endpoints,
  onCodeGeneration
}) => {
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [customizedEndpoints, setCustomizedEndpoints] = useState<Record<string, Endpoint>>({});
  const [endpointValidations, setEndpointValidations] = useState<Record<string, ValidationRule[]>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [configModalEndpoint, setConfigModalEndpoint] = useState<Endpoint | null>(null);
  const [validationModalEndpoint, setValidationModalEndpoint] = useState<Endpoint | null>(null);
  const [selectedResponseEndpoint, setSelectedResponseEndpoint] = useState<string | null>(null);
  const [endpointResponses, setEndpointResponses] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const handleEndpointSelection = (endpointId: string, checked: boolean) => {
    setSelectedEndpoints(prev => 
      checked 
        ? [...prev, endpointId]
        : prev.filter(id => id !== endpointId)
    );
  };

  const handleSelectAll = () => {
    setSelectedEndpoints(
      selectedEndpoints.length === endpoints.length 
        ? [] 
        : endpoints.map(e => e.id)
    );
  };

  const getEffectiveEndpoint = (endpointId: string): Endpoint => {
    const customized = customizedEndpoints[endpointId];
    const original = endpoints.find(e => e.id === endpointId)!;
    return customized || original;
  };

  const handleConfigureEndpoint = (endpoint: Endpoint) => {
    const effectiveEndpoint = getEffectiveEndpoint(endpoint.id);
    setConfigModalEndpoint(effectiveEndpoint);
  };

  const handleValidateEndpoint = (endpoint: Endpoint) => {
    setValidationModalEndpoint(endpoint);
  };

  const handleSaveEndpointConfig = (updatedEndpoint: Endpoint) => {
    setCustomizedEndpoints(prev => ({
      ...prev,
      [updatedEndpoint.id]: updatedEndpoint
    }));
    
    toast({
      title: "Configuration saved",
      description: `Updated settings for ${updatedEndpoint.name}`,
    });
  };

  const handleSaveValidationRules = (endpointId: string, rules: ValidationRule[]) => {
    setEndpointValidations(prev => ({
      ...prev,
      [endpointId]: rules
    }));
    
    toast({
      title: "Validation rules saved",
      description: `Added ${rules.length} validation rules`,
    });
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

        case 'body':
          const actualValue = getNestedValue(response.data, rule.field || '');
          const expectedValue = rule.expectedValue;
          let convertedExpected: any = expectedValue;
          if (expectedValue === 'true') convertedExpected = true;
          if (expectedValue === 'false') convertedExpected = false;
          
          result = actualValue == convertedExpected ? 'pass' : 'fail';
          message = result === 'pass'
            ? `${rule.field} equals ${expectedValue}`
            : `${rule.field} is ${JSON.stringify(actualValue)}, expected ${expectedValue}`;
          break;

        case 'header':
          const headerValue = response.headers?.[rule.field || ''];
          result = headerValue === rule.expectedValue ? 'pass' : 'fail';
          message = result === 'pass'
            ? `Header ${rule.field} equals ${rule.expectedValue}`
            : `Header ${rule.field} is ${headerValue}, expected ${rule.expectedValue}`;
          break;

        case 'responseTime':
          const responseTime = response.responseTime || 0;
          const maxTime = parseInt(rule.expectedValue);
          result = responseTime <= maxTime ? 'pass' : 'fail';
          message = result === 'pass'
            ? `Response time ${responseTime}ms is within ${maxTime}ms limit`
            : `Response time ${responseTime}ms exceeds ${maxTime}ms limit`;
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

  const executeSelectedEndpoints = async () => {
    if (selectedEndpoints.length === 0) {
      toast({
        title: "No endpoints selected",
        description: "Please select at least one endpoint to execute",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    setExecutionResults([]);
    setEndpointResponses({});
    
    const results: ExecutionResult[] = [];
    const responses: Record<string, any> = {};

    for (const endpointId of selectedEndpoints) {
      const endpoint = getEffectiveEndpoint(endpointId);
      const validationRules = endpointValidations[endpointId] || [];
      
      try {
        const startTime = performance.now();
        
        const response = await proxyApiCall({
          method: endpoint.method,
          url: endpoint.url,
          headers: endpoint.headers,
          body: endpoint.body,
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
        responses[endpointId] = apiResponse;

        // Run validations if any are defined
        let validationResults: ValidationRule[] = [];
        if (validationRules.length > 0) {
          validationResults = validateResponse(response, validationRules);
        }

        const validationPassed = validationResults.filter(r => r.result === 'pass').length;
        const validationTotal = validationResults.length;

        results.push({
          endpoint,
          status: 'success',
          response: {
            status: response.status,
            data: response.data,
            headers: response.headers || {},
            responseTime: responseTime
          },
          validationResults,
        });

      } catch (error) {
        results.push({
          endpoint,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          validationResults: [],
        });
      }
    }

    setExecutionResults(results);
    setEndpointResponses(responses);
    setIsExecuting(false);

    const successCount = results.filter(r => r.status === 'success').length;
    const totalValidationsPassed = results.reduce((sum, r) => sum + (r.validationResults?.filter(v => v.result === 'pass').length || 0), 0);
    const totalValidations = results.reduce((sum, r) => sum + (r.validationResults?.length || 0), 0);
    
    toast({
      title: "Execution completed",
      description: `${successCount}/${results.length} requests succeeded. ${totalValidationsPassed}/${totalValidations} validations passed.`,
    });
  };

  const handleMultiEndpointCodeGeneration = async (format: 'cucumber' | 'karate') => {
    if (executionResults.length === 0) {
      toast({
        title: "No execution results",
        description: "Please run the endpoints first to generate test code",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating test code...",
        description: `Creating ${format} test files for ${executionResults.length} endpoints`,
      });

      const allFiles: Array<{name: string, content: string, type: string}> = [];

      // Generate test code for each executed endpoint
      for (const result of executionResults) {
        const endpoint = result.endpoint;
        const validationRules = endpointValidations[endpoint.id] || [];
        
        const config = {
          method: endpoint.method,
          url: endpoint.url,
          headers: endpoint.headers,
          body: endpoint.body,
          validationRules: validationRules.map(rule => ({
            type: rule.type,
            field: rule.field,
            expectedValue: rule.expectedValue
          }))
        };

        const testCode = generateTestCode(format, config);
        allFiles.push(...testCode.files);
      }

      await downloadFiles(allFiles);

      toast({
        title: "Test code generated!",
        description: format === 'cucumber' 
          ? `Maven project with ${allFiles.length} files downloaded as ZIP`
          : `${allFiles.length} Karate feature files downloaded as ZIP`,
      });

    } catch (error) {
      console.error('Multi-endpoint code generation failed:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate test code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCodeGeneration = () => {
    const selectedEndpointObjects = selectedEndpoints.map(id => getEffectiveEndpoint(id));
    onCodeGeneration(selectedEndpointObjects);
  };

  const getStatusIcon = (result: ExecutionResult) => {
    if (result.status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (result: ExecutionResult) => {
    if (result.status === 'success' && result.response) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          {result.response.status}
        </Badge>
      );
    }
    if (result.status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Error
        </Badge>
      );
    }
    return null;
  };

  const getValidationBadge = (result: ExecutionResult) => {
    const validationTotal = result.validationResults?.length || 0;
    if (validationTotal === 0) return null;
    
    const validationPassed = result.validationResults?.filter(v => v.result === 'pass').length || 0;
    const allPassed = validationPassed === validationTotal;
    return (
      <Badge className={`${allPassed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
        {validationPassed}/{validationTotal} validations
      </Badge>
    );
  };

  const hasCustomizations = (endpointId: string) => {
    return customizedEndpoints[endpointId] !== undefined;
  };

  const hasValidations = (endpointId: string) => {
    return endpointValidations[endpointId] && endpointValidations[endpointId].length > 0;
  };

  const handleViewResponse = (endpointId: string) => {
    setSelectedResponseEndpoint(endpointId);
  };

  if (endpoints.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No endpoints imported yet. Use Smart Import to load API collections.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Endpoint Selection and Execution */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Multi-Endpoint Execution
                </span>
                <Badge variant="outline">
                  {selectedEndpoints.length}/{endpoints.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedEndpoints.length === endpoints.length ? 'Deselect All' : 'Select All'}
                </Button>
                <div className="flex space-x-2">
                  <Button
                    onClick={executeSelectedEndpoints}
                    disabled={selectedEndpoints.length === 0 || isExecuting}
                    className="flex items-center"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {isExecuting ? 'Running...' : 'Run Selected'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCodeGeneration}
                    disabled={selectedEndpoints.length === 0}
                    className="flex items-center"
                  >
                    <FileCode className="w-4 h-4 mr-1" />
                    Generate Code
                  </Button>
                </div>
              </div>

              {/* Integration buttons - show after execution */}
              {executionResults.length > 0 && (
                <div className="flex gap-4">
                  <JiraIntegration 
                    results={executionResults}
                    collectionName="API Test Collection"
                  />
                  <BitbucketIntegration 
                    endpoints={selectedEndpoints.map(id => getEffectiveEndpoint(id))}
                    collectionName="API Test Collection"
                  />
                </div>
              )}

              {/* Endpoint List */}
              <div className="border rounded-lg">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-3">
                    {endpoints.map((endpoint) => {
                      const isSelected = selectedEndpoints.includes(endpoint.id);
                      const isCustomized = hasCustomizations(endpoint.id);
                      const hasValidationRules = hasValidations(endpoint.id);
                      const effectiveEndpoint = getEffectiveEndpoint(endpoint.id);
                      const hasResponse = endpointResponses[endpoint.id];
                      
                      return (
                        <div key={endpoint.id} className={`p-3 rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleEndpointSelection(endpoint.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={`font-mono text-xs border ${getMethodColor(effectiveEndpoint.method)}`}>
                                  {effectiveEndpoint.method}
                                </Badge>
                                <span className="font-medium">{effectiveEndpoint.name}</span>
                                {isCustomized && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    Modified
                                  </Badge>
                                )}
                                {hasValidationRules && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                    {endpointValidations[endpoint.id].length} rules
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mb-2">{effectiveEndpoint.url}</p>
                              
                              {isSelected && (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfigureEndpoint(endpoint)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Settings className="w-3 h-3" />
                                    <span>Configure</span>
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleValidateEndpoint(endpoint)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Shield className="w-3 h-3" />
                                    <span>Validation</span>
                                  </Button>

                                  {hasResponse && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewResponse(endpoint.id)}
                                      className="flex items-center space-x-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>View Response</span>
                                    </Button>
                                  )}
                                  
                                  {effectiveEndpoint.headers && typeof effectiveEndpoint.headers === 'object' && Object.keys(effectiveEndpoint.headers).length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {Object.keys(effectiveEndpoint.headers).length} headers
                                    </Badge>
                                  )}
                                  
                                  {effectiveEndpoint.body && (
                                    <Badge variant="outline" className="text-xs">
                                      Has body
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Execution Result */}
                            {executionResults.find(r => r.endpoint.id === endpoint.id) && (
                              <div className="flex flex-col items-end space-y-1">
                                {(() => {
                                  const result = executionResults.find(r => r.endpoint.id === endpoint.id)!;
                                  return (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        {getStatusIcon(result)}
                                        {getStatusBadge(result)}
                        {result.response?.responseTime && (
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {result.response.responseTime}ms
                          </Badge>
                        )}
                                      </div>
                                      {getValidationBadge(result) && (
                                        <div>{getValidationBadge(result)}</div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Execution Results Summary */}
              {executionResults.length > 0 && (
                <div className="mt-4 space-y-4">
                   <Collapsible defaultOpen={true}>
                     <CollapsibleTrigger asChild>
                       <div className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                         <div className="flex items-center justify-between">
                           <h4 className="font-medium">Execution Summary</h4>
                           <div className="flex items-center space-x-4">
                             <div className="flex items-center space-x-2 text-sm">
                               <span className="text-green-600 font-semibold">
                                 {executionResults.filter(r => r.status === 'success').length} passed
                               </span>
                               <span className="text-red-600 font-semibold">
                                 {executionResults.filter(r => r.status === 'failed').length} failed
                               </span>
                             </div>
                             <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                           </div>
                         </div>
                       </div>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                       <div className="px-4 pb-4">
                         <div className="grid grid-cols-4 gap-4 text-sm">
                           <div className="text-center">
                             <div className="text-2xl font-bold text-green-600">
                               {executionResults.filter(r => r.status === 'success').length}
                             </div>
                             <div className="text-gray-600">Successful</div>
                           </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {executionResults.filter(r => r.status === 'failed').length}
                              </div>
                              <div className="text-gray-600">Failed</div>
                            </div>
                           <div className="text-center">
                             <div className="text-2xl font-bold text-blue-600">
                               {executionResults.reduce((sum, r) => sum + (r.validationResults?.filter(v => v.result === 'pass').length || 0), 0)}/
                               {executionResults.reduce((sum, r) => sum + (r.validationResults?.length || 0), 0)}
                             </div>
                             <div className="text-gray-600">Validations</div>
                           </div>
                           <div className="text-center">
                             <div className="text-2xl font-bold text-purple-600">
                               {Math.round(
                                 executionResults
                                   .filter(r => r.response?.responseTime)
                                   .reduce((acc, r) => acc + (r.response?.responseTime || 0), 0) / 
                                 executionResults.filter(r => r.response?.responseTime).length
                               ) || 0}ms
                             </div>
                             <div className="text-gray-600">Avg Time</div>
                           </div>
                         </div>
                       </div>
                     </CollapsibleContent>
                   </Collapsible>

                   {/* Test Code Generation Section - Collapsible */}
                   <Collapsible>
                     <CollapsibleTrigger asChild>
                       <Card className="border-2 border-dashed border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100/50 transition-colors">
                         <CardHeader>
                           <CardTitle className="flex items-center justify-between">
                             <span className="flex items-center text-blue-800">
                               <FileCode className="w-5 h-5 mr-2" />
                               Generate Combined Test Suite
                             </span>
                             <div className="flex items-center space-x-2">
                               <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                 {executionResults.length} endpoints
                               </Badge>
                               <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                             </div>
                           </CardTitle>
                         </CardHeader>
                       </Card>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                       <Card className="border-2 border-dashed border-blue-200 bg-blue-50 mt-2">
                         <CardContent className="pt-6">
                           <p className="text-sm text-blue-700 mb-4">
                             Generate automated test code for all executed endpoints with their validation rules:
                           </p>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Button
                               onClick={() => handleMultiEndpointCodeGeneration('cucumber')}
                               className="flex items-center justify-center h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700"
                             >
                               <div className="flex items-center">
                                 <Coffee className="w-5 h-5 mr-2" />
                                 <span className="font-semibold">Cucumber Java</span>
                               </div>
                               <div className="text-xs text-center">
                                 Complete Maven Project
                               </div>
                               <div className="flex items-center text-xs">
                                 <Archive className="w-3 h-3 mr-1" />
                                 ZIP download
                               </div>
                             </Button>

                             <Button
                               onClick={() => handleMultiEndpointCodeGeneration('karate')}
                               className="flex items-center justify-center h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700"
                             >
                               <div className="flex items-center">
                                 <FileCode className="w-5 h-5 mr-2" />
                                 <span className="font-semibold">Karate DSL</span>
                               </div>
                               <div className="text-xs text-center">
                                 Feature files bundle
                               </div>
                               <div className="flex items-center text-xs">
                                 <Archive className="w-3 h-3 mr-1" />
                                 ZIP download
                               </div>
                             </Button>
                           </div>

                           <div className="mt-4 p-3 bg-white rounded-md border">
                             <h4 className="text-sm font-medium mb-2">Generated Test Suite Will Include:</h4>
                             <ul className="text-xs text-gray-600 space-y-1">
                               <li>• Test files for all {executionResults.length} executed endpoints</li>
                               <li>• All configured validation rules per endpoint</li>
                               <li>• Complete project structure (Maven for Cucumber)</li>
                               <li>• Ready-to-run test automation code</li>
                             </ul>
                           </div>
                         </CardContent>
                       </Card>
                     </CollapsibleContent>
                   </Collapsible>

                  {/* Test Report Panel */}
                  {isFeatureEnabled('reporting') && (
                    <TestReportPanel 
                      results={executionResults as any}
                      collectionName="API Collection Test"
                    />
                  )}
                </div>
              )}

              {isExecuting && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Executing endpoints... ({executionResults.length + 1}/{selectedEndpoints.length})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Response Viewer */}
        <div className="xl:col-span-1">
          {selectedResponseEndpoint && endpointResponses[selectedResponseEndpoint] ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Response</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedResponseEndpoint(null)}
                  >
                    Close
                  </Button>
                </CardTitle>
                <div className="text-sm text-gray-600">
                  {endpoints.find(e => e.id === selectedResponseEndpoint)?.name}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsePanel
                  response={endpointResponses[selectedResponseEndpoint]}
                  loading={false}
                  requestConfig={null}
                  validationRules={endpointValidations[selectedResponseEndpoint] as any || []}
                  showResponse={true}
                  showValidation={false}
                  showCodeGen={false}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Select an endpoint and run execution to view responses here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
          existingRules={endpointValidations[validationModalEndpoint.id] || []}
          isOpen={true}
          onClose={() => setValidationModalEndpoint(null)}
          onSave={(rules) => handleSaveValidationRules(validationModalEndpoint.id, rules)}
        />
      )}
    </>
  );
};
