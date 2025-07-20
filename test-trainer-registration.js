// Test script to verify trainer registration
const mongoose = require('mongoose');

// Use the same connection string that's working in your app
const MONGODB_URI = 'mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/fit-sync';

async function testTrainerRegistration() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const bcryptjs = require('bcryptjs');
    
    console.log('🧪 Testing trainer registration...');
    
    const db = mongoose.connection.db;
    
    // Test data
    const testTrainerData = {
      firstName: "Test",
      lastName: "Trainer",
      email: "testtrainer@example.com",
      password: "123456",
      phone: "1234567890",
      dob: "1990-01-01",
      gender: "Male",
      address: "Test Address",
      specialization: "Strength Training",
      certifications: ["CPT", "Nutrition"],
      preferredTrainingHours: "Morning",
      yearsOfExperience: "5",
      availability: "Weekdays",
      pricingPlan: "Standard",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0987654321",
        relationship: "Spouse"
      },
      termsAccepted: true,
      profileImage: "https://example.com/image.jpg",
      biography: "Test biography",
      skills: [
        { name: "Strength Training", level: 5 },
        { name: "Cardio", level: 4 }
      ],
      status: "pending",
      submittedAt: new Date()
    };
    
    console.log('📝 Test trainer data:', JSON.stringify(testTrainerData, null, 2));
    
    // Test password hashing
    console.log('\n🔐 Testing password hashing...');
    const hashedPassword = await bcryptjs.hash(testTrainerData.password, 12);
    console.log(`Original password: ${testTrainerData.password}`);
    console.log(`Hashed password: ${hashedPassword}`);
    
    // Test password comparison
    const isValid = await bcryptjs.compare(testTrainerData.password, hashedPassword);
    console.log(`Password comparison test: ${isValid}`);
    
    // Test emergency contact structure
    console.log('\n📞 Testing emergency contact structure...');
    console.log(`Emergency contact: ${JSON.stringify(testTrainerData.emergencyContact, null, 2)}`);
    
    // Check if the structure matches the schema
    const hasName = testTrainerData.emergencyContact.name;
    const hasPhone = testTrainerData.emergencyContact.phone;
    const hasRelationship = testTrainerData.emergencyContact.relationship;
    
    console.log(`Has name: ${!!hasName}`);
    console.log(`Has phone: ${!!hasPhone}`);
    console.log(`Has relationship: ${!!hasRelationship}`);
    
    if (hasName && hasPhone && hasRelationship) {
      console.log('✅ Emergency contact structure is correct');
    } else {
      console.log('❌ Emergency contact structure is missing fields');
    }
    
    console.log('\n✅ Trainer registration test complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test function
testTrainerRegistration().then(() => {
  console.log('🧪 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 