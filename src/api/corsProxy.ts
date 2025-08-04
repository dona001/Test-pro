// Backend CORS Proxy Integration
// All API requests go through the backend proxy server

import { getProxyBase, getProxySolutions } from '@/config/proxy';

const BACKEND_PROXY = getProxyBase();

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
    
    // Provide more specific error messages
    let errorMessage = 'Backend proxy failed';
    let solutions = getProxySolutions();
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to proxy server';
        solutions = [
          'Start the proxy server: cd backend && node server.js',
          'Check if the server is running on port 3001',
          'Verify no firewall is blocking the connection',
          'Try restarting the proxy server'
        ];
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error - proxy server not responding';
        solutions = [
          'Ensure the proxy server is running and accessible',
          'Check proxy server logs for errors',
          'Verify the proxy server is configured correctly'
        ];
      }
    }
    
    throw new Error(`${errorMessage}. Please ensure the proxy server is running. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    return `Backend proxy error for ${url}. Please ensure the proxy server is running.`;
  }

  static getCORSSolutions(): string[] {
    return getProxySolutions();
  }
} 