
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileCode, Coffee, Archive } from 'lucide-react';
import { generateTestCode, downloadFiles } from '@/utils/testCodeGenerator';
import { useToast } from '@/hooks/use-toast';

interface ValidationRule {
  id: string;
  type: 'status' | 'value' | 'existence';
  field?: string;
  expectedValue?: string;
  condition?: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_null' | 'is_not_null';
  result?: 'pass' | 'fail';
  message?: string;
}

interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

interface TestCodeGeneratorProps {
  requestConfig: RequestConfig | null;
  validationRules: ValidationRule[];
}

export const TestCodeGenerator: React.FC<TestCodeGeneratorProps> = ({
  requestConfig,
  validationRules
}) => {
  const { toast } = useToast();

  const handleGenerateCode = async (format: 'cucumber' | 'karate') => {
    if (!requestConfig) {
      toast({
        title: "No request data",
        description: "Please make an API request first",
        variant: "destructive",
      });
      return;
    }

    if (validationRules.length === 0) {
      toast({
        title: "No validation rules",
        description: "Please add at least one validation rule",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating test code...",
        description: "Please wait while we create your test files",
      });

      const config = {
        method: requestConfig.method,
        url: requestConfig.url,
        headers: requestConfig.headers,
        body: requestConfig.body,
        validationRules: validationRules.map(rule => ({
          type: rule.type,
          field: rule.field,
          expectedValue: rule.expectedValue
        }))
      };

      const result = generateTestCode(format, config);
      await downloadFiles(result.files);

      toast({
        title: "Test code generated!",
        description: format === 'cucumber' 
          ? `Maven project with ${result.files.length} files downloaded as ZIP`
          : `Karate feature file downloaded`,
      });
    } catch (error) {
      console.error('Code generation failed:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate test code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canGenerate = requestConfig && validationRules.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <FileCode className="w-5 h-5 mr-2" />
            Generate Test Code
          </span>
          {canGenerate && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {validationRules.length} rule{validationRules.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canGenerate ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Export your API test as automated test code for popular BDD frameworks:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleGenerateCode('cucumber')}
                className="flex items-center justify-center h-24 flex-col space-y-2"
                variant="outline"
              >
                <div className="flex items-center">
                  <Coffee className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Cucumber Java</span>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Complete Maven Project<br/>
                  .feature + Java steps + pom.xml
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <Archive className="w-3 h-3 mr-1" />
                  ZIP download
                </div>
              </Button>

              <Button
                onClick={() => handleGenerateCode('karate')}
                className="flex items-center justify-center h-24 flex-col space-y-2"
                variant="outline"
              >
                <div className="flex items-center">
                  <FileCode className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Karate DSL</span>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Standalone .feature file<br/>
                  Ready to run with Karate
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <Download className="w-3 h-3 mr-1" />
                  Single file
                </div>
              </Button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Cucumber Java will generate:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <code>src/test/resources/features/</code> - Gherkin feature file</li>
                <li>• <code>src/test/java/.../steps/</code> - Java step definitions</li>
                <li>• <code>src/test/java/.../runner/</code> - JUnit test runner</li>
                <li>• <code>pom.xml</code> - Maven dependencies & configuration</li>
              </ul>
              
              <h4 className="text-sm font-medium mb-2 mt-3">Test Details:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• API endpoint: {requestConfig.method.toUpperCase()} {requestConfig.url}</li>
                <li>• Headers: {requestConfig.headers && typeof requestConfig.headers === 'object' ? Object.keys(requestConfig.headers).join(', ') || 'None' : 'None'}</li>
                <li>• Request body: {requestConfig.body ? 'Included' : 'None'}</li>
                <li>• Validation rules: {validationRules.length} assertions</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm mb-2">Ready to generate test automation code!</p>
            <p className="text-xs">
              {!requestConfig && "Make an API request and "}
              {!validationRules.length && "add validation rules "}
              to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
