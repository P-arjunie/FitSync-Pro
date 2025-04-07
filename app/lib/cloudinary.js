import { v2 as cloudinary } from "cloudinary";

// ✅ Configure using environment variables
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL, // Optional if full URL is present
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

