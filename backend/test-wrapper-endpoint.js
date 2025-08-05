const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/wrapper';

async function testWrapperEndpoint() {
  console.log('🧪 Testing API Wrapper Endpoint\n');

  // Test 1: GET request
  console.log('1️⃣ Testing GET request...');
  try {
    const getResponse = await axios.post(BASE_URL, {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET'
    });
    console.log('✅ GET request successful');
    console.log(`   Status: ${getResponse.data.status}`);
    console.log(`   Response time: ${getResponse.data.wrapperInfo.responseTime}ms`);
    console.log(`   Data: ${JSON.stringify(getResponse.data.data, null, 2).substring(0, 100)}...`);
  } catch (error) {
    console.log('❌ GET request failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: POST request with body
  console.log('2️⃣ Testing POST request with body...');
  try {
    const postResponse = await axios.post(BASE_URL, {
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        title: 'API Wrapper Test',
        body: 'This is a test post from the wrapper endpoint',
        userId: 1
      }
    });
    console.log('✅ POST request successful');
    console.log(`   Status: ${postResponse.data.status}`);
    console.log(`   Response time: ${postResponse.data.wrapperInfo.responseTime}ms`);
    console.log(`   Created ID: ${postResponse.data.data.id}`);
  } catch (error) {
    console.log('❌ POST request failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Missing URL validation
  console.log('3️⃣ Testing missing URL validation...');
  try {
    await axios.post(BASE_URL, {
      method: 'GET'
    });
    console.log('❌ Should have failed with missing URL error');
  } catch (error) {
    console.log('✅ Missing URL validation working correctly');
    console.log(`   Error: ${error.response.data.error}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Invalid URL format
  console.log('4️⃣ Testing invalid URL format...');
  try {
    await axios.post(BASE_URL, {
      url: 'not-a-valid-url',
      method: 'GET'
    });
    console.log('❌ Should have failed with invalid URL error');
  } catch (error) {
    console.log('✅ Invalid URL validation working correctly');
    console.log(`   Error: ${error.response.data.error}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Non-existent URL
  console.log('5️⃣ Testing non-existent URL...');
  try {
    const nonExistentResponse = await axios.post(BASE_URL, {
      url: 'https://this-domain-does-not-exist-12345.com/api/test',
      method: 'GET'
    });
    console.log('✅ Non-existent URL handled correctly');
    console.log(`   Status: ${nonExistentResponse.data.status}`);
    console.log(`   Response time: ${nonExistentResponse.data.wrapperInfo.responseTime}ms`);
  } catch (error) {
    console.log('❌ Non-existent URL test failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Custom headers
  console.log('6️⃣ Testing custom headers...');
  try {
    const customHeadersResponse = await axios.post(BASE_URL, {
      url: 'https://httpbin.org/headers',
      method: 'GET',
      headers: {
        'X-Custom-Header': 'API-Wrapper-Test',
        'User-Agent': 'API-Tester-Pro-Custom-UA'
      }
    });
    console.log('✅ Custom headers request successful');
    console.log(`   Status: ${customHeadersResponse.data.status}`);
    console.log(`   Response time: ${customHeadersResponse.data.wrapperInfo.responseTime}ms`);
    console.log(`   Headers received: ${JSON.stringify(customHeadersResponse.data.data.headers, null, 2).substring(0, 200)}...`);
  } catch (error) {
    console.log('❌ Custom headers test failed:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 All tests completed!');
}

// Run the tests
testWrapperEndpoint().catch(console.error); 