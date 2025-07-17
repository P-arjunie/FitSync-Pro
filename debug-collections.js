// debug-collections.js - Debug script to check all collections
const mongoose = require('mongoose');

// Use the same connection string that's working in your app
const MONGODB_URI = 'mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fit-sync';

async function debugCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define schemas for all collections
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      profileImage: String
    });
    
    const MemberSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String
    });
    
    const ApprovedTrainerSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String,
      yearsOfExperience: Number,
      specialization: String
    });

    const TrainerSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String,
      yearsOfExperience: String,
      specialization: String
    });

    const PendingMemberSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      status: String
    });

    // Create models
    const User = mongoose.model('User', UserSchema);
    const Member = mongoose.model('Member', MemberSchema);
    const ApprovedTrainer = mongoose.model('ApprovedTrainer', ApprovedTrainerSchema);
    const Trainer = mongoose.model('Trainer', TrainerSchema);
    const PendingMember = mongoose.model('PendingMember', PendingMemberSchema);

    console.log('\n=== CHECKING ALL COLLECTIONS ===');

    // Check all collections for Esther
    const searchEmail = 'esther@123.com';
    
    console.log(`\n🔍 Searching for: ${searchEmail}`);
    
    const [user, member, approvedTrainer, trainer, pendingMember] = await Promise.all([
      User.findOne({ email: searchEmail }),
      Member.findOne({ email: searchEmail }),
      ApprovedTrainer.findOne({ email: searchEmail }),
      Trainer.findOne({ email: searchEmail }),
      PendingMember.findOne({ email: searchEmail })
    ]);

    console.log('\n📊 Results:');
    console.log('User collection:', user ? `✅ Found (${user.role})` : '❌ Not found');
    console.log('Member collection:', member ? `✅ Found (${member.role})` : '❌ Not found');
    console.log('ApprovedTrainer collection:', approvedTrainer ? `✅ Found (${approvedTrainer.role})` : '❌ Not found');
    console.log('Trainer collection:', trainer ? `✅ Found (${trainer.role})` : '❌ Not found');
    console.log('PendingMember collection:', pendingMember ? `✅ Found (${pendingMember.role})` : '❌ Not found');

    // List all users in each collection
    console.log('\n=== ALL USERS IN EACH COLLECTION ===');
    
    const [allUsers, allMembers, allApprovedTrainers, allTrainers, allPendingMembers] = await Promise.all([
      User.find({}).select('email role'),
      Member.find({}).select('email role status'),
      ApprovedTrainer.find({}).select('email role status firstName lastName'),
      Trainer.find({}).select('email role status firstName lastName'),
      PendingMember.find({}).select('email role status firstName lastName')
    ]);

    console.log('\n👥 Users in User collection:');
    allUsers.forEach(user => console.log(`- ${user.email} (${user.role})`));
    
    console.log('\n👥 Users in Member collection:');
    allMembers.forEach(member => console.log(`- ${member.email} (${member.role}) - Status: ${member.status}`));
    
    console.log('\n👥 Users in ApprovedTrainer collection:');
    allApprovedTrainers.forEach(trainer => console.log(`- ${trainer.email} (${trainer.role}) - Status: ${trainer.status} - Name: ${trainer.firstName} ${trainer.lastName}`));
    
    console.log('\n👥 Users in Trainer (pending) collection:');
    allTrainers.forEach(trainer => console.log(`- ${trainer.email} (${trainer.role}) - Status: ${trainer.status} - Name: ${trainer.firstName} ${trainer.lastName}`));
    
    console.log('\n👥 Users in PendingMember collection:');
    allPendingMembers.forEach(member => console.log(`- ${member.email} (${member.role}) - Status: ${member.status} - Name: ${member.firstName} ${member.lastName}`));

    // Check if there are any collections we might have missed
    console.log('\n=== CHECKING FOR OTHER COLLECTIONS ===');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('All collections in database:');
    collections.forEach(col => console.log(`- ${col.name}`));

    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

debugCollections(); 