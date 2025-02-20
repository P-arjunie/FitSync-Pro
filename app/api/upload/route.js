// import { NextResponse } from "next/server";
// import cloudinary from "../../lib/cloudinary";
// import { writeFile } from "fs/promises";
// import path from "path";

// export async function POST(req) {
//   try {
//     // Log incoming request
//     console.log("Received file upload request");

//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file) {
//       // Return 400 if no file is uploaded
//       console.error("No file provided");
//       return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
//     }



//     //convert to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     //temp file
//     const tempFilePath = path.join("/tmp", file.name);
//     await writeFile(tempFilePath, buffer);  

//     // Log the buffer size for debugging
//     console.log("Buffer size:", buffer.length);

//      // Upload to Cloudinary
//     const uploadRes = await cloudinary.uploader.upload(tempFilePath, 
//       {
//       folder: "products", // Stores images in Cloudinary's "products" folder
//       }
//     );

//     result.end(buffer);

//     return NextResponse.json({ success: true, url: uploadRes.secure_url });
    
//     // Ensure the route handler always returns a valid response
    
//   } catch (error) {
//     console.error("Upload error:", error);
//     return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import cloudinary from "../../lib/cloudinary";

export async function POST(req) {
  try {
    console.log("Received file upload request");

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      console.error("No file provided");
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    // Convert to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload directly to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(`data:image/png;base64,${buffer.toString("base64")}`, {
      folder: "products",
    });

    console.log("Cloudinary Upload Successful:", uploadRes.secure_url);
    return NextResponse.json({ success: true, url: uploadRes.secure_url });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
