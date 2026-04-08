import React, { useState, useEffect } from "react";
import {
  Form,
  Card,
  Radio,
  Button,
  message,
  Alert,
  Spin,
  Modal,
  Descriptions,
} from "antd";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "../../style/stylesurvey/StudentSurveyFormuser.css";

const API_URL = "http://localhost:8081/api";

export default function StudentSurveyForm({ surveyId }) {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [open, setOpen] = useState(false);
  
  const likertOptions = [
    { value: 1, label: "น้อยมาก" },
    { value: 2, label: "น้อย" },
    { value: 3, label: "ปานกลาง" },
    { value: 4, label: "มาก" },
    { value: 5, label: "มากที่สุด" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const surveyRes = await axios.get(`${API_URL}/surveys/${surveyId}`);
        setSurvey(surveyRes.data);

        if (user?.username) {
          const checkRes = await axios.get(`${API_URL}/surveys/${surveyId}/check-submit/${user.username}`);
          if (checkRes.data.submitted) {
            setHasSubmitted(true);
          }
        }
      } catch (error) {
        message.error("ไม่สามารถโหลดข้อมูลแบบสอบถามได้");
      } finally {
        setLoading(false);
      }
    };

    if (user && surveyId) fetchData();
  }, [surveyId, user]);

  if (!user || user.role !== "student") {
    return <Alert message="กรุณาเข้าสู่ระบบนักศึกษาก่อนทำแบบสอบถาม" type="warning" showIcon className="ssf-alert-box" />;
  }

  if (loading) return <Spin tip="กำลังโหลด..." className="ssf-loading-spin" />;
  if (!survey) return <Alert message="ไม่พบแบบสอบถาม" type="error" showIcon className="ssf-alert-box" />;
  
  const allowedYears = survey.allowedYears || survey.allowed_years || []; 
  const matchDigits = user?.username ? String(user.username).match(/\d{2}/) : null;
  const studentPrefix = matchDigits ? matchDigits[0] : "";

  if (allowedYears.length > 0 && !allowedYears.includes(studentPrefix)) {
    return (
      <div className="ssf-container">
        <Alert
          message="คุณไม่มีสิทธิ์ทำแบบสอบถามนี้"
          description={`แบบสอบถามนี้เปิดให้เฉพาะนักศึกษาชั้นปีที่กำหนดเท่านั้น (รหัสชั้นปี: ${allowedYears.join(', ')})`}
          type="error"
          showIcon
        />
        <Button style={{ marginTop: 16 }} onClick={() => window.history.back()}>
          กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="ssf-container">
        <Alert
          message="คุณได้ตอบแบบสอบถามนี้ไปแล้ว"
          description="ระบบบันทึกข้อมูลเรียบร้อยแล้ว ไม่สามารถตอบซ้ำได้"
          type="success"
          showIcon
        />
        <Button style={{ marginTop: 16 }} onClick={() => window.history.back()}>กลับหน้าหลัก</Button>
      </div>
    );
  }

  const handlePreview = (values) => {
    setPreviewData(values);
    setOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitLoading(true);
    try {
      const payload = {
        surveyId: survey.id,
        studentCode: user.username,
        answers: Object.entries(previewData.answers).map(([key, value]) => {
          const [topicIdx, subIdx] = key.split('_'); 
          const topic = survey.mainTopics[topicIdx];
          const questions = topic.subTopics || topic.questions || topic.sub_topics || [];
          const question = questions[subIdx];

          if (!question) {
             return null;
          }

          return {
            question_id: question.id, 
            score: value
          };
        }).filter(item => item !== null), 
      };

      await axios.post(`${API_URL}/responses/student`, payload);

      message.success("ส่งคำตอบเรียบร้อยแล้ว");
      setOpen(false);
      setHasSubmitted(true); 

    } catch (error) {
      const msg = error.response?.data?.message || "เกิดข้อผิดพลาดในการส่งคำตอบ";
      message.error(msg);
      
      if (msg.includes("ทำแบบสอบถามนี้ไปแล้ว")) {
          setOpen(false);
          setHasSubmitted(true); 
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="ssf-main-wrapper">
      <Form form={form} layout="vertical" onFinish={handlePreview} scrollToFirstError>
        
        <div className="ssf-student-info">
         <div className="ssf-info-text">
            ผู้ตอบแบบสอบถาม: <strong className="ssf-info-strong">
              {user.firstname} {user.lastname}
            </strong>
          </div>
          <div className="ssf-info-subtext">
            รหัสนักศึกษา: <strong>{user.username}</strong>
          </div>
        </div>

        {survey.mainTopics?.map((mt, i) => {
          const mainNumber = i + 1; 
          return (
            <Card 
              key={i} 
              title={<span className="ssf-topic-title">{mainNumber}. {mt.title}</span>} 
              className="ssf-card" 
              bodyStyle={{ padding: 0 }}
            >
              <div className="ssf-table">
                <div className="ssf-thead">
                  <div className="ssf-tr">
                    <div className="ssf-th ssf-col-question">ข้อรายการประเมิน</div>
                    <div className="ssf-th-options">
                      {likertOptions.map((opt) => (
                        <div key={opt.value} className="ssf-th-opt">
                          <div className="ssf-opt-val">{opt.value}</div>
                          <div className="ssf-opt-label">{opt.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ssf-tbody">
                  {mt.subTopics?.map((st, j) => {
                    const subNumber = j + 1; 
                    return (
                      <div key={j} className={`ssf-tr ${j % 2 === 0 ? 'ssf-row-even' : 'ssf-row-odd'}`}>
                        <div className="ssf-td ssf-col-question">
                          <strong style={{ marginRight: '8px' }}>{mainNumber}.{subNumber}</strong> 
                          <span>{st.title}</span>
                        </div>
                        <div className="ssf-td ssf-col-options">
                          <Form.Item
                            name={["answers", `${i}_${j}`]}
                            rules={[{ required: true, message: "กรุณาเลือกคำตอบ" }]}
                            className="ssf-form-item-no-margin"
                          >
                            <Radio.Group className="ssf-radio-group">
                              {likertOptions.map((opt) => (
                                <div 
                                  key={opt.value} 
                                  className={`ssf-radio-cell ${opt.value < 5 ? 'ssf-border-right' : ''}`}
                                >
                                  <Radio value={opt.value} className="ssf-radio-btn">
                                    <span className="ssf-mobile-radio-label">
                                      {opt.value} - {opt.label}
                                    </span>
                                  </Radio>
                                </div>
                              ))}
                            </Radio.Group>
                          </Form.Item>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
        <div className="ssf-submit-container">
          <Button type="primary" htmlType="submit" size="large" className="ssf-submit-btn">
            ตรวจสอบคำตอบก่อนส่ง
          </Button>
        </div>
      </Form>

      <Modal
        open={open}
        title="ตรวจสอบความถูกต้องอีกครั้ง"
        onOk={handleConfirmSubmit}
        onCancel={() => setOpen(false)}
        okText="ยืนยันและส่งคำตอบ"
        cancelText="กลับไปแก้ไข"
        confirmLoading={submitLoading}
        width={600}
      >
        <div style={{ marginTop: 10 }}>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ชื่อ-นามสกุล">{user.firstname || user.first_name || user.name} {user.lastname || user.last_name}</Descriptions.Item>
            <Descriptions.Item label="รหัสนักศึกษา">{user.username}</Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    </div>
  );
}