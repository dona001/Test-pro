const axios = require('axios');
const config = require('./config');

const PROXY_URL = config.getServerURL('/proxy');

// Test Swagger URLs
const testUrls = [
  'https://petstore.swagger.io/v2/swagger.json',
  'https://api.github.com/swagger.json',
  'https://reqres.in/api/swagger.json',
  'https://jsonplaceholder.typicode.com/swagger.json'
];

async function testSwaggerImport() {
  console.log('🧪 Testing Swagger import via proxy...');
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🏠 Server URL: ${config.getServerURL()}`);
  console.log('');

  for (const url of testUrls) {
    try {
      console.log(`📡 Testing: ${url}`);
      
      const response = await axios.get(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
      
      if (response.data.success) {
        console.log(`✅ Success: ${response.status} ${response.statusText}`);
        
        // Check if it's valid Swagger/OpenAPI content
        const data = response.data.data;
        if (data && (data.swagger || data.openapi)) {
          console.log(`📋 Valid Swagger/OpenAPI spec detected`);
          console.log(`📊 Version: ${data.swagger || data.openapi}`);
          console.log(`📝 Title: ${data.info?.title || 'N/A'}`);
          console.log(`🔗 Paths: ${Object.keys(data.paths || {}).length}`);
        } else {
          console.log(`⚠️ Response received but not a valid Swagger spec`);
        }
      } else {
        console.log(`❌ Proxy failed: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('---\n');
  }
}

// Test with a known working Swagger URL
async function testKnownSwagger() {
  console.log('🧪 Testing with known working Swagger URL...');
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🏠 Server URL: ${config.getServerURL()}`);
  console.log('');
  
  const swaggerUrl = 'https://petstore.swagger.io/v2/swagger.json';
  
  try {
    console.log(`📡 Testing: ${swaggerUrl}`);
    
    const response = await axios.get(`${PROXY_URL}?url=${encodeURIComponent(swaggerUrl)}`);
    
    if (response.data.success) {
      console.log(`✅ Success: ${response.status} ${response.statusText}`);
      
      const data = response.data.data;
      if (data && data.swagger) {
        console.log(`📋 Valid Swagger spec detected`);
        console.log(`📊 Version: ${data.swagger}`);
        console.log(`📝 Title: ${data.info?.title || 'N/A'}`);
        console.log(`🔗 Paths: ${Object.keys(data.paths || {}).length}`);
        
        // List some endpoints
        const paths = Object.keys(data.paths || {}).slice(0, 5);
        console.log(`📋 Sample endpoints:`);
        paths.forEach(path => {
          const methods = Object.keys(data.paths[path]);
          methods.forEach(method => {
            console.log(`  ${method.toUpperCase()} ${path}`);
          });
        });
      }
    } else {
      console.log(`❌ Proxy failed: ${response.data.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
  }
}

// Run tests
if (require.main === module) {
  testKnownSwagger().then(() => {
    return testSwaggerImport();
  }).catch(console.error);
}

module.exports = { testSwaggerImport, testKnownSwagger }; 