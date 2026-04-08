import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Button,
  Upload,
  message,
  Spin,
  Select
} from "antd";
import { ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import "../../style/styletraining/EditTrainingPage.css";

const { RangePicker } = DatePicker;
const API_URL = "http://localhost:8081/api"; 

const trainingTypeOptions = [
  { value: "การจัดอบรม/เชิงปฏิบัติการ", label: "การจัดอบรม/เชิงปฏิบัติการ" },
  { value: "การจัดสัมมนา/เชิงปฏิบัติการ", label: "การจัดสัมมนา/เชิงปฏิบัติการ" },
  { value: "การจัดประชุมวิชาการ", label: "การจัดประชุมวิชาการ" },
  { value: "การจัดเสวนา", label: "การจัดเสวนา" },
  { value: "การจัดบรรยาย", label: "การจัดบรรยาย" },
  { value: "การจัดการศึกษาดูงาน", label: "การจัดการศึกษาดูงาน" }
];

export default function EditTrainingPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type"); 

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const requiredMessage = (field) => `กรุณากรอก${field}`;

  useEffect(() => {
    const loadData = async () => {
      if (!id || !userType) return;
      
      setLoading(true);
      try {
        const endpoint = userType === "teacher"
          ? `${API_URL}/teacher-trainings/${id}`
          : `${API_URL}/staff-trainings/${id}`;

        const res = await axios.get(endpoint);
        const data = res.data;

        form.setFieldsValue({
          id: data.work_code,
          year: data.academic_year,
          trainingType: data.training_type,
          trainingName: data.training_name,
          location: data.location,
          hours: data.total_hours,
          description: data.description,
          dateRange: data.start_date && data.end_date
            ? [dayjs(data.start_date), dayjs(data.end_date)]
            : [],
        });

        if (data.files && data.files.length > 0) {
          const existingFiles = data.files.map((f) => ({
            uid: f.id,          
            name: f.file_name,   
            status: 'done',      
          }));
          setFileList(existingFiles);
        }

      } catch (error) {
        console.error(error);
        message.error("ไม่พบข้อมูลการอบรม / สัมมนา");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, userType, form, navigate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("academic_year", values.year);
      formData.append("training_type", values.trainingType); 
      formData.append("training_name", values.trainingName);
      formData.append("location", values.location);
      formData.append("total_hours", values.hours);
      formData.append("description", values.description || "");

      if (values.dateRange) {
        formData.append("start_date", values.dateRange[0].format("YYYY-MM-DD"));
        formData.append("end_date", values.dateRange[1].format("YYYY-MM-DD"));
      }

      fileList.forEach((file) => {
        if (file.originFileObj) {
           formData.append("files", file.originFileObj);
        }
      });

      const endpoint = userType === "teacher"
        ? `${API_URL}/teacher-trainings/${id}`
        : `${API_URL}/staff-trainings/${id}`;

      await axios.put(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("แก้ไขข้อมูลสำเร็จ");
      navigate(-1); 

    } catch (error) {
      console.error(error);
      message.error("แก้ไขข้อมูลไม่สำเร็จ: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async (file) => {
    if (file.originFileObj) {
      return true;
    }

    try {
      const endpoint = userType === "teacher"
        ? `${API_URL}/teacher-files/${file.uid}`
        : `${API_URL}/staff-files/${file.uid}`;

      await axios.delete(endpoint);
      message.success("ลบไฟล์เรียบร้อยแล้ว");
      return true; 
    } catch (error) {
      console.error(error);
      message.error("ลบไฟล์ไม่สำเร็จ");
      return false; 
    }
  };

  if (loading && !form.getFieldValue("id")) {
     return <div style={{ textAlign: "center", marginTop: 50 }}><Spin size="large" /></div>;
  }

  return (
    <div className="edit-training-container">
      <Card
        className="edit-training-card"
        title={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)} 
          >
            กลับ
          </Button>
        }
      >
        <h2 className="title">แก้ไขข้อมูลงานอบรม / สัมมนา</h2>
        
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <div className="form-grid">
            <Form.Item label="รหัสผลงาน" name="id">
              <Input disabled style={{ backgroundColor: "#f5f5f5", color: "#555" }} />
            </Form.Item>

            <Form.Item
              label="ปีการศึกษา"
              name="year"
              rules={[
                { required: true, message: requiredMessage("ปีการศึกษา") },
              ]}
            >
              <Input type="number" placeholder="เช่น 2567" />
            </Form.Item>

            <Form.Item
              label="ประเภท"
              name="trainingType"
              rules={[{ required: true, message: requiredMessage("ประเภท") }]}
            >
              <Select
                options={trainingTypeOptions}
                placeholder="เลือกประเภทการจัดงาน"
              />
            </Form.Item>

            <Form.Item
              label="ชื่องานอบรม / สัมมนา"
              name="trainingName"
              rules={[
                { required: true, message: requiredMessage("ชื่องานอบรม / สัมมนา") },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="สถานที่"
              name="location"
              rules={[{ required: true, message: requiredMessage("สถานที่") }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="จำนวนชั่วโมงการอบรม"
              name="hours"
              rules={[
                { required: true, message: requiredMessage("จำนวนชั่วโมงการอบรม") },
              ]}
            >
              <Input type="number" step="0.5" />
            </Form.Item>

            <Form.Item
              label="วันอบรม (จาก - ถึง)"
              name="dateRange"
              rules={[{ required: true, message: requiredMessage("วันอบรม") }]}
              className="full-row"
            >
              <RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
            
            <Form.Item label="รายละเอียดเพิ่มเติม" name="description" className="full-row">
              <Input.TextArea rows={4} placeholder="รายละเอียดอื่นๆ (ถ้ามี)" />
            </Form.Item>
            
            <Form.Item label="ไฟล์แนบ (อัปโหลดเพิ่ม)" className="full-row">
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                onRemove={handleRemoveFile} 
                multiple
              >
                <Button icon={<UploadOutlined />}>เลือกไฟล์</Button>
              </Upload>
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" className="submit-btn" loading={loading} size="large">
            บันทึกการแก้ไข
          </Button>
        </Form>
      </Card>
    </div>
  );
}