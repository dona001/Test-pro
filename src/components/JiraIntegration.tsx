import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isFeatureEnabled } from '@/config';

interface ExecutionResult {
  endpoint: any;
  status: 'success' | 'failed' | 'pending';
  response?: any;
  error?: string;
  validationResults?: any[];
  executionTime?: number;
}

interface JiraIntegrationProps {
  results: ExecutionResult[];
  collectionName?: string;
}

export const JiraIntegration: React.FC<JiraIntegrationProps> = ({ results, collectionName }) => {
  // Check if Jira integration is enabled
  if (!isFeatureEnabled('jiraIntegration')) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [jiraConfig, setJiraConfig] = useState({
    jiraUrl: '',
    projectKey: '',
    apiToken: '',
    epicLink: '',
    syncMode: 'one-issue-per-endpoint'
  });

  // Calculate test results
  const passedCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const totalCount = results.length;

  const handleSyncToJira = async () => {
    if (!jiraConfig.jiraUrl || !jiraConfig.projectKey || !jiraConfig.apiToken) {
      toast({
        title: "Missing Configuration",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store config in localStorage for future use
      localStorage.setItem('jiraConfig', JSON.stringify(jiraConfig));

      if (jiraConfig.syncMode === 'one-issue-per-endpoint') {
        await syncOneIssuePerEndpoint();
      } else {
        await syncSingleSummaryIssue();
      }

      toast({
        title: "Sync Successful",
        description: `Test results synced to Jira successfully.`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: `Failed to sync to Jira: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncOneIssuePerEndpoint = async () => {
    for (const result of results) {
      const issueData = {
        fields: {
          project: { key: jiraConfig.projectKey },
          summary: `API Test: ${result.endpoint.name || result.endpoint.method} ${result.endpoint.url}`,
          description: createIssueDescription(result),
          issuetype: { name: 'Task' },
          ...(jiraConfig.epicLink && { parent: { key: jiraConfig.epicLink } })
        }
      };

      await createJiraIssue(issueData);
    }
  };

  const syncSingleSummaryIssue = async () => {
    const issueData = {
      fields: {
        project: { key: jiraConfig.projectKey },
        summary: `Test Collection Results: ${collectionName || 'API Tests'}`,
        description: createSummaryDescription(),
        issuetype: { name: 'Task' },
        ...(jiraConfig.epicLink && { parent: { key: jiraConfig.epicLink } })
      }
    };

    await createJiraIssue(issueData);
  };

  const createJiraIssue = async (issueData: any) => {
    const response = await fetch(`${jiraConfig.jiraUrl}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`admin:${jiraConfig.apiToken}`)}`
      },
      body: JSON.stringify(issueData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorMessages?.[0] || 'Failed to create Jira issue');
    }

    return response.json();
  };

  const createIssueDescription = (result: ExecutionResult) => {
    let description = `*Endpoint:* ${result.endpoint.method} ${result.endpoint.url}\n`;
    description += `*Status:* ${result.status === 'success' ? '✅ PASSED' : '❌ FAILED'}\n`;
    description += `*Execution Time:* ${result.executionTime || 0}ms\n\n`;
    
    if (result.error) {
      description += `*Error:* ${result.error}\n`;
    }
    
    if (result.validationResults?.length) {
      description += `*Validations:*\n`;
      result.validationResults.forEach(validation => {
        description += `- ${validation.field}: ${validation.success ? '✅' : '❌'} ${validation.message}\n`;
      });
    }

    return description;
  };

  const createSummaryDescription = () => {
    let description = `*Test Collection:* ${collectionName || 'API Tests'}\n`;
    description += `*Total Tests:* ${totalCount}\n`;
    description += `*Passed:* ${passedCount}\n`;
    description += `*Failed:* ${failedCount}\n`;
    description += `*Success Rate:* ${totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0}%\n\n`;
    
    description += `*Detailed Results:*\n`;
    results.forEach((result, index) => {
      description += `${index + 1}. ${result.endpoint.method} ${result.endpoint.url} - ${result.status === 'success' ? '✅' : '❌'}\n`;
    });

    return description;
  };

  // Load saved config on component mount
  React.useEffect(() => {
    const savedConfig = localStorage.getItem('jiraConfig');
    if (savedConfig) {
      setJiraConfig(JSON.parse(savedConfig));
    }
  }, []);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Sync to Jira
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {totalCount}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Sync Results to Jira
              <span className="text-sm font-normal text-muted-foreground">
                {totalCount} endpoints
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jiraUrl">Jira URL *</Label>
                <Input
                  id="jiraUrl"
                  placeholder="https://yourcompany.atlassian.net"
                  value={jiraConfig.jiraUrl}
                  onChange={(e) => setJiraConfig(prev => ({ ...prev, jiraUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectKey">Project Key *</Label>
                <Input
                  id="projectKey"
                  placeholder="PROJ"
                  value={jiraConfig.projectKey}
                  onChange={(e) => setJiraConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token *</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Your Jira API token"
                value={jiraConfig.apiToken}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, apiToken: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="epicLink">Epic Link (Optional)</Label>
              <Input
                id="epicLink"
                placeholder="PROJ-123"
                value={jiraConfig.epicLink}
                onChange={(e) => setJiraConfig(prev => ({ ...prev, epicLink: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Sync Mode</Label>
              <Select value={jiraConfig.syncMode} onValueChange={(value) => setJiraConfig(prev => ({ ...prev, syncMode: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-issue-per-endpoint">One issue per endpoint</SelectItem>
                  <SelectItem value="single-summary">Single summary issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span>Passed: <span className="font-semibold text-green-600">{passedCount}</span></span>
              <span>Failed: <span className="font-semibold text-red-600">{failedCount}</span></span>
            </div>

            <Button 
              onClick={handleSyncToJira} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Syncing...' : 'Sync to Jira'}
            </Button>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};