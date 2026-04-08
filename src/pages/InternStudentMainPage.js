import React, { useState, useEffect } from "react";
import { Card, Table, Input, Select, message, Tag, Button, Modal, Form, Upload, Space, Popconfirm, Dropdown, DatePicker } from "antd";
import { EyeOutlined, SearchOutlined, PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs"; 
import { jwtDecode } from "jwt-decode"; 
import "./../style/MainInternStudentPage.css";

const { Search } = Input;
const { Option } = Select;

export default function InternStudentMainPage() {
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [internshipType, setInternshipType] = useState("domestic");
  const [editingId, setEditingId] = useState(null); 

  useEffect(() => {
    const token = localStorage.getItem("token"); 
    let userFromToken = null;
    if (token) {
      try {
        userFromToken = jwtDecode(token);
        setCurrentUser(userFromToken);
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }
    fetchData(userFromToken);
  }, []);

  const fetchData = async (user) => {
    setLoading(true);
    try {
      const internRes = await fetch("http://localhost:8081/api/internships");
      if (!internRes.ok) throw new Error("Fetch failed");

      const internData = await internRes.json();

      let data = internData.map((intern) => {
        let fullNameToDisplay = "-";
        if (user && user.firstName && user.lastName) {
            fullNameToDisplay = `${user.firstName} ${user.lastName}`;
        } else if (intern.first_name_th && intern.last_name_th) {
            fullNameToDisplay = `${intern.prefix_th || ""}${intern.first_name_th} ${intern.last_name_th}`;
        }

        return {
          key: intern.internship_id || intern.id, 
          internshipId: intern.internship_id || intern.id,
          studentCode: intern.student_id || "-",
          fullName: fullNameToDisplay,
          type: intern.internship_type || "-",
          placeName: intern.place_name || "-",
          country: intern.country,
          city: intern.city,
          institution: intern.institution,
          startDate: intern.start_date ? dayjs(intern.start_date).format("YYYY-MM-DD") : "-",
          endDate: intern.end_date ? dayjs(intern.end_date).format("YYYY-MM-DD") : "-",
          fileName: intern.file_name || "-", 
          filePath: intern.file_path || null, 
          status: intern.status || "pending", 
          rejectComment: intern.reject_comment || "", 
        };
      });

      if (user && user.userType === 'student') {
          const currentStudentId = user.username.replace(/^s/i, ''); 
          data = data.filter(item => item.studentCode === currentStudentId || item.studentCode === user.username);
      }

      setDataSource(data);
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = dataSource.filter(item => {
    const matchSearch = item.fullName.toLowerCase().includes(searchText.toLowerCase()) || 
                        item.placeName.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.studentCode.includes(searchText);
    const matchType = filterType === "all" ? true : item.type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (id) => {
    try {
        const response = await fetch(`http://localhost:8081/api/internships/${id}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            message.success("ลบข้อมูลสำเร็จ");
            fetchData(currentUser);
        } else {
            message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    } catch (error) {
        message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
    setEditingId(null);
    form.resetFields();
    
    form.setFieldsValue({ type: "domestic" });
    setInternshipType("domestic");
    
    if (currentUser && currentUser.username) {
        const studentId = currentUser.username.replace(/^s/i, '');
        form.setFieldsValue({ studentCode: studentId });
    }
  };

  const handleEdit = (record) => {
      setIsModalVisible(true);
      setEditingId(record.internshipId);
      setInternshipType(record.type);

      form.setFieldsValue({
          studentCode: record.studentCode,
          type: record.type,
          placeName: record.type === "domestic" ? record.placeName : undefined,
          country: record.country,
          city: record.city,
          institution: record.institution,
          startDate: record.startDate !== "-" ? dayjs(record.startDate, "YYYY-MM-DD") : null,
          endDate: record.endDate !== "-" ? dayjs(record.endDate, "YYYY-MM-DD") : null,
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleTypeChange = (value) => {
    setInternshipType(value);
    form.setFieldsValue({ type: value });

    if (value === "domestic") {
      form.setFieldsValue({ country: undefined, city: undefined, institution: undefined });
    } else {
      form.setFieldsValue({ placeName: undefined });
    }
  };

  const handleSubmit = async (values) => {
    const formData = new FormData();
    const currentStudentId = currentUser?.username?.replace(/^s/i, '') || values.studentCode;
    formData.append("studentId", currentStudentId);
    formData.append("type", internshipType);
    
    const place = internshipType === "domestic" ? values.placeName : `${values.country} - ${values.city} - ${values.institution}`;
    formData.append("placeName", place);
    
    if (internshipType === "international") {
      formData.append("country", values.country);
      formData.append("city", values.city);
      formData.append("institution", values.institution);
    }

    formData.append("startDate", values.startDate ? values.startDate.format("YYYY-MM-DD") : "");
    formData.append("endDate", values.endDate ? values.endDate.format("YYYY-MM-DD") : "");

    if (values.files && values.files.fileList) {
      values.files.fileList.forEach(fileItem => {
          if (fileItem.originFileObj) {
              formData.append("files", fileItem.originFileObj);
          }
      });
    }

    try {
      let url = "http://localhost:8081/api/internships";
      let method = "POST";

      if (editingId) {
          url = `http://localhost:8081/api/internships/${editingId}`;
          method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        body: formData,
      });
      
      if (response.ok) {
        message.success(editingId ? "อัปเดตข้อมูลสำเร็จ (รอแอดมินตรวจสอบใหม่)" : "ส่งข้อมูลสำเร็จ");
        setIsModalVisible(false);
        form.resetFields();
        fetchData(currentUser); 
      } else {
        message.error("เกิดข้อผิดพลาดในการบันทึก กรุณาตรวจสอบข้อมูล");
      }
    } catch (error) {
      message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    }
  };

  const columns = [
    { title: "รหัสนักศึกษา", dataIndex: "studentCode", width: 120, fixed: 'left' },
    { title: "ชื่อ-สกุล", dataIndex: "fullName", width: 200 },
    { 
      title: "ประเภท", 
      dataIndex: "type", 
      width: 130, 
      render: type => {
        if (type === "domestic") return <Tag color="blue">ภายในประเทศ</Tag>;
        if (type === "international") return <Tag color="purple">ต่างประเทศ</Tag>;
        return "-";
      }
    },
    { title: "สถานที่ฝึกงาน", dataIndex: "placeName", width: 220 },
    {
      title: "ไฟล์แนบ",
      dataIndex: "filePath",
      width: 150,
      render: (_, record) => {
        if (!record.filePath) return <span style={{ color: "#aaa" }}>ไม่มีไฟล์</span>;
        
        const paths = record.filePath.split(',');
        const names = record.fileName && record.fileName !== "-" ? record.fileName.split(',') : [];

        const menuItems = paths.map((path, index) => {
          const displayName = names[index] ? names[index].trim() : `ไฟล์ที่ ${index + 1}`;
          return {
            key: index,
            icon: <EyeOutlined />,
            label: (
              <a 
                href={`http://localhost:8081/uploads/internships/${encodeURIComponent(path.trim())}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {displayName}
              </a>
            ),
          };
        });

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomLeft">
            <Button icon={<EyeOutlined />}>
              ดูไฟล์แนบ ({paths.length})
            </Button>
          </Dropdown>
        );
      }
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 120,
      render: (status) => {
          let color = 'default';
          let text = status;
          if (status === 'pending') { color = 'orange'; text = 'รอตรวจสอบ'; }
          else if (status === 'approved') { color = 'green'; text = 'อนุมัติแล้ว'; }
          else if (status === 'rejected') { color = 'red'; text = 'ต้องแก้ไข'; }
          return <Tag color={color}>{text}</Tag>;
      }
    },
    {
        title: "ข้อความจากแอดมิน",
        dataIndex: "rejectComment",
        width: 200,
        render: (text, record) => {
            if (record.status === 'rejected' && text) {
                return <span style={{ color: 'red' }}>{text}</span>;
            }
            return "-";
        }
    },
    {
      title: "จัดการ",
      width: 120,
      align: "center",
      fixed: 'right', 
      render: (_, record) => (
          <Space>
            {record.status === 'rejected' && (
                <Button 
                    type="primary" 
                    danger
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(record)}
                    title="แก้ไขข้อมูล"
                />
            )}
            <Popconfirm 
                title="ลบข้อมูล" 
                description="คุณแน่ใจหรือไม่ที่จะลบข้อมูลการฝึกงานนี้?" 
                onConfirm={() => handleDelete(record.internshipId)} 
                okText="ลบ" 
                cancelText="ยกเลิก"
            >
                <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    title="ลบข้อมูล"
                />
            </Popconfirm>
          </Space>
      ),
    }
  ];

  return (
    <div className="page-container">
      <Card 
        title={<span className="card-title">ข้อมูลการฝึกงานและสหกิจศึกษา</span>} 
        className="intern-card"
        variant="outlined"
        extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                เพิ่มข้อมูลการฝึกงาน
            </Button>
        }
      >
        <div className="filter-container">
          <Search
            className="search-input"
            placeholder="ค้นหาสถานที่ฝึกงาน" 
            allowClear
            enterButton={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="select-group">
            <Select value={filterType} onChange={setFilterType} className="filter-select">
              <Option value="all">ทุกประเภท</Option>
              <Option value="domestic">ภายในประเทศ</Option>
              <Option value="international">ต่างประเทศ</Option>
            </Select>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          loading={loading}
          scroll={{ x: 1200 }} 
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            responsive: true 
          }}
          className="responsive-table"
        />
      </Card>

      <Modal
        title={editingId ? "แก้ไขข้อมูลการฝึกงาน" : "แจ้งข้อมูลการฝึกงาน"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ type: "domestic" }}>
          
          <Form.Item label="รหัสนักศึกษา" name="studentCode">
            <Input readOnly style={{ color: 'rgba(0,0,0,0.85)', backgroundColor: '#f5f5f5' }}/>
          </Form.Item>

          <Form.Item label="ประเภทฝึกงาน" name="type" rules={[{ required: true }]}>
            <Select onChange={handleTypeChange}>
              <Option value="domestic">ภายในประเทศ</Option>
              <Option value="international">ต่างประเทศ</Option>
            </Select>
          </Form.Item>
          
          {internshipType === "domestic" && (
            <Form.Item label="สถานที่ฝึกงาน" name="placeName" rules={[{ required: true, message: "กรุณากรอกสถานที่ฝึกงาน" }]}>
              <Input placeholder="กรอกชื่อสถานที่ฝึกงาน" />
            </Form.Item>
          )}

          {internshipType === "international" && (
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

          <Form.Item label="วันที่เริ่มฝึกงาน" name="startDate" rules={[{ required: true, message: "กรุณาเลือกวันที่เริ่ม" }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="เลือกวันที่เริ่มฝึกงาน"/>
          </Form.Item>

          <Form.Item label="วันที่สิ้นสุดฝึกงาน" name="endDate" rules={[{ required: true, message: "กรุณาเลือกวันที่สิ้นสุด" }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="เลือกวันที่สิ้นสุดฝึกงาน"/>
          </Form.Item>

          <Form.Item 
            label={editingId ? "แนบไฟล์ใหม่ (ถ้าต้องการเปลี่ยน)" : "แนบไฟล์เอกสาร"} 
            name="files" 
            rules={[{ required: !editingId, message: "กรุณาแนบไฟล์" }]}
          >
            <Upload beforeUpload={() => false} multiple>
              <Button icon={<UploadOutlined />} style={{ width: "100%" }}>อัปโหลดไฟล์ (เลือกได้หลายไฟล์)</Button>
            </Upload>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button onClick={handleCancel}>ยกเลิก</Button>
            <Button type="primary" htmlType="submit">
              {editingId ? "บันทึกการแก้ไข" : "ส่งข้อมูล"}
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}