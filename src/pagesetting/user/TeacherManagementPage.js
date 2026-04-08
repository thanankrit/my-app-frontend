import React, { useState, useEffect } from "react";
import { Table, Button, Space, Card, Input, message, Modal, Tag } from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '@ant-design/v5-patch-for-react-19';
import "../../style/styleuser/TeacherManagementPage.css"; 

export default function TeacherManagementPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [modal, contextHolder] = Modal.useModal();

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8081/api/teachers");
      
      const sortedData = res.data.sort((a, b) => 
        (a.teacher_code || "").localeCompare(b.teacher_code || "", undefined, { numeric: true })
      );

      setTeachers(sortedData);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      message.error("ไม่สามารถดึงข้อมูลอาจารย์ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDeleteLogic = async (teacherCode) => {
    try {
      await axios.delete(`http://localhost:8081/api/teachers/${teacherCode}`);
      message.success("ลบผู้ใช้งานเรียบร้อยแล้ว");
      setTeachers((prev) => prev.filter((t) => t.teacher_code !== teacherCode));
    } catch (error) {
      console.error("Delete error:", error);
      const msg = error.response?.data?.message || "ลบข้อมูลล้มเหลว";
      message.error(msg);
    }
  };

  const showDeleteConfirm = (record) => {
    modal.confirm({
      title: 'แจ้งเตือนการลบข้อมูล',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          คุณต้องการลบอาจารย์ <b>"{record.short_name || record.teacher_code}"</b> ใช่หรือไม่?
          <br />
          <span style={{ color: 'gray', fontSize: '12px' }}>
            การกระทำนี้ไม่สามารถเรียกคืนข้อมูลได้
          </span>
        </div>
      ),
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      centered: true,
      maskClosable: true,
      okButtonProps: {
        danger: true,
        style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' },
      },
      async onOk() {
        await handleDeleteLogic(record.teacher_code);
      },
    });
  };

  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.prefix_th} ${t.first_name_th} ${t.last_name_th}`;
    const shortName = t.short_name || ""; 
    const code = t.teacher_code || "";
    return (
      code.toLowerCase().includes(searchText.toLowerCase()) ||          
      shortName.toLowerCase().includes(searchText.toLowerCase()) ||     
      fullName.toLowerCase().includes(searchText.toLowerCase())         
    );
  });

  const columns = [
    { 
      title: "รหัสอาจารย์", 
      dataIndex: "teacher_code", 
      key: "teacher_code", 
      align: 'center',
      sorter: (a, b) => (a.teacher_code || "").localeCompare(b.teacher_code || "", undefined, { numeric: true }),
      defaultSortOrder: 'ascend',
      showSorterTooltip: false, 
      render: (text) => text || "-"
    },
    { 
      title: "ชื่อย่อ", 
      dataIndex: "short_name", 
      key: "short_name", 
      align: 'center',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : "-"
    },
    {
      title: "ชื่อ-นามสกุล",
      key: "fullName",
      render: (_, record) => `${record.prefix_th} ${record.first_name_th} ${record.last_name_th}`,
    },
    {
      title: "สิทธิ์",
      dataIndex: "role_name",
      key: "role_name",
      align: 'center',
      render: (text) => <Tag color="geekblue">{text || "General"}</Tag>,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      align: "center",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : status === "inactive"
              ? "orange"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/home/setting/teacher/edit/${record.teacher_code}`)}
          >
            แก้ไข
          </Button>
          <Button
            size="small"
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record)}
          >
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="teacher-list-container">
      {contextHolder}
      <Card className="teacher-list-card" bordered={false}>
        <div className="header-section">
          <h2 className="page-title">รายการผู้ใช้งาน (อาจารย์)</h2>
          <div className="action-section">
            <Input
              className="teacher-search-input"
              placeholder="ค้นหา..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button
              className="btn-add-teacher"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/home/setting/adduser/teacher")}
            >
              เพิ่มผู้ใช้งาน
            </Button>
          </div>
        </div>
        <Table
          dataSource={filteredTeachers}
          columns={columns}
          rowKey="teacher_code"
          pagination={{ pageSize: 8, responsive: true }}
          loading={loading}
          className="teacher-table"
          scroll={{ x: 'max-content' }} 
        />
      </Card>
    </div>
  );
}