/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ImageModel } from '@/models/Images';
import { connectToDatabase } from '@/lib/mongodb';

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ✅ Required for Next.js App Router file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ POST handler for image upload
export async function POST(req: Request) {
  try {
    // Parse the form data and get file
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert to stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Upload to Cloudinary in "fitsyncpro_gallery" folder
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'fitsyncpro_gallery' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.pipe(uploadStream);
    });

    const secureUrl = (uploadResult as any).secure_url;

    // ✅ Save to MongoDB
    await connectToDatabase();
    const newImage = await ImageModel.create({
      src: secureUrl,
      status: 'pending',
      comments: [],
      likes: 0,
      source: 'gallery', // Mark as uploaded from gallery page
    });

    // ✅ Return uploaded image URL
    return new Response(
      JSON.stringify({ url: secureUrl, image: newImage }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    console.error('Cloudinary Upload Error:', err);

    return new Response(
      JSON.stringify({ error: 'Upload failed. Try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
