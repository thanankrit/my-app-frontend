import React, { useState, useEffect } from "react";
import { Card, Form, Input, Select, Button, message, Upload, DatePicker } from "antd";
import { useNavigate } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import "../../style/styleaddintern/InternshipPages.css";

const { Option } = Select;

export default function InternshipCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [studentsList, setStudentsList] = useState([]); 
  const [type, setType] = useState("domestic");
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8081/api/students/dropdown")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map(s => {
          const prefix = (s.prefix_th || "").trim();
          const fName = (s.first_name_th || "").trim();
          const lName = (s.last_name_th || "").trim();
          const fullName = (fName || lName) ? `${prefix}${fName} ${lName}`.trim() : null;
          return { ...s, fullName };
        });
        setStudentsList(formatted);
      })
      .catch((err) => message.error("ไม่สามารถดึงข้อมูลนักศึกษาได้"));
  }, []);

  const handleStudentCodeChange = (value) => {
    const student = studentsList.find((s) => s.student_id === value);
    setStudentInfo(student || null);
    form.resetFields(["placeName", "country", "city", "institution", "startDate", "endDate", "file"]);
  };

  const handleTypeChange = (value) => {
    setType(value);
    form.setFieldsValue({ type: value });

    if (value === "domestic") {
      form.setFieldsValue({ country: undefined, city: undefined, institution: undefined });
    } else {
      form.setFieldsValue({ placeName: undefined });
    }
  };

  const handleSave = async (values) => {
    if (!studentInfo) {
      message.error("กรุณาเลือกนักศึกษา");
      return;
    }

    const formData = new FormData();
    formData.append("studentId", studentInfo.student_id);
    formData.append("type", type);
    
    const place = type === "domestic" ? values.placeName : `${values.country} - ${values.city} - ${values.institution}`;
    formData.append("placeName", place);
    
    if (type === "international") {
      formData.append("country", values.country);
      formData.append("city", values.city);
      formData.append("institution", values.institution);
    }

    formData.append("startDate", values.startDate ? values.startDate.format("YYYY-MM-DD") : "");
    formData.append("endDate", values.endDate ? values.endDate.format("YYYY-MM-DD") : "");

    if (values.file?.fileList?.[0]?.originFileObj) {
      formData.append("file", values.file.fileList[0].originFileObj);
    }

    try {
      const response = await fetch("http://localhost:8081/api/internships", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        message.success("เพิ่มข้อมูลนักศึกษาฝึกงานสำเร็จ");
        navigate("/home/setting/internstudent");
      } else {
        message.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="internship-create-container">
      <Card title="เพิ่มนักศึกษาฝึกงาน" className="card-title">
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ type: "domestic" }}>
          <Form.Item label="รหัสนักศึกษา" name="studentCode" rules={[{ required: true, message: "กรุณาเลือกนักศึกษา" }]}>
            <Select
              showSearch
              placeholder="พิมพ์รหัสนักศึกษา หรือ ชื่อ"
              onChange={handleStudentCodeChange}
              optionFilterProp="children"
              filterOption={(input, option) => 
                String(option.children).toLowerCase().includes(input.toLowerCase())
              }
            >
              {studentsList.map((s) => (
                <Option key={s.student_id} value={s.student_id}>
                  {s.student_id} - {s.fullName || "(ไม่พบข้อมูลชื่อ)"}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {studentInfo && (
            <div className="student-info" style={{ marginBottom: '20px', padding: '10px', background: '#f0f2f5', borderRadius: '4px' }}>
              <p style={{ margin: 0 }}>
                <b>ชื่อ-สกุล:</b> {studentInfo.fullName || <span style={{color: 'red'}}>ไม่พบข้อมูลชื่อในระบบ</span>}
              </p>
            </div>
          )}

          <Form.Item label="ประเภทฝึกงาน" name="type" rules={[{ required: true, message: "กรุณาเลือกประเภทฝึกงาน" }]}>
            <Select onChange={handleTypeChange}>
              <Option value="domestic">ภายในประเทศ</Option>
              <Option value="international">ต่างประเทศ</Option>
            </Select>
          </Form.Item>
          
          {type === "domestic" && (
            <Form.Item label="สถานที่ฝึกงาน" name="placeName" rules={[{ required: true, message: "กรุณากรอกสถานที่ฝึกงาน" }]}>
              <Input placeholder="กรอกชื่อสถานที่ฝึกงาน" />
            </Form.Item>
          )}

          {type === "international" && (
            <>
              <Form.Item label="ประเทศ" name="country" rules={[{ required: true, message: "กรุณากรอกประเทศ" }]}>
                <Input placeholder="กรอกประเทศ" />
              </Form.Item>
              <Form.Item label="เมือง" name="city" rules={[{ required: true, message: "กรุณากรอกเมือง" }]}>
                <Input placeholder="กรอกเมือง" />
              </Form.Item>
              <Form.Item label="สถาบัน/บริษัท" name="institution" rules={[{ required: true, message: "กรุณากรอกสถาบัน/บริษัท" }]}>
                <Input placeholder="กรอกสถาบัน/บริษัท" />
              </Form.Item>
            </>
          )}

          <Form.Item label="วันที่เริ่ม" name="startDate" rules={[{ required: true, message: "กรุณาเลือกวันที่เริ่ม" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="วันที่สิ้นสุด" name="endDate" rules={[{ required: true, message: "กรุณาเลือกวันที่สิ้นสุด" }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="แนบไฟล์" name="file">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />} style={{ width: "100%" }}>อัปโหลดไฟล์</Button>
            </Upload>
          </Form.Item>

          <div className="form-buttons">
            <Button type="primary" htmlType="submit">บันทึก</Button>
            <Button onClick={() => { form.resetFields(); navigate("/home/setting/internstudent"); }}>ยกเลิก</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}