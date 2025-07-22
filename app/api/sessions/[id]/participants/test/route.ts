import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🧪 Test participants API called for session:", params.id);
    
    return NextResponse.json({ 
      message: "Test endpoint working",
      sessionId: params.id,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Test endpoint error:", error);
    return NextResponse.json({ 
      error: "Test endpoint failed",
      details: error.message 
    }, { status: 500 });
  }
} 