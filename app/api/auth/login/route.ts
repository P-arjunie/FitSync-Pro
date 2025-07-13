import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';
import bcrypt from 'bcrypt'; // Direct bcrypt import

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // Enhanced input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: "Invalid input format" },
        { status: 400 }
      );
    }

    // Clean inputs
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email and password cannot be empty" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    console.log(`\n=== LOGIN ATTEMPT ===`);
    console.log(`Email: ${cleanEmail}`);
    console.log(`Password length: ${cleanPassword.length}`);

    // Find user in either collection
    const [member, approvedTrainer] = await Promise.all([
      Member.findOne({ email: cleanEmail }).select('+password'),
      ApprovedTrainer.findOne({ email: cleanEmail }).select('+password')
    ]);

    console.log(`Member found: ${member ? 'Yes' : 'No'}`);
    console.log(`Trainer found: ${approvedTrainer ? 'Yes' : 'No'}`);

    const user = member || approvedTrainer;
    const userRole = member ? 'member' : approvedTrainer ? 'trainer' : null;

    if (!user || !userRole) {
      console.log('No user found with this email');
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log(`User found. Role: ${userRole}`);
    console.log(`User status: ${user.status || 'active'}`);

    // Account status checks
    if (user.status === 'suspended') {
      console.log('User account is suspended');
      return NextResponse.json(
        { error: "Account is suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Password validation - DIRECT BCRYPT METHOD
    console.log('\n=== PASSWORD VALIDATION ===');
    console.log(`Password field exists: ${!!user.password}`);
    
    if (!user.password) {
      console.log('No password set for user');
      return NextResponse.json(
        { error: "Account setup incomplete. Please contact support." },
        { status: 400 }
      );
    }

    console.log(`Stored password hash: ${user.password.substring(0, 15)}...`);
    console.log(`Hash length: ${user.password.length}`);

    // DIRECT BCRYPT COMPARISON - This should work!
    console.log('\n=== DIRECT BCRYPT TEST ===');
    
    let isPasswordValid = false;

    try {
      // Test 1: Direct comparison with cleaned password
      isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
      console.log(`Test 1 - Clean password "${cleanPassword}": ${isPasswordValid}`);
      
      // Test 2: If that doesn't work, try with original password (no trim)
      if (!isPasswordValid && password !== cleanPassword) {
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`Test 2 - Original password "${password}": ${isPasswordValid}`);
      }
      
      // Test 3: Try some common variations if still not working
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
            const result = await bcrypt.compare(variation, user.password);
            console.log(`Variation "${variation}": ${result}`);
            if (result) {
              isPasswordValid = true;
              break;
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Direct bcrypt error:', error);
    }

    // Handle plain text passwords (legacy support)
    if (!isPasswordValid) {
      console.log('\n=== CHECKING FOR PLAIN TEXT PASSWORD ===');
      const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
      const isHashFormat = bcryptRegex.test(user.password);
      
      console.log(`Password is in hash format: ${isHashFormat}`);
      
      if (!isHashFormat) {
        console.log('Checking for plain text password match');
        isPasswordValid = cleanPassword === user.password;
        
        if (isPasswordValid) {
          console.log('Plain text match found - upgrading to hashed password');
          try {
            user.password = await bcrypt.hash(cleanPassword, 12);
            await user.save();
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
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const responseData = {
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: fullName,
        role: userRole,
        status: user.status || 'active',
        profileImage: user.profileImage || null
      }
    };

    console.log('Returning success response');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("\n=== LOGIN ERROR ===", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}