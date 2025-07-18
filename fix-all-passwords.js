// Script to fix all members with password issues
const mongoose = require('mongoose');

// Use the same connection string that's working in your app
const MONGODB_URI = 'mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fit-sync';

async function fixAllPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bcryptjs = require('bcryptjs');
    
    console.log('🔧 Checking all members for password issues...');
    
    const db = mongoose.connection.db;
    
    // Get all members
    const members = await db.collection('members').find({}).toArray();
    
    console.log(`Found ${members.length} members`);
    
    let fixedCount = 0;
    let noPasswordCount = 0;
    
    for (const member of members) {
      console.log(`\n👤 Checking: ${member.firstName} ${member.lastName} (${member.email})`);
      
      if (!member.password) {
        console.log(`❌ No password found`);
        noPasswordCount++;
        continue;
      }
      
      // Test with common passwords
      const testPasswords = ['123456', 'password', 'test', 'admin'];
      let hasWorkingPassword = false;
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await bcryptjs.compare(testPassword, member.password);
          if (isValid) {
            console.log(`✅ Has working password: "${testPassword}"`);
            hasWorkingPassword = true;
            break;
          }
        } catch (error) {
          // Ignore comparison errors
        }
      }
      
      if (!hasWorkingPassword) {
        console.log(`🔧 Fixing password for ${member.email}...`);
        
        // Set a default password (you can change this)
        const defaultPassword = '123456';
        const newHash = await bcryptjs.hash(defaultPassword, 12);
        
        // Update the member
        await db.collection('members').updateOne(
          { _id: member._id },
          { $set: { password: newHash } }
        );
        
        console.log(`✅ Fixed password for ${member.email}`);
        console.log(`New credentials: ${member.email} / ${defaultPassword}`);
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total members: ${members.length}`);
    console.log(`- Members with no password: ${noPasswordCount}`);
    console.log(`- Members fixed: ${fixedCount}`);
    console.log(`- Members with working passwords: ${members.length - noPasswordCount - fixedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the fix function
fixAllPasswords().then(() => {
  console.log('🔧 Fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
}); 