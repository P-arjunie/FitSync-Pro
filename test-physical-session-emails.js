// Test script for physical session email functionality
// Run this with: node test-physical-session-emails.js

const testPhysicalSessionEmails = async () => {
  console.log('🧪 Testing Physical Session Email Functionality...\n');

  // Test 1: Test email endpoint
  console.log('1. Testing email endpoint...');
  try {
    const testResponse = await fetch('http://localhost:3000/api/test-physical-session-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testEmail: 'test@example.com' // Replace with your email for testing
      })
    });

    const testData = await testResponse.json();
    console.log('✅ Test email response:', testData);
  } catch (error) {
    console.log('❌ Test email failed:', error.message);
  }

  // Test 2: Create a physical session
  console.log('\n2. Testing physical session creation...');
  try {
    const sessionData = {
      title: "Test Physical Session",
      trainerName: "Test Trainer",
      trainerId: "test-trainer-id",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      location: "Test Gym Location",
      maxParticipants: 10,
      description: "This is a test session for email functionality"
    };

    const sessionResponse = await fetch('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData)
    });

    const sessionResult = await sessionResponse.json();
    
    if (sessionResponse.ok) {
      console.log('✅ Physical session created successfully:', sessionResult);
      console.log('📧 Email notifications should have been sent to all approved members');
    } else {
      console.log('❌ Failed to create session:', sessionResult);
    }
  } catch (error) {
    console.log('❌ Session creation failed:', error.message);
  }

  console.log('\n🎉 Test completed! Check your console logs for email sending details.');
};

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testPhysicalSessionEmails().catch(console.error);
}

module.exports = { testPhysicalSessionEmails }; 