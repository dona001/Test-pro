import * as yaml from 'js-yaml';

export interface ParsedEndpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}

// Postman Collection interfaces
interface PostmanRequest {
  method: string;
  header?: Array<{ key: string; value: string; disabled?: boolean }>;
  url: string | { raw: string; host?: string[]; path?: string[] };
  body?: {
    mode: string;
    raw?: string;
    formdata?: Array<{ key: string; value: string }>;
  };
}

interface PostmanItem {
  name: string;
  request: PostmanRequest;
  item?: PostmanItem[];
}

interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
}

interface PostmanCollection {
  info: { name: string };
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

// OpenAPI/Swagger interfaces
interface OpenAPIOperation {
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: any;
  }>;
  requestBody?: {
    content: {
      [mediaType: string]: {
        schema?: any;
        example?: any;
      };
    };
  };
}

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: { title: string };
  servers?: Array<{ url: string }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths: {
    [path: string]: {
      [method: string]: OpenAPIOperation;
    };
  };
}

export async function parseImportedFile(content: string, filename: string): Promise<ParsedEndpoint[]> {
  try {
    // Try to determine file type
    const isYaml = filename.toLowerCase().endsWith('.yaml') || filename.toLowerCase().endsWith('.yml');
    
    let data: any;
    if (isYaml) {
      data = yaml.load(content);
    } else {
      data = JSON.parse(content);
    }

    // Check if it's a Postman collection
    if (data.info && data.item && !data.paths) {
      return parsePostmanCollection(data as PostmanCollection);
    }
    
    // Check if it's an OpenAPI/Swagger spec
    if (data.paths && (data.openapi || data.swagger)) {
      return parseOpenAPISpec(data as OpenAPISpec);
    }

    throw new Error('Unrecognized file format. Please upload a valid Postman Collection or OpenAPI/Swagger file.');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse the uploaded file. Please check the file format.');
  }
}

function resolvePostmanVariables(text: string, variables: PostmanVariable[]): string {
  if (!text || !variables) return text;
  
  let resolvedText = text;
  
  // Replace all {{variableName}} patterns
  const variablePattern = /\{\{([^}]+)\}\}/g;
  resolvedText = resolvedText.replace(variablePattern, (match, variableName) => {
    const variable = variables.find(v => v.key === variableName.trim());
    return variable ? variable.value : match; // Keep original if variable not found
  });
  
  return resolvedText;
}

function parsePostmanCollection(collection: PostmanCollection): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  const variables = collection.variable || [];

  function extractItemsRecursively(items: PostmanItem[], folderName = ''): void {
    for (const item of items) {
      if (item.request) {
        // This is an actual request
        let url = typeof item.request.url === 'string' 
          ? item.request.url 
          : item.request.url.raw || '';
        
        // Resolve variables in URL
        url = resolvePostmanVariables(url, variables);
        
        const headers: Record<string, string> = {};
        if (item.request.header) {
          item.request.header.forEach(h => {
            if (!h.disabled && h.key && h.value) {
              // Resolve variables in header values
              const resolvedValue = resolvePostmanVariables(h.value, variables);
              headers[h.key] = resolvedValue;
            }
          });
        }

        let body: string | undefined;
        if (item.request.body) {
          if (item.request.body.mode === 'raw' && item.request.body.raw) {
            // Resolve variables in request body
            body = resolvePostmanVariables(item.request.body.raw, variables);
          } else if (item.request.body.mode === 'formdata' && item.request.body.formdata) {
            // Convert form data to JSON for simplicity and resolve variables
            const formObj: Record<string, string> = {};
            item.request.body.formdata.forEach(field => {
              const resolvedValue = resolvePostmanVariables(field.value, variables);
              formObj[field.key] = resolvedValue;
            });
            body = JSON.stringify(formObj, null, 2);
          }
        }

        const endpointName = folderName ? `${folderName} / ${item.name}` : item.name;
        
        endpoints.push({
          id: `postman-${endpoints.length}`,
          name: endpointName,
          method: item.request.method.toUpperCase(),
          url,
          headers,
          body,
        });
      } else if (item.item) {
        // This is a folder, recurse into it
        extractItemsRecursively(item.item, item.name);
      }
    }
  }

  extractItemsRecursively(collection.item);
  return endpoints;
}

function parseOpenAPISpec(spec: OpenAPISpec): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];
  
  // Determine base URL
  let baseUrl = '';
  if (spec.servers && spec.servers.length > 0) {
    baseUrl = spec.servers[0].url;
  } else if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https';
    const basePath = spec.basePath || '';
    baseUrl = `${scheme}://${spec.host}${basePath}`;
  }

  // Parse paths
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
        const op = operation as OpenAPIOperation;
        
        // Build headers
        const headers: Record<string, string> = {};
        if (op.parameters) {
          op.parameters.forEach(param => {
            if (param.in === 'header') {
              headers[param.name] = `{${param.name}}`;
            }
          });
        }

        // Build request body
        let body: string | undefined;
        if (op.requestBody) {
          const content = op.requestBody.content;
          const jsonContent = content['application/json'];
          if (jsonContent) {
            if (jsonContent.example) {
              body = JSON.stringify(jsonContent.example, null, 2);
            } else if (jsonContent.schema) {
              // Generate example from schema
              body = JSON.stringify(generateExampleFromSchema(jsonContent.schema), null, 2);
            }
          }
        }

        const fullUrl = baseUrl + path;
        const name = op.summary || `${method.toUpperCase()} ${path}`;

        endpoints.push({
          id: `openapi-${endpoints.length}`,
          name,
          method: method.toUpperCase(),
          url: fullUrl,
          headers,
          body,
          description: op.description,
        });
      }
    }
  }

  return endpoints;
}

function generateExampleFromSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return {};
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.type === 'object' && schema.properties) {
    const example: any = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      example[key] = generateExampleFromSchema(prop);
    }
    return example;
  }

  if (schema.type === 'array' && schema.items) {
    return [generateExampleFromSchema(schema.items)];
  }

  // Generate basic examples based on type
  switch (schema.type) {
    case 'string':
      return schema.format === 'email' ? 'user@example.com' : 'string';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}
