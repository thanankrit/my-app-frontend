
import React, { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(null);
const STORAGE_KEY = "currentUser";
const TOKEN_KEY = "token"; 

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  const handleLoginSuccess = (userData, token = null) => {
    const finalToken = token || userData.token;
    if (finalToken) {
      localStorage.setItem(TOKEN_KEY, finalToken);
    }
    
    let detectedRole = userData.role || userData.userType || "";
    
    if (!detectedRole && (userData.student_info || userData.studentId)) {
      detectedRole = "student";
    }

    if (!detectedRole && /^\d{8,10}$/.test(userData.username)) {
      detectedRole = "student";
    }

    const finalRole = String(detectedRole || "guest").toLowerCase().trim();
    const displayRoleName = userData.roleName || (finalRole === "student" ? "นักศึกษา" : "บุคคลทั่วไป");

    const normalizedUser = {
      ...userData, 
      username: userData.username || userData.email || "",
      role: finalRole, 
      roleName: displayRoleName,      
      permissions: userData.permissions || [], 
      firstname: userData.firstname || userData.firstNameTH || userData.firstName || "ผู้ใช้งาน",
      lastname: userData.lastname || userData.lastNameTH || userData.lastName || "",
    };
    
    console.log("Normalized User Data:", normalizedUser); 
    setUser(normalizedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth Error:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData, token) => {
    handleLoginSuccess(userData, token);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    window.location.href = '/'; 
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

