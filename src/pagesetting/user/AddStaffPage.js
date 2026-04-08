import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Upload,
  Divider,
  Space,
  Row,
  Col,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/styleuser/AddStaffPage.css"; 

const { Option } = Select;
const { Title, Text } = Typography;

export default function AddStaffPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);

  const API_URL = "http://localhost:8081/api";

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const roleRes = await axios.get(`${API_URL}/roles`);
        setRoleOptions(roleRes.data);

        const idRes = await axios.get(`${API_URL}/staffs/next-id`);
        if (idRes.data && idRes.data.nextId) {
          form.setFieldsValue({ staff_code: idRes.data.nextId });
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        message.error("ไม่สามารถดึงข้อมูลเริ่มต้นได้");
        form.setFieldsValue({ staff_code: "STF-ERROR" });
      }
    };

    fetchInitialData();
  }, [form]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));
    
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("staff_code", values.staff_code);
      formData.append("prefix_th", values.prefix_th);
      formData.append("first_name_th", values.first_name_th);
      formData.append("last_name_th", values.last_name_th);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("role_id", values.role_id);
      formData.append("status", "active");

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("photo", fileList[0].originFileObj);
      }

      await axios.post(`${API_URL}/staffs`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success({ content: `เพิ่มเจ้าหน้าที่ ${values.staff_code} สำเร็จ!`, style: { marginTop: '10vh' } });
      navigate("/home/setting/staff");
    } catch (error) {
      console.error(error);
      const errorData = error.response?.data;
      
      if (errorData && errorData.field) {
        form.setFields([
          {
            name: errorData.field,
            errors: [errorData.message],
          },
        ]);
        message.error("กรุณาตรวจสอบข้อมูลที่ซ้ำในระบบ");
      } else {
        const errorMsg = errorData?.message || "เกิดข้อผิดพลาดในการบันทึก";
        message.error(errorMsg);
      }
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation(); 
    setFileList([]);
    setImageUrl(null);
  };

  return (
    <div className="add-staff-container">
      <Card
        className="add-staff-card"
        bordered={false} 
      >
        <div className="page-header">
           <Title level={3} style={{ margin: 0 }}>
             <UserOutlined /> เพิ่มข้อมูลเจ้าหน้าที่ใหม่
           </Title>
           <Text type="secondary">กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งาน</Text>
        </div>
        
        <Divider style={{ margin: '24px 0' }} />

        <Form 
            layout="vertical" 
            form={form} 
            onFinish={handleSubmit}
            size="large"
        >
          <Row gutter={48}> 

            <Col xs={24} lg={8}>
                <div className="profile-upload-section">
                    <Form.Item label="รูปโปรไฟล์">
                        <Upload
                            name="avatar"
                            listType="picture-card"
                            className="avatar-uploader"
                            showUploadList={false}
                            beforeUpload={() => false}
                            onChange={handleUploadChange}
                            fileList={fileList}
                        >
                            {imageUrl ? (
                                <div className="image-preview-container">
                                    <img src={imageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div className="overlay-remove" onClick={handleRemoveImage}>
                                        <DeleteOutlined /> ลบรูป
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <PlusOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                    <div style={{ marginTop: 8, color: '#666' }}>อัปโหลดรูป</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                    <div className="role-select-highlight">
                         <Form.Item
                            label="สิทธิ์การใช้งาน (Role)"
                            name="role_id"
                            rules={[{ required: true, message: "กรุณาเลือกสิทธิ์" }]}
                        >
                            <Select 
                                placeholder="-- เลือกสิทธิ์การใช้งาน --" 
                                suffixIcon={<SafetyCertificateOutlined />}
                                loading={roleOptions.length === 0}
                            >
                                {roleOptions.map((role) => {
                                    const roleId = role.id || role.role_id;
                                    const roleName = role.name || role.role_name;
                                    return (
                                        <Option key={roleId} value={roleId}>
                                            {roleName}
                                        </Option>
                                    );
                                })}
                            </Select>
                        </Form.Item>
                    </div>
                </div>
            </Col>

            <Col xs={24} lg={16}>
              <div className="form-section">
                  <Text strong className="section-title">ข้อมูลส่วนตัว</Text>
                  <Row gutter={16}>
                      <Col span={24}>
                          <Form.Item
                              label="รหัสเจ้าหน้าที่"
                              name="staff_code"
                          >
                              <Input disabled prefix={<UserOutlined />} className="disabled-input-custom" />
                          </Form.Item>
                      </Col>

                      <Col xs={24} sm={24} md={6}>
                              <Form.Item
                              label="คำนำหน้า"
                              name="prefix_th"
                              rules={[{ required: true, message: "เลือก" }]}
                              >
                              <Select placeholder="คำนำหน้า">
                                  <Option value="นาย">นาย</Option>
                                  <Option value="นาง">นาง</Option>
                                  <Option value="นางสาว">นางสาว</Option>
                              </Select>
                              </Form.Item>
                      </Col>

                      <Col xs={24} sm={24} md={9}>
                          <Form.Item
                              label="ชื่อจริง"
                              name="first_name_th"
                              rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
                          >
                              <Input placeholder="ภาษาไทย" />
                          </Form.Item>
                      </Col>

                      <Col xs={24} sm={24} md={9}>
                          <Form.Item
                              label="นามสกุล"
                              name="last_name_th"
                              rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
                          >
                              <Input placeholder="ภาษาไทย" />
                          </Form.Item>
                      </Col>
                  </Row>
              </div>

                <div className="form-section" style={{ marginTop: '24px' }}>
                    <Text strong className="section-title">ข้อมูลเข้าสู่ระบบ</Text>
                    
                    <Form.Item
                        label="อีเมล"
                        name="email"
                        rules={[
                            { required: true, message: "กรุณากรอกอีเมล" },
                            { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="example@kmutnb.ac.th" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="รหัสผ่าน"
                                name="password"
                                rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
                                hasFeedback
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="ตั้งรหัสผ่าน" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="ยืนยันรหัสผ่าน"
                                name="confirm"
                                dependencies={['password']}
                                hasFeedback
                                rules={[
                                    { required: true, message: "กรุณายืนยันรหัสผ่าน" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="ยืนยันรหัสผ่าน" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <Divider />
                
                <div className="form-actions">
                     <Space size="middle" className="responsive-space">
                        <Button 
                            className="btn-cancel"
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate("/home/setting/staff")}
                            size="large"
                        >
                            ยกเลิก
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            icon={<SaveOutlined />} 
                            className="btn-submit"
                            size="large"
                        >
                            บันทึกข้อมูล
                        </Button>
                     </Space>
                </div>

            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}