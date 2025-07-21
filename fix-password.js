// Script to fix the password for x@123.com
const mongoose = require('mongoose');

// Use the same connection string that's working in your app
const MONGODB_URI = 'mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fit-sync';

async function fixPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bcryptjs = require('bcryptjs');
    
    console.log('🔧 Fixing password for x@123.com...');
    
    const db = mongoose.connection.db;
    
    // Find the member
    const member = await db.collection('members').findOne({ email: 'x@123.com' });
    
    if (!member) {
      console.log('❌ Member not found');
      return;
    }
    
    console.log(`Found member: ${member.firstName} ${member.lastName} (${member.email})`);
    console.log(`Current hash: ${member.password}`);
    
    // Create a new hash for password "123456"
    const newHash = await bcryptjs.hash('123456', 12);
    console.log(`New hash: ${newHash}`);
    
    // Test the new hash
    const isValid = await bcryptjs.compare('123456', newHash);
    console.log(`New hash test: ${isValid}`);
    
    if (isValid) {
      // Update the member with the new hash
      await db.collection('members').updateOne(
        { _id: member._id },
        { $set: { password: newHash } }
      );
      
      console.log('✅ Password fixed successfully!');
      console.log('You can now login with:');
      console.log('Email: x@123.com');
      console.log('Password: 123456');
    } else {
      console.log('❌ Failed to create valid hash');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the fix function
fixPassword().then(() => {
  console.log('🔧 Fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
}); 