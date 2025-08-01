import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Shield, CheckCircle, AlertCircle } from 'lucide-react';

import { ValidationRule, Endpoint } from '@/types/validation';

interface EndpointValidationModalProps {
  endpoint: Endpoint;
  existingRules: ValidationRule[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (rules: ValidationRule[]) => void;
}

export const EndpointValidationModal: React.FC<EndpointValidationModalProps> = ({
  endpoint,
  existingRules,
  isOpen,
  onClose,
  onSave
}) => {
  const [rules, setRules] = useState<ValidationRule[]>(existingRules);
  const [newRuleType, setNewRuleType] = useState<string>('');
  const [newRuleField, setNewRuleField] = useState('');
  const [newRuleValue, setNewRuleValue] = useState('');

  useEffect(() => {
    setRules(existingRules);
  }, [existingRules]);

  const addRule = () => {
    if (!newRuleType || !newRuleField) return;

    const rule: ValidationRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: newRuleType as 'status' | 'value' | 'exists',
      field: newRuleField,
      expectedValue: newRuleType === 'exists' ? undefined : newRuleValue,
    };

    setRules([...rules, rule]);
    setNewRuleType('');
    setNewRuleField('');
    setNewRuleValue('');
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleSave = () => {
    onSave(rules);
    onClose();
  };

  const getRuleDisplayText = (rule: ValidationRule) => {
    switch (rule.type) {
      case 'status':
        return `status == ${rule.expectedValue || '200'}`;
      case 'value':
        return `${rule.field} == ${rule.expectedValue}`;
      case 'exists':
        return `${rule.field} exists`;
      default:
        return 'Unknown rule';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <Badge variant="outline" className="font-mono">
              {endpoint.method}
            </Badge>
            <span>Validation Rules</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Configure validation rules for {endpoint.name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Endpoint Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endpoint Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono">
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {endpoint.url}
                  </code>
                </div>
                {endpoint.description && (
                  <p className="text-sm text-gray-600">{endpoint.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add New Rule Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add Validation Rule</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {rules.length} rule{rules.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Select value={newRuleType} onValueChange={setNewRuleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Validation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status Code</SelectItem>
                      <SelectItem value="value">JSON Value</SelectItem>
                      <SelectItem value="exists">Key Exists</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder={newRuleType === 'status' ? 'status' : 'field.path'}
                    value={newRuleField}
                    onChange={(e) => setNewRuleField(e.target.value)}
                    className="font-mono text-sm"
                  />

                  {newRuleType !== 'exists' && (
                    <Input
                      placeholder="expected value"
                      value={newRuleValue}
                      onChange={(e) => setNewRuleValue(e.target.value)}
                      className="font-mono text-sm"
                    />
                  )}

                  <Button 
                    onClick={addRule} 
                    disabled={!newRuleType || !newRuleField}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Status Code:</strong> Validates HTTP response status (e.g., 200, 404)</p>
                  <p><strong>JSON Value:</strong> Checks if a field equals expected value (e.g., data.success == true)</p>
                  <p><strong>Key Exists:</strong> Verifies if a field exists in response (e.g., user.id exists)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Rules */}
          {rules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configured Validation Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {getRuleDisplayText(rule)}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {rule.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="flex items-center"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm mb-2">No validation rules configured</p>
              <p className="text-xs">Add rules above to validate API responses automatically</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Rules ({rules.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
