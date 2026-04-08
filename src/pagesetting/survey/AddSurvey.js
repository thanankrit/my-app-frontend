import React, { useState } from "react";
import { Card, Button, Modal, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import GeneralSurveyForm from "./GeneralSurveyForm";
import StudentSurveyForm from "./StudentSurveyForm";
import "../../style/stylesurvey/AddSurveySelectPage.css";

export default function AddSurveySelectPage() {
  const navigate = useNavigate();
  const [modalType, setModalType] = useState(null);

  const closeModal = () => setModalType(null);

  return (
    <div className="survey-container">
      <Card className="survey-card center">
        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/home/setting/survey")}
            >
              กลับ
            </Button>
        </div>

        <h2 className="title">เลือกรูปแบบการกรอกแบบสอบถาม</h2>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Button type="primary" block onClick={() => setModalType("general")}>
            บุคคลทั่วไป
          </Button>
          <Button type="primary" block onClick={() => setModalType("student")}>
            นักศึกษา
          </Button>
        </Space>

        {/* แยกตามประเภท */}
        <Modal
          open={modalType === "general"}
          onCancel={closeModal}
          footer={null}
          width={900}
          title="เพิ่มแบบสอบถามบุคคลทั่วไป"
          destroyOnClose={true}
        >
          <GeneralSurveyForm onSuccess={closeModal} />
        </Modal>

        <Modal
          open={modalType === "student"}
          onCancel={closeModal}
          footer={null}
          width={900}
          title="เพิ่มแบบสอบถามนักศึกษา"
          destroyOnClose={true}
        >
          <StudentSurveyForm onSuccess={closeModal} />
        </Modal>
      </Card>
    </div>
  );
}