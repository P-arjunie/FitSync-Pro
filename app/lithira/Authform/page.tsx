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
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

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

interface ForgotPasswordData {
  email: string;
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
  const [forgotPasswordData, setForgotPasswordData] =
    useState<ForgotPasswordData>({
      email: "",
    });
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

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

  const handleForgotPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForgotPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      alert("Please enter email and password to login.");
      return;
    }

    setIsLoading(true);

    // Admin login (if needed)
    if (
      loginData.email === "admin@123.com" &&
      loginData.password === "123456"
    ) {
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("userEmail", "admin@123.com");
      localStorage.setItem("userName", "Admin");
      localStorage.setItem("userId", "admin_001");
      localStorage.setItem("adminLoginTimestamp", Date.now().toString());
      router.push("/lithira/admindashboard");
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
        if (data.user.status === "suspended") {
          alert("Your account has been suspended. Please contact support.");
          return;
        }

        // Store user data in localStorage with consistent naming
        localStorage.setItem("userRole", data.user.role); // This should now be lowercase
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userStatus", data.user.status || "active");

        // Debug log for userId
        console.log("[DEBUG] Set userId in localStorage:", data.user.id);
        if (!data.user.id || data.user.id.length < 10) {
          alert("[DEBUG] Warning: userId set in localStorage is missing or looks invalid: " + data.user.id);
        }

        if (data.user.profileImage) {
          localStorage.setItem("profileImage", data.user.profileImage);
        }

        // Set login timestamp for admin users
        if (data.user.role === "admin") {
          localStorage.setItem("adminLoginTimestamp", Date.now().toString());
        }

        // Set login timestamp for member users
        if (data.user.role === "member") {
          localStorage.setItem("memberLoginTimestamp", Date.now().toString());
        }

        console.log("Login successful, stored role:", data.user.role); // Debug log

        alert("Login successful!");
        router.push("/");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordData.email) {
      alert("Please enter your email address.");
      return;
    }

    if (!isValidEmail(forgotPasswordData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setForgotPasswordMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordData.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotPasswordMessage(
          "Password reset link has been sent to your email."
        );
        setForgotPasswordData({ email: "" });
      } else {
        setForgotPasswordMessage(data.error || "Failed to send reset email.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotPasswordMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
      const formData = new FormData();
      formData.append("file", signUpData.profileImage);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
      imageUrl = uploadData.url;
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed.");
      return;
    }

    // Register user
    const userData = {
      name: signUpData.name,
      email: signUpData.email,
      password: signUpData.password,
      role: signUpData.role,
      profileImage: imageUrl,
      status: "pending", // New users are pending approval
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
        if (onNewUser)
          onNewUser({ name: signUpData.name, role: signUpData.role });

        const profileKey =
          signUpData.role === "trainer"
            ? "trainerProfileImage"
            : "memberProfileImage";
        localStorage.setItem(profileKey, imageUrl);

        router.push(
          signUpData.role === "trainer"
            ? "/lithira/trainerregform"
            : "/lithira/memberregform"
        );
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
    <div className="min-h-screen flex flex-col w-screen bg-gray-200 text-white">
      {" "}
      {/* Changed bg-black to bg-gray-200 (ash) */}
      <Navbar />
      <div className="flex flex-1 justify-center items-center w-full">
        <div className="flex w-[800px] min-h-[500px] shadow-xl">
          {/* Sign Up Section */}
          <div
            className="w-1/2 bg-white/90 backdrop-blur-md p-6 flex flex-col items-center rounded-l-lg border border-white/30 shadow-lg"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
          >
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
              className="bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 mb-4 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition"
              required
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
            </select>

            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
              CREATE Your New Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 w-full">
              <div className="flex items-center bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
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

              <div className="flex items-center bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
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
                  className="flex items-center bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition relative"
                >
                  <FaLock className="mr-2" />
                  <input
                    type={showPassword[field] ? "text" : "password"}
                    name={field}
                    placeholder={
                      field === "password" ? "Password" : "Confirm Password"
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

              <div className="flex w-full gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-4 py-3 text-lg transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Proceed"}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg px-4 py-3 text-lg transition"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Login Section */}
          <div
            className="w-1/2 bg-white/90 backdrop-blur-md p-6 flex flex-col justify-center items-center rounded-r-lg border border-white/30 shadow-lg"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
          >
            <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">
              Log In to Your Account
            </h2>

            {!showForgotPassword ? (
              <div className="space-y-3 w-full">
                <div className="flex items-center bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
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

                <div className="flex items-center bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
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
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-4 py-3 text-lg transition disabled:opacity-50"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>

                <button
                  type="button"
                  className="w-full text-red-600 hover:text-red-700 text-sm font-medium transition underline"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
                  Reset Your Password
                </h3>

                <div className="flex items-center bg-white/70 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
                  <FaEnvelope className="mr-2" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="bg-transparent w-full outline-none"
                    value={forgotPasswordData.email}
                    onChange={handleForgotPasswordChange}
                  />
                </div>

                {forgotPasswordMessage && (
                  <div
                    className={`text-sm p-2 rounded ${
                      forgotPasswordMessage.includes("sent")
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {forgotPasswordMessage}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-4 py-3 text-lg transition disabled:opacity-50"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg px-4 py-3 text-lg transition"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordMessage("");
                      setForgotPasswordData({ email: "" });
                    }}
                    disabled={isLoading}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer1 />
    </div>
  );
};

export default AuthForm;
