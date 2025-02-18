"use client";

import React, { useState } from "react";
import AuthForm from "./lithira/Authform/page";  
import UserManagement from "./lithira/userinfo/page";  // I assume this is being used later

const ParentComponent:React.FC = () => {
  const handleNewUser = (user: { name: string; role: "member" | "trainer" }) => {
    console.log("New user created:", user);
  };

  return (
    <div>
      {/* Pass handleNewUser as onNewUser prop */}
      <AuthForm onNewUser={handleNewUser} />
    </div>
  );
};

export default ParentComponent;



