import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    framework: 'ocbc' as const,
    language: 'java' as const,
    basePackage: 'com.ocbc.api',
    useLombok: true,
    generatePOJOs: false, // POJOs are embedded in service classes
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
              BDD code generation is currently disabled. Enable it in the configuration to generate OCBC test framework code.
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
        title: "OCBC BDD Code Generated",
        description: `Generated ${code.featureFiles.length} feature files, ${code.stepDefinitions.length} step definitions, ${code.serviceClasses.length} service classes with embedded POJOs.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate OCBC BDD code. Please try again.",
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

    // Add service classes to service folder (POJOs are embedded)
    generatedCode.serviceClasses.forEach(file => {
      zip.file(`src/main/java/${config.basePackage.replace(/\./g, '/')}/service/${file.name}`, file.content);
    });

    // Generate and download
    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ocbc-bdd-framework-code.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    toast({
      title: "Download Complete",
      description: "OCBC BDD framework code has been downloaded as a ZIP file.",
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
                  <SelectItem value="ocbc">OCBC Test Framework</SelectItem>
                  <SelectItem value="cucumber">Cucumber</SelectItem>
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
                placeholder="com.ocbc.api"
              />
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
              <TabsList className="grid w-full grid-cols-3">
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
              </TabsList>

              <TabsContent value="features" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <ScrollArea className="h-80 w-full">
                    <div className="p-4 space-y-4">
                      {generatedCode.featureFiles.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <Badge variant="outline" className="text-xs">{file.name}</Badge>
                          <div className="bg-muted rounded-md overflow-hidden">
                            <pre className="text-xs p-4 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full font-mono">
                              <code className="block">{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <ScrollArea className="h-80 w-full">
                    <div className="p-4 space-y-4">
                      {generatedCode.stepDefinitions.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <Badge variant="outline" className="text-xs">{file.name}</Badge>
                          <div className="bg-muted rounded-md overflow-hidden">
                            <pre className="text-xs p-4 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full font-mono">
                              <code className="block">{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <ScrollArea className="h-80 w-full">
                    <div className="p-4 space-y-4">
                      {generatedCode.serviceClasses.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <Badge variant="outline" className="text-xs">{file.name}</Badge>
                          <div className="bg-muted rounded-md overflow-hidden">
                            <pre className="text-xs p-4 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full font-mono">
                              <code className="block">{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 