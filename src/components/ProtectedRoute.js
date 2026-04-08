
import React from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredPermission }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', marginTop: '20vh' }}>
        <Spin size="large" tip="กำลังตรวจสอบสิทธิ์ผู้ใช้งาน..." />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (!requiredPermission) {
    return children;
  }
  const hasPermission = user.permissions && user.permissions.includes(requiredPermission);

  if (!hasPermission) {
    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ครับ"); 
    return <Navigate to="/home" replace />; 
  }
  return children;
}