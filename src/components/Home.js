import React, { useState, useEffect } from "react";
import { Layout, Menu, Spin, Space, Button } from "antd";
import {
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
  PieChartOutlined,
  TeamOutlined,
  DiffOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../style/Home.css";
import logo from "../img/logo_cis.png";

const { Header, Content, Footer, Sider } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setCollapsed(true); 
    };

    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>กำลังตรวจสอบข้อมูลผู้ใช้งาน...</p>
      </div>
    );
  }

  const fullName =
    user.firstname && user.lastname
      ? `${user.firstname} ${user.lastname}`
      : user.firstNameTH && user.lastNameTH
        ? `${user.firstNameTH} ${user.lastNameTH}`
        : user.email || user.username || "ผู้ใช้งาน";

  const roleLabel = user.roleName || user.role || "ผู้ใช้งาน";

  const allMenuItems = [
    { key: "dashboard", icon: <PieChartOutlined />, label: "Dashboard", requiredPermission: "view_basic_data" },
    { key: "researchmainpage", icon: <LaptopOutlined />, label: "ข้อมูลงานวิจัย", requiredPermission: "view_basic_data" },
    { key: "trainingmainpage", icon: <UserOutlined />, label: "ข้อมูลการอบรม", requiredPermission: "view_basic_data" },
    { key: "workmainpage", icon: <NotificationOutlined />, label: "ข้อมูลผลงาน", requiredPermission: "view_basic_data" },
    { key: "InternStudentmainpage", icon: <TeamOutlined />, label: "ข้อมูลฝึกงาน", requiredPermission: "view_internship" },
    { key: "surveymainpage", icon: <DiffOutlined />, label: "แบบประเมิน" },
    { key: "report", icon: <FileTextOutlined />, label: "สร้างรายงาน", requiredPermission: "view_reports" },
    { key: "setting", icon: <SettingOutlined />, label: "ตั้งค่า", requiredPermission: "manage_settings" },
    { type: "divider" },
    {
      key: "user-info",
      icon: <UserOutlined />,
      label: (
        <Space direction="vertical" size={0}>
          <span className="user-role-label">{roleLabel}</span>
          <span className="user-full-name">{fullName}</span>
        </Space>
      ),
      disabled: true,
      className: "menu-user-info"
    },
    { key: "logout", icon: <LogoutOutlined />, label: "ออกจากระบบ", danger: true },
  ];

  const menuItems = allMenuItems
    .filter(item => {
      if (item.type === "divider" || item.key === "logout" || item.key === "user-info") return true;
      if (!item.requiredPermission) return true;
      return user.permissions && user.permissions.includes(item.requiredPermission);
    })
    .map(({ requiredPermission, ...rest }) => rest);

  const handleMenuClick = async ({ key }) => {
    if (key === "logout") {
      await logout();
      navigate("/");
    } else if (key !== "user-info") {
      navigate(`/home/${key}`);
      if (isMobile) setCollapsed(true); 
    }
  };

  const currentKey = location.pathname.split("/").pop() || "dashboard";

  return (
    <Layout className="main-outer-layout">
      <Header className="main-header">
        <div className="header-left">
          {isMobile && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="mobile-toggle-btn"
            />
          )}
          <div className="logo">
            <img src={logo} alt="logo" className="logo-img" />
          </div>
        </div>
      </Header>

      <Layout className="main-inner-layout">
        {/* Sider */}
        <Sider
          collapsible
          collapsed={collapsed}
          width={280}
          collapsedWidth={isMobile ? 0 : 80}
          trigger={null}
          onMouseEnter={() => !isMobile && setCollapsed(false)}
          onMouseLeave={() => !isMobile && setCollapsed(true)}
          className={`custom-sider ${isMobile && !collapsed ? "sider-mobile-open" : ""}`}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentKey === "home" ? "dashboard" : currentKey]}
            items={menuItems}
            onClick={handleMenuClick}
            className="custom-menu"
          />
        </Sider>

        {isMobile && !collapsed && (
          <div className="mobile-overlay" onClick={() => setCollapsed(true)} />
        )}

        <Layout className={`content-layout ${!isMobile && !collapsed ? "content-pushed" : ""}`}>
          <Content className="main-content">
            <Outlet />
          </Content>
          <Footer className="main-footer">
            © {new Date().getFullYear()} CIS KMUTNB MASTER
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;