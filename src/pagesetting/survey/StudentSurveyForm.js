import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Checkbox, message, DatePicker, Switch } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import "../../style/stylesurvey/StudentSurveyForm.css";

const API_URL = "http://localhost:8081/api"; 

export default function StudentSurveyForm({ onSuccess }) {
  const [form] = Form.useForm();
  const [studentYears, setStudentYears] = useState([]);
  const [loading, setLoading] = useState(false);

    useEffect(() => {
    const fetchExistingStudentYears = async () => {
        try {
            const res = await axios.get(`${API_URL}/students`);
            const years = res.data.map(s => String(s.student_id).substring(0, 2));
            const uniqueYears = [...new Set(years)].sort();
    
            setStudentYears(uniqueYears); 
    } catch (error) {
            console.error("ไม่สามารถดึงข้อมูลชั้นปีของนักศึกษาได้:", error);
            message.error("ไม่สามารถโหลดข้อมูลชั้นปีจากระบบได้");
      }
    };

    fetchExistingStudentYears();
    }, []);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const time = String(now.getHours()) + String(now.getMinutes()) + String(now.getSeconds());
        const uniqueCode = `S${y}${m}${d}-${time}`;

        const payload = {
            code: uniqueCode, 
            title: values.title,
            academicYear: values.academicYear, 
            targetGroup: 'student',
            isActive: values.isActive ? 1 : 0,
            startAt: values.startAt ? values.startAt.format("YYYY-MM-DD HH:mm:ss") : null,
            endAt: values.endAt ? values.endAt.format("YYYY-MM-DD HH:mm:ss") : null,
            allowedYears: values.allowedUsers || [],
            mainTopics: values.mainTopics 
        };

        await axios.post(`${API_URL}/surveys`, payload);
        message.success(`บันทึกแบบสอบถามเรียบร้อย! (รหัส: ${uniqueCode})`);
        
        form.resetFields();
        form.setFieldsValue({ 
          isActive: true,
          mainTopics: [{ title: "", subTopics: [{ title: "" }] }] 
        });
        
        if (onSuccess) onSuccess();
    } catch (error) {
        console.error(error);
        const errorMsg = error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก";
        message.error(errorMsg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} className="ssf-form-container">
      <div className="ssf-warning-text">
        * ระบบจะสร้างรหัสแบบสอบถามนักศึกษาให้อัตโนมัติเมื่อกดบันทึก
      </div>

      <Form.Item label="ชื่อแบบสอบถาม" name="title" rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}>
        <Input.TextArea autoSize={{ minRows: 2 }} placeholder="ชื่อแบบสอบถาม..." />
      </Form.Item>

      <Form.Item label="ปีการศึกษา" name="academicYear" rules={[{ required: true, message: "กรุณากรอกปีการศึกษา (เช่น 2566)" }]}>
        <Input placeholder="เช่น 2566" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="เปิดใช้งาน" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>

      <div className="ssf-date-group">
        <Form.Item label="เวลาเริ่ม" name="startAt" className="ssf-date-item">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="ssf-date-picker" />
        </Form.Item>
        <Form.Item label="เวลาสิ้นสุด" name="endAt" className="ssf-date-item">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="ssf-date-picker" />
        </Form.Item>
      </div>

      <Form.List name="mainTopics">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card key={key} type="inner" className="ssf-main-topic-card">
                <div className="ssf-topic-header">
                    <h4 className="ssf-topic-title">หัวข้อหลักที่ {index + 1}</h4>
                    {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(name)} className="ssf-delete-main-icon" />
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
                    <div className="ssf-subtopics-wrapper">
                      {subFields.map(({ key: subKey, name: subName, ...subRestField }, subIndex) => (
                        <div key={subKey} className="ssf-subtopic-row">
                           <Form.Item
                            {...subRestField}
                            name={[subName, 'title']}
                            rules={[{ required: true, message: 'กรุณากรอกหัวข้อย่อย' }]}
                            className="ssf-subtopic-item"
                          >
                            <Input placeholder={`หัวข้อย่อย ${index + 1}.${subIndex + 1}`} />
                          </Form.Item>
                          {subFields.length > 1 && (
                             <MinusCircleOutlined onClick={() => removeSub(subName)} className="ssf-delete-sub-icon" />
                          )}
                        </div>
                      ))}
                      <Button type="dashed" onClick={() => addSub()} block icon={<PlusOutlined />} className="ssf-add-subtopic-btn">
                        เพิ่มหัวข้อย่อย
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Card>
            ))}
            
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="ssf-add-maintopic-btn">
              เพิ่มหัวข้อหลัก
            </Button>
          </>
        )}
      </Form.List>

      <Form.Item 
        label="เลือกชั้นปีที่มีสิทธิ์ (รหัสนักศึกษาสองตัวแรก)" 
        name="allowedUsers"
        rules={[{ required: true, message: "กรุณาเลือกอย่างน้อย 1 ชั้นปี" }]}
      >
        <Checkbox.Group options={studentYears} className="ssf-checkbox-group" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} size="large">
          บันทึกข้อมูล
        </Button>
      </Form.Item>
    </Form>
  );
}