import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Upload, message, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../style/styleWorks/TeacherWorkForm.css"; 

const API_URL = "http://localhost:8081/api"; 

export default function TeacherWorkForm() {
  const [form] = Form.useForm();
  const [teacherList, setTeacherList] = useState([]);
  const [workIdPreview, setWorkIdPreview] = useState("");
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const requiredMessage = (field) => `กรุณากรอก${field}`;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(`${API_URL}/teachers`);
        setTeacherList(
          response.data.map((t) => ({
            label: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`,
            value: t.id,
            code: t.teacher_code 
          }))
        );
      } catch (error) {
        console.error("Error fetching teachers:", error);
        message.error("ไม่สามารถโหลดรายชื่ออาจารย์ได้");
      }
    };
    fetchTeachers();
  }, []);

  const handleTeacherChange = async (teacherId) => {
    const selectedTeacher = teacherList.find((t) => t.value === teacherId);
    if (!selectedTeacher || !selectedTeacher.code) return;

    setWorkIdPreview("กำลังสร้างรหัส...");

    try {
      const response = await axios.get(`${API_URL}/teacher-works/next-id/${selectedTeacher.code}`);
      const nextId = response.data.nextId;
      
      setWorkIdPreview(nextId);
      form.setFieldsValue({ id: nextId });
    } catch (error) {
      console.error("Error fetching next ID:", error);
      message.error("ไม่สามารถดึงรหัสผลงานได้");
      setWorkIdPreview("");
    }
  };

  const handleSubmit = async (values) => {
    const teacher = teacherList.find((t) => t.value === values.teacherId);
    if (!teacher) return message.error("กรุณาเลือกอาจารย์");

    const formData = new FormData();
    formData.append("workCode", values.id);
    formData.append("teacherId", values.teacherId);
    formData.append("workName", values.workName);
    formData.append("organization", values.organization || "");
    formData.append("location", values.location || "");
    formData.append("academicYear", values.year);
    formData.append("date", values.date.format("YYYY-MM-DD"));
    formData.append("description", values.workDetail);

    if (fileList.length > 0) {
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj);
        }
      });
    }

    try {
      await axios.post(`${API_URL}/teacher-works`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("บันทึกผลงานและไฟล์แนบเรียบร้อยแล้ว");
      navigate("/home/setting/work");
    } catch (error) {
      console.error("Submit error:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={handleSubmit}>
      <div className="form-grid">
        <Form.Item label="ID" name="id">
          <Input 
            value={workIdPreview} 
            disabled 
            placeholder="เลือกรหัสอาจารย์เพื่อสร้าง ID อัตโนมัติ" 
            className="full-width" 
          />
        </Form.Item>
        
        <Form.Item label="ปีการศึกษา" name="year" rules={[{ required: true, message: requiredMessage("ปีการศึกษา") }]}>
          <Input className="full-width" />
        </Form.Item>
        
        <Form.Item label="ชื่ออาจารย์" name="teacherId" rules={[{ required: true, message: requiredMessage("ชื่ออาจารย์") }]}>
          <Select 
            options={teacherList} 
            placeholder="เลือกชื่ออาจารย์" 
            onChange={handleTeacherChange} 
            showSearch 
            optionFilterProp="label" 
            className="full-width" 
          />
        </Form.Item>
        
        <Form.Item label="หน่วยงาน/สถานที่" name="organization">
          <Input className="full-width" />
        </Form.Item>
        
        <Form.Item label="สถานที่" name="location">
          <Input className="full-width" />
        </Form.Item>
        
        <Form.Item label="วัน/เดือน/ปี" name="date" rules={[{ required: true, message: requiredMessage("วัน/เดือน/ปี") }]}>
          <DatePicker format="DD/MM/YYYY" className="full-width" />
        </Form.Item>
        
        <Form.Item label="ชื่อผลงาน" name="workName" rules={[{ required: true, message: requiredMessage("ชื่อผลงาน") }]} className="full-row">
          <Input className="full-width" />
        </Form.Item>
        
        <Form.Item label="รายละเอียดผลงาน" name="workDetail" rules={[{ required: true, message: requiredMessage("รายละเอียดผลงาน") }]} className="full-row">
          <Input.TextArea rows={4} className="full-width" />
        </Form.Item>
        
        <Form.Item label="ไฟล์เอกสาร (เพิ่มได้หลายไฟล์)" className="full-row">
          <Upload 
            beforeUpload={() => false}
            fileList={fileList} 
            onChange={({ fileList }) => setFileList(fileList)}
            multiple 
          >
            <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
          </Upload>
        </Form.Item>
      </div>

      <div className="submit-btn-wrapper">
        <Button type="primary" htmlType="submit" className="submit-btn">
          บันทึกข้อมูล
        </Button>
      </div>
    </Form>
  );
}