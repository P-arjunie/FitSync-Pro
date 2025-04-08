import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    console.log("📤 Received file upload request");

    const contentType = req.headers.get("content-type");

    // ✅ Only allow JSON body with base64 image
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 415 }
      );
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "fit-sync-pro",
    });

    console.log("✅ Image uploaded:", uploadResponse.secure_url);
    return NextResponse.json({ url: uploadResponse.secure_url }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}


