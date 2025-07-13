// test-password.js - Test bcrypt functionality
const bcrypt = require('bcrypt');

console.log('=== Testing bcrypt functionality ===');

async function testBcrypt() {
  try {
    // Test 1: Create a hash and test it
    const testPassword = 'password123';
    console.log('\n1. Testing basic bcrypt functionality...');
    const hash = await bcrypt.hash(testPassword, 12);
    console.log('Generated hash:', hash);
    
    const result = await bcrypt.compare(testPassword, hash);
    console.log('Password comparison result:', result ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test 2: Test with different variations
    console.log('\n2. Testing password variations...');
    const variations = ['password123', 'Password123', 'PASSWORD123', ' password123 '];
    
    for (const variation of variations) {
      const trimmed = variation.trim();
      const result = await bcrypt.compare(trimmed, hash);
      console.log(`"${variation}" -> "${trimmed}": ${result ? '✅' : '❌'}`);
    }
    
    // Test 3: Test with some common passwords against sample hashes
    console.log('\n3. Testing with sample hashes...');
    
    // Sample hashes for common passwords (you can replace these with actual hashes from your DB)
    const sampleTests = [
      {
        password: 'password123',
        hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/EWKrP/q4.'
      },
      {
        password: 'test123',
        hash: '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
      }
    ];
    
    for (const test of sampleTests) {
      try {
        const result = await bcrypt.compare(test.password, test.hash);
        console.log(`Testing "${test.password}": ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
      } catch (error) {
        console.log(`Testing "${test.password}": ERROR - ${error.message}`);
      }
    }
    
    // Test 4: Show how to validate hash format
    console.log('\n4. Hash format validation...');
    const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
    console.log('Hash format regex:', bcryptRegex.toString());
    console.log('Sample hash valid:', bcryptRegex.test(hash));
    
    console.log('\n=== bcrypt test complete ===');
    console.log('\nNow try these steps:');
    console.log('1. Check your MongoDB connection string');
    console.log('2. Add the direct bcrypt test to your login route');
    console.log('3. Check your server logs for the actual password hash');
    
  } catch (error) {
    console.error('Error during bcrypt test:', error);
  }
}

testBcrypt();