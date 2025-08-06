import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTestCode } from '@/utils/testCodeGenerator';
import JSZip from 'jszip';
import { isFeatureEnabled } from '@/config';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

interface BitbucketIntegrationProps {
  endpoints: Endpoint[];
  collectionName?: string;
}

export const BitbucketIntegration: React.FC<BitbucketIntegrationProps> = ({ endpoints, collectionName }) => {
  // Check if Bitbucket integration is enabled
  if (!isFeatureEnabled('bitbucketIntegration')) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [bitbucketConfig, setBitbucketConfig] = useState({
    workspace: '',
    repository: '',
    branch: 'main',
    folderPath: 'src/test/java',
    username: '',
    password: '',
    codeFormat: (isFeatureEnabled('standardCodeGeneration') ? 'cucumber' : (isFeatureEnabled('karateFramework') ? 'karate' : 'cucumber')) as 'karate' | 'cucumber'
  });

  const handlePushToBitbucket = async () => {
    if (!bitbucketConfig.workspace || !bitbucketConfig.repository || !bitbucketConfig.username || !bitbucketConfig.password) {
      toast({
        title: "Missing Configuration",
        description: "Please fill in workspace, repository, username, and password.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store config in localStorage for future use (excluding password)
      const configToStore = { ...bitbucketConfig };
      delete configToStore.password;
      localStorage.setItem('bitbucketConfig', JSON.stringify(configToStore));

      // Generate test code for all endpoints
      const testFiles = [];
      
      for (const endpoint of endpoints) {
        const config = {
          method: endpoint.method,
          url: endpoint.url,
          headers: endpoint.headers || {},
          body: endpoint.body,
          expectedStatus: 200,
          validationRules: []
        };

        const generatedCode = generateTestCode(bitbucketConfig.codeFormat, config);
        testFiles.push(...generatedCode.files);
      }

      // Create file structure and push to Bitbucket
      for (const file of testFiles) {
        await pushFileToBitbucket(file);
      }

      toast({
        title: "Push Successful",
        description: `Test collection pushed to Bitbucket repository successfully.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://bitbucket.org/${bitbucketConfig.workspace}/${bitbucketConfig.repository}/src/${bitbucketConfig.branch}/${bitbucketConfig.folderPath}`, '_blank')}
          >
            View on Bitbucket
          </Button>
        ),
      });
    } catch (error) {
      toast({
        title: "Push Failed",
        description: `Failed to push to Bitbucket: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pushFileToBitbucket = async (file: { name: string; content: string; type: string }) => {
    const filePath = `${bitbucketConfig.folderPath}/${file.name}`;
    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${bitbucketConfig.workspace}/${bitbucketConfig.repository}/src`;
    
    const formData = new FormData();
    formData.append('message', `Auto-generated test collection from ${collectionName || 'API Testing Tool'}`);
    formData.append('branch', bitbucketConfig.branch);
    formData.append(filePath, file.content);

    // Route through our wrapper endpoint
    const wrapperPayload = {
      url: apiUrl,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${bitbucketConfig.username}:${bitbucketConfig.password}`)}`
      },
      body: formData
    };

    const response = await fetch('/api/wrapper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wrapperPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to push file to Bitbucket');
    }

    return response.json();
  };

  // Load saved config on component mount
  React.useEffect(() => {
    const savedConfig = localStorage.getItem('bitbucketConfig');
    if (savedConfig) {
      setBitbucketConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
    }
  }, []);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Push to Bitbucket
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {endpoints.length}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Push Test Collection to Bitbucket
              <span className="text-sm font-normal text-muted-foreground">
                {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace *</Label>
                <Input
                  id="workspace"
                  placeholder="your-workspace"
                  value={bitbucketConfig.workspace}
                  onChange={(e) => setBitbucketConfig(prev => ({ ...prev, workspace: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repository">Repository *</Label>
                <Input
                  id="repository"
                  placeholder="your-repo-name"
                  value={bitbucketConfig.repository}
                  onChange={(e) => setBitbucketConfig(prev => ({ ...prev, repository: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="main"
                  value={bitbucketConfig.branch}
                  onChange={(e) => setBitbucketConfig(prev => ({ ...prev, branch: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folderPath">Folder Path</Label>
                <Input
                  id="folderPath"
                  placeholder="src/test/java"
                  value={bitbucketConfig.folderPath}
                  onChange={(e) => setBitbucketConfig(prev => ({ ...prev, folderPath: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="your-username"
                  value={bitbucketConfig.username}
                  onChange={(e) => setBitbucketConfig(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="your-bitbucket-password"
                  value={bitbucketConfig.password}
                  onChange={(e) => setBitbucketConfig(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Code Format</Label>
              <Select value={bitbucketConfig.codeFormat} onValueChange={(value: 'karate' | 'cucumber') => setBitbucketConfig(prev => ({ ...prev, codeFormat: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isFeatureEnabled('standardCodeGeneration') && (
                    <SelectItem value="cucumber">Standard Code (Cucumber + RestAssured)</SelectItem>
                  )}
                  {isFeatureEnabled('karateFramework') && (
                    <SelectItem value="karate">Karate DSL</SelectItem>
                  )}
                  {isFeatureEnabled('bddCodeGeneration') && (
                    <SelectItem value="bdd">BDD Framework</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Will generate {bitbucketConfig.codeFormat === 'karate' ? 'Karate feature files' : 'Cucumber features and Java step definitions'} for {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
              {isFeatureEnabled('standardCodeGeneration') && isFeatureEnabled('karateFramework') && isFeatureEnabled('bddCodeGeneration') && (
                <span className="block mt-1 text-xs text-blue-600">
                  All 3 code generation options available
                </span>
              )}
            </div>

            <Button 
              onClick={handlePushToBitbucket} 
              disabled={isLoading || endpoints.length === 0}
              className="w-full"
            >
              {isLoading ? 'Pushing...' : 'Push to Bitbucket'}
            </Button>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};