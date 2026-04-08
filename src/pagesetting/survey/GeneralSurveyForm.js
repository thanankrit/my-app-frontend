import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, DatePicker, message, Switch } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import "../../style/stylesurvey/GeneralSurveyForm.css"; 

const API_URL = "http://localhost:8081/api"; 

export default function GeneralSurveyForm({ onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
        isActive: true,
        mainTopics: [{ title: "", subTopics: [{ title: "" }] }] 
    });
  }, [form]);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const time = String(now.getHours()) + String(now.getMinutes()) + String(now.getSeconds());
        const uniqueCode = `G${y}${m}${d}-${time}`;

        const payload = {
            code: uniqueCode, 
            title: values.title,
            academicYear: values.academicYear, 
            targetGroup: 'general',
            isActive: values.isActive ? 1 : 0,
            startAt: values.startAt ? values.startAt.format("YYYY-MM-DD HH:mm:ss") : null,
            endAt: values.endAt ? values.endAt.format("YYYY-MM-DD HH:mm:ss") : null,
            allowedYears: [],
            mainTopics: values.mainTopics
        };

        await axios.post(`${API_URL}/surveys`, payload);
        message.success(`บันทึกเรียบร้อย! รหัสอ้างอิง: ${uniqueCode}`);
        form.resetFields();
        form.setFieldsValue({ 
            mainTopics: [{ title: "", subTopics: [{ title: "" }] }] 
        });
        
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error(error);
        const errorMsg = error.response?.data?.message || "บันทึกไม่สำเร็จ";
        message.error(errorMsg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} className="gsf-form-container">
      <div className="gsf-warning-text">
        * ระบบจะสร้างรหัสแบบสอบถามให้อัตโนมัติเมื่อบันทึก
      </div>

      <Form.Item label="ชื่อแบบสอบถาม" name="title" rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}>
        <Input.TextArea autoSize={{ minRows: 2 }} placeholder="เช่น แบบประเมินความพึงพอใจ..." />
      </Form.Item>

      {/* เพิ่มช่องกรอกปีการศึกษา */}
      <Form.Item label="ปีการศึกษา" name="academicYear" rules={[{ required: true, message: "กรุณากรอกปีการศึกษา" }]}>
        <Input placeholder="เช่น 2567" />
      </Form.Item>

      <Form.Item label="เปิดใช้งาน" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>

      <div className="gsf-date-group">
        <Form.Item label="เวลาเริ่ม" name="startAt" className="gsf-date-item">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="gsf-date-picker" />
        </Form.Item>
        <Form.Item label="เวลาสิ้นสุด" name="endAt" className="gsf-date-item">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="gsf-date-picker" />
        </Form.Item>
      </div>

      <Form.List name="mainTopics">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card key={key} type="inner" className="gsf-main-topic-card">
                 <div className="gsf-topic-header">
                    <h4 className="gsf-topic-title">หัวข้อหลักที่ {index + 1}</h4>
                    {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(name)} className="gsf-delete-main-icon" />
                    )}
                </div>

                <Form.Item
                  {...restField}
                  name={[name, 'title']}
                  rules={[{ required: true, message: 'กรุณากรอกหัวข้อหลัก' }]}
                >
                  <Input placeholder="ชื่อหัวข้อหลัก" />
                </Form.Item>

                <Form.List name={[name, 'subTopics']}>
                  {(subFields, { add: addSub, remove: removeSub }) => (
                    <div className="gsf-subtopics-wrapper">
                      {subFields.map(({ key: subKey, name: subName, ...subRestField }, subIndex) => (
                        <div key={subKey} className="gsf-subtopic-row">
                           <Form.Item
                            {...subRestField}
                            name={[subName, 'title']}
                            rules={[{ required: true, message: 'กรุณากรอกหัวข้อย่อย' }]}
                            className="gsf-subtopic-item"
                          >
                            <Input placeholder={`หัวข้อย่อย ${index + 1}.${subIndex + 1}`} />
                          </Form.Item>
                          {subFields.length > 1 && (
                             <MinusCircleOutlined onClick={() => removeSub(subName)} className="gsf-delete-sub-icon" />
                          )}
                        </div>
                      ))}
                        <Button type="dashed" onClick={() => addSub()} block icon={<PlusOutlined />} className="gsf-add-subtopic-btn">
                        เพิ่มหัวข้อย่อย
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Card>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="gsf-add-maintopic-btn">
              เพิ่มหัวข้อหลัก
            </Button>
          </>
        )}
      </Form.List>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} size="large">
          บันทึกแบบสอบถาม
        </Button>
      </Form.Item>
    </Form>
  );
}