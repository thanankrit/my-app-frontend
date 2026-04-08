import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Input,
  message,
  Modal,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "@ant-design/v5-patch-for-react-19";
import "../../style/styleuser/StaffManagementPage.css";

export default function StaffManagementPage() {
  const navigate = useNavigate();

  const [staffs, setStaffs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [modal, contextHolder] = Modal.useModal();
  
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const roleRes = await axios.get("http://localhost:8081/api/permissions");
      setRoles(roleRes.data);

      const staffRes = await axios.get("http://localhost:8081/api/staffs");
      const rawData = staffRes.data;
      rawData.sort((a, b) =>
        a.staff_code.localeCompare(b.staff_code, undefined, { numeric: true })
      );

      setStaffs(rawData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getUserTypeName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "ไม่ระบุ";
  };

  const handleDeleteLogic = async (id) => {
    try {
      await axios.delete(`http://localhost:8081/api/staffs/${id}`);
      message.success("ลบผู้ใช้งานเรียบร้อยแล้ว");
      fetchAllData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล";
      message.error(errMsg);
    }
  };

  const showDeleteConfirm = (record) => {
    modal.confirm({
      title: "แจ้งเตือนการลบข้อมูล",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          คุณต้องการลบผู้ใช้งาน
          <br />
          <b>
            "{record.prefix_th} {record.first_name_th} {record.last_name_th}"
          </b>
          <br />
          <span style={{ color: "gray", fontSize: 12 }}>
            การกระทำนี้ไม่สามารถเรียกคืนข้อมูลได้
          </span>
        </div>
      ),
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await handleDeleteLogic(record.id); 
      },
    });
  };

  const filteredStaffs = staffs.filter((s) => {
    const fullName = `${s.prefix_th} ${s.first_name_th} ${s.last_name_th}`;
    return (
      s.staff_code.toLowerCase().includes(searchText.toLowerCase()) ||
      fullName.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const columns = [
    {
      title: "รหัสเจ้าหน้าที่",
      dataIndex: "staff_code", 
      key: "staff_code",
      align: "center",
      sorter: (a, b) =>
        a.staff_code.localeCompare(b.staff_code, undefined, { numeric: true }),
    },
    {
      title: "ชื่อเจ้าหน้าที่",
      key: "fullName",
      render: (_, record) =>
        `${record.prefix_th} ${record.first_name_th} ${record.last_name_th}`,
    },
    {
      title: "สิทธิ์",
      dataIndex: "role_id", 
      align: "center",
      render: (roleId) => (
        <Tag color="blue">{getUserTypeName(roleId)}</Tag>
      ),
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
      align: "center",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() =>
                navigate(`/home/setting/staff/edit/${record.staff_code}`)
            }
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
    <div className="staff-list-container">
      {contextHolder}

      <Card className="staff-list-card" bordered={false}>
        <div className="header-section">
          <h2 className="page-title">
            รายการผู้ใช้งาน (บุคลากร)
          </h2>

          <div className="action-section">
            <Input
              className="staff-search-input"
              placeholder="ค้นหาชื่อ หรือ รหัส..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button
              className="btn-add-staff"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/home/setting/adduser/staff")}
            >
              เพิ่มผู้ใช้งาน
            </Button>
          </div>
        </div>

        <Table
          dataSource={filteredStaffs}
          columns={columns}
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10, responsive: true }}
          className="staff-table"
          scroll={{ x: 'max-content' }} 
        />
      </Card>
    </div>
  );
}