import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, DatePicker, Switch, message, Space, Spin, Checkbox } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../style/stylesurvey/EditSurveyPage.css";

const API_URL = "http://localhost:8081/api";

export default function EditSurveyPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [studentYears, setStudentYears] = useState([]);
  const [targetGroup, setTargetGroup] = useState("");
  
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

  useEffect(() => {
    const fetchSurveyDetail = async () => {
      try {
        const res = await axios.get(`${API_URL}/surveys/${id}`);
        const data = res.data;
        const fetchedTargetGroup = data.target_group || data.targetGroup;
        setTargetGroup(fetchedTargetGroup);

        const initialValues = {
            ...data,
            academicYear: data.academic_year || data.academicYear, 
            allowedUsers: data.allowedYears || [], 
            startAt: data.startAt ? dayjs(data.startAt) : null,
            endAt: data.endAt ? dayjs(data.endAt) : null,
            isActive: data.isActive === 1 || data.isActive === true
        };

        form.setFieldsValue(initialValues);
      } catch (error) {
        console.error(error);
        message.error("ไม่สามารถดึงข้อมูลแบบสอบถามได้");
        navigate("/home/setting/survey");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchSurveyDetail();
  }, [id, form, navigate]);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        academicYear: values.academicYear,
        isActive: values.isActive ? 1 : 0,
        startAt: values.startAt ? values.startAt.format("YYYY-MM-DD HH:mm:ss") : null,
        endAt: values.endAt ? values.endAt.format("YYYY-MM-DD HH:mm:ss") : null,
        allowedYears: targetGroup === 'student' ? (values.allowedUsers || []) : [], 
        mainTopics: values.mainTopics 
      };

      await axios.put(`${API_URL}/surveys/${id}`, payload);

      message.success("แก้ไขแบบสอบถามเรียบร้อย");
      navigate("/home/setting/survey");
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return <div className="loading-container"><Spin size="large" /></div>;
  }

  return (
    <div className="edit-survey-wrapper">
      <Card title="แก้ไขแบบสอบถาม" className="edit-survey-card">
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="รหัสแบบสอบถาม" name="code">
            <Input disabled />
          </Form.Item>

          <Form.Item
            label="ชื่อแบบสอบถาม"
            name="title"
            rules={[{ required: true, message: "กรุณากรอกชื่อแบบสอบถาม" }]}
          >
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>

          <Form.Item 
            label="ปีการศึกษา" 
            name="academicYear" 
            rules={[{ required: true, message: "กรุณากรอกปีการศึกษา" }]}
          >
            <Input placeholder="เช่น 2566" />
          </Form.Item>

          <Form.Item label="เปิดใช้งาน" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="date-group-container">
              <Form.Item label="เวลาเริ่ม" name="startAt" className="date-input-item">
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item label="เวลาสิ้นสุด" name="endAt" className="date-input-item">
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
              </Form.Item>
          </div>

          <Form.List name="mainTopics">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card key={key} type="inner" className="main-topic-card">
                  <div className="topic-header">
                      <h4>หัวข้อหลักที่ {index + 1}</h4>
                      {fields.length > 1 && (
                          <MinusCircleOutlined onClick={() => remove(name)} className="delete-icon" />
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
                      <div className="subtopic-container">
                        {subFields.map(({ key: subKey, name: subName, ...subRestField }, subIndex) => (
                          <div key={subKey} className="subtopic-row">
                             <Form.Item
                              {...subRestField}
                              name={[subName, 'title']}
                              rules={[{ required: true, message: 'กรุณากรอกหัวข้อย่อย' }]}
                              className="subtopic-input"
                            >
                              <Input placeholder={`หัวข้อย่อย ${index + 1}.${subIndex + 1}`} />
                            </Form.Item>
                            {subFields.length > 1 && (
                               <MinusCircleOutlined onClick={() => removeSub(subName)} className="delete-sub-icon" />
                            )}
                          </div>
                        ))}
                        <Button type="dashed" onClick={() => addSub()} block icon={<PlusOutlined />} className="add-subtopic-btn">
                          เพิ่มหัวข้อย่อย
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </Card>
              ))}
              
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="add-maintopic-btn">
                เพิ่มหัวข้อหลัก
              </Button>
            </>
          )}
        </Form.List>

          {/* ซ่อนส่วนเลือกชั้นปีหากกลุ่มเป้าหมายไม่ใช่ 'student' */}
          {targetGroup === 'student' && (
            <Form.Item 
              label="เลือกชั้นปีที่มีสิทธิ์ (รหัสนักศึกษาสองตัวแรก)" 
              name="allowedUsers"
              rules={[{ required: true, message: "กรุณาเลือกอย่างน้อย 1 ชั้นปี" }]}
              style={{ marginTop: '20px' }}
            >
              <Checkbox.Group options={studentYears} className="ssf-checkbox-group" />
            </Form.Item>
          )}

          <Form.Item className="form-action-footer">
            <Space className="action-space">
              <Button type="primary" htmlType="submit" loading={loading} block className="save-btn">
                บันทึกการแก้ไข
              </Button>
              <Button onClick={() => navigate(-1)} block>ยกเลิก</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}