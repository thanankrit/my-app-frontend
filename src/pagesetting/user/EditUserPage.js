import React, { useEffect, useState } from "react";
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
  Typography,
} from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  PlusOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../style/styleuser/UserPage.css"; 

const { Option } = Select;
const { Title, Text } = Typography;

export default function EditUserPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams(); 
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
    const fetchData = async () => {
      try {
        setLoading(true);
        const typeRes = await axios.get(`${API_URL}/api/user-types`);
        setUserTypes(typeRes.data);

        const teacherRes = await axios.get(`${API_URL}/api/teachers/${id}`);
        const data = teacherRes.data;

        form.setFieldsValue({
          id: data.teacher_code, 
          shortName: data.short_name,
          prefixTH: data.prefix_th,
          firstNameTH: data.first_name_th,
          lastNameTH: data.last_name_th,
          prefixEN: data.prefix_en,
          firstNameEN: data.first_name_en,
          lastNameEN: data.last_name_en,
          email: data.email,
          userTypeId: data.role_id,
          status: data.status, 
          degrees: data.degrees || [], 
        });

        if (data.photo) {
          const url = `${API_URL}/uploads/teachers/${data.photo}`;
          setImageUrl(url); 
          setFileList([
            {
              uid: "-1",
              name: data.photo,
              status: "done",
              url: url,
            },
          ]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้");
        navigate("/home/setting/teacher");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, navigate]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1));

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
        const url = URL.createObjectURL(newFileList[0].originFileObj);
        setImageUrl(url);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setFileList([]);
    setImageUrl(null); 
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("shortName", values.shortName);
      formData.append("prefixTH", values.prefixTH);
      formData.append("firstNameTH", values.firstNameTH);
      formData.append("lastNameTH", values.lastNameTH);
      formData.append("prefixEN", values.prefixEN);
      formData.append("firstNameEN", values.firstNameEN);
      formData.append("lastNameEN", values.lastNameEN);
      formData.append("email", values.email);
      formData.append("userTypeId", values.userTypeId);
      formData.append("status", values.status);
      formData.append("degrees", JSON.stringify(values.degrees || []));

      if (values.password) {
        formData.append("password", values.password);
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("photo", fileList[0].originFileObj);
      } else if (!imageUrl) {
        formData.append("removePhoto", "true");
      }

      await axios.put(`${API_URL}/api/teachers/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("แก้ไขข้อมูลสำเร็จ");
      navigate("/home/setting/teacher");

    } catch (error) {
      console.error("Update Error:", error);
      const msg = error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-user-container">
      <Card className="edit-user-card" bordered={false} loading={loading}>
        <div className="page-header">
           <Title level={3} style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 24px)' }}>
             <UserOutlined /> แก้ไขข้อมูลอาจารย์
           </Title>
           <Text type="secondary">รหัส: {id}</Text>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Row gutter={[32, 32]}>
            {/* ด้านซ้าย: รูปโปรไฟล์และสิทธิ์ */}
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
                                    <img src={imageUrl} alt="avatar" className="preview-image" />
                                    <div className="overlay-remove" onClick={handleRemovePhoto}>
                                        <DeleteOutlined /> ลบรูป
                                    </div>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <PlusOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                    <div style={{ marginTop: 8, color: '#666' }}>เปลี่ยนรูป</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <div className="role-select-highlight">
                        <Form.Item 
                            label="สถานะบัญชี" 
                            name="status" 
                            rules={[{ required: true }]}
                        >
                            <Select suffixIcon={<CheckCircleOutlined />}>
                                <Option value="active">Active (ปกติ)</Option>
                                <Option value="inactive">Inactive (ระงับ)</Option>
                                <Option value="resigned">Resigned (ลาออก)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item 
                            label="สิทธิ์การใช้งาน" 
                            name="userTypeId" 
                            rules={[{ required: true, message: "กรุณาเลือกสิทธิ์" }]}
                        >
                            <Select 
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
                            label="ชื่อย่อ (Unique)" 
                            name="shortName" 
                            rules={[
                                { required: true }, 
                                { pattern: /^[A-Z]+$/, message: "ตัวพิมพ์ใหญ่เท่านั้น" }
                            ]}
                        >
                            <Input style={{ textTransform: 'uppercase' }} />
                        </Form.Item>
                    </div>
                </div>
            </Col>

            {/* ด้านขวา: ข้อมูลส่วนตัว */}
            <Col xs={24} lg={16}>
                <div className="form-section">
                    <Text strong className="section-title">ข้อมูลส่วนตัว (ภาษาไทย)</Text>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="รหัสอาจารย์ (System ID)" name="id">
                                <Input disabled className="disabled-input-custom" prefix={<UserOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="คำนำหน้า" name="prefixTH" rules={[{ required: true }]}>
                                <Select showSearch>{thaiPrefixes.map(p => <Option key={p} value={p}>{p}</Option>)}</Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="ชื่อ" name="firstNameTH" rules={[{ required: true }, { pattern: thaiRegex, message: "ไทยเท่านั้น" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="นามสกุล" name="lastNameTH" rules={[{ required: true }, { pattern: thaiRegex, message: "ไทยเท่านั้น" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <div className="form-section" style={{ marginTop: 24 }}>
                    <Text strong className="section-title">ข้อมูลส่วนตัว (English)</Text>
                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item label="Prefix" name="prefixEN" rules={[{ required: true }]}>
                                <Select showSearch>{englishPrefixes.map(p => <Option key={p} value={p}>{p}</Option>)}</Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="First Name" name="firstNameEN" rules={[{ required: true }, { pattern: engRegex, message: "Eng only" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Last Name" name="lastNameEN" rules={[{ required: true }, { pattern: engRegex, message: "Eng only" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <div className="form-section" style={{ marginTop: 24 }}>
                    <Text strong className="section-title">ข้อมูลเข้าสู่ระบบ</Text>
                    <Form.Item label="อีเมล" name="email" rules={[{ required: true, type: 'email' }]}>
                        <Input prefix={<MailOutlined />} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item label="เปลี่ยนรหัสผ่าน (ว่างไว้ถ้าไม่เปลี่ยน)" name="password">
                                <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่านใหม่" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item 
                                label="ยืนยันรหัสผ่านใหม่" 
                                name="confirm" 
                                dependencies={['password']}
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value && !getFieldValue('password')) return Promise.resolve();
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

                <Divider orientation="left"><ReadOutlined /> ประวัติการศึกษา</Divider>
                <div className="education-section">
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
                                        className="education-card"
                                    >
                                        <Row gutter={12}>
                                            <Col xs={24} md={8}>
                                                <Form.Item {...restField} name={[name, 'degree_level']} label="ระดับ" rules={[{ required: true }]}>
                                                    <Select placeholder="เลือก">{degreeLevels.map(l => <Option key={l.value} value={l.value}>{l.label}</Option>)}</Select>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={16}>
                                                <Form.Item {...restField} name={[name, 'degree_name']} label="ชื่อวุฒิ (เช่น วท.บ.)" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={10}>
                                                <Form.Item {...restField} name={[name, 'major']} label="สาขา">
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={10}>
                                                <Form.Item {...restField} name={[name, 'institution']} label="สถาบัน">
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={4}>
                                                <Form.Item {...restField} name={[name, 'graduation_year']} label="ปีที่จบ">
                                                    <Input placeholder="พ.ศ." />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="btn-add-education">
                                    เพิ่มวุฒิการศึกษา
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </div>

                <Divider />
                
                <div className="form-actions">
                    <Space size="middle" className="action-space">
                        <Button size="large" className="btn-cancel" onClick={() => navigate("/home/setting/teacher")}>
                            ยกเลิก
                        </Button>
                        <Button size="large" type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} className="btn-submit">
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