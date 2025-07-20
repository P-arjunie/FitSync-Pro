// app/lib/auth.ts

export interface AuthUser {
  userId: string;
  userEmail: string;
  userRole: string;
  userName: string;
}

export const getAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  if (userId && userEmail && userRole && userName) {
    return {
      userId,
      userEmail,
      userRole,
      userName
    };
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  return getAuthUser() !== null;
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userId");
}; 