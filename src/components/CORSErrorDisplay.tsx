import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, Info, Shield } from 'lucide-react';

interface CORSErrorData {
  error: string;
  solutions: string[];
  originalError?: string;
}

interface CORSErrorDisplayProps {
  errorData: CORSErrorData;
  url: string;
}

export const CORSErrorDisplay: React.FC<CORSErrorDisplayProps> = ({ errorData, url }) => {
  return (
    <div className="space-y-4">
      {/* Main Error Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Backend Proxy Error</AlertTitle>
        <AlertDescription>
          The backend proxy server failed to handle the request to <code className="bg-red-100 px-1 rounded">{url}</code>.
        </AlertDescription>
      </Alert>

      {/* Error Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Backend Proxy Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">What is the Backend Proxy?</h4>
            <p className="text-sm text-orange-700">
              The backend proxy server handles all API requests to bypass CORS restrictions and provide secure, reliable API testing. 
              This error indicates the proxy server is not running or not accessible.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Possible Solutions:</h4>
            <ul className="space-y-2">
              {errorData.solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Badge variant="outline" className="text-xs mt-0.5">•</Badge>
                  {solution}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Quick Fix
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Start the backend proxy server:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                  cd backend && npm start
                </code>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <a 
                  href="http://localhost:3001/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Check proxy health
                </a>
              </div>
            </div>
          </div>

          {errorData.originalError && (
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary className="font-semibold text-gray-700 cursor-pointer">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                {errorData.originalError}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 