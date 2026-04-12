/**
 * Direct API Test Script
 * Tests login functionality without going through React
 */

const http = require('http');

const testLogin = async () => {
  try {
    console.log('🔍 Testing Login API...\n');
    
    const payload = JSON.stringify({
      emailId: 'test@example.com',
      password: 'Test@123'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('✅ Login Successful!');
            console.log('\n📊 Response Status:', res.statusCode);
            console.log('\n📦 Response Data:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.access_token) {
              console.log('\n🔑 Token received:', response.access_token.substring(0, 50) + '...');
            }
            resolve(response);
          } catch (e) {
            console.error('❌ Failed to parse response:', data);
            reject(e);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Login Failed!');
        console.error('\n🔴 Error:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
          console.error('\n⚠️  Backend server is not running on port 4000');
          console.error('Please start backend with: npm start or node server.js');
        }
        reject(error);
      });

      req.write(payload);
      req.end();
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testLogin().catch(() => process.exit(1));
