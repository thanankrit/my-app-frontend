import React, { useState, useEffect } from "react";
import { Card, Form, Input, Select, Button, message, Upload, DatePicker } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs"; 
import "../../style/styleaddintern/InternshipPages.css"; 

const { Option } = Select;

export default function InternshipEditPage() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [form] = Form.useForm();
  
  const [studentsList, setStudentsList] = useState([]); 
  const [type, setType] = useState("domestic");
  const [studentInfo, setStudentInfo] = useState(null);
  const [oldFile, setOldFile] = useState(null); 

  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:8081/api/students/dropdown");
      const data = await res.json();
      const formatted = data.map(s => {
        const prefix = (s.prefix_th || "").trim();
        const fName = (s.first_name_th || "").trim();
        const lName = (s.last_name_th || "").trim();
        const fullName = (fName || lName) ? `${prefix}${fName} ${lName}`.trim() : null;
        return { ...s, fullName };
      });
      
      setStudentsList(formatted);
      return formatted;
    } catch (err) {
      message.error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
      return [];
    }
  };

  const fetchInternshipData = async (students) => {
    try {
      const res = await fetch(`http://localhost:8081/api/internships/${id}`);
      if (res.ok) {
        const data = await res.json();
        const student = students.find((s) => s.student_id === data.student_id);
        setStudentInfo(student || null);
        setType(data.internship_type);
        setOldFile(data.file_name);

        form.setFieldsValue({
          studentCode: data.student_id,
          type: data.internship_type,
          placeName: data.internship_type === "domestic" ? data.place_name : undefined,
          country: data.country,
          city: data.city,
          institution: data.institution,
          startDate: data.start_date ? dayjs(data.start_date) : null,
          endDate: data.end_date ? dayjs(data.end_date) : null,
        });
      }
    } catch (err) {
      message.error("ไม่สามารถดึงข้อมูลเดิมได้");
    }
  };

  useEffect(() => {
    fetchStudents().then((students) => {
      if (id) fetchInternshipData(students);
    });
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStudentCodeChange = (value) => {
    const student = studentsList.find((s) => s.student_id === value);
    setStudentInfo(student || null);
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
      const response = await fetch(`http://localhost:8081/api/internships/${id}`, {
        method: "PUT",
        body: formData, 
      });

      if (response.ok) {
        message.success("อัปเดตข้อมูลสำเร็จ");
        navigate("/home/setting/internstudent");
      } else {
        message.error("เกิดข้อผิดพลาดในการอัปเดต");
      }
    } catch (error) {
      message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="internship-create-container">
      <Card title="แก้ไขข้อมูลนักศึกษาฝึกงาน" className="card-title">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          
          <Form.Item label="รหัสนักศึกษา" name="studentCode" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="พิมพ์รหัสนักศึกษา"
              onChange={handleStudentCodeChange}
              optionFilterProp="children"
              filterOption={(input, option) => 
                String(option.children).toLowerCase().includes(input.toLowerCase())
              }
              disabled 
            >
              {studentsList.map((s) => (
                <Option key={s.student_id} value={s.student_id}>
                  {s.student_id} - {s.fullName || "(ไม่พบข้อมูลชื่อ)"}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {studentInfo && (
            <div className="student-info" style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <p style={{ margin: 0 }}>
                <b>ชื่อ-สกุล:</b> {studentInfo.fullName || <span style={{color: 'red'}}>ไม่พบข้อมูลชื่อในระบบ</span>}
              </p>
            </div>
          )}

          <Form.Item label="ประเภทฝึกงาน" name="type" rules={[{ required: true }]}>
            <Select onChange={handleTypeChange}>
              <Option value="domestic">ภายในประเทศ</Option>
              <Option value="international">ต่างประเทศ</Option>
            </Select>
          </Form.Item>

          {type === "domestic" && (
            <Form.Item label="สถานที่ฝึกงาน" name="placeName" rules={[{ required: true }]}>
              <Input placeholder="กรอกชื่อสถานที่ฝึกงาน" />
            </Form.Item>
          )}

          {type === "international" && (
            <>
              <Form.Item label="ประเทศ" name="country" rules={[{ required: true }]}>
                <Input placeholder="กรอกประเทศ" />
              </Form.Item>
              <Form.Item label="เมือง" name="city" rules={[{ required: true }]}>
                <Input placeholder="กรอกเมือง" />
              </Form.Item>
              <Form.Item label="สถาบัน/บริษัท" name="institution" rules={[{ required: true }]}>
                <Input placeholder="กรอกสถาบัน/บริษัท" />
              </Form.Item>
            </>
          )}

          <Form.Item label="วันที่เริ่ม" name="startDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="วันที่สิ้นสุด" name="endDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="แนบไฟล์ใหม่ (หากต้องการเปลี่ยน)" name="file">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />} style={{ width: "100%" }}>อัปโหลดไฟล์</Button>
            </Upload>
            {oldFile && <div style={{ marginTop: 8, color: '#1890ff' }}>ไฟล์เดิม: {oldFile}</div>}
          </Form.Item>

          <div className="form-buttons">
            <Button type="primary" htmlType="submit">อัปเดตข้อมูล</Button>
            <Button onClick={() => navigate("/home/setting/internstudent")}>ยกเลิก</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}