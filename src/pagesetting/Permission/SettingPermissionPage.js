import React, { useEffect, useState } from "react";
import { Table, Button, Space, Card, Input, message, Modal } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/stylePermission/PermissionPage.css";

const API_URL = "http://localhost:8081/api/permissions";

export default function PermissionPage() {
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const permissionLabel = {
    view_basic_data: "ดูข้อมูลพื้นฐาน",
    view_reports: "เข้าถึงและสร้างรายงาน",
    manage_settings: "เข้าถึงเมนูตั้งค่าระบบ",
    manage_research: "จัดการข้อมูลงานวิจัย",
    manage_training: "จัดการข้อมูลการอบรม",
    manage_works: "จัดการข้อมูลผลงาน",
    manage_permissions: "จัดการสิทธิ์การใช้งานระบบ",
    manage_surveys: "จัดการแบบประเมิน",
    manage_interns: "จัดการข้อมูลนักศึกษาฝึกงาน (สำหรับ Admin)", 
    view_internship: "ยื่นและดูข้อมูลฝึกงาน (สำหรับนักศึกษา)", 
    manage_users: "จัดการผู้ใช้งาน",
    manage_insurance_reports: "จัดการรายงานสำหรับส่งประกัน" 
};

  const [modal, contextHolder] = Modal.useModal();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      message.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteLogic = async (record) => {
    try {
      await axios.delete(`${API_URL}/${record.id}`);
      message.success("ลบข้อมูลเรียบร้อย");
      loadData(); 
    } catch (err) {
      console.error("Delete error:", err);
      message.error("เกิดข้อผิดพลาดในการลบ");
    }
  };

  const showDeleteConfirm = (record) => {
    if (record.name.toLowerCase() === "superadmin") {
      message.warning("ไม่สามารถลบประเภท Superadmin ได้");
      return;
    }

    modal.confirm({
      title: 'แจ้งเตือนการลบข้อมูล',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          คุณต้องการลบข้อมูล <b>"{record.name}"</b> ใช่หรือไม่?
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
        style: {
          backgroundColor: '#ff4d4f',
          borderColor: '#ff4d4f',
        },
      },
      async onOk() {
        await handleDeleteLogic(record);
      },
    });
  };

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: "ลำดับ", 
      render: (_, __, index) => index + 1, 
      width: "10%", 
      align: 'center' 
    },
    { 
      title: "ชื่อประเภทผู้ใช้งาน", 
      dataIndex: "name", 
      width: "25%" 
    },
    {
      title: "สิทธิ์",
      dataIndex: "permissions",
      width: "45%",
      render: (perms) =>
        Array.isArray(perms) && perms.length > 0
          ? perms.map(p => permissionLabel[p] || p).join(", ")
          : "-"
    },
    {
      title: "จัดการ",
      align: "center",
      width: 200,
      render: (_, record) => (
        <Space wrap justifyContent="center">
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/home/setting/permission/edit/${record.id}`)}
          >
            แก้ไข
          </Button>
          <Button
            type="primary"
            size="small"
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
    <div className="permission-container">
      {contextHolder}
      <Card className="permission-card">
        <div className="permission-header">
          <h2 className="permission-title">รายการประเภทผู้ใช้งาน</h2>
          <div className="permission-actions">
            <Input
              className="permission-search"
              placeholder="ค้นหา..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/home/setting/permission/add")}
              className="permission-add-btn"
            >
              เพิ่มประเภท
            </Button>
          </div>
        </div>
        
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="permission-table"
          scroll={{ x: 800 }} 
        />
      </Card>
    </div>
  );
}