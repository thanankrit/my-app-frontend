import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Card,
  Divider,
  Upload,
  Space,
  Row,
  Col,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../style/styleuser/UserstaffPage.css"; 

const { Option } = Select;
const { Title, Text } = Typography;

export default function EditStaffPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id: paramId } = useParams();

  const [fileList, setFileList] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null); 
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);

  const API_URL = "http://localhost:8081";
  const thaiRegex = /^[\u0E00-\u0E7F\s]+$/;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const roleRes = await axios.get(`${API_URL}/api/roles`);
        setRoleOptions(roleRes.data);

        const staffRes = await axios.get(`${API_URL}/api/staffs/${paramId}`);
        const staff = staffRes.data;

        form.setFieldsValue({
          staff_code: staff.staff_code,
          prefix_th: staff.prefix_th,
          first_name_th: staff.first_name_th,
          last_name_th: staff.last_name_th,
          email: staff.email,
          role_id: staff.role_id,
          status: staff.status,
          password: "", 
          confirm: "",
        });

        if (staff.photo) {
          const photoUrl = `${API_URL}/uploads/staffs/${staff.photo}`;
          setImageUrl(photoUrl);
          setFileList([
            {
              uid: "-1",
              name: "current-photo",
              status: "done",
              url: photoUrl,
            },
          ]);
        }
      } catch (err) {
        console.error(err);
        message.error("ไม่พบข้อมูลเจ้าหน้าที่");
        navigate("/home/setting/staff");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paramId, form, navigate]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));
    setIsPhotoRemoved(false);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setImageUrl(url);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setFileList([]);
    setImageUrl(null);
    setIsPhotoRemoved(true);
    message.info("ลบรูปภาพเดิมแล้ว (กดบันทึกเพื่อยืนยัน)");
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("prefix_th", values.prefix_th);
      formData.append("first_name_th", values.first_name_th);
      formData.append("last_name_th", values.last_name_th);
      formData.append("email", values.email);
      formData.append("role_id", values.role_id);
      formData.append("status", values.status);

      // ส่ง password เฉพาะเมื่อมีการกรอกค่า
      if (values.password && values.password.trim() !== "") {
        formData.append("password", values.password);
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("photo", fileList[0].originFileObj);
      } else if (isPhotoRemoved) {
        formData.append("delete_photo", "true");
      }

      await axios.put(`${API_URL}/api/staffs/${paramId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
      navigate("/home/setting/staff");
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "เกิดข้อผิดพลาด";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-user-container">
      <Card className="edit-user-card" bordered={false} loading={loading}>
        
        <div className="page-header">
           <Title level={3} style={{ margin: 0 }}>
             <UserOutlined /> แก้ไขข้อมูลเจ้าหน้าที่
           </Title>
           <Text type="secondary">รหัส: {form.getFieldValue('staff_code')}</Text>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <Form layout="vertical" form={form} onFinish={onFinish} size="large">
          <Row gutter={[{ xs: 16, sm: 24, md: 32, lg: 48 }, { xs: 24, sm: 24, md: 24, lg: 24 }]}>
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
                              <div className="overlay-remove" onClick={handleRemovePhoto}>
                                  <DeleteOutlined /> ลบรูป
                              </div>
                          </div>
                      ) : (
                          <div>
                              <PlusOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                              <div style={{ marginTop: 8, color: '#666' }}>เปลี่ยนรูป</div>
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
                            suffixIcon={<SafetyCertificateOutlined />}
                            loading={roleOptions.length === 0}
                        >
                            {roleOptions.map((r) => {
                                const roleId = r.id || r.role_id;
                                const roleName = r.name || r.role_name;
                                return (
                                    <Option key={roleId} value={roleId}>
                                        {roleName}
                                    </Option>
                                );
                            })}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="สถานะบัญชี"
                        name="status"
                        rules={[{ required: true, message: "กรุณาระบุสถานะ" }]}
                    >
                        <Select>
                            <Option value="active"><CheckCircleOutlined style={{ color: 'green' }} /> ใช้งานปกติ (Active)</Option>
                            <Option value="inactive"><StopOutlined style={{ color: 'red' }} /> ระงับการใช้งาน (Inactive)</Option>
                            <Option value="resigned"><UserOutlined style={{ color: 'gray' }} /> ลาออก (Resigned)</Option>
                        </Select>
                    </Form.Item>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={16}>
              <div className="form-section">
                 <Text strong className="section-title">ข้อมูลส่วนตัว</Text>
                 <Row gutter={16}>
                    <Col xs={24}>
                        <Form.Item label="รหัสเจ้าหน้าที่" name="staff_code">
                            <Input disabled prefix={<UserOutlined />} className="disabled-input-custom" />
                        </Form.Item>
                    </Col>
                    
                    <Col xs={24}>
                        <Form.Item 
                            label="คำนำหน้า" 
                            name="prefix_th" 
                            rules={[{ required: true, message: "เลือก" }]}
                        >
                            <Select>
                                <Option value="นาย">นาย</Option>
                                <Option value="นาง">นาง</Option>
                                <Option value="นางสาว">นางสาว</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item 
                            label="ชื่อจริง (ภาษาไทย)" 
                            name="first_name_th" 
                            rules={[
                              { required: true, message: "กรุณากรอกชื่อ" },
                              { pattern: thaiRegex, message: "กรุณากรอกเป็นภาษาไทยเท่านั้น" }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <Form.Item 
                            label="นามสกุล (ภาษาไทย)" 
                            name="last_name_th" 
                            rules={[
                              { required: true, message: "กรุณากรอกนามสกุล" },
                              { pattern: thaiRegex, message: "กรุณากรอกเป็นภาษาไทยเท่านั้น" }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                 </Row>
              </div>

              <div className="form-section" style={{ marginTop: '24px' }}>
                 <Text strong className="section-title">ข้อมูลเข้าสู่ระบบ</Text>
                 
                 <Form.Item 
                    label="อีเมล (Login ID)" 
                    name="email" 
                    rules={[
                        { required: true, message: "กรุณากรอกอีเมล" },
                        { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }
                    ]}
                 >
                    <Input prefix={<MailOutlined />} />
                 </Form.Item>

                 <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item 
                           label="เปลี่ยนรหัสผ่าน (ว่างไว้ถ้าไม่เปลี่ยน)" 
                           name="password"
                           tooltip="กรอกเฉพาะเมื่อต้องการเปลี่ยนรหัสผ่านเท่านั้น"
                        >
                           <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่านใหม่" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="ยืนยันรหัสผ่านใหม่"
                            name="confirm"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value && !getFieldValue('password')) {
                                            return Promise.resolve();
                                        }
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
                  <Space size="middle" className="action-space">
                    <Button 
                        className="btn-cancel"
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate("/home/setting/staff")}
                        size="large"
                    >
                        กลับ
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<SaveOutlined />} 
                        className="btn-submit"
                        size="large"
                    >
                        บันทึกการแก้ไข
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