import React from "react";
import { Button, Card, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";

import "../../style/styleuser/UserTypeSelectionPage.css";

export default function UserTypeSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="user-type-selection-container">
      <Card className="user-type-selection-card" bordered={false}>
        <h2 className="selection-title">เลือกประเภทผู้ใช้งาน</h2>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Button
            className="selection-btn"
            type="primary"
            icon={<TeamOutlined />}
            size="large"
            block
            onClick={() => navigate("/home/setting/teacher")}
          >
            ผู้ใช้งาน: อาจารย์
          </Button>

          <Button
            className="selection-btn"
            type="primary"
            icon={<UserOutlined />}
            size="large"
            block
            onClick={() => navigate("/home/setting/staff")}
          >
            ผู้ใช้งาน: เจ้าหน้าที่
          </Button>
        </Space>
      </Card>
    </div>
  );
}