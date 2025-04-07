import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  try {
    console.log("📤 Received file upload request");

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      console.error("❌ No file provided");
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(base64Image, {
      folder: "fitsync-trainers", // ✅ target folder
    });

    console.log("✅ Upload Successful:", uploadRes.secure_url);

    return NextResponse.json({ success: true, url: uploadRes.secure_url }, { status: 200 });

  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
