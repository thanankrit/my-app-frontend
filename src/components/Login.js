
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../style/Login.css";
import logo from "../img/logo_cis.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ username: "", password: "" });
  const [ssoStatus, setSsoStatus] = useState("idle"); 
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const SSO_CLIENT_ID = process.env.REACT_APP_SSO_CLIENT_ID || "oGHvtkAgoaPb7ZvGHYTQ3X3KbUHsjnY7";
  const REDIRECT_URI = "http://localhost:3000/auth/callback";
  const AUTH_URL = "https://sso.kmutnb.ac.th/auth/authorize";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

      login(data.user, data.token);
      navigate("/home");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = () => {
    if (ssoStatus !== "idle") return;
    setSsoStatus("loading");

    try {
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem("sso_state", state);

      const scope = "openid profile student_info";

      const params = new URLSearchParams({
        client_id: SSO_CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: scope,
        state: state,
      });

      window.location.href = `${AUTH_URL}?${params.toString()}`;
    } catch (err) {
      console.error("SSO Redirect Error:", err);
      setSsoStatus("idle");
      setErrorMsg("ไม่สามารถเชื่อมต่อกับระบบ SSO ได้ในขณะนี้");
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("http://localhost:8081/api/auth/guest", { 
        method: "POST" 
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error("Guest login failed");

      login(data.user, data.token);
      navigate("/home");
    } catch (err) {
      setErrorMsg("ไม่สามารถเข้าสู่ระบบแบบบุคคลทั่วไปได้");
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
            <h1 className="system-title-th">
             ระบบจัดการข้อมูลภายในสำหรับการประกันคุณภาพการศึกษา
            </h1>
          </div>

          {errorMsg && <div className="error-alert">{errorMsg}</div>}

          {/* ฟอร์มเข้าสู่ระบบ */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Username / Email"
                value={inputs.username}
                onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
                required
                autoComplete="username"
                disabled={isLoading || ssoStatus !== "idle"}
              />
            </div>

            <div className="input-group" style={{ marginBottom: "8px" }}>
              <input
                type="password"
                placeholder="Password"
                value={inputs.password}
                onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                required
                autoComplete="current-password"
                disabled={isLoading || ssoStatus !== "idle"}
              />
            </div>

            <div className="forgot-password-container" style={{ textAlign: "right", marginBottom: "20px" }}>
              <span 
                style={{ color: "#d32f2f", cursor: "pointer", fontSize: "0.9rem", textDecoration: "underline" }}
                onClick={() => navigate("/forgot-password")}
              >
                ลืมรหัสผ่าน?
              </span>
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading || ssoStatus !== "idle"}
            >
              {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="login-divider">
            <span>หรือ</span>
          </div>

          {/* ปุ่มตัวเลือก */}
          <div className="extra-login-actions">
            <button
              type="button"
              className={`sso-button ${ssoStatus === "loading" ? "loading" : ""}`}
              onClick={handleSSO}
              disabled={ssoStatus !== "idle" || isLoading}
            >
              {ssoStatus === "idle" ? (
                "นักศึกษาเข้าสู่ระบบด้วย KMUTNB SSO"
              ) : (
                <span className="loading-dots">กำลังเชื่อมต่อ SSO</span>
              )}
            </button>

            <button
              type="button"
              className="guest-button"
              onClick={handleGuest}
              disabled={isLoading || ssoStatus !== "idle"}
            >
              เข้าสู่ระบบสำหรับบุคคลทั่วไป
            </button>
          </div>

          {/* คำแนะนำสำหรับผู้ที่ไม่มีบัญชี */}
          <div className="contact-admin-info" style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#595959' }}>
             <p style={{ margin: 0 }}>
               <strong>สำหรับอาจารย์และเจ้าหน้าที่</strong>
             </p>
             <p style={{ margin: 0 }}>
               หากท่านยังไม่มีบัญชีผู้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ 
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}