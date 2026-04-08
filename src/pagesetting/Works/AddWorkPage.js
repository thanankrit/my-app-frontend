import React, { useState } from "react";
import { Card, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import TeacherWorkForm from "./TeacherWorkForm";
import StaffWorkForm from "./StaffWorkForm";
import StudentWorkForm from "./StudentWorkForm";

import "../../style/styleWorks/AddWorkPage.css";

export default function AddWorkPage() {
  const [selectedType, setSelectedType] = useState(null);
  const navigate = useNavigate();

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null); 
    } else {
      navigate("/home/setting/work"); 
    }
  };

  return (
    <div className="research-container">
      <Card className="research-card" bordered={false}>
        <Button
          className="back-btn"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
        >
          กลับ
        </Button>

        {!selectedType && (
          <div className="selection-section">
            <h2 className="title">เลือกประเภทผลงาน</h2>
            <div className="button-group-vertical">
              <Button type="primary" onClick={() => setSelectedType("teacher")}>
                ผลงานอาจารย์
              </Button>
              <Button type="primary" onClick={() => setSelectedType("staff")}>
                ผลงานเจ้าหน้าที่
              </Button>
              <Button type="primary" onClick={() => setSelectedType("student")}>
                ผลงานนักศึกษา
              </Button>
            </div>
          </div>
        )}

        {selectedType === "teacher" && <TeacherWorkForm />}
        {selectedType === "staff" && <StaffWorkForm />}
        {selectedType === "student" && <StudentWorkForm />}
      </Card>
    </div>
  );
}