import { NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";

export async function POST(req) {
  try {
    // Log incoming request
    console.log("Received file upload request");

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      // Return 400 if no file is uploaded
      console.error("No file provided");
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Log the buffer size for debugging
    console.log("Buffer size:", buffer.length);

    // Upload directly to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, cloudinaryResult) => {
        if (error) {
          // Handle error during Cloudinary upload
          console.error("Cloudinary Upload Error:", error);
          return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
        }

        // Return success response with Cloudinary image URL
        console.log("Cloudinary result:", cloudinaryResult);
        return NextResponse.json({ success: true, url: cloudinaryResult.secure_url });
      }
    );

    result.end(buffer);
    // Ensure the route handler always returns a valid response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server-side upload error:", error);
    // Ensure we always send a response, even on failure
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
