/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/sessions/trainer/[name]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import Session from '@/models/Session';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connectMongoDB();
    const decodedName = decodeURIComponent(params.name);
    
    // Get query parameters for date filtering
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Build query
    const query: any = { trainerName: decodedName };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query.start = { $gte: new Date(startDate) };
      query.end = { $lte: new Date(endDate) };
    }
    
    const sessions = await Session.find(query).sort({ start: 1 });
    
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching trainer sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer sessions' },
      { status: 500 }
    );
  }
}