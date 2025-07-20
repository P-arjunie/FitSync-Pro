
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcryptjs from "bcryptjs";
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';
import bcrypt from 'bcrypt';

// A helper function to call the logging API without waiting for it to finish.
// It constructs the full URL to ensure it works in all environments (dev, prod).
const logAttempt = (data: object) => {
  const url = new URL("/api/analytics/log-login-attempt", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(error => {
    // Log fetch errors, but don't let them crash the main application
    console.error("Fire-and-forget log failed:", error);
  });
};


export async function POST(req: Request) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("remote-addr");
  const userAgent = req.headers.get("user-agent");

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

// Clean up email and password
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Establish a connection to the MongoDB database
    await connectToDatabase();

    console.log(`\n=== LOGIN ATTEMPT ===`);
    console.log(`Email: ${cleanEmail}`);
    console.log(`Password length: ${cleanPassword.length}`);
    console.log(`Raw password received for login:`, cleanPassword);

    // Find user in approved collections only (Member, ApprovedTrainer)
    // Only check for users with status "approved"
    const [approvedMember, approvedTrainer] = await Promise.all([
      Member.findOne({ 
        email: cleanEmail, 
        status: "approved" 
      }).select('+password'),
      ApprovedTrainer.findOne({ 
        email: cleanEmail, 
        status: "approved" 
      }).select('+password')
    ]);

    console.log(`Approved Member found: ${approvedMember ? 'Yes' : 'No'}`);
    console.log(`Approved Trainer found: ${approvedTrainer ? 'Yes' : 'No'}`);

    // Determine which user to use and their role
    let currentUser = null;
    let userRole = null;

    // Priority: ApprovedTrainer > Member
    if (approvedTrainer) {
      currentUser = approvedTrainer;
      userRole = 'trainer';
    } else if (approvedMember) {
      currentUser = approvedMember;
      userRole = 'member';
    }

    if (!currentUser || !userRole) {
      console.log('No approved user found with this email');
      return NextResponse.json(
        { error: "Invalid email or password. Please ensure your account has been approved." },
        { status: 401 }
      );
    }

    console.log(`Approved user found. Role: ${userRole}`);
    console.log(`User status: ${currentUser.status || 'active'}`);
    console.log('User object for debug:', JSON.stringify(currentUser));

    // Additional check for suspended users (should not happen since we filtered by approved)
    const status = (currentUser.status || '').toString().toLowerCase();
    if (status === 'suspended') {
      console.log('User account is suspended');
      return NextResponse.json(
        { error: "Your account is suspended. Please contact the admin." },
        { status: 403 }
      );
    }

    // Password validation - TRY BOTH BCRYPT LIBRARIES
    console.log('\n=== PASSWORD VALIDATION ===');
    console.log(`Password field exists: ${!!currentUser.password}`);
    
    if (!currentUser.password) {
      console.log('No password set for user');
      return NextResponse.json(
        { error: "Account setup incomplete. Please contact support." },
        { status: 400 }
      );
    }

    console.log(`Stored password hash: ${currentUser.password.substring(0, 15)}...`);
    console.log(`Hash length: ${currentUser.password.length}`);

    // After finding the user and before password comparison
    if (currentUser && currentUser.password) {
      console.log("Stored password hash for user:", currentUser.password);
    }

    // Try both bcrypt libraries for compatibility
    console.log('\n=== TESTING BOTH BCRYPT LIBRARIES ===');
    
    let isPasswordValid = false;

    try {
      // Test 1: Try with bcrypt (primary)
      const bcryptResult = await bcrypt.compare(cleanPassword, currentUser.password);
      const bcryptjsResult = await bcryptjs.compare(cleanPassword, currentUser.password);
      console.log("bcrypt.compare result:", bcryptResult);
      console.log("bcryptjs.compare result:", bcryptjsResult);
      isPasswordValid = bcryptResult || bcryptjsResult;
      // Test 2: If that doesn't work, try with bcryptjs
      if (!isPasswordValid) {
        isPasswordValid = await bcryptjs.compare(cleanPassword, currentUser.password);
        console.log(`Test 2 - bcryptjs.compare: ${isPasswordValid}`);
      }
      // Test 3: Try with original password (no trim)
      if (!isPasswordValid && password !== cleanPassword) {
        const result1 = await bcrypt.compare(password, currentUser.password);
        const result2 = await bcryptjs.compare(password, currentUser.password);
        console.log(`Test 3 - Original password bcrypt: ${result1}, bcryptjs: ${result2}`);
        isPasswordValid = result1 || result2;
      }
      // Test 4: Try some common variations if still not working
      if (!isPasswordValid) {
        const variations = [
          password.trim(),
          password,
          cleanPassword.toLowerCase(),
          cleanPassword.toUpperCase(),
          cleanPassword.charAt(0).toUpperCase() + cleanPassword.slice(1)
        ];
        console.log('Testing password variations...');
        for (const variation of variations) {
          if (variation && variation !== cleanPassword) {
            const result1 = await bcrypt.compare(variation, currentUser.password);
            const result2 = await bcryptjs.compare(variation, currentUser.password);
            console.log(`Variation "${variation}": bcrypt=${result1}, bcryptjs=${result2}`);
            if (result1 || result2) {
              isPasswordValid = true;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Bcrypt comparison error:', error);
    }

    // Handle plain text passwords (legacy support)
    if (!isPasswordValid) {
      console.log('\n=== CHECKING FOR PLAIN TEXT PASSWORD ===');
      const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
      const isHashFormat = bcryptRegex.test(currentUser.password);
      console.log(`Password is in hash format: ${isHashFormat}`);
      if (!isHashFormat) {
        console.log('Checking for plain text password match');
        isPasswordValid = cleanPassword === currentUser.password;
        if (isPasswordValid) {
          console.log('Plain text match found - upgrading to hashed password');
          try {
            // Use bcryptjs for consistency with registration
            currentUser.password = await bcryptjs.hash(cleanPassword, 12);
            await currentUser.save();
            console.log('Password successfully upgraded to hash');
          } catch (error) {
            console.error('Error upgrading password:', error);
          }
        }
      }
    }

    console.log(`Final validation result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log('✅ Login successful');

    // Prepare user data for response
    const fullName = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
    const responseData = {
      message: "Login successful",
      user: {
        id: currentUser._id,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        name: fullName,
        role: userRole,
        status: currentUser.status || 'active',
        profileImage: currentUser.profileImage || currentUser.image || null
      }
    };

    console.log('Returning success response');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("\n=== LOGIN ERROR ===", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
