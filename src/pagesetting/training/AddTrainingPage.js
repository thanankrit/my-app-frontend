import React, { useState } from "react";
import { Card, Button, Modal, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import TeacherTrainingForm from "./TeacherTrainingForm";
import StaffTrainingForm from "./StaffTrainingForm";

import "../../style/styletraining/AddTrainingPage.css";

export default function AddTrainingSelectPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null); 

  const openForm = (formType) => {
    setType(formType);
    setOpen(true);
  };

  return (
    <div className="research-container">
      <Card className="research-card">
        <Button 
          className="back-btn" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          กลับ
        </Button>

        <h2 className="title">เลือกรูปแบบการกรอกข้อมูลงานอบรม / สัมมนา</h2>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Button 
            type="primary" 
            block 
            className="select-btn"
            onClick={() => openForm("teacher")}
          >
            สำหรับอาจารย์
          </Button>

          <Button 
            type="primary" 
            block 
            className="select-btn"
            onClick={() => openForm("staff")}
          >
            สำหรับเจ้าหน้าที่
          </Button>
        </Space>

        <Modal
          open={open}
          footer={null}
          width={900}
          destroyOnClose
          onCancel={() => setOpen(false)}
          title={
            type === "teacher"
              ? "เพิ่มงานอบรม / สัมมนา (อาจารย์)"
              : "เพิ่มงานอบรม / สัมมนา (เจ้าหน้าที่)"
          }
          style={{ top: 20 }} 
        >
          {type === "teacher" && (
            <TeacherTrainingForm
              onSuccess={() => {
                setOpen(false);
                navigate(-1);
              }}
            />
          )}

          {type === "staff" && (
            <StaffTrainingForm
              onSuccess={() => {
                setOpen(false);
                navigate(-1);
              }}
            />
          )}
        </Modal>
      </Card>
    </div>
  );
}