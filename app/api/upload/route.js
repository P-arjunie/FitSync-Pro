import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    // Parse JSON body (since you're sending base64 in application/json format)
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "fitsync_profiles", // You can customize this folder
    });

    return new Response(
      JSON.stringify({ url: uploadResponse.secure_url }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    return new Response(
      JSON.stringify({ error: "Image upload failed. Try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
