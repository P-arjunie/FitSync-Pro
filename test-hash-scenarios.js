// Test script to understand the password hashing issue
const bcryptjs = require('bcryptjs');

async function testHashScenarios() {
  const password = '123456';
  const storedHash = '$2b$12$9E4E7pHfYEV1hzo/DD8obe1CtX3tOFYicOrRx2lmbBa2l2tAWb6xy';
  
  console.log('🔍 Testing different hashing scenarios...');
  console.log(`Password: ${password}`);
  console.log(`Stored hash: ${storedHash}`);
  
  // Test 1: Direct comparison
  console.log('\n=== Test 1: Direct comparison ===');
  const directMatch = await bcryptjs.compare(password, storedHash);
  console.log(`Direct comparison: ${directMatch}`);
  
  // Test 2: Hash with same salt rounds (12)
  console.log('\n=== Test 2: Hash with same salt rounds ===');
  const newHash = await bcryptjs.hash(password, 12);
  console.log(`New hash: ${newHash}`);
  const newHashMatch = await bcryptjs.compare(password, newHash);
  console.log(`New hash comparison: ${newHashMatch}`);
  
  // Test 3: Check if stored hash is valid
  console.log('\n=== Test 3: Validate stored hash format ===');
  const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  const isValidFormat = bcryptRegex.test(storedHash);
  console.log(`Hash format valid: ${isValidFormat}`);
  
  // Test 4: Try different salt rounds
  console.log('\n=== Test 4: Try different salt rounds ===');
  for (let rounds = 10; rounds <= 14; rounds++) {
    const testHash = await bcryptjs.hash(password, rounds);
    const testMatch = await bcryptjs.compare(password, testHash);
    console.log(`Rounds ${rounds}: ${testMatch}`);
  }
  
  // Test 5: Check if it's a double-hash with different pattern
  console.log('\n=== Test 5: Check for double-hash patterns ===');
  if (storedHash.length > 60) {
    console.log('Hash is longer than expected - might be double-hashed');
    // Try removing different prefixes
    const withoutPrefix = storedHash.replace(/^\$2b\$12\$/, '');
    console.log(`Without prefix: ${withoutPrefix}`);
    const testMatch = await bcryptjs.compare(password, withoutPrefix);
    console.log(`Test with removed prefix: ${testMatch}`);
  }
  
  // Test 6: Try with different bcrypt libraries
  console.log('\n=== Test 6: Try with bcrypt library ===');
  try {
    const bcrypt = require('bcrypt');
    const bcryptMatch = await bcrypt.compare(password, storedHash);
    console.log(`bcrypt comparison: ${bcryptMatch}`);
  } catch (error) {
    console.log(`bcrypt not available: ${error.message}`);
  }
}

testHashScenarios().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 