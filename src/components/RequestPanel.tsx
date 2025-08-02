
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Send, Zap, Copy, Clipboard, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface RequestPanelProps {
  onApiCall: (config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => void;
  loading: boolean;
  selectedEndpoint?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    name?: string;
    description?: string;
  };
}

interface Header {
  key: string;
  value: string;
}

const HTTP_METHODS = [
  { value: 'GET', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'POST', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'PUT', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'DELETE', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'PATCH', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'HEAD', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'OPTIONS', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

export const RequestPanel: React.FC<RequestPanelProps> = ({ onApiCall, loading, selectedEndpoint }) => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [bulkHeadersText, setBulkHeadersText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const { toast } = useToast();

  // Auto-populate form when selectedEndpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      setMethod(selectedEndpoint.method);
      setUrl(selectedEndpoint.url);
      
      // Convert headers object to array format
      const headerArray = Object.entries(selectedEndpoint.headers || {}).map(([key, value]) => ({
        key,
        value
      }));
      
      // Always ensure at least one empty header row
      setHeaders(headerArray.length > 0 ? [...headerArray, { key: '', value: '' }] : [{ key: '', value: '' }]);
      
      setBody(selectedEndpoint.body || '');
    }
  }, [selectedEndpoint]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updatedHeaders = headers.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    );
    setHeaders(updatedHeaders);
  };

  const parseBulkHeaders = (text: string): Header[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedHeaders: Header[] = [];
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key && value) {
          parsedHeaders.push({ key, value });
        }
      }
    });
    
    return parsedHeaders;
  };

  const handleBulkHeadersApply = () => {
    const parsedHeaders = parseBulkHeaders(bulkHeadersText);
    if (parsedHeaders.length > 0) {
      setHeaders([...parsedHeaders, { key: '', value: '' }]);
      setShowBulkInput(false);
      setBulkHeadersText('');
      toast({
        title: "Headers imported",
        description: `Successfully parsed ${parsedHeaders.length} headers`,
      });
    } else {
      toast({
        title: "No valid headers found",
        description: "Please check the format: Header-Name: Header-Value",
        variant: "destructive",
      });
    }
  };

  const handleBulkHeadersCancel = () => {
    setShowBulkInput(false);
    setBulkHeadersText('');
  };

  const copyHeadersToBulk = () => {
    const validHeaders = headers.filter(h => h.key.trim() && h.value.trim());
    const headerText = validHeaders.map(h => `${h.key}: ${h.value}`).join('\n');
    setBulkHeadersText(headerText);
    setShowBulkInput(true);
  };

  const handleSubmit = () => {
    if (!url.trim()) return;

    const headersObject = headers.reduce((acc, header) => {
      if (header.key.trim() && header.value.trim()) {
        acc[header.key.trim()] = header.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    onApiCall({
      method,
      url: url.trim(),
      headers: headersObject,
      body: body.trim() || undefined,
    });
  };

  const getMethodColor = (methodValue: string) => {
    return HTTP_METHODS.find(m => m.value === methodValue)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const validHeaders = headers.filter(h => h.key.trim() && h.value.trim());

  return (
    <div className="space-y-6">
      {/* Request Configuration */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-xl">
              <Zap className="w-6 h-6 mr-2 text-blue-600" />
              Request Configuration
            </span>
            {(url || validHeaders.length > 0 || body) && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ready
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure your HTTP request manually with full control over all parameters
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method and URL */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Request Details</Label>
            <div className="flex space-x-3">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-32 h-12 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((httpMethod) => (
                    <SelectItem key={httpMethod.value} value={httpMethod.value}>
                      <Badge className={`${httpMethod.color} border text-xs font-semibold`}>
                        {httpMethod.value}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-12 text-base font-mono"
              />
            </div>
          </div>

          {/* Request Details Tabs */}
          <Tabs defaultValue="headers" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="headers" className="flex items-center space-x-2">
                <span>Headers</span>
                {validHeaders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {validHeaders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="body" className="flex items-center space-x-2">
                <span>Body</span>
                {body.trim() && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    JSON
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="headers" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">HTTP Headers</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyHeadersToBulk}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy to Bulk</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkInput(true)}
                      className="flex items-center space-x-1"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Bulk Input</span>
                    </Button>
                  </div>
                </div>

                {/* Bulk Header Input */}
                {showBulkInput && (
                  <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Bulk Header Input (Postman-style)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">
                          Paste headers in format: Header-Name: Header-Value
                        </Label>
                        <Textarea
                          placeholder={`Authorization: Bearer xyz123
Content-Type: application/json
X-Custom-Header: test`}
                          value={bulkHeadersText}
                          onChange={(e) => setBulkHeadersText(e.target.value)}
                          className="min-h-[120px] font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={handleBulkHeadersApply}
                          className="flex items-center space-x-1"
                        >
                                                <Clipboard className="w-3 h-3" />
                      <span>Apply Headers</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkHeadersCancel}
                          className="flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Individual Header Input */}
                {headers.map((header, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <Input
                      placeholder="Header name (e.g., Authorization)"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeHeader(index)}
                      disabled={headers.length === 1}
                      className="px-3 hover:bg-red-50 hover:border-red-200"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={addHeader} 
                  className="w-full border-dashed border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Header
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="body" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="request-body" className="text-sm font-medium text-gray-700">
                  Request Body (JSON)
                </Label>
                <Textarea
                  id="request-body"
                  placeholder={`{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[200px] font-mono text-sm bg-gray-50 border-2 border-dashed"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={!url.trim() || loading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-medium shadow-lg"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Sending Request...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
