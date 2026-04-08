import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Login.css"; 
import logo from "../img/logo_cis.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ email: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8081/api/auth/direct-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }

  
      setMessage(data.message);
      setInputs({ email: "", newPassword: "" });
      setTimeout(() => navigate("/"), 1000);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <img src={logo} alt="CIS Logo" className="login-logo" />
            <h2 style={{ textAlign: "center", marginTop: "10px", color: "#333" }}>ตั้งรหัสผ่านใหม่</h2>
            <p style={{ textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
              กรุณากรอกอีเมลของคุณ และตั้งรหัสผ่านใหม่
            </p>
          </div>

          {errorMsg && <div className="error-alert">{errorMsg}</div>}
          {message && (
            <div className="success-alert" style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "4px", marginBottom: "15px", fontSize: "0.9rem", textAlign: "center" }}>
              {message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                placeholder="กรอกอีเมลที่ใช้ในระบบ"
                value={inputs.email}
                onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="input-group" style={{ marginBottom: "20px" }}>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่"
                value={inputs.newPassword}
                onChange={(e) => setInputs({ ...inputs, newPassword: e.target.value })}
                required
                disabled={isLoading || message !== ""}
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading || !inputs.email || !inputs.newPassword || message !== ""}
            >
              {isLoading ? "กำลังอัปเดต..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <span 
              style={{ color: "#1890ff", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/")}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}