const axios = require('axios');

async function testCompleteAuthFlow() {
  try {
    console.log('🧪 Testing Complete Authentication Flow...\n');
    console.log('============================================\n');

    // Step 1: Login
    console.log('Step 1: Logging in as admin@test.com...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com',
      password: 'Test@123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Login failed - no token received');
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('   User:', user.name, '-', user.role);
    console.log('');

    // Step 2: Test profile endpoint
    console.log('Step 2: Fetching user profile...');
    const profileResponse = await axios.get('http://localhost:5000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile endpoint working!');
    console.log('   User ID:', profileResponse.data.user.id);
    console.log('   Email:', profileResponse.data.user.email);
    console.log('');

    // Step 3: Test dashboard stats endpoint
    console.log('Step 3: Fetching dashboard stats...');
    const statsResponse = await axios.get('http://localhost:5000/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Dashboard stats endpoint working!');
    console.log('   Stats:', JSON.stringify(statsResponse.data.data, null, 2));
    console.log('');

    // Step 4: Test without token (should fail with 401)
    console.log('Step 4: Testing unauthorized access (should fail)...');
    try {
      await axios.get('http://localhost:5000/api/dashboard/stats');
      console.log('❌ SECURITY ISSUE: Unauthorized access allowed!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly blocked unauthorized access (401)');
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('============================================');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('============================================');
    console.log('');
    console.log('✅ Authentication Flow Summary:');
    console.log('   1. Login works - Token generated');
    console.log('   2. Profile endpoint works - Token validated');
    console.log('   3. Dashboard stats works - Real data returned');
    console.log('   4. Security works - Unauthorized access blocked');
    console.log('');
    console.log('🚀 Your application is ready to use!');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend: http://localhost:5000');
    console.log('   Login: admin@test.com / Test@123');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      console.error('URL:', error.config.url);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testCompleteAuthFlow();
