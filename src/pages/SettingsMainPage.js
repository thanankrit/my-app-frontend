import React from "react";
import { Button, Card } from "antd";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import { 
  ReadOutlined, 
  VideoCameraOutlined, 
  TrophyOutlined, 
  SafetyOutlined, 
  IdcardOutlined, 
  FormOutlined, 
  UserAddOutlined, 
  SolutionOutlined,
  FileProtectOutlined 
} from "@ant-design/icons";
import "../style/setting.css";

const SettingsPage = () => {
  const { user } = useAuth(); 
  
  const buttons = [
    { label: "งานวิจัย", path: "/home/setting/research", perm: "manage_research", icon: <ReadOutlined /> },
    { label: "งานอบรมและสัมนา", path: "/home/setting/training", perm: "manage_training", icon: <VideoCameraOutlined /> },
    { label: "ผลงาน", path: "/home/setting/work", perm: "manage_works", icon: <TrophyOutlined /> },
    { label: "สร้างสิทธิ์", path: "/home/setting/permission", perm: "manage_permissions", icon: <SafetyOutlined /> },
    { label: "ข้อมูลการฝึกงานนักศึกษา", path: "/home/setting/internstudent", perm: "manage_interns", icon: <IdcardOutlined /> },
    { label: "สร้างแบบสอบถาม", path: "/home/setting/survey", perm: "manage_surveys", icon: <FormOutlined /> },
    { label: "เพิ่มผู้ใช้งาน", path: "/home/setting/UserTypeSelectionPage", perm: "manage_users", icon: <UserAddOutlined /> }, 
    { label: "เพิ่มข้อมูลนักศึกษา", path: "/home/setting/AddstudentTypeSelectionPage", perm: "manage_users", icon: <SolutionOutlined /> }, 
    { label: "สร้างรายงานสำหรับส่งประกัน", path: "/home/setting/insurance-report", perm: "manage_insurance_reports",       icon: <FileProtectOutlined /> },
  ];

  const visibleButtons = buttons.filter(btn => 
    user?.permissions?.includes(btn.perm)
  );

  return (
    <div className="settings-page-container">
      <Card title={<h2>การตั้งค่าระบบ</h2>} className="settings-main-card">
        <div className="settings-grid">
          {visibleButtons.map(({ label, path, icon }, index) => (
            <Link to={path} key={index} className="settings-link-wrapper">
              <Button 
                type="default" 
                block 
                className="settings-btn"
                icon={icon} 
              >
                {label}
              </Button>
            </Link>
          ))}
          
          {visibleButtons.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px', gridColumn: '1 / -1' }}>
              คุณไม่มีสิทธิ์จัดการการตั้งค่าใดๆ
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;