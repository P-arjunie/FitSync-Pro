"use client";
import connectMongoDB  from '@/lib/mongodb';
import cloudinary from '@/lib/cloudinary';
import  uploadImageToCloudinary  from "@/lib/cloudinary"; 
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaGoogle,
  FaFacebook,
  FaMicrosoft,
} from "react-icons/fa";

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "member" | "trainer" | "";
  profileImage: File | null | string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthFormProps {
  onNewUser?: (user: { name: string; role: "member" | "trainer" }) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onNewUser }) => {
  const router = useRouter();

  const [signUpData, setSignUpData] = useState<SignUpData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    profileImage: null,
  });

  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const handleSignUpChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "profileImage" && files) {
      setSignUpData((prev) => ({ ...prev, profileImage: files[0] }));
    } else {
      setSignUpData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      alert("Please enter email and password to login.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (signUpData.password !== signUpData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
  
    if (!signUpData.role) {
      alert("Please select a role");
      return;
    }
  
    let imageUrl = "";
  
    if (signUpData.profileImage && typeof signUpData.profileImage !== "string") {
      // Convert image to base64
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
  
      try {
        const base64Image = await toBase64(signUpData.profileImage);
  
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          throw new Error(data.error || "Image upload failed");
        }
  
        imageUrl = data.url;
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Image upload failed");
        return;
      }
    } else if (typeof signUpData.profileImage === "string") {
      imageUrl = signUpData.profileImage;
    }
  
    const userData = {
      name: signUpData.name,
      email: signUpData.email,
      password: signUpData.password,
      role: signUpData.role,
      profileImage: imageUrl,
    };
  
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
  
    const data = await res.json();
  
    if (res.ok) {
      alert(data.message);
      localStorage.setItem("trainerProfileImage", data.profileImage);
  
      if (onNewUser) {
        onNewUser({
          name: userData.name,
          role: userData.role as "member" | "trainer",
        });
      }
  
      router.push(
        userData.role === "trainer"
          ? "/lithira/trainerregform"
          : "/lithira/memberregform"
      );
    } else {
      alert(data.error);
    }
  };
  

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-black text-white">
      <div className="flex w-[800px] shadow-xl">
        {/* Left Side - Sign Up */}
        <div className="w-1/2 bg-gray-800 p-6 flex flex-col items-center rounded-l-lg">
          <div className="flex flex-col items-center mb-4">
            <label className="mb-2 cursor-pointer relative w-20 h-20">
              {signUpData.profileImage ? (
                <img
                  src={
                    typeof signUpData.profileImage === "string"
                      ? signUpData.profileImage
                      : URL.createObjectURL(signUpData.profileImage)
                  }
                  alt="Profile Preview"
                  className="w-full h-full object-cover rounded-full border-2 border-red-500"
                />
              ) : (
                <div className="bg-gray-700 p-4 rounded-full border-2 border-red-500 flex items-center justify-center w-full h-full">
                  <FaCamera className="text-3xl text-white" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                name="profileImage"
                className="hidden"
                onChange={handleSignUpChange}
              />
            </label>

            <select
              name="role"
              value={signUpData.role}
              onChange={handleSignUpChange}
              className="bg-red-600 text-white px-3 py-2 rounded-lg"
              required
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
            </select>
          </div>

          <h2 className="text-xl font-bold mb-6 text-center">
            CREATE Your New Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 w-full">
            <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2 border border-red-500">
              <FaUser className="mr-2" />
              <input
                type="text"
                name="name"
                placeholder="Name"
                className="bg-transparent w-full outline-none"
                value={signUpData.name}
                onChange={handleSignUpChange}
                required
              />
            </div>

            <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2 border border-red-500">
              <FaEnvelope className="mr-2" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="bg-transparent w-full outline-none"
                value={signUpData.email}
                onChange={handleSignUpChange}
                required
              />
            </div>

            {["password", "confirmPassword"].map((field) => (
              <div
                key={field}
                className="flex items-center bg-gray-700 rounded-lg px-3 py-2 border border-red-500 relative"
              >
                <FaLock className="mr-2" />
                <input
                  type={showPassword[field] ? "text" : "password"}
                  name={field}
                  placeholder={
                    field === "password" ? "Enter Password" : "Confirm Password"
                  }
                  className="bg-transparent w-full outline-none"
                  value={signUpData[field as keyof SignUpData] as string}
                  onChange={handleSignUpChange}
                  required
                />
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setShowPassword({
                      ...showPassword,
                      [field]: !showPassword[field],
                    })
                  }
                >
                  {showPassword[field] ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-4">
              <button
                type="submit"
                className="bg-red-600 px-4 py-2 rounded-lg w-[48%]"
              >
                Proceed
              </button>
              <button
                type="button"
                className="bg-gray-500 px-4 py-2 rounded-lg w-[48%]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Divider */}
        <div className="w-[1%] bg-transparent"></div>

        {/* Right Side - Login */}
        <div className="w-1/2 bg-gray-800 p-6 flex flex-col justify-center items-center rounded-r-lg">
          <h2 className="text-xl font-bold mb-6">Log In to Your Account</h2>

          <div className="space-y-3 w-full">
            <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2 border border-red-500">
              <FaEnvelope className="mr-2" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="bg-transparent w-full outline-none"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>

            <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2 border border-red-500">
              <FaLock className="mr-2" />
              <input
                type={showPassword["loginPassword"] ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="bg-transparent w-full outline-none"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
              <div
                className="cursor-pointer"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    loginPassword: !showPassword["loginPassword"],
                  })
                }
              >
                {showPassword["loginPassword"] ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          <div className="flex justify-between w-full mt-4 mb-4">
            <button
              className="bg-red-600 px-4 py-2 rounded-lg w-[48%]"
              onClick={handleLogin}
            >
              Log In
            </button>
            <button className="bg-gray-500 px-4 py-2 rounded-lg w-[48%]">
              Forgot Password
            </button>
          </div>

          <div className="w-full text-center mb-2">or sign in with</div>
          <div className="flex space-x-4 justify-center">
            <FaGoogle className="text-2xl cursor-pointer" />
            <FaFacebook className="text-2xl cursor-pointer" />
            <FaMicrosoft className="text-2xl cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

