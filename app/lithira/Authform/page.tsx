"use client";
import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCamera, FaGoogle, FaFacebook, FaMicrosoft } from 'react-icons/fa';

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  profileImage: File | null;
}

interface AuthFormProps {
  onNewUser: (user: { name: string; role: 'member' | 'trainer' }) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onNewUser }) => {
  const [signUpData, setSignUpData] = useState<SignUpData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    profileImage: null,
  });

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = () => {
    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!signUpData.role) {
      alert('Please select a role');
      return;
    }

    if (onNewUser) {
      onNewUser({ name: signUpData.name, role: signUpData.role as 'member' | 'trainer' });
    } else {
      //console.error('onNewUser function is not defined in the parent component.');
    }

    //alert(`Sign-up successful! Name: ${signUpData.name}, Role: ${signUpData.role}`);
    setSignUpData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      profileImage: null,
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-black text-white">
      <div className="flex w-[800px] shadow-xl">
        {/* Left Side - Sign Up */}
        <div className="w-1/2 bg-gray-800 p-6 flex flex-col items-center rounded-l-lg">
          <div className="flex flex-col items-center mb-4">
            <label className="bg-gray-700 p-4 rounded-full border-2 border-red-500 mb-2 cursor-pointer">
              <FaCamera className="text-3xl" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSignUpChange(e as React.ChangeEvent<HTMLInputElement>)}
              />
            </label>
            <select
              name="role"
              value={signUpData.role}
              onChange={handleSignUpChange}
              className="bg-red-600 text-white px-3 py-2 rounded-lg"
              required
            >
              <option value="" disabled>Select Role</option>
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
            </select>
          </div>

          <h2 className="text-xl font-bold mb-6 text-center">CREATE Your New Account</h2>

          <div className="space-y-3 w-full">
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

            {['password', 'confirmPassword'].map((field) => (
              <div key={field} className="flex items-center bg-gray-700 rounded-lg px-3 py-2 border border-red-500 relative">
                <FaLock className="mr-2" />
                <input
                  type={showPassword[field] ? 'text' : 'password'}
                  name={field}
                  placeholder={field === 'password' ? 'Enter Password' : 'Confirm Password'}
                  className="bg-transparent w-full outline-none"
                  value={signUpData[field as keyof SignUpData] as string}
                  onChange={handleSignUpChange}
                  required
                />
                <div
                  className="cursor-pointer"
                  onClick={() => setShowPassword({ ...showPassword, [field]: !showPassword[field] })}
                >
                  {showPassword[field] ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-4">
              <button className="bg-red-600 px-4 py-2 rounded-lg w-[48%]" onClick={handleSignUp}>
                Proceed
              </button>
              <button className="bg-gray-500 px-4 py-2 rounded-lg w-[48%]">
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1%] bg-transparent"></div>

        {/* Right Side - Login */}
        <div className="w-1/2 bg-gray-800 p-6 flex flex-col justify-center items-center rounded-r-lg">
          <h2 className="text-xl font-bold mb-6">Log In to Your Account</h2>
          <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2 mb-4 border border-red-500 w-full">
            <FaUser className="mr-2" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="bg-transparent w-full outline-none"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            />
          </div>

          <div className="flex items-center bg-gray-700 rounded-lg px-3 py-2 mb-4 border border-red-500 w-full">
            <FaLock className="mr-2" />
            <input
              type={showPassword['login'] ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className="bg-transparent w-full outline-none"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <div
              className="cursor-pointer"
              onClick={() => setShowPassword({ ...showPassword, login: !showPassword['login'] })}
            >
              {showPassword['login'] ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          {/* Login & Forgot Password Buttons */}
          <div className="flex justify-between w-full mt-4 mb-6">
            <button className="bg-red-600 px-4 py-2 rounded-lg w-[48%]">
              Log In
            </button>
            <button className="bg-gray-500 px-4 py-2 rounded-lg w-[48%]">
              Forgot Password
            </button>
          </div>

          {/* Sign Up with Google, Facebook, Microsoft */}
          <div className="flex flex-col items-center w-full mt-4">
            <p className="mb-3 text-gray-300">Sign up with</p>
            <div className="flex justify-center gap-6">
              <button
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-all"
                onClick={() => alert('Google sign-in triggered')}
              >
                <FaGoogle className="text-white text-xl" />
              </button>
              <button
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-all"
                onClick={() => alert('Facebook sign-in triggered')}
              >
                <FaFacebook className="text-white text-xl" />
              </button>
              <button
                className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-all"
                onClick={() => alert('Microsoft sign-in triggered')}
              >
                <FaMicrosoft className="text-white text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;





