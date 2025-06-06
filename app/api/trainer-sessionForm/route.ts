// For app router (Next 13+)
import { NextResponse } from 'next/server';

const sessions: any[] = []; // In-memory store (will reset on server restart)

export async function POST(req: Request) {
  const data = await req.json();
  sessions.push(data);
  return NextResponse.json({ message: 'Session created successfully', session: data }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ sessions });
}
