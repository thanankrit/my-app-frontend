import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const API_ENDPOINT = "http://localhost:8081/api/auth/sso/callback";

export default function Callback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const hasFetched = useRef(false);
  const [statusMessage, setStatusMessage] = useState("กำลังยืนยันตัวตน...");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const code = searchParams.get("code") || searchParams.get("ticket");
    const stateReturned = searchParams.get("state");
    const stateStored = sessionStorage.getItem('sso_state');

    if (!code) {
      navigate("/", { replace: true });
      return;
    }

    hasFetched.current = true;
    if (stateStored && (stateReturned !== stateStored)) {
        console.error("Security Alert: State mismatch");
        alert("พบความผิดปกติ (State ไม่ตรงกัน)");
        navigate("/", { replace: true });
        return;
    }
    sessionStorage.removeItem('sso_state');

    const verifyToken = async () => {
        try {
            setStatusMessage("กำลังตรวจสอบสิทธิ์...");
            const currentRedirectUri = window.location.origin + "/auth/callback"; 

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: code,
                    redirectUri: currentRedirectUri 
                }) 
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Server responded with error');
            }

            const data = await response.json();

            if (!data.user) {
                throw new Error("Invalid response: User data missing");
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
            }
        
            login(data.user);

            setIsSuccess(true);
            setStatusMessage("เข้าสู่ระบบสำเร็จ กำลังนำท่านไปยังระบบ...");

            setTimeout(() => {
                navigate("/home", { replace: true });
            }, 1500);

        } catch (error) {
            console.error("SSO Login Error:", error);
            setIsError(true);
            setStatusMessage("การยืนยันตัวตนล้มเหลว หรือระบบขัดข้อง");
            
            setTimeout(() => {
                navigate("/", { replace: true });
            }, 2500);
        }
    };

    verifyToken();

  }, [searchParams, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', backgroundColor: '#f0f2f5', fontFamily: 'Sarabun, sans-serif' }}>
      {isSuccess ? (
          <CheckCircleOutlined style={{ fontSize: 60, color: '#52c41a', marginBottom: 20 }} />
      ) : isError ? (
          <CloseCircleOutlined style={{ fontSize: 60, color: '#ff4d4f', marginBottom: 20 }} />
      ) : (
          <Spin size="large" />
      )}
      <h2 style={{ marginTop: 20, color: isSuccess ? '#52c41a' : isError ? '#ff4d4f' : '#1890ff', textAlign: 'center' }}>
        {statusMessage}
      </h2>
    </div>
  );
}