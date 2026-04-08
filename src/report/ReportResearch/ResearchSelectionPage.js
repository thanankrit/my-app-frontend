import React from "react";
import { Card, Row, Col, Button } from "antd";
import { BookOutlined, FilePptOutlined, TeamOutlined, LeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./../../style/stylereport/ResearchSelectionPage.css"; 

export default function ResearchSelectionPage() {
  const navigate = useNavigate();

  const menuItems = [
    { title: "งานวิจัย", path: "/home/report/research/list", icon: <BookOutlined />, color: "#1677ff" },
    { title: "บทความวารสาร", path: "/home/report/journal/list", icon: <FilePptOutlined />, color: "#52c41a" },
    { title: "งานประชุม", path: "/home/report/conference/list", icon: <TeamOutlined />, color: "#faad14" },
  ];

  return (
    <div className="selection-container">
      <Card 
        className="selection-main-card"
        title={<span className="selection-header-title">เลือกประเภทงานวิจัย</span>} 
        extra={
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} className="btn-back">
            ย้อนกลับ
          </Button>
        }
      >
        <Row gutter={[24, 24]} justify="center">
          {menuItems.map((item) => (
            <Col xs={24} sm={12} md={8} lg={8} key={item.path}>
              <Card 
                hoverable 
                className="selection-item-card"
                onClick={() => navigate(item.path)} 
                style={{ borderTop: `5px solid ${item.color}` }}
              >
                <div className="selection-icon-wrapper" style={{ color: item.color }}>
                  {item.icon}
                </div>
                <h3 className="selection-item-title">{item.title}</h3>
                <p className="selection-item-desc">คลิกเพื่อดูรายการและออกรายงาน</p>
                <Button 
                  type="primary" 
                  block 
                  size="large"
                  className="selection-btn-select"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    navigate(item.path);
                  }}
                  style={{ backgroundColor: item.color, borderColor: item.color }}
                >
                  เลือก
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}