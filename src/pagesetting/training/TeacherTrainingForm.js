import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import "../../style/styletraining/TeacherTrainingForm.css";

const { RangePicker } = DatePicker;
const { TextArea } = Input; 

const API_URL = "http://localhost:8081/api";

const trainingTypeOptions = [
  { value: "การจัดอบรม/เชิงปฏิบัติการ", label: " การจัดอบรม/เชิงปฏิบัติการ" },
  { value: "การจัดสัมมนา/เชิงปฏิบัติการ", label: "การจัดสัมมนา/เชิงปฏิบัติการ" },
  { value: "การจัดประชุมวิชาการ", label: "การจัดประชุมวิชาการ" },
  { value: "การจัดเสวนา", label: "การจัดเสวนา" },
  { value: "การจัดบรรยาย", label: " การจัดบรรยาย" },
  { value: "การจัดการศึกษาดูงาน", label: " การจัดการศึกษาดูงาน" }
];

export default function TeacherTrainingForm({ onSuccess }) {
  const [form] = Form.useForm();
  const [teacherList, setTeacherList] = useState([]);
  const [trainingIdPreview, setTrainingIdPreview] = useState("");
  const [fileList, setFileList] = useState([]);

  const required = (f) => `กรุณากรอก${f}`;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(`${API_URL}/teachers`);
        const options = response.data.map((t) => ({
          label: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`,
          value: t.id,
          code: t.teacher_code
        }));
        setTeacherList(options);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    };
    fetchTeachers();
  }, []);

  const handleTeacherChange = async (teacherId) => {
    try {
      const response = await axios.get(`${API_URL}/teacher-trainings/next-id/${teacherId}`);
      const nextId = response.data.work_code;
      setTrainingIdPreview(nextId);
      form.setFieldsValue({ id: nextId, teacherId });
    } catch (error) {
      console.error("Error generating ID:", error);
    }
  };

  const onFinish = async (values) => {
    try {
      const formData = new FormData();

      formData.append("teacher_id", values.teacherId);
      formData.append("work_code", values.id);
      formData.append("academic_year", values.year);
      formData.append("training_type", values.trainingType); 
      formData.append("training_name", values.trainingName);
      formData.append("location", values.location);
      formData.append("total_hours", values.hours);
      formData.append("description", values.description || ""); 

      if (values.dateRange && values.dateRange.length === 2) {
        formData.append("start_date", values.dateRange[0].format("YYYY-MM-DD"));
        formData.append("end_date", values.dateRange[1].format("YYYY-MM-DD"));
      }

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj); 
        }
      });

      await axios.post(`${API_URL}/teacher-trainings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("บันทึกข้อมูลสำเร็จ");
      form.resetFields();
      setFileList([]);
      setTrainingIdPreview("");
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Submit Error:", error);
      message.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <div className="teacher-training-form-container">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <div className="form-grid">
          <Form.Item label="รหัสผลงาน" name="id">
            <Input disabled value={trainingIdPreview} placeholder="รหัสจะปรากฏเมื่อเลือกอาจารย์" />
          </Form.Item>

          <Form.Item
            label="ชื่ออาจารย์"
            name="teacherId"
            rules={[{ required: true, message: required("ชื่ออาจารย์") }]}
          >
            <Select
              options={teacherList}
              placeholder="เลือกชื่ออาจารย์"
              onChange={handleTeacherChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="ปีการศึกษา"
            name="year"
            rules={[{ required: true, message: required("ปีการศึกษา") }]}
          >
            <Input placeholder="เช่น 2567" />
          </Form.Item>

          <Form.Item
            label="ประเภท"
            name="trainingType"
            rules={[{ required: true, message: required("ประเภท") }]}
          >
            <Select
              options={trainingTypeOptions}
              placeholder="เลือกประเภทการจัดงาน"
            />
          </Form.Item>

          <Form.Item
            label="ชื่องาน"
            name="trainingName"
            rules={[{ required: true, message: required("ชื่องาน") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="สถานที่"
            name="location"
            rules={[{ required: true, message: required("สถานที่") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="จำนวนชั่วโมงการอบรม"
            name="hours"
            rules={[{ required: true, message: "กรุณากรอกจำนวนชั่วโมง" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            label="วันอบรม (จาก - ถึง)"
            name="dateRange"
            rules={[{ required: true, message: required("วันอบรม") }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item 
            label="รายละเอียดเพิ่มเติม" 
            name="description" 
            className="full-width"
          >
            <TextArea rows={4} placeholder="รายละเอียดอื่นๆ (ถ้ามี)" />
          </Form.Item>

          <Form.Item 
            label="ไฟล์เอกสาร (แนบได้หลายไฟล์)" 
            className="full-width"
          >
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              multiple={true}
              onChange={({ fileList }) => setFileList(fileList)}
            >
              <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
            </Upload>
          </Form.Item>
        </div>

        <Button 
          type="primary" 
          htmlType="submit" 
          block 
          size="large"
          className="submit-btn"
        >
          บันทึกข้อมูล
        </Button>
      </Form>
    </div>
  );
}