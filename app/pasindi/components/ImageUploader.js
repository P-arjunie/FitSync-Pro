/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, ChangeEvent } from "react";


export default function ImageUploader() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!image) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    console.log("Upload Response:", data);

    if (data.success) {
      setImageUrl(data.url);
      onImageUpload(data.url);
      alert("Image uploaded successfully!");
    } else {
      alert("Upload failed");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
      {imageUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded" style={{ width: "200px" }} />
        </div>
      )}
    </div>
  );
}
