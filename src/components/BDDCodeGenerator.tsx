import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCode, Download, Settings, Code, FileText, Database, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isFeatureEnabled } from '@/config';
import { BDDCodeGenerator as BDDGenerator, Endpoint, GeneratedCode } from '@/utils/bddCodeGenerator';
import JSZip from 'jszip';

interface BDDCodeGeneratorProps {
  endpoints: Endpoint[];
}

export const BDDCodeGenerator: React.FC<BDDCodeGeneratorProps> = ({ endpoints }) => {
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({
    framework: 'cucumber',
    language: 'java',
    basePackage: 'com.example.api',
    useLombok: true,
    generatePOJOs: true,
    generateServiceClasses: true,
    generateStepDefinitions: true,
    generateFeatureFiles: true,
  });
  const { toast } = useToast();

  // Check if BDD feature is enabled
  if (!isFeatureEnabled('bddCodeGeneration')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            BDD Framework Code Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Badge variant="secondary" className="mb-4">
              Feature Disabled
            </Badge>
            <p className="text-muted-foreground">
              BDD code generation is currently disabled. Enable it in the configuration to generate Cucumber/Karate test code.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleGenerateCode = async () => {
    if (endpoints.length === 0) {
      toast({
        title: "No endpoints available",
        description: "Please import or add some API endpoints first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generator = new BDDGenerator();
      const code = generator.generateCode(endpoints);
      setGeneratedCode(code);
      
      toast({
        title: "BDD Code Generated",
        description: `Generated ${code.featureFiles.length} feature files, ${code.stepDefinitions.length} step definitions, ${code.serviceClasses.length} service classes, and ${code.pojos.length} POJOs.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate BDD code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (!generatedCode) return;

    const allFiles = [
      ...generatedCode.featureFiles,
      ...generatedCode.stepDefinitions,
      ...generatedCode.serviceClasses,
      ...generatedCode.pojos,
    ];

    const zip = new JSZip();
    
    // Add feature files to features folder
    generatedCode.featureFiles.forEach(file => {
      zip.file(`features/${file.name}`, file.content);
    });

    // Add step definitions to steps folder
    generatedCode.stepDefinitions.forEach(file => {
      zip.file(`src/test/java/${config.basePackage.replace(/\./g, '/')}/steps/${file.name}`, file.content);
    });

    // Add service classes to service folder
    generatedCode.serviceClasses.forEach(file => {
      zip.file(`src/main/java/${config.basePackage.replace(/\./g, '/')}/service/${file.name}`, file.content);
    });

    // Add POJOs to model folder
    generatedCode.pojos.forEach(file => {
      zip.file(`src/main/java/${config.basePackage.replace(/\./g, '/')}/model/${file.name}`, file.content);
    });

    // Generate and download
    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bdd-framework-code.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    toast({
      title: "Download Complete",
      description: "BDD framework code has been downloaded as a ZIP file.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          BDD Framework Code Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h3 className="text-sm font-medium">Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select value={config.framework} onValueChange={(value) => setConfig({ ...config, framework: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cucumber">Cucumber</SelectItem>
                  <SelectItem value="karate">Karate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={config.language} onValueChange={(value) => setConfig({ ...config, language: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="kotlin">Kotlin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePackage">Base Package</Label>
              <Input
                id="basePackage"
                value={config.basePackage}
                onChange={(e) => setConfig({ ...config, basePackage: e.target.value })}
                placeholder="com.example.api"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="useLombok">Use Lombok</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useLombok"
                  checked={config.useLombok}
                  onCheckedChange={(checked) => setConfig({ ...config, useLombok: checked as boolean })}
                />
                <Label htmlFor="useLombok" className="text-sm">Generate Lombok annotations</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Generate Components</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateFeatureFiles"
                  checked={config.generateFeatureFiles}
                  onCheckedChange={(checked) => setConfig({ ...config, generateFeatureFiles: checked as boolean })}
                />
                <Label htmlFor="generateFeatureFiles" className="text-sm">Feature Files</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateStepDefinitions"
                  checked={config.generateStepDefinitions}
                  onCheckedChange={(checked) => setConfig({ ...config, generateStepDefinitions: checked as boolean })}
                />
                <Label htmlFor="generateStepDefinitions" className="text-sm">Step Definitions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateServiceClasses"
                  checked={config.generateServiceClasses}
                  onCheckedChange={(checked) => setConfig({ ...config, generateServiceClasses: checked as boolean })}
                />
                <Label htmlFor="generateServiceClasses" className="text-sm">Service Classes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generatePOJOs"
                  checked={config.generatePOJOs}
                  onCheckedChange={(checked) => setConfig({ ...config, generatePOJOs: checked as boolean })}
                />
                <Label htmlFor="generatePOJOs" className="text-sm">POJOs</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateCode} 
            disabled={isGenerating || endpoints.length === 0}
            className="flex items-center gap-2"
          >
            <Code className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate BDD Code'}
          </Button>
          
          {generatedCode && (
            <Button 
              onClick={handleDownloadAll}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download All
            </Button>
          )}
        </div>

        {/* Generated Code Preview */}
        {generatedCode && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-medium">Generated Code Preview</h3>
            </div>

            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="features" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Features ({generatedCode.featureFiles.length})
                </TabsTrigger>
                <TabsTrigger value="steps" className="flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  Steps ({generatedCode.stepDefinitions.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Services ({generatedCode.serviceClasses.length})
                </TabsTrigger>
                <TabsTrigger value="pojos" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  POJOs ({generatedCode.pojos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="mt-4">
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  {generatedCode.featureFiles.map((file, index) => (
                    <div key={index} className="mb-4">
                      <Badge variant="outline" className="mb-2">{file.name}</Badge>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  {generatedCode.stepDefinitions.map((file, index) => (
                    <div key={index} className="mb-4">
                      <Badge variant="outline" className="mb-2">{file.name}</Badge>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  {generatedCode.serviceClasses.map((file, index) => (
                    <div key={index} className="mb-4">
                      <Badge variant="outline" className="mb-2">{file.name}</Badge>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pojos" className="mt-4">
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  {generatedCode.pojos.map((file, index) => (
                    <div key={index} className="mb-4">
                      <Badge variant="outline" className="mb-2">{file.name}</Badge>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 