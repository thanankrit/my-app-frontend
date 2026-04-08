import React, { useEffect, useState } from "react";
import { Form, Input, DatePicker, Button, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import "../../style/styletraining/StaffTrainingForm.css";

const { RangePicker } = DatePicker;
const { TextArea } = Input; 

const API_URL = "http://localhost:8081/api";

const trainingTypeOptions = [
  { value: "การจัดอบรม/เชิงปฏิบัติการ", label: "การจัดอบรม/เชิงปฏิบัติการ" },
  { value: "การจัดสัมมนา/เชิงปฏิบัติการ", label: "การจัดสัมมนา/เชิงปฏิบัติการ" },
  { value: "การจัดประชุมวิชาการ", label: "การจัดประชุมวิชาการ" },
  { value: "การจัดเสวนา", label: "การจัดเสวนา" },
  { value: "การจัดบรรยาย", label: "การจัดบรรยาย" },
  { value: "การจัดการศึกษาดูงาน", label: "การจัดการศึกษาดูงาน" }
];

export default function StaffTrainingForm({ onSuccess }) {
  const [form] = Form.useForm();
  const [staffList, setStaffList] = useState([]);
  const [trainingIdPreview, setTrainingIdPreview] = useState("");
  const [fileList, setFileList] = useState([]);

  const required = (f) => `กรุณากรอก${f}`;

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const response = await axios.get(`${API_URL}/staffs`);
        const staffOptions = response.data.map((s) => ({
          label: `${s.prefix_th || ''}${s.first_name_th} ${s.last_name_th}`,
          value: s.id,
          code: s.staff_code
        }));
        setStaffList(staffOptions);
      } catch (error) {
        console.error("Error fetching staff:", error);
        message.error("ไม่สามารถดึงข้อมูลเจ้าหน้าที่ได้");
      }
    };
    fetchStaffs();
  }, []);

  const handleStaffChange = async (staffId) => {
    try {
      const response = await axios.get(`${API_URL}/staff-trainings/next-id/${staffId}`);
      const nextId = response.data.work_code;
      setTrainingIdPreview(nextId);
      form.setFieldsValue({ id: nextId, staffId });
    } catch (error) {
      console.error("Error generating ID:", error);
    }
  };

  const onFinish = async (values) => {
    const formData = new FormData();

    formData.append("staff_id", values.staffId);
    formData.append("work_code", trainingIdPreview);
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
      formData.append("files", file.originFileObj);
    });

    try {
      await axios.post(`${API_URL}/staff-trainings`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("บันทึกข้อมูลสำเร็จ");
      form.resetFields();
      setFileList([]);
      setTrainingIdPreview("");
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Submit Error:", error);
      message.error("บันทึกข้อมูลไม่สำเร็จ: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="staff-training-form-container">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <div className="form-grid">
          <Form.Item label="รหัสผลงาน" name="id">
            <Input disabled value={trainingIdPreview} placeholder="ระบบจะสร้างรหัสให้อัตโนมัติ" />
          </Form.Item>

          <Form.Item
            label="ชื่อเจ้าหน้าที่"
            name="staffId"
            rules={[{ required: true, message: "กรุณาเลือกเจ้าหน้าที่" }]}
          >
            <Select
              options={staffList}
              placeholder="เลือกชื่อเจ้าหน้าที่"
              onChange={handleStaffChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="ปีการศึกษา"
            name="year"
            rules={[
              { required: true, message: required("ปีการศึกษา") },
              { pattern: /^[0-9]+$/, message: "กรุณากรอกปีการศึกษาเป็นตัวเลขเท่านั้น" },
            ]}
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
            rules={[
              { required: true, message: required("จำนวนชั่วโมงการอบรม") },
              { pattern: /^[0-9]+$/, message: "กรุณากรอกจำนวนชั่วโมงเป็นตัวเลขเท่านั้น" },
            ]}
          >
            <Input />
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