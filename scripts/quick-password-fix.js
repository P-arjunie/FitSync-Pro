// Quick Password Fix Script
// Save this as: scripts/quick-password-fix.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Your ApprovedTrainer model
const ApprovedTrainerSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  experience: String,
  profilePicture: String,
  certificate: String,
  status: { type: String, default: 'approved' },
  createdAt: { type: Date, default: Date.now }
});

const ApprovedTrainer = mongoose.model('ApprovedTrainer', ApprovedTrainerSchema);

async function fixedPasswords() {
  try {
    // Connect to your database
    await mongoose.connect('mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fitsync');
    console.log('✅ Connected to MongoDB');

    // Find all trainers
    const trainers = await ApprovedTrainer.find({});
    console.log(`Found ${trainers.length} trainers`);

    let fixedCount = 0;
    
    for (const trainer of trainers) {
      // Check if password is corrupted (not hashed)
      if (!trainer.password.startsWith('$2b$') && !trainer.password.startsWith('$2a$')) {
        console.log(`🔧 Fixing password for: ${trainer.username}`);
        
        // Hash the corrupted password
        const hashedPassword = await bcrypt.hash(trainer.password, 12);
        
        // Update in database
        await ApprovedTrainer.findByIdAndUpdate(trainer._id, {
          password: hashedPassword
        });
        
        fixedCount++;
        console.log(`✅ Fixed password for: ${trainer.username}`);
      } else {
        console.log(`✅ Password already OK for: ${trainer.username}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} corrupted passwords!`);
    console.log('✅ All trainer passwords are now secure!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

fixedPasswords();