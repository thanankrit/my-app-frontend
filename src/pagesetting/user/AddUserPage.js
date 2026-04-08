import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Upload,
  Space,
  Card,
  Divider,
  Row,
  Col,
  Typography
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ReadOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../style/styleuser/UserPage.css";

const { Option } = Select;
const { Title, Text } = Typography;

export default function AddUserPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = "http://localhost:8081";

  const thaiRegex = /^[\u0E00-\u0E7F\s]+$/;
  const engRegex = /^[a-zA-Z\s.]+$/;
  const thaiPrefixes = ["นาย", "นาง", "นางสาว", "ดร.", "ผศ.", "ผศ.ดร.", "รศ.", "รศ.ดร.", "ศ.", "ศ.ดร.", "อาจารย์"];
  const englishPrefixes = ["Mr.", "Mrs.", "Ms.", "Dr.", "Asst. Prof.", "Assoc. Prof.", "Prof.", "Lecturer"];
  const degreeLevels = [
    { value: "Bachelor", label: "ปริญญาตรี" },
    { value: "Master", label: "ปริญญาโท" },
    { value: "Doctor", label: "ปริญญาเอก" },
    { value: "Diploma", label: "ประกาศนียบัตร/อนุปริญญา" },
    { value: "Other", label: "อื่นๆ" },
  ];

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const idRes = await axios.get(`${API_URL}/api/teachers/next-id`);
        form.setFieldsValue({ id: idRes.data.nextId });
        
        const typeRes = await axios.get(`${API_URL}/api/user-types`);
        setUserTypes(typeRes.data);
      } catch (error) {
        console.error("Error fetching init data:", error);
        message.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      }
    };
    fetchInitData();
  }, [form]);

  const checkDuplicate = async (fieldName, value) => {
    if (!value) return Promise.resolve();
    try {
      const res = await axios.post(`${API_URL}/api/teachers/check-duplicate`, {
        field: fieldName,
        value: value
      });
      if (res.data.exists) {
        return Promise.reject(new Error(`${value} นี้ถูกใช้งานไปแล้ว`));
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.resolve();
    }
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const url = URL.createObjectURL(newFileList[0].originFileObj);
      setImageUrl(url);
    } else {
      setImageUrl(null);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setFileList([]);
    setImageUrl(null);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (key === 'degrees') {
          formData.append(key, JSON.stringify(values[key] || []));
        } else if (key !== 'confirm' && values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      if (fileList.length > 0) {
        formData.append("photo", fileList[0].originFileObj);
      }

      await axios.post(`${API_URL}/api/teachers`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success(`เพิ่มอาจารย์ ${values.shortName} เรียบร้อยแล้ว`);
      navigate("/home/setting/teacher");
    } catch (error) {
      console.error("Submit Error:", error);
      
      if (error.response && error.response.data) {
        const { field, message: serverMsg } = error.response.data;

        if (field) {
          form.setFields([
            {
              name: field,
              errors: [serverMsg || "ข้อมูลซ้ำ"],
            },
          ]);
          form.scrollToField(field);
        } else {
          message.error(serverMsg || "เกิดข้อผิดพลาดในการบันทึก");
        }
      } else {
        message.error("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-container">
      <Card className="add-user-card" bordered={false}>
        <div className="page-header">
          <Title level={3} style={{ margin: 0, color: '#000' }}>
            <PlusOutlined /> เพิ่มผู้ใช้งาน (อาจารย์)
          </Title>
          <Text type="secondary" style={{ color: '#595959' }}>กรุณากรอกข้อมูลให้ครบถ้วน (ระบบจะแสดงกรอบสีแดงหากข้อมูลซ้ำ)</Text>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <Form form={form} layout="vertical" onFinish={onFinish} size="large" validateTrigger="onBlur">
          <Row gutter={48}>
            {/* ซ้าย: อัปโหลดรูปภาพ และสิทธิ์ */}
            <Col xs={24} lg={8}>
              <div className="profile-upload-section">
                <Form.Item label="รูปโปรไฟล์">
                  <Upload
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleUploadChange}
                    fileList={fileList}
                    accept=".jpg,.jpeg,.png"
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
                        <div style={{ marginTop: 8, color: '#666' }}>อัปโหลด</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                <div className="role-select-highlight">
                  <Form.Item
                    label="สิทธิ์การใช้งาน (Role)"
                    name="userTypeId"
                    rules={[{ required: true, message: "กรุณาเลือกสิทธิ์" }]}
                  >
                    <Select 
                        placeholder="-- เลือกสิทธิ์การใช้งาน --" 
                        suffixIcon={<SafetyCertificateOutlined />}
                        loading={userTypes.length === 0}
                    >
                      {userTypes.map((t) => {
                        const typeId = t.id || t.role_id || t.user_type_id;
                        const typeName = t.name || t.role_name || t.user_type_name;
                        return (
                           <Option key={typeId} value={typeId}>
                               {typeName}
                           </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="ชื่อย่อ (Short Name)"
                    name="shortName"
                    rules={[
                      { required: true, message: "กรุณาระบุชื่อย่อ" },
                      { pattern: /^[A-Z]+$/, message: "ภาษาอังกฤษพิมพ์ใหญ่เท่านั้น" },
                      { validator: (_, value) => checkDuplicate("shortName", value) }
                    ]}
                  >
                    <Input placeholder="เช่น SSP" className="uppercase-input" />
                  </Form.Item>
                </div>
              </div>
            </Col>

            {/* ขวา: ฟอร์มข้อมูลอาจารย์ */}
            <Col xs={24} lg={16}>
              {/* ส่วนข้อมูลภาษาไทย */}
              <div className="form-section">
                <Text strong className="section-title">ข้อมูลส่วนตัว (ภาษาไทย)</Text>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="รหัสอาจารย์" name="id">
                      <Input disabled className="readonly-input" prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <Form.Item label="คำนำหน้า" name="prefixTH" rules={[{ required: true, message: "เลือก" }]}>
                      <Select showSearch placeholder="ระบุคำนำหน้า">{thaiPrefixes.map(p => <Option key={p} value={p}>{p}</Option>)}</Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <Form.Item 
                      label="ชื่อ" 
                      name="firstNameTH" 
                      rules={[{ required: true, message: "กรุณากรอกชื่อ" }, { pattern: thaiRegex, message: "ภาษาไทยเท่านั้น" }]}
                    >
                      <Input placeholder="ภาษาไทย" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <Form.Item 
                      label="นามสกุล" 
                      name="lastNameTH" 
                      rules={[{ required: true, message: "กรุณากรอกนามสกุล" }, { pattern: thaiRegex, message: "ภาษาไทยเท่านั้น" }]}
                    >
                      <Input placeholder="ภาษาไทย" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ส่วนข้อมูลภาษาอังกฤษ */}
              <div className="form-section" style={{ marginTop: 24 }}>
                <Text strong className="section-title">ข้อมูลส่วนตัว (English)</Text>
                <Row gutter={16}>
                  <Col xs={24} sm={24} md={8}>
                    <Form.Item label="Prefix" name="prefixEN" rules={[{ required: true, message: "Select" }]}>
                      <Select showSearch placeholder="Select Prefix">{englishPrefixes.map(p => <Option key={p} value={p}>{p}</Option>)}</Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <Form.Item 
                      label="First Name" 
                      name="firstNameEN" 
                      rules={[{ required: true, message: "Required" }, { pattern: engRegex, message: "English only" }]}
                    >
                      <Input placeholder="English Name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={24} md={8}>
                    <Form.Item 
                      label="Last Name" 
                      name="lastNameEN" 
                      rules={[{ required: true, message: "Required" }, { pattern: engRegex, message: "English only" }]}
                    >
                      <Input placeholder="English Lastname" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ส่วนข้อมูล Login */}
              <div className="form-section" style={{ marginTop: 24 }}>
                <Text strong className="section-title">ข้อมูลเข้าสู่ระบบ</Text>
                <Form.Item
                  label="อีเมล (Email)"
                  name="email"
                  rules={[
                    { required: true, message: "ระบุอีเมล" },
                    { type: 'email', message: "อีเมลไม่ถูกต้อง" },
                    { validator: (_, value) => checkDuplicate("email", value) }
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="example@kmutnb.ac.th" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="รหัสผ่าน" name="password" rules={[{ required: true, message: "ระบุรหัสผ่าน" }, { min: 6, message: "ขั้นต่ำ 6 ตัวอักษร" }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="ตั้งรหัสผ่าน" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="ยืนยันรหัสผ่าน"
                      name="confirm"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: "ยืนยันรหัสผ่าน" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) return Promise.resolve();
                            return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="ยืนยันรหัสผ่าน" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* ส่วนประวัติการศึกษา */}
              <Divider orientation="left"><ReadOutlined /> ประวัติการศึกษา</Divider>
              <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
                <Form.List name="degrees">
                  {(fields, { add, remove }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card
                          key={key}
                          size="small"
                          type="inner"
                          title={`วุฒิการศึกษา #${name + 1}`}
                          extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>ลบ</Button>}
                        >
                          <Row gutter={12}>
                            <Col xs={24} md={8}>
                              <Form.Item {...restField} name={[name, 'degree_level']} label="ระดับ" rules={[{ required: true, message: 'ระบุระดับ' }]}>
                                <Select placeholder="เลือกระดับ">{degreeLevels.map(l => <Option key={l.value} value={l.value}>{l.label}</Option>)}</Select>
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={16}>
                              <Form.Item {...restField} name={[name, 'degree_name']} label="ชื่อวุฒิ" rules={[{ required: true, message: 'ระบุชื่อวุฒิ' }]}>
                                <Input placeholder="เช่น วท.บ. (วิทยาการคอมพิวเตอร์)" />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item {...restField} name={[name, 'institution']} label="สถาบัน" rules={[{ required: true, message: 'ระบุสถาบัน' }]}>
                                <Input placeholder="ระบุสถาบันการศึกษา" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>เพิ่มวุฒิการศึกษา</Button>
                    </div>
                  )}
                </Form.List>
              </div>

              <Divider />
              <div className="form-actions">
                <Space size="middle" className="responsive-space">
                  <Button size="large" className="btn-cancel" onClick={() => navigate("/home/setting/teacher")}>ยกเลิก</Button>
                  <Button size="large" type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} className="btn-submit">บันทึกข้อมูล</Button>
                </Space>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}