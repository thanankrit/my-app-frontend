import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Upload, message, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../style/styleWorks/StaffWorkForm.css"; 

const API_URL = "http://localhost:8081/api"; 

export default function StaffWorkForm() {
  const [form] = Form.useForm();
  const [staffList, setStaffList] = useState([]);
  const [workIdPreview, setWorkIdPreview] = useState("");
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const requiredMessage = (field) => `กรุณากรอก${field}`;

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const response = await axios.get(`${API_URL}/staffs`);
        setStaffList(
          response.data.map((s) => ({
            label: `${s.prefix_th || ''}${s.first_name_th} ${s.last_name_th}`,
            value: s.id,
            code: s.staff_code 
          }))
        );
      } catch (error) {
        console.error("Error fetching staffs:", error);
        message.error("ไม่สามารถโหลดรายชื่อเจ้าหน้าที่ได้");
      }
    };
    fetchStaffs();
  }, []);

  const handleStaffChange = async (staffId) => {
    const selectedStaff = staffList.find((s) => s.value === staffId);
    if (!selectedStaff || !selectedStaff.code) return;

    setWorkIdPreview("กำลังสร้างรหัส...");

    try {
      const response = await axios.get(`${API_URL}/staff-works/next-id/${selectedStaff.code}`);
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
    const staff = staffList.find((s) => s.value === values.staffId);
    if (!staff) return message.error("กรุณาเลือกชื่อเจ้าหน้าที่");

    const formData = new FormData();
    formData.append("workCode", values.id);
    formData.append("staffId", values.staffId);
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
      await axios.post(`${API_URL}/staff-works`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("บันทึกผลงานเจ้าหน้าที่และไฟล์แนบเรียบร้อยแล้ว");
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
            placeholder="เลือกรหัสเจ้าหน้าที่เพื่อสร้าง ID อัตโนมัติ" 
            className="full-width"
          />
        </Form.Item>
        
        <Form.Item label="ปีการศึกษา" name="year" rules={[{ required: true, message: requiredMessage("ปีการศึกษา") }]}>
          <Input className="full-width" />
        </Form.Item>
        
        <Form.Item label="ชื่อเจ้าหน้าที่" name="staffId" rules={[{ required: true, message: requiredMessage("ชื่อเจ้าหน้าที่") }]}>
          <Select 
            options={staffList} 
            placeholder="เลือกเจ้าหน้าที่" 
            onChange={handleStaffChange} 
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