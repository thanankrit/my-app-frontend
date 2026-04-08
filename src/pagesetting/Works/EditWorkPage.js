import React, { useEffect, useState, useCallback } from "react";
import { Form, Input, DatePicker, Button, Upload, Card, message, List, Typography } from "antd";
import { ArrowLeftOutlined, UploadOutlined, DeleteOutlined, FileOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";

import "../../style/styleWorks/EditWorkPage.css"; 

const { Text } = Typography;
const API_URL = "http://localhost:8081/api"; 

export default function EditWorkPage() {
  const { type, id, workId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [form] = Form.useForm();
  
  const [searchParams] = useSearchParams();
  const listType = searchParams.get("type") || type;

  const [existingFiles, setExistingFiles] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWork = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/work-details/${type}/${workId}`);
      const data = response.data;

      if (!data) {
        message.error("ไม่พบข้อมูลผลงาน");
        navigate(-1);
        return;
      }

      form.setFieldsValue({
        id: data.work_code || data.workCode || "", 
        ownerName: data.ownerName || data.owner_name || location.state?.ownerName || "", 
        academicYear: data.academic_year || data.academicYear || "",
        date: (data.work_date || data.workDate) ? dayjs(data.work_date || data.workDate) : null,
        workName: data.work_name || data.workName || "",
        organization: data.organization || "",
        location: data.location || "",
        description: data.description || "",
      });

      setExistingFiles(data.files || []);

    } catch (error) {
      console.error("Load Edit Data Error:", error);
      message.error("ไม่พบข้อมูลผลงาน");
      navigate(`/home/setting/work/by/${type}/${id}?type=${listType}`);
    }
  }, [type, workId, form, navigate, id, listType, location.state]);

  useEffect(() => {
    loadWork();
  }, [loadWork]);

  const handleDeleteExistingFile = async (fileId, originalName) => {
    try {
      await axios.delete(`${API_URL}/work-files/${type}/${fileId}`);
      message.success(`ลบไฟล์ ${originalName} สำเร็จ`);
      setExistingFiles((prev) => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error("Delete file error:", error);
      message.error("ลบไฟล์ไม่สำเร็จ");
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    const formData = new FormData();

    formData.append("academicYear", values.academicYear);
    formData.append("workName", values.workName);
    formData.append("organization", values.organization || "");
    formData.append("location", values.location || "");
    formData.append("date", values.date ? values.date.format("YYYY-MM-DD") : "");
    formData.append("description", values.description || "");

    if (fileList.length > 0) {
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj);
        }
      });
    }

    try {
      await axios.put(`${API_URL}/works/${type}/${workId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("แก้ไขข้อมูลผลงานสำเร็จ");
      navigate(`/home/setting/work/by/${type}/${id}?type=${listType}`);
    } catch (error) {
      console.error("Update Error:", error);
      message.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="research-container">
      <Card className="research-card" bordered={false}>
        <Button
          className="back-btn"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/home/setting/work/by/${type}/${id}?type=${listType}`)}
        >
          กลับ
        </Button>

        <h2 className="title">แก้ไขผลงาน</h2>

        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <div className="form-grid">
            <Form.Item label="รหัสผลงาน" name="id">
              <Input disabled style={{ backgroundColor: '#f5f5f5' }} className="full-width" />
            </Form.Item>

            <Form.Item label="ชื่อเจ้าของผลงาน" name="ownerName">
              <Input disabled style={{ backgroundColor: '#f5f5f5' }} className="full-width" />
            </Form.Item>

            <Form.Item label="ปีการศึกษา" name="academicYear" rules={[{ required: true, message: "กรุณากรอกปีการศึกษา" }]}>
              <Input className="full-width" />
            </Form.Item>

            <Form.Item label="วัน/เดือน/ปี" name="date" rules={[{ required: true, message: "กรุณากรอกวันที่" }]}>
              <DatePicker format="DD/MM/YYYY" className="full-width" />
            </Form.Item>

            <Form.Item label="ชื่อผลงาน" name="workName" rules={[{ required: true, message: "กรุณากรอกชื่อผลงาน" }]} className="full-row">
              <Input className="full-width" />
            </Form.Item>

            <Form.Item label="หน่วยงาน" name="organization">
              <Input className="full-width" />
            </Form.Item>

            <Form.Item label="สถานที่" name="location">
              <Input className="full-width" />
            </Form.Item>

            <Form.Item label="รายละเอียด" name="description" rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]} className="full-row">
              <Input.TextArea rows={4} className="full-width" />
            </Form.Item>
          </div>

          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <Text strong>ไฟล์เอกสารเดิม (สามารถกดลบได้):</Text>
            {existingFiles.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={existingFiles}
                style={{ marginTop: 8, backgroundColor: '#fafafa' }}
                renderItem={(file) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDeleteExistingFile(file.id, file.original_file_name)}
                      />
                    ]}
                  >
                    <List.Item.Meta avatar={<FileOutlined />} title={file.original_file_name} />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ marginTop: 8, color: '#999' }}>ไม่มีไฟล์แนบเดิม</div>
            )}
          </div>

          <Form.Item label="อัปโหลดไฟล์เพิ่ม (เลือกได้หลายไฟล์)">
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              multiple
            >
              <Button icon={<UploadOutlined />}>เลือกไฟล์ใหม่</Button>
            </Upload>
          </Form.Item>

          <div className="submit-btn">
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%', maxWidth: '200px' }}>
              บันทึกการแก้ไข
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}