import { connectToDatabase } from '@/lib/mongodb';
import { ImageModel } from '@/models/Images';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const { id } = params;
  const { status } = await req.json();
  if (!['approved', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const updated = await ImageModel.findByIdAndUpdate(id, { status }, { new: true });
  if (!updated) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, image: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const deletedImage = await ImageModel.findByIdAndDelete(id);
    if (!deletedImage) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    return NextResponse.json({ message: '✅ Image deleted successfully' });
  } catch (err) {
    console.error('❌ DELETE /api/image/:id failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 