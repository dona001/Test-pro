
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}

interface EndpointConfigModalProps {
  endpoint: Endpoint;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEndpoint: Endpoint) => void;
}

export const EndpointConfigModal: React.FC<EndpointConfigModalProps> = ({
  endpoint,
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<Endpoint>(endpoint);
  const [headerEntries, setHeaderEntries] = useState<Array<{key: string, value: string}>>(() => 
    Object.entries(endpoint.headers).map(([key, value]) => ({ key, value }))
  );

  const handleSave = () => {
    const updatedHeaders = headerEntries.reduce((acc, entry) => {
      if (entry.key.trim()) {
        acc[entry.key.trim()] = entry.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    const updatedEndpoint = {
      ...config,
      headers: updatedHeaders
    };

    onSave(updatedEndpoint);
    onClose();
  };

  const addHeaderEntry = () => {
    setHeaderEntries([...headerEntries, { key: '', value: '' }]);
  };

  const removeHeaderEntry = (index: number) => {
    setHeaderEntries(headerEntries.filter((_, i) => i !== index));
  };

  const updateHeaderEntry = (index: number, field: 'key' | 'value', value: string) => {
    const updated = headerEntries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    );
    setHeaderEntries(updated);
  };

  const isValidJson = (str: string) => {
    if (!str.trim()) return true;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              {config.method}
            </Badge>
            <span>Configure Endpoint</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={config.method}
                    onValueChange={(value) => setConfig({ ...config, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Endpoint name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Headers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Headers</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addHeaderEntry}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Header</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {headerEntries.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Header name"
                      value={entry.key}
                      onChange={(e) => updateHeaderEntry(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={entry.value}
                      onChange={(e) => updateHeaderEntry(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeHeaderEntry(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {headerEntries.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No headers configured. Click "Add Header" to add one.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(config.method) && (
            <Card>
              <CardHeader>
                <CardTitle>Request Body</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    value={config.body || ''}
                    onChange={(e) => setConfig({ ...config, body: e.target.value })}
                    placeholder="Request body (JSON, XML, or plain text)"
                    className="min-h-[120px] font-mono text-sm"
                  />
                  {config.body && !isValidJson(config.body) && (
                    <p className="text-sm text-amber-600">
                      ⚠️ Note: Body content is not valid JSON
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
