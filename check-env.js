// Check environment variables
require("dotenv").config();

console.log("🔍 Checking Environment Variables...");
console.log("====================================");

const requiredVars = [
  'MONGODB_URI',
  'EMAIL_USER', 
  'EMAIL_PASS'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allGood = false;
  }
});

if (allGood) {
  console.log("\n✅ All required environment variables are set!");
} else {
  console.log("\n❌ Some environment variables are missing!");
  console.log("Please check your .env file.");
} 