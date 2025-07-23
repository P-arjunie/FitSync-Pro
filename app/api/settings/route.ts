import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';

// GET: Fetch site settings
export async function GET() {
  await connectToDatabase();
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return NextResponse.json(settings);
}

// POST/PUT: Update site settings
export async function PUT(req: NextRequest) {
  await connectToDatabase();
  const data = await req.json();
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create(data);
  } else {
    Object.assign(settings, data);
    await settings.save();
  }
  return NextResponse.json(settings);
} 