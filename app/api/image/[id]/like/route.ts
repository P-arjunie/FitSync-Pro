// app/api/gallery/[id]/like/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { ImageModel } from '@/models/Images';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    let userId = '';
    try {
      const body = await req.json();
      userId = body.userId;
    } catch {}

    if (userId) {
      // Existing logic for logged-in users
      const image = await ImageModel.findOneAndUpdate(
        { _id: id, likedBy: { $ne: userId } },
        { $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
        { new: true }
      );
      if (!image) {
        return NextResponse.json({ error: 'Already liked or image not found' }, { status: 400 });
      }
      return NextResponse.json({ success: true, likes: image.likes, likedBy: image.likedBy });
    } else {
      // Anonymous like: just increment likes
      const image = await ImageModel.findByIdAndUpdate(
        id,
        { $inc: { likes: 1 } },
        { new: true }
      );
      if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, likes: image.likes });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
