// Debug script to check and fix double-hashed passwords
const mongoose = require('mongoose');

// Use the same connection string that's working in your app
const MONGODB_URI = 'mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fit-sync';

async function debugPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bcryptjs = require('bcryptjs');
    
    console.log('🔍 Checking for double-hashed passwords...');
    
    const db = mongoose.connection.db;
    
    // Get the approved member with x@123.com
    const approvedMembers = await db.collection('members').find({ email: 'x@123.com' }).toArray();
    
    for (const member of approvedMembers) {
      console.log(`\n👤 Member: ${member.firstName} ${member.lastName} (${member.email})`);
      console.log(`Password hash: ${member.password}`);
      
      // Test if it's double-hashed
      if (member.password && member.password.startsWith('$2b$12$$2b$12$')) {
        console.log('🔧 Found double-hashed password!');
        
        // Extract the original hash (remove the first $2b$12$)
        const originalHash = member.password.replace(/^\$2b\$12\$/, '');
        console.log(`Original hash: ${originalHash}`);
        
        // Test with the original hash
        const isValid = await bcryptjs.compare('123456', originalHash);
        console.log(`Password "123456" with original hash: ${isValid}`);
        
        if (isValid) {
          console.log('✅ Found the correct password! Fixing double-hashed password...');
          
          // Update the member with the corrected hash
          await db.collection('members').updateOne(
            { _id: member._id },
            { $set: { password: originalHash } }
          );
          
          console.log('✅ Fixed double-hashed password!');
        }
      } else {
        // Test with the current hash
        const isValid = await bcryptjs.compare('123456', member.password);
        console.log(`Password "123456" with current hash: ${isValid}`);
        
        if (!isValid) {
          console.log('❌ Password still doesn\'t match. Checking for other issues...');
          
          // Test with different variations
          const variations = ['123456', '1234567', '12345', 'password', 'test'];
          for (const variation of variations) {
            const testValid = await bcryptjs.compare(variation, member.password);
            if (testValid) {
              console.log(`✅ Found working password: "${variation}"`);
              break;
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the debug function
debugPasswords().then(() => {
  console.log('🔍 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 