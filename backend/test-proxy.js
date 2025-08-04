const axios = require('axios');
const config = require('./config');

const PROXY_URL = config.getServerURL('/proxy');
const TEST_API = 'https://reqres.in/api';

// Test data
const testUser = {
  name: "John Doe",
  job: "Developer"
};

const testUserUpdate = {
  name: "Jane Smith",
  job: "Senior Developer"
};

async function testProxy() {
  console.log('🧪 Testing Proxy Server with different HTTP methods...');
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🏠 Server URL: ${config.getServerURL()}`);
  console.log('');

  try {
    // Test 1: GET request
    console.log('1️⃣ Testing GET request...');
    const getResponse = await axios.get(`${PROXY_URL}?url=${encodeURIComponent(`${TEST_API}/users/2`)}`);
    console.log('✅ GET successful:', getResponse.data.success);
    console.log('Status:', getResponse.data.status);
    console.log('Data received:', getResponse.data.data ? 'Yes' : 'No');
    console.log('---\n');

    // Test 2: POST request
    console.log('2️⃣ Testing POST request...');
    const postResponse = await axios.post(`${PROXY_URL}?url=${encodeURIComponent(`${TEST_API}/users`)}`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST successful:', postResponse.data.success);
    console.log('Status:', postResponse.data.status);
    console.log('Data received:', postResponse.data.data ? 'Yes' : 'No');
    console.log('---\n');

    // Test 3: PUT request
    console.log('3️⃣ Testing PUT request...');
    const putResponse = await axios.put(`${PROXY_URL}?url=${encodeURIComponent(`${TEST_API}/users/2`)}`, testUserUpdate, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ PUT successful:', putResponse.data.success);
    console.log('Status:', putResponse.data.status);
    console.log('Data received:', putResponse.data.data ? 'Yes' : 'No');
    console.log('---\n');

    // Test 4: DELETE request
    console.log('4️⃣ Testing DELETE request...');
    const deleteResponse = await axios.delete(`${PROXY_URL}?url=${encodeURIComponent(`${TEST_API}/users/2`)}`);
    console.log('✅ DELETE successful:', deleteResponse.data.success);
    console.log('Status:', deleteResponse.data.status);
    console.log('---\n');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error details:', error.response.data);
    }
  }
}

// Test with different content types
async function testContentTypes() {
  console.log('\n🧪 Testing different content types...\n');

  try {
    // Test with form data
    console.log('1️⃣ Testing with form data...');
    const formData = new URLSearchParams();
    formData.append('name', 'John Doe');
    formData.append('job', 'Developer');

    const formResponse = await axios.post(`${PROXY_URL}?url=${encodeURIComponent(`${TEST_API}/users`)}`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('✅ Form data POST successful:', formResponse.data.success);
    console.log('---\n');

    // Test with plain text
    console.log('2️⃣ Testing with plain text...');
    const textResponse = await axios.post(`${PROXY_URL}?url=${encodeURIComponent(`${TEST_API}/users`)}`, 'Hello World', {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    console.log('✅ Plain text POST successful:', textResponse.data.success);
    console.log('---\n');

  } catch (error) {
    console.error('❌ Content type test failed:', error.response ? error.response.data : error.message);
  }
}

// Run tests
if (require.main === module) {
  testProxy().then(() => {
    return testContentTypes();
  }).catch(console.error);
}

module.exports = { testProxy, testContentTypes }; 