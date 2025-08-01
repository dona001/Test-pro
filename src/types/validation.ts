export interface ValidationRule {
  id: string;
  type: 'status' | 'header' | 'body' | 'responseTime' | 'value' | 'exists';
  field?: string;
  expectedValue?: string;
  result?: 'pass' | 'fail';
  message?: string;
}

export interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}

export interface ExecutionResult {
  endpoint: Endpoint;
  status: 'success' | 'error' | 'pending';
  response?: {
    status: number;
    data: any;
    headers: Record<string, string>;
    responseTime: number;
  };
  error?: string;
  validationResults?: ValidationRule[];
}