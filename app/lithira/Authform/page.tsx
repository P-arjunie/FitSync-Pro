"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCamera,
} from "react-icons/fa";

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "member" | "trainer" | "";
  profileImage: File | null;
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
    if (name === "profileImage" && files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should not exceed 2MB.");
        return;
      }
      setSignUpData((prev) => ({ ...prev, profileImage: file }));
    } else {
      setSignUpData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userId", data.user.id);

        if (data.user.role === "member") {
          window.location.href = "/lithira/MemberProfilePage";
        } else if (data.user.role === "trainer") {
          window.location.href = "/lithira/TrainerProfilePage";
        } else {
          alert("Unknown user role.");
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpData.password.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!signUpData.role) {
      alert("Please select a role.");
      return;
    }

    if (!signUpData.profileImage) {
      alert("Please upload a profile image.");
      return;
    }

    if (!isValidEmail(signUpData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    let imageUrl = "";

    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });

      const base64Image = await toBase64(signUpData.profileImage);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      imageUrl = uploadData.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed.");
      return;
    }

    const userData = {
      name: signUpData.name,
      email: signUpData.email,
      password: signUpData.password,
      role: signUpData.role,
      profileImage: imageUrl,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        localStorage.setItem("userId", data.userId);

        if (onNewUser) {
          onNewUser({ name: signUpData.name, role: signUpData.role });
        }

        if (signUpData.role === "trainer") {
          localStorage.setItem("trainerProfileImage", imageUrl);
          router.push("/lithira/trainerregform");
        } else {
          localStorage.setItem("memberProfileImage", imageUrl);
          router.push("/lithira/memberregform");
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Registration failed.");
    }
  };

  const handleCancel = () => {
    setSignUpData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      profileImage: null,
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-black text-white">
      <div className="flex w-[800px] shadow-xl">
        {/* Sign Up Section */}
        <div className="w-1/2 bg-gray-800 p-6 flex flex-col items-center rounded-l-lg">
          <label className="mb-4 cursor-pointer relative w-20 h-20">
            {signUpData.profileImage ? (
              <img
                src={URL.createObjectURL(signUpData.profileImage)}
                alt="Profile"
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
            className="bg-red-600 text-white px-3 py-2 rounded-lg mb-4"
            required
          >
            <option value="" disabled>
              Select Role
            </option>
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
          </select>

          <h2 className="text-xl font-bold mb-4 text-center">
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
                    setShowPassword((prev) => ({
                      ...prev,
                      [field]: !prev[field],
                    }))
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
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Login Section */}
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
              />
              <div
                className="cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    loginPassword: !prev.loginPassword,
                  }))
                }
              >
                {showPassword["loginPassword"] ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            <button
              className="bg-red-600 px-4 py-2 rounded-lg w-full"
              onClick={handleLogin}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

