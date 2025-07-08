/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const AddProductForm: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number | "">("");
  const [countInStock, setCountInStock] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  //set the image state to the selected file
  // const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => { //update when the user add a new image
  //   if (event.target.files && event.target.files[0]) { // Check if a file is selected
  //     setImage(event.target.files[0]); 
  //   }
  // };

  //image upload
  // const handleImageUpload = async () => {
  //   //async fucntion - js single threaded (sync), to make it async 
  //   if (!image) return alert("Please select an image!");

  //   setUploading(true);
  //   const formData = new FormData(); //send file data (image) in formdata format
  //   formData.append("image", image); //append/attach the image to formdata

  //   try {
  //     const res = await fetch("/api/upload", { //return a promise 
  //       method: "POST",
  //       body: formData,
  //     });

  //     const data = await res.json(); //wait for res 
  //     setUploading(false);

  //     if (data.success) {
  //       setImageUrl(data.url);
  //       alert("Image uploaded successfully!");
  //     } else {
  //       alert("Upload failed");
  //     }
  //   } catch (error) {
  //     setUploading(false);
  //     alert("Upload error");
  //   }
  // };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) { //check if a file is selected 
    setImage(e.target.files[0]); //set the image state to the selected 
  }
};

const handleImageUpload = async () => {
  if (!image) { //if image is not selcted 
    alert("Please select an image!");
    return;
  }
  setUploading(true);
  const formData = new FormData();
  formData.append("file", image);

  try {
    const res = await fetch("/api/upload", { //send image to cloudinary
      method: "POST",
      body: formData, 
    });

    const data = await res.json(); //promise to wait for url + error/success
    setUploading(false);

    if (!res.ok) { //if fail upload
      console.error("Upload failed:", data.error);
      alert("Upload failed: " + data.error);
      return;
    }

    //upload successful
    setImageUrl(data.url); //pass image url
    console.log("Uploaded URL:", data.url);
    alert("Upload successful!");
  } catch (err) { 
    setUploading(false); 
    console.error("Fetch error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    alert("Upload failed: " + errorMessage);
  }
};

  const handleSubmit = async (e: FormEvent) => { //handle form 
    e.preventDefault(); 
    if (!imageUrl) { //image url availbility 
      setError("Please upload an image");
      return;
    }
    //product objs + details 
    const product = { image: imageUrl, title, description, category, price, countInStock };

    const response = await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
      headers: { "Content-Type": "application/json" },
    });

    const json = await response.json(); //response
    if (!response.ok) {
      setError(json.error);
      return;
    }
    //clear states
    setImage(null);
    setImageUrl("");
    setTitle("");
    setDescription("");
    setCategory("");
    setPrice("");
    setCountInStock("");
    setError(null);
    console.log("New product added", json);
    router.push("/");
  };

  return (
    <div className="min-h-screen py-8 text-white">
      <div className="max-w-2xl mx-auto bg-gray-900 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-500 mb-6">Add a New Product</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Product Image</label>
            <div className="mt-1 flex items-center gap-4">
              <label className="cursor-pointer bg-white text-black rounded-md px-4 py-2">Choose File
                <input type="file" className="sr-only" onChange={handleImageChange} required />
              </label>
              <span className="text-sm">{image ? image.name : "No file chosen"}</span>
              <button type="button" onClick={handleImageUpload} disabled={!image || uploading} className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700">
                <Upload className="w-4 h-4 mr-2" /> {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          {/* Text Input Fields */}
          {[{ label: "Title", value: title, setter: setTitle },
            { label: "Description", value: description, setter: setDescription },
            { label: "Category", value: category, setter: setCategory },
            { label: "Price", value: price, setter: setPrice, type: "number" },
            { label: "Count in Stock", value: countInStock, setter: setCountInStock, type: "number" }
          ].map(({ label, value, setter, type }) => (
            <div key={label}>
              <label className="block text-sm font-medium">{label}</label>
              <input type={type || "text"} value={value} onChange={(e) => setter(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) as any : e.target.value)} className="block w-full rounded-md bg-gray-800 border-gray-700 text-white p-2" placeholder={`Enter ${label.toLowerCase()}`} required />
            </div>
          ))}
          
          <select id="" >
            <option value="sports">Sports</option>
            <option value="accessories">Accessories</option>
          </select>

          {/* Submit Button */}
          <button type="submit" className="w-full py-2 bg-red-600 rounded-md hover:bg-red-700">Add Product</button>

          {/* Error Message */}
          {error && <div className="bg-red-500 text-white p-2 mt-4 rounded-md">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
