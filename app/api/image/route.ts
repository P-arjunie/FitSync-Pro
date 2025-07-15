// app/api/images/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { ImageModel } from '@/models/Images';

export async function GET() {
  await connectToDatabase();
  const images = await ImageModel.find({ status: 'approved' }).sort({ createdAt: -1 });
  return Response.json(images);
}
