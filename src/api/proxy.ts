
// Backend Proxy Integration for Collection Testing
// All API calls go through the backend proxy server

const BACKEND_PROXY = 'http://localhost:3001/proxy?url=';

export async function proxyApiCall(config: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}) {
  try {
    console.log(`🚀 Collection API Request: ${config.method} ${config.url}`);
    
    // Use backend proxy for all requests
    const proxyUrl = BACKEND_PROXY + encodeURIComponent(config.url);
    
    console.log(`🛡️ Using backend proxy: ${proxyUrl}`);
    
    const startTime = Date.now();
    
    const response = await fetch(proxyUrl, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.body,
    });
    
    const endTime = Date.now();
    
    if (!response.ok) {
      console.log(`⚠️ Backend proxy failed: ${response.status} ${response.statusText}`);
      throw new Error(`Backend proxy failed: ${response.status} ${response.statusText}`);
    }
    
    console.log(`✅ Backend proxy successful! (${endTime - startTime}ms)`);
    
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    // Handle backend proxy response format
    if (parsedData.success) {
      return {
        status: parsedData.status,
        statusText: parsedData.statusText,
        headers: parsedData.headers || {},
        data: parsedData.data,
      };
    } else {
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: parsedData,
      };
    }
    
  } catch (error) {
    console.log(`❌ Backend proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Check if it's a CORS error
    if (error instanceof Error && error.message.includes('CORS')) {
      throw new Error(`CORS error: The request was blocked due to CORS policy. Please check if the target API allows cross-origin requests.`);
    }
    
    throw new Error(`Backend proxy failed. Please ensure the proxy server is running on localhost:3001. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
