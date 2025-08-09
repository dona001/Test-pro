import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  Globe, 
  Code2, 
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { ExtentReporter } from '@/utils/extentReporter';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { isFeatureEnabled } from '@/config';

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
  status: 'success' | 'failed' | 'pending';
  response?: {
    status: number;
    data: any;
    headers: Record<string, string>;
    time: number;
  };
  error?: string;
  validationResults?: ValidationRule[];
}

interface TestReportPanelProps {
  results: ExecutionResult[];
  collectionName?: string;
  onJiraAttach?: (report: any) => void;
}

export const TestReportPanel: React.FC<TestReportPanelProps> = ({
  results,
  collectionName = 'API Test Collection',
  onJiraAttach
}) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  if (results.length === 0) {
    return null;
  }

  const [extentReporter] = useState(() => new ExtentReporter());
  const executionTime = format(new Date(), 'PPp');

  // Calculate summary statistics (treat validation failures as failed tests)
  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'success' && (!r.validationResults || r.validationResults.every(v => v.result === 'pass'))).length;
  const failed = totalTests - passed;
  const totalExecutionTime = results.reduce((sum, r) => sum + (((r.response as any)?.responseTime ?? r.response?.time ?? 0)), 0);
  // Check which reporting system to use
  const useAllureReports = false;

  const handleGenerateReport = async () => {
    try {
      {
        setIsGenerating('extent');
        const result = await extentReporter.generateReport(results, collectionName);
        
        toast({
          title: "Extent Report Generated",
          description: `Extent report downloaded successfully!`,
        });
      }
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: `Failed to generate report. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleServeAllureReport = async () => {
    toast({
      title: "Serve Report Unavailable",
      description: `Only Extent HTML download is supported now.`,
      variant: "destructive",
    });
  };

  const handleJiraAttach = () => {
    if (onJiraAttach) {
      // Create a simple report object for Jira
      const report = {
        collectionName,
        timestamp: new Date().toISOString(),
        summary: { totalTests, passed, failed, totalExecutionTime },
        results
      };
      onJiraAttach(report);
    } else {
      toast({
        title: "Jira Integration",
        description: "Jira integration is not configured. Please contact your administrator.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Test Execution Report
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
            {executionTime}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalTests}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {passed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {failed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalExecutionTime}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
          </div>
        </div>

        <Separator />

        {/* Quick Results Overview */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Quick Overview</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto overflow-x-auto">
            {results.map((result) => {
              const hasValidationFailures = !!result.validationResults?.some(v => v.result === 'fail');
              const effectiveStatus = result.status === 'success' && hasValidationFailures ? 'failed' : result.status;
              return (
                <div key={result.endpoint.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(effectiveStatus)}
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {result.endpoint.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.endpoint.method} • {(result.response as any)?.responseTime ?? result.response?.time ?? 0}ms
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.validationResults && result.validationResults.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {result.validationResults.filter(v => v.result === 'pass').length}/{result.validationResults.length} validations
                      </Badge>
                    )}
                    {getStatusBadge(effectiveStatus)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Report Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Extent Report
            </h4>
            <Badge variant="outline" className="text-xs">Extent Mode</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateReport}
              disabled={isGenerating === 'allure' || isGenerating === 'extent'}
              className="flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGenerating === 'extent' 
                  ? 'Generating...' 
                  : `Generate Extent Report`
                }
              </span>
            </Button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p>💡 <strong>Extent Reports:</strong> Beautiful HTML reports that work without any server setup. 
            Perfect for immediate viewing and sharing.</p>
          </div>
        </div>

        {/* Jira Integration */}
        {onJiraAttach && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Share & Attach</h4>
              <Button
                variant="secondary"
                onClick={handleJiraAttach}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Attach to Jira Ticket</span>
              </Button>
            </div>
          </>
        )}

        {/* Success Message */}
        {passed === totalTests && totalTests > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-800 dark:text-green-300 font-medium">
                All tests passed successfully! 🎉
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};