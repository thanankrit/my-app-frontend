import React from "react";
import { Card, Row, Col, Button } from "antd";
import { ReadOutlined, FileTextOutlined, TrophyOutlined, FormOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "../style/ReportPage.css"; 

export default function ReportPage() {
  const navigate = useNavigate();

  const reportTypes = [
    {
      key: "research",
      title: "รายงานงานวิจัย",
      icon: <ReadOutlined className="report-icon" style={{ color: "#1677ff" }} />,
      path: "research",
    },
    {
      key: "Training",
      title: "รายงานงานอบรม / สัมมนา",
      icon: <FileTextOutlined className="report-icon" style={{ color: "#52c41a" }} />,
      path: "Training",
    },
    {
      key: "work",
      title: "รายงานผลงาน",
      icon: <TrophyOutlined className="report-icon" style={{ color: "#faad14" }} />,
      path: "work",
    },
    {
      key: "survey",
      title: "รายงานแบบสอบถาม",
      icon: <FormOutlined className="report-icon" style={{ color: "#eb2f96" }} />,
      path: "survey",
    },
  ];

  return (
    <div className="report-page-container">
      <Card 
        title={<span className="report-main-title">เลือกประเภทการสร้างรายงาน</span>}
        className="report-main-card"
        variant="outlined"
      >
        <Row gutter={[16, 16]}>
          {reportTypes.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.key}>
              <Card hoverable className="report-item-card">
                <div className="report-icon-wrapper">
                  {item.icon}
                </div>
                <h3 className="report-item-title">{item.title}</h3>
                <div>
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => navigate(item.path)}
                    className="report-btn"
                  >
                    สร้างรายงาน
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}