"use client";

import React from "react";
import AuthForm from "./Authform/page";

const ParentComponent: React.FC = () => {
  const handleNewUser = (user: {
    name: string;
    role: "member" | "trainer";
  }) => {
    console.log("New user created:", user);
    // Add any API call or logic to save user data
  };

  return (
    <div>
      {/* Ensure the prop is passed correctly */}
      <AuthForm onNewUser={handleNewUser} />
    </div>
  );
};

export default ParentComponent;
