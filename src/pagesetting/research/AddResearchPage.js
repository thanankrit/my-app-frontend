import React, { useState } from "react";
import { Card, Button, Modal, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import ResearchForm from "./ResearchForm";

import "../../style/styleresearch/AddResearchSelectPage.css"; 

export default function AddResearchSelectPage() {
  const navigate = useNavigate();
  const { teacherId } = useParams();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);

  const formConfig = {
    research: "เพิ่มงานวิจัย",
    journal: "เพิ่มบทความวารสาร",
    conference: "เพิ่มงานประชุม",
    book: "เพิ่มข้อมูลหนังสือ / เอกสารประกอบการสอน"
  };

  const openForm = (formType) => {
    setType(formType);
    setOpen(true);
  };

  return (
    <div className="research-container">
      <Card className="research-card">
        <div className="research-header">
          <Button
            className="back-btn"
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              teacherId
                ? navigate(`/home/setting/research/by-teacher/${teacherId}`)
                : navigate("/home/setting/research")
            }
          >
            กลับ
          </Button>
        </div>

        <h2 className="title">เลือกรูปแบบการกรอกข้อมูล</h2>

        <div className="button-group">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Button type="primary" block className="select-btn" onClick={() => openForm("research")}>
              งานวิจัย
            </Button>

            <Button type="primary" block className="select-btn" onClick={() => openForm("journal")}>
              บทความวารสาร
            </Button>

            <Button type="primary" block className="select-btn" onClick={() => openForm("conference")}>
              งานประชุม
            </Button>

            <Button type="primary" block className="select-btn" onClick={() => openForm("book")}>
              ข้อมูลหนังสือ / เอกสารประกอบการสอน
            </Button>
          </Space>
        </div>

        <Modal
          open={open}
          footer={null}
          width={900}
          destroyOnClose
          onCancel={() => setOpen(false)}
          title={formConfig[type] || "เพิ่มข้อมูล"}
          className="responsive-modal"
        >
          <ResearchForm
            type={type} 
            initialValues={{ teacherId }}
            onSuccess={() => {
              setOpen(false);
              navigate(
                teacherId
                  ? `/home/setting/research/by-teacher/${teacherId}`
                  : "/home/setting/research"
              );
            }}
          />
        </Modal>
      </Card>
    </div>
  );
}