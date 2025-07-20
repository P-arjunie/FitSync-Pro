// Test script to verify password hashing
const bcryptjs = require('bcryptjs');

async function testPasswordHashing() {
  const testPassword = '123456';
  
  console.log('🔍 Testing password hashing...');
  console.log(`Test password: ${testPassword}`);
  
  // Hash the password
  const hashedPassword = await bcryptjs.hash(testPassword, 12);
  console.log(`Hashed password: ${hashedPassword}`);
  
  // Test comparison
  const isValid = await bcryptjs.compare(testPassword, hashedPassword);
  console.log(`Password comparison result: ${isValid}`);
  
  // Test with the hash from the logs
  const storedHash = '$2b$12$9E4E7pHfYEV1hzo/DD8obe1CtX3tOFYicOrRx2lmbBa2l2tAWb6xy';
  console.log(`\n🔍 Testing with stored hash: ${storedHash}`);
  
  const testWithStored = await bcryptjs.compare(testPassword, storedHash);
  console.log(`Comparison with stored hash: ${testWithStored}`);
  
  // Test with different password
  const testWithWrongPassword = await bcryptjs.compare('wrongpassword', storedHash);
  console.log(`Comparison with wrong password: ${testWithWrongPassword}`);
}

testPasswordHashing().then(() => {
  console.log('✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 