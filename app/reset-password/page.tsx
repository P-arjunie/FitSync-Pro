"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid reset link. Please request a new password reset.");
      return;
    }

    // Validate token
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch("/api/auth/validate-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsValidToken(true);
        setMessage("");
      } else {
        if (data.error === "Token expired") {
          setTokenExpired(true);
          setMessage(
            "This reset link has expired. Please request a new password reset."
          );
        } else {
          setMessage(
            "Invalid reset link. Please request a new password reset."
          );
        }
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/lithira/Authform");
        }, 2000);
      } else {
        setMessage(data.error || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewReset = () => {
    router.push("/lithira/Authform");
  };

  if (tokenExpired || !token) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-200">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Reset Link Expired
            </h1>
            <p className="text-gray-600 mb-6 text-center">{message}</p>
            <button
              onClick={handleRequestNewReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-4 py-3 text-lg transition"
            >
              Request New Reset
            </button>
          </div>
        </div>
        <Footer1 />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-200">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Reset Your Password
          </h1>

          {message && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                message.includes("successful")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {isValidToken && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center bg-gray-50 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
                <FaLock className="mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  className="bg-transparent w-full outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div
                  className="cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>

              <div className="flex items-center bg-gray-50 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:border-red-400 focus:ring-2 focus:ring-red-200 outline-none transition">
                <FaLock className="mr-2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  className="bg-transparent w-full outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div
                  className="cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-4 py-3 text-lg transition disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {!isValidToken && !tokenExpired && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Validating reset link...</p>
            </div>
          )}
        </div>
      </div>
      <Footer1 />
    </div>
  );
}
