import React, { useState, useEffect } from "react";
import {
  Form,
  Card,
  Radio,
  Button,
  message,
  Alert,
  Input,
  Modal,
  Descriptions,
  Spin,
  Select
} from "antd";
import axios from "axios";
import "../../style/stylesurvey/GeneralSurveyFormuser.css";

const API_URL = "http://localhost:8081/api";

export default function GeneralSurveyForm({ surveyId }) {
  const [form] = Form.useForm();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const orgTypeOptions = [
    { value: "อุตสาหกรรม/การผลิต", label: "อุตสาหกรรม/การผลิต" },
    { value: "ธุรกิจ/บริการ", label: "ธุรกิจ/บริการ" },
    { value: "สถาบันการศึกษา", label: "สถาบันการศึกษา" },
    { value: "ธนาคาร/สถาบันการเงิน/สหกรณ์ออมทรัพย์", label: "ธนาคาร/สถาบันการเงิน/สหกรณ์ออมทรัพย์" },
    { value: "โรงพยาบาล/สถานพยาบาล", label: "โรงพยาบาล/สถานพยาบาล" },
    { value: "รัฐวิสาหกิจ", label: "รัฐวิสาหกิจ" },
    { value: "อื่น ๆ", label: "อื่น ๆ" },
  ];

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await axios.get(`${API_URL}/surveys/${surveyId}`);
        setSurvey(res.data);
      } catch (error) {
        message.error("ไม่สามารถโหลดข้อมูลแบบสอบถามได้");
      } finally {
        setLoading(false);
      }
    };
    if (surveyId) fetchSurvey();
  }, [surveyId]);

  if (loading) return <Spin tip="กำลังโหลดแบบสอบถาม..." className="gsf-loading-spin" />;
  if (!survey) return <Alert message="ไม่พบแบบสอบถาม" type="error" showIcon />;

  const now = new Date();
  if (!survey.isActive) return <Alert message="แบบสอบถามยังไม่เปิดให้ใช้งาน" type="warning" showIcon className="gsf-alert-box" />;
  if (survey.startAt && now < new Date(survey.startAt)) return <Alert message="ยังไม่ถึงเวลาเปิดให้ทำแบบสอบถาม" type="info" showIcon className="gsf-alert-box" />;
  if (survey.endAt && now > new Date(survey.endAt)) return <Alert message="แบบสอบถามนี้หมดเขตการรับข้อมูลแล้ว" type="warning" showIcon className="gsf-alert-box" />;

  const handlePreview = (values) => {
    setPreviewData(values);
    setOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitLoading(true);
    try {
      const answersList = Object.entries(previewData.answers).map(([key, value]) => {
          const [topicIdx, questionIdx] = key.split('_');
          const questionObj = survey.mainTopics[topicIdx]?.subTopics[questionIdx];
          
          if (!questionObj || !questionObj.id) {
             throw new Error("ข้อมูลแบบสอบถามไม่ถูกต้อง (ไม่พบ ID คำถาม)");
          }

          return {
            question_id: questionObj.id, 
            score: value
          };
      });

      const payload = {
        surveyId: survey.id,
        respondent: {
          orgType: previewData.orgType, 
          company: previewData.company,
          email: previewData.email,
        },
        suggestion: previewData.suggestion, 
        answers: answersList,
      };

      await axios.post(`${API_URL}/responses/general`, payload);

      message.success("ส่งคำตอบเรียบร้อยแล้ว ขอบคุณที่สละเวลา");
      setOpen(false);
      setPreviewData(null);
      form.resetFields();
      
    } catch (error) {
      message.error(error.message || "เกิดข้อผิดพลาดในการส่งคำตอบ");
    } finally {
      setSubmitLoading(false);
    }
  };

  const academicYearDisplay = survey.academic_year || survey.academicYear;

  return (
    <div className="gsf-container">
      <Form form={form} layout="vertical" onFinish={handlePreview}>
        
        <h2 className="gsf-main-title">{survey.title}</h2>
        {academicYearDisplay && (
           <h4 style={{ textAlign: 'center', marginTop: '-10px', marginBottom: '20px', color: '#555' }}>
             ปีการศึกษา: {academicYearDisplay}
           </h4>
        )}

        <Card title="ข้อมูลผู้ตอบแบบสอบถาม" className="gsf-card" size="small">
          <Form.Item 
            label="ประเภทกิจการขององค์กร" 
            name="orgType" 
            rules={[{ required: true, message: "กรุณาเลือกประเภทกิจการ" }]}
          >
            <Select 
              placeholder="-- กรุณาเลือกประเภทกิจการ --" 
              options={orgTypeOptions} 
            />
          </Form.Item>
          
          <Form.Item 
            label="บริษัท / หน่วยงาน / สถานประกอบการ" 
            name="company" 
            rules={[{ required: true, message: "กรุณากรอกชื่อหน่วยงาน" }]}
          >
            <Input placeholder="ระบุชื่อบริษัทหรือหน่วยงานของท่าน" />
          </Form.Item>
          
          <Form.Item 
            label="อีเมลติดต่อ" 
            name="email" 
            rules={[{ required: true, type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง" }]}
          >
            <Input placeholder="example@email.com" />
          </Form.Item>
        </Card>

        {survey.mainTopics?.map((mt, i) => (
          <Card 
            key={i} 
            title={<span className="gsf-topic-title">{i + 1}. {mt.title}</span>} 
            className="gsf-card" 
            bodyStyle={{ padding: 0 }}
          >
            <div className="gsf-table">
              <div className="gsf-thead">
                <div className="gsf-tr">
                  <div className="gsf-th gsf-col-question">หัวข้อประเมิน</div>
                  <div className="gsf-th-options">
                    {likertOptions.map((opt) => (
                      <div key={opt.value} className="gsf-th-opt">
                        <div className="gsf-opt-val">{opt.value}</div>
                        <div className="gsf-opt-label">{opt.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="gsf-tbody">
                {mt.subTopics?.map((st, j) => (
                  <div key={j} className={`gsf-tr ${j % 2 === 0 ? 'gsf-row-even' : 'gsf-row-odd'}`}>
                    <div className="gsf-td gsf-col-question">
                      <span style={{ marginRight: '8px' }}>{st.title}</span>
                    </div>
                    <div className="gsf-td gsf-col-options">
                      <Form.Item
                        name={["answers", `${i}_${j}`]}
                        rules={[{ required: true, message: "กรุณาเลือกคำตอบ" }]}
                        className="gsf-form-item-no-margin"
                      >
                        <Radio.Group className="gsf-radio-group">
                          {likertOptions.map((opt) => (
                            <div 
                              key={opt.value} 
                              className={`gsf-radio-cell ${opt.value < 5 ? 'gsf-border-right' : ''}`}
                            >
                              <Radio value={opt.value}>
                                <span className="gsf-mobile-radio-label">
                                  {opt.value} - {opt.label}
                                </span>
                              </Radio>
                            </div>
                          ))}
                        </Radio.Group>
                      </Form.Item>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}

        <Card title="ข้อเสนอแนะอื่นๆ (ถ้ามี)" className="gsf-card" size="small">
          <Form.Item name="suggestion" className="gsf-form-item-no-margin">
            <Input.TextArea 
              placeholder="ระบุข้อเสนอแนะ หรือความคิดเห็นเพิ่มเติมของท่าน" 
              autoSize={{ minRows: 4, maxRows: 10 }} 
            />
          </Form.Item>
        </Card>

        <div className="gsf-submit-container">
          <Button type="primary" htmlType="submit" size="large" className="gsf-submit-btn">
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
        {previewData && (
          <div style={{ marginTop: 10 }}>
            <Descriptions bordered size="small" column={1} labelStyle={{ width: '150px', fontWeight: 'bold' }}>
              <Descriptions.Item label="ประเภทกิจการ">{previewData.orgType}</Descriptions.Item>
              <Descriptions.Item label="บริษัท/หน่วยงาน">{previewData.company}</Descriptions.Item>
              <Descriptions.Item label="อีเมลติดต่อ">{previewData.email}</Descriptions.Item>
              {previewData.suggestion && (
                <Descriptions.Item label="ข้อเสนอแนะ">{previewData.suggestion}</Descriptions.Item>
              )}
            </Descriptions>
            
            <Alert 
              message="คำเตือน"
              description="เมื่อกดยืนยันแล้ว ท่านจะไม่สามารถกลับมาแก้ไขข้อมูลได้อีกครั้ง"
              type="warning" 
              showIcon 
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}