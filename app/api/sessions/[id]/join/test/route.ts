import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    return NextResponse.json({ 
      message: "Join route is working!",
      sessionId: id,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error("Error in join test route:", error);
    return NextResponse.json({ error: "Test route failed" }, { status: 500 });
  }
} 