// Backend CORS Proxy Integration
// All API requests go through the backend proxy server

const BACKEND_PROXY = 'http://localhost:3001/proxy?url=';

/**
 * Unified API request function using backend proxy
 */
export async function fetchWithCORS(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const { method = 'GET', headers = {}, body } = options;

  console.log(`🚀 API Request: ${method} ${url}`);

  // Always use backend proxy for consistency
  const proxyUrl = BACKEND_PROXY + encodeURIComponent(url);
  
  console.log(`🛡️ Using backend proxy: ${proxyUrl}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(proxyUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });
    
    const endTime = Date.now();
    
    if (response.ok) {
      console.log(`✅ Backend proxy successful! (${endTime - startTime}ms)`);
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    } else {
      console.log(`⚠️ Backend proxy failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    const endTime = Date.now();
    console.log(`❌ Backend proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`⏱️ Request time: ${endTime - startTime}ms`);
    
    throw new Error(`Backend proxy failed. Please ensure the proxy server is running on localhost:3001. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy CORSProxy class for backward compatibility
 */
export class CORSProxy {
  static async makeRequest(config: any): Promise<Response> {
    return fetchWithCORS(config.targetUrl, {
      method: config.method,
      headers: config.headers,
      body: config.body,
    });
  }

  static isLikelyCORSBlocked(url: string): boolean {
    // Always use backend proxy, so this is always false
    return false;
  }

  static getCORSErrorMessage(url: string): string {
    return `Backend proxy error for ${url}. Please ensure the proxy server is running on localhost:3001.`;
  }

  static getCORSSolutions(): string[] {
    return [
      'Ensure the backend proxy server is running: cd backend && npm start',
      'Check if the proxy server is accessible at http://localhost:3001/health',
      'Verify the proxy server is running on port 3001',
      'Check network connectivity to localhost:3001',
      'Restart the backend proxy server if needed'
    ];
  }
} 