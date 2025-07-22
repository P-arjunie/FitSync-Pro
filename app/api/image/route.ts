// app/api/images/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { ImageModel } from '@/models/Images';

export async function GET(req) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'approved';
  const source = searchParams.get('source');
  const query = { status };
  if (source) query.source = source;
  const images = await ImageModel.find(query).sort({ createdAt: -1 });
  return Response.json(images);
}
