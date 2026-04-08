import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Space, Card, message, Input, Modal, Form, DatePicker, List, Typography } from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, DownloadOutlined, FileOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import "../../style/styleWorks/WorkByTeacherPage.css"; 

const { Text } = Typography;
const API_URL = "http://localhost:8081/api"; 
const FILE_URL = "http://localhost:8081/uploads"; 

export default function WorkByUserPage() {
  const { type, id } = useParams(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listType = searchParams.get("type") || type;
  
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  const loadUser = useCallback(async () => {
    try {
      const endpoint = type === "staff" ? "staffs" : `${type}s`; 
      const response = await axios.get(`${API_URL}/${endpoint}/${id}`);
      const user = response.data;
      if (user) {
        const fullName = `${user.prefix_th || ""}${user.first_name_th || ""} ${user.last_name_th || ""}`.trim();
        setOwnerName(fullName);
      }
    } catch (error) { console.error("Load User Error:", error); }
  }, [type, id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/works/${type}/${id}`);
      setData(response.data || []);
    } catch (error) {
      message.error("โหลดข้อมูลผลงานไม่สำเร็จ");
    } finally { setLoading(false); }
  }, [type, id]);

  useEffect(() => {
    loadUser(); 
    loadData(); 
  }, [loadUser, loadData]);

  const handleView = async (workId) => {
    try {
      const response = await axios.get(`${API_URL}/work-details/${type}/${workId}`);
      const workData = response.data;
      
      form.setFieldsValue({
        workCode: workData.work_code || workData.workCode,
        ownerName: workData.ownerName || ownerName,
        academicYear: workData.academic_year || workData.academicYear,
        date: (workData.work_date || workData.workDate) ? dayjs(workData.work_date || workData.workDate) : null,
        workName: workData.work_name || workData.workName,
        organization: workData.organization || "-",
        location: workData.location || "-",
        description: workData.description || "-",
      });

      setSelectedFiles(workData.files || []); 
      setOpen(true);
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลรายละเอียดได้");
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบผลงาน "${record.work_name || record.workName || "ไม่ระบุชื่อผลงาน"}" หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก", 
      okType: "danger", 
      okButtonProps: { danger: true, type: "primary" }, 
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/works/${type}/${record.id}`);
          message.success("ลบผลงานเรียบร้อย");
          loadData();
        } catch (error) { message.error("ลบไม่สำเร็จ"); }
      },
    });
  };

 const filteredData = data.filter((item) =>
    `${item.work_code || item.workCode || ""} ${item.work_name || item.workName || ""} ${item.academic_year || item.academicYear || ""}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: "รหัสผลงาน", 
      dataIndex: "work_code", 
      width: "20%",
      render: (text, record) => text || record.workCode || "-"
    },
    { 
      title: "ปีการศึกษา", 
      dataIndex: "academic_year", 
      width: "15%",
      render: (text, record) => text || record.academicYear || "-"
    },
    { 
      title: "ชื่อผลงาน", 
      dataIndex: "work_name", 
      width: "35%",
      render: (text, record) => text || record.workName || "-"
    },
    {
      title: "จัดการ",
      width: "30%",
      render: (_, record) => (
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record.id)}>ดู</Button>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/home/setting/work/by/${type}/${id}/edit/${record.id}?type=${listType}`, { state: record })}>แก้ไข</Button>
          <Button type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>ลบ</Button>
        </Space>
      ),
    },
  ];

  const getFileDownloadUrl = (fileName) => {
    const folders = { teacher: 'teacher_works', staff: 'staff_works', student: 'student_works' };
    return `${FILE_URL}/${folders[type]}/${fileName}`;
  };

  return (
    <div className="research-list-container">
      <Card className="research-list-card" bordered={false}>
        <Button 
          className="back-btn" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`/home/setting/work?type=${listType}`)}
        >
          กลับ
        </Button>
        
        <h2 className="page-title">รายการผลงาน {ownerName || `ของ ${type} (${id})`}</h2>
        
        <Input
          className="search-input"
          placeholder="ค้นหา รหัสผลงาน / ชื่อผลงาน / ปี"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        <Table 
          rowKey="id" 
          dataSource={filteredData} 
          columns={columns} 
          pagination={{ pageSize: 8, responsive: true }} 
          loading={loading} 
          scroll={{ x: 800 }} 
        />

        <Modal title="รายละเอียดผลงาน" open={open} onCancel={() => setOpen(false)} footer={null} width={700}>
          <Form layout="vertical" form={form} disabled>
            <Form.Item label="รหัสผลงาน" name="workCode"><Input /></Form.Item>
            <Form.Item label="ชื่อเจ้าของผลงาน" name="ownerName"><Input /></Form.Item>
            <Form.Item label="ปีการศึกษา" name="academicYear"><Input /></Form.Item>
            <Form.Item label="วัน/เดือน/ปี" name="date"><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item>
            <Form.Item label="ชื่อผลงาน" name="workName"><Input /></Form.Item>
            <Form.Item label="หน่วยงาน" name="organization"><Input /></Form.Item>
            <Form.Item label="สถานที่" name="location"><Input /></Form.Item>
            <Form.Item label="รายละเอียด" name="description"><Input.TextArea rows={4} /></Form.Item>
          </Form>
          
          <div style={{ marginTop: 24 }}>
            <Text strong>ไฟล์แนบ:</Text>
            <List
              size="small"
              bordered
              style={{ marginTop: 8 }}
              dataSource={selectedFiles}
              renderItem={(file) => (
                <List.Item actions={[
                  <a href={getFileDownloadUrl(file.file_name)} target="_blank" rel="noopener noreferrer">
                    <Button type="primary" size="small" icon={<DownloadOutlined />}>ดาวน์โหลด</Button>
                  </a>
                ]}>
                  <List.Item.Meta avatar={<FileOutlined />} title={file.original_file_name} />
                </List.Item>
              )}
              locale={{ emptyText: 'ไม่มีไฟล์แนบ' }}
            />
          </div>
        </Modal>
      </Card>
    </div>
  );
}