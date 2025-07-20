// Script to fix trainer passwords that might be stored in plain text
const mongoose = require('mongoose');

// Use the same connection string that's working in your app
const MONGODB_URI = 'mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fit-sync';

async function fixTrainerPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bcryptjs = require('bcryptjs');
    
    console.log('🔧 Checking trainer passwords...');
    
    const db = mongoose.connection.db;
    
    // Check pending trainers
    console.log('\n=== Checking Pending Trainers ===');
    const pendingTrainers = await db.collection('trainers').find({}).toArray();
    console.log(`Found ${pendingTrainers.length} pending trainers`);
    
    let fixedPendingCount = 0;
    for (const trainer of pendingTrainers) {
      console.log(`\n👤 Pending Trainer: ${trainer.firstName} ${trainer.lastName} (${trainer.email})`);
      
      if (!trainer.password) {
        console.log(`❌ No password found`);
        continue;
      }
      
      // Check if password is already hashed
      const bcryptRegex = /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/;
      const isHashed = bcryptRegex.test(trainer.password);
      
      if (!isHashed) {
        console.log(`🔧 Found plain text password: ${trainer.password}`);
        
        // Hash the password
        const hashedPassword = await bcryptjs.hash(trainer.password, 12);
        
        // Update the trainer
        await db.collection('trainers').updateOne(
          { _id: trainer._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`✅ Fixed password for ${trainer.email}`);
        fixedPendingCount++;
      } else {
        console.log(`✅ Password already hashed`);
      }
    }
    
    // Check approved trainers
    console.log('\n=== Checking Approved Trainers ===');
    const approvedTrainers = await db.collection('approvedtrainers').find({}).toArray();
    console.log(`Found ${approvedTrainers.length} approved trainers`);
    
    let fixedApprovedCount = 0;
    for (const trainer of approvedTrainers) {
      console.log(`\n👤 Approved Trainer: ${trainer.firstName} ${trainer.lastName} (${trainer.email})`);
      
      if (!trainer.password) {
        console.log(`❌ No password found`);
        continue;
      }
      
      // Check if password is already hashed
      const bcryptRegex = /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/;
      const isHashed = bcryptRegex.test(trainer.password);
      
      if (!isHashed) {
        console.log(`🔧 Found plain text password: ${trainer.password}`);
        
        // Hash the password
        const hashedPassword = await bcryptjs.hash(trainer.password, 12);
        
        // Update the trainer
        await db.collection('approvedtrainers').updateOne(
          { _id: trainer._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`✅ Fixed password for ${trainer.email}`);
        fixedApprovedCount++;
      } else {
        console.log(`✅ Password already hashed`);
      }
      
      // Check emergency contact
      if (trainer.emergencyContact) {
        console.log(`✅ Emergency contact found: ${trainer.emergencyContact.name} (${trainer.emergencyContact.relationship}) - ${trainer.emergencyContact.phone}`);
      } else {
        console.log(`❌ No emergency contact found`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Pending trainers fixed: ${fixedPendingCount}`);
    console.log(`- Approved trainers fixed: ${fixedApprovedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the fix function
fixTrainerPasswords().then(() => {
  console.log('🔧 Fix complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
}); 