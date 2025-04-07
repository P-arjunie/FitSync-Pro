// /app/api/upload/route.ts
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type");

  // Case 1: JSON with base64 image
  if (contentType?.includes("application/json")) {
    try {
      const { image } = await req.json();

      if (!image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }

      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "fit-sync-pro",
      });

      return NextResponse.json({ url: uploadResponse.secure_url });
    } catch (error: any) {
      console.error("Base64 Upload Error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  // Case 2: Multipart form-data with file
  if (contentType?.includes("multipart/form-data")) {
    try {
      const data = await req.formData();
      const file = data.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "fitsync-profile-pics" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      return NextResponse.json(uploadResult);
    } catch (err) {
      console.error("Form Upload Error:", err);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  // Invalid content type
  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}

