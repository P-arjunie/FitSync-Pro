// app/api/gallery/[id]/like/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { ImageModel } from '@/models/Images';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const image = await ImageModel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, likes: image.likes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Like error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), { status: 500 });
  }
}
