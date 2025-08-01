import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
}

import { ValidationRule } from '@/types/validation';

interface ResponseValidationProps {
  response: ApiResponse | null;
  onRulesChange?: (rules: ValidationRule[]) => void;
}

export const ResponseValidation: React.FC<ResponseValidationProps> = ({ response, onRulesChange }) => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [newRuleType, setNewRuleType] = useState<string>('');
  const [newRuleField, setNewRuleField] = useState('');
  const [newRuleValue, setNewRuleValue] = useState('');

  const getNestedValue = (obj: any, path: string): any => {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    } catch {
      return undefined;
    }
  };

  const validateRule = useCallback((rule: ValidationRule): { result: 'pass' | 'fail'; message: string } => {
    console.log('Validating rule:', rule, 'against response:', response);
    
    if (!response) {
      return { result: 'fail', message: 'No response to validate' };
    }

    switch (rule.type) {
      case 'status':
        const expectedStatus = parseInt(rule.expectedValue || '200');
        const passed = response.status === expectedStatus;
        console.log(`Status validation: expected=${expectedStatus}, actual=${response.status}, passed=${passed}`);
        return {
          result: passed ? 'pass' : 'fail',
          message: passed 
            ? `Status ${response.status} matches expected ${expectedStatus}`
            : `Status ${response.status} does not match expected ${expectedStatus}`
        };

      case 'value':
        const actualValue = getNestedValue(response.data, rule.field);
        const expectedValue = rule.expectedValue;
        
        // Handle boolean conversion properly
        let convertedExpected: any = expectedValue;
        if (expectedValue === 'true') convertedExpected = true;
        if (expectedValue === 'false') convertedExpected = false;
        
        const valueMatches = actualValue == convertedExpected;
        console.log(`Value validation: field=${rule.field}, expected=${expectedValue}, actual=${actualValue}, matches=${valueMatches}`);
        return {
          result: valueMatches ? 'pass' : 'fail',
          message: valueMatches
            ? `${rule.field} equals ${expectedValue}`
            : `${rule.field} is ${JSON.stringify(actualValue)}, expected ${expectedValue}`
        };

      case 'exists':
        const value = getNestedValue(response.data, rule.field);
        const exists = value !== undefined && value !== null;
        console.log(`Exists validation: field=${rule.field}, value=${value}, exists=${exists}`);
        return {
          result: exists ? 'pass' : 'fail',
          message: exists
            ? `${rule.field} exists`
            : `${rule.field} does not exist`
        };

      case 'header':
        const headerValue = response.headers[rule.field || ''];
        const headerMatches = headerValue === rule.expectedValue;
        return {
          result: headerMatches ? 'pass' : 'fail',
          message: headerMatches
            ? `Header ${rule.field} equals ${rule.expectedValue}`
            : `Header ${rule.field} is ${headerValue}, expected ${rule.expectedValue}`
        };

      case 'body':
        const bodyValue = getNestedValue(response.data, rule.field || '');
        const bodyMatches = bodyValue === rule.expectedValue;
        return {
          result: bodyMatches ? 'pass' : 'fail',
          message: bodyMatches
            ? `Body ${rule.field} equals ${rule.expectedValue}`
            : `Body ${rule.field} is ${bodyValue}, expected ${rule.expectedValue}`
        };

      case 'responseTime':
        const maxTime = parseInt(rule.expectedValue || '1000');
        const timeOk = response.responseTime <= maxTime;
        return {
          result: timeOk ? 'pass' : 'fail',
          message: timeOk
            ? `Response time ${response.responseTime}ms is within ${maxTime}ms`
            : `Response time ${response.responseTime}ms exceeds ${maxTime}ms`
        };

      default:
        return { result: 'fail', message: 'Unknown validation type' };
    }
  }, [response]);

  // Update validation results when response changes or rules change
  useEffect(() => {
    console.log('Effect triggered - response:', !!response, 'rules count:', rules.length);
    if (response && rules.length > 0) {
      const updatedRules = rules.map(rule => {
        const validation = validateRule(rule);
        console.log('Rule validation result:', rule.id, validation);
        return {
          ...rule,
          result: validation.result,
          message: validation.message
        };
      });
      setRules(updatedRules);
      onRulesChange?.(updatedRules);
    } else {
      onRulesChange?.(rules);
    }
  }, [response, validateRule, onRulesChange]);

  const addRule = () => {
    if (!newRuleType || !newRuleField) return;

    const rule: ValidationRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: newRuleType as ValidationRule['type'],
      field: newRuleField,
      expectedValue: newRuleType === 'exists' ? undefined : newRuleValue,
    };

    console.log('Adding new rule:', rule);
    const newRules = [...rules, rule];
    
    // If we have a response, immediately validate the new rule
    if (response) {
      const validation = validateRule(rule);
      rule.result = validation.result;
      rule.message = validation.message;
      console.log('Immediate validation result:', validation);
    }
    
    setRules(newRules);
    onRulesChange?.(newRules);
    setNewRuleType('');
    setNewRuleField('');
    setNewRuleValue('');
  };

  const removeRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);
    onRulesChange?.(updatedRules);
  };

  const getRuleDisplayText = (rule: ValidationRule) => {
    switch (rule.type) {
      case 'status':
        return `status == ${rule.expectedValue || '200'}`;
      case 'value':
        return `${rule.field} == ${rule.expectedValue}`;
      case 'exists':
        return `${rule.field} exists`;
      case 'header':
        return `header.${rule.field} == ${rule.expectedValue}`;
      case 'body':
        return `body.${rule.field} == ${rule.expectedValue}`;
      case 'responseTime':
        return `responseTime <= ${rule.expectedValue}ms`;
      default:
        return 'Unknown rule';
    }
  };

  const passedCount = rules.filter(rule => rule.result === 'pass').length;
  const failedCount = rules.filter(rule => rule.result === 'fail').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>✅ Add Response Validations</span>
          {rules.length > 0 && (
            <div className="flex space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {passedCount} passed
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {failedCount} failed
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new rule form */}
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
                <SelectItem value="header">Header Value</SelectItem>
                <SelectItem value="body">Body Value</SelectItem>
                <SelectItem value="responseTime">Response Time</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={
                newRuleType === 'status' ? 'status' : 
                newRuleType === 'header' ? 'header-name' :
                newRuleType === 'responseTime' ? 'responseTime' : 
                'field.path'
              }
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

            <Button onClick={addRule} disabled={!newRuleType || !newRuleField}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Display rules */}
        {rules.length > 0 && (
          <div className="space-y-2">
            <Label>Validation Rules:</Label>
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center space-x-2">
                  {rule.result === 'pass' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {rule.result === 'fail' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {!rule.result && (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {getRuleDisplayText(rule)}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  {rule.message && (
                    <span className="text-xs text-gray-600">{rule.message}</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {rules.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Add validation rules to check if your API responses meet expectations</p>
            <p className="text-xs mt-1">Examples: status == 200, data.success == true, user.id exists</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
