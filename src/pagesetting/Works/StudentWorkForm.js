import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Upload, Select, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../style/styleWorks/StudentWorkForm.css"; 

const API_URL = "http://localhost:8081/api"; 

export default function StudentWorkForm() {
  const [form] = Form.useForm();
  const [studentList, setStudentList] = useState([]);
  const [workIdPreview, setWorkIdPreview] = useState("");
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const requiredMessage = (field) => `กรุณากรอก${field}`;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${API_URL}/students`);
        setStudentList(
          response.data.map((s) => ({
            label: `${s.prefix_th || ""}${s.first_name_th || ""} ${s.last_name_th || ""}`,
            value: s.student_id, 
            searchCode: s.student_id 
          }))
        );
      } catch (error) {
        console.error("Error fetching students:", error);
        message.error("ไม่สามารถโหลดรายชื่อนักศึกษาได้");
      }
    };
    fetchStudents();
  }, []);

  const handleStudentChange = async (studentId) => {
    setWorkIdPreview("กำลังสร้างรหัส...");

    try {
      const response = await axios.get(`${API_URL}/student-works/next-id/${studentId}`);
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
    const student = studentList.find((s) => s.value === values.studentId);
    if (!student) return message.error("กรุณาเลือกนักศึกษา");

    const formData = new FormData();
    formData.append("workCode", values.id);
    formData.append("studentId", values.studentId);
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
      await axios.post(`${API_URL}/student-works`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("บันทึกผลงานนักศึกษาสำเร็จ");
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
            placeholder="เลือกรหัสนักศึกษาเพื่อสร้าง ID อัตโนมัติ" 
            className="full-width" 
          />
        </Form.Item>

        <Form.Item
          label="ปีการศึกษา"
          name="year"
          rules={[{ required: true, message: requiredMessage("ปีการศึกษา") }]}
        >
          <Input className="full-width" />
        </Form.Item>

        <Form.Item
          label="ชื่อนักศึกษา"
          name="studentId"
          rules={[{ required: true, message: requiredMessage("ชื่อนักศึกษา") }]}
        >
          <Select
            className="full-width"
            showSearch
            placeholder="เลือกนักศึกษา"
            options={studentList}
            onChange={handleStudentChange}
            filterOption={(input, option) => {
              const label = option.label || "";
              const searchCode = option.searchCode || "";
              return (
                label.toLowerCase().includes(input.toLowerCase()) ||
                searchCode.toLowerCase().includes(input.toLowerCase())
              );
            }}
          />
        </Form.Item>

        <Form.Item label="หน่วยงาน/สถานที่" name="organization">
          <Input className="full-width" />
        </Form.Item>

        <Form.Item label="สถานที่" name="location">
          <Input className="full-width" />
        </Form.Item>

        <Form.Item
          label="วัน/เดือน/ปี"
          name="date"
          rules={[{ required: true, message: requiredMessage("วัน/เดือน/ปี") }]}
        >
          <DatePicker format="DD/MM/YYYY" className="full-width" />
        </Form.Item>

        <Form.Item
          label="ชื่อผลงาน"
          name="workName"
          rules={[{ required: true, message: requiredMessage("ชื่อผลงาน") }]}
          className="full-row"
        >
          <Input className="full-width" />
        </Form.Item>

        <Form.Item
          label="รายละเอียดผลงาน"
          name="workDetail"
          rules={[{ required: true, message: requiredMessage("รายละเอียดผลงาน") }]}
          className="full-row"
        >
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