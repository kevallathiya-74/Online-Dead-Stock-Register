const axios = require('axios');

async function testProfileEndpoint() {
  try {
    console.log('🧪 Testing /api/users/profile endpoint...\n');

    // Step 1: Login to get token
    console.log('Step 1: Logging in as admin@test.com...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'Test@123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Login failed - no token received');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful! Token received.');
    console.log('👤 User:', loginResponse.data.user.name, '-', loginResponse.data.user.role);
    console.log('');

    // Step 2: Test profile endpoint
    console.log('Step 2: Fetching user profile with token...');
    const profileResponse = await axios.get('http://localhost:5000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile endpoint working!\n');
    console.log('📊 Profile Data:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testProfileEndpoint();
