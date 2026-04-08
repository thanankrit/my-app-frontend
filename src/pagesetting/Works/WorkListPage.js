import React, { useEffect, useState } from "react";
import { Table, Button, Space, Card, Input, Select, message } from "antd";
import { FileSearchOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

import "../../style/styleWorks/WorkListPage.css";

const { Option } = Select;
const API_URL = "http://localhost:8081/api"; 

export default function WorkListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultType = searchParams.get("type") || "teacher";
  const [userType, setUserType] = useState(defaultType);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    loadData(userType);
  }, [userType]);

  const loadData = async (type) => {
    setLoading(true);
    try {
      const endpoint = 
        type === "teacher" ? "/work-summary/teachers" :
        type === "staff" ? "/work-summary/staffs" : "/work-summary/students";

      const response = await axios.get(`${API_URL}${endpoint}`);
      const formattedData = response.data.map((user) => ({
        id: user.id, 
        code: user.code,
        name: `${user.prefix_th || ""}${user.first_name_th || ""} ${user.last_name_th || ""}`,
        type: type,
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Fetch Error:", error);
      message.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeType = (value) => {
    setUserType(value);
    setSearchParams({ type: value });
    setSearchText(""); 
  };

  const handleViewWork = (record) => {
    navigate(
      `/home/setting/work/by/${record.type}/${record.id}?type=${userType}`
    );
  };

  const handleAddWork = () => {
    navigate("/home/setting/work/add");
  };

  const filteredData = data.filter((item) => {
    const keyword = searchText.toLowerCase();
    return (
      item.code.toLowerCase().includes(keyword) || 
      item.name.toLowerCase().includes(keyword)
    );
  });

  const columns = [
    {
      title:
        userType === "teacher"
          ? "รหัสอาจารย์"
          : userType === "staff"
          ? "รหัสเจ้าหน้าที่"
          : "รหัสนักศึกษา",
      dataIndex: "code", 
      width: "25%",
    },
    {
      title:
        userType === "teacher"
          ? "ชื่ออาจารย์"
          : userType === "staff"
          ? "ชื่อเจ้าหน้าที่"
          : "ชื่อนักศึกษา",
      dataIndex: "name",
      width: "45%",
    },
    {
      title: "จัดการ",
      width: "30%",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => handleViewWork(record)}
          >
            ดูผลงาน
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="work-list-container">
      <Card className="work-list-card" bordered={false}>
        <div className="work-header-section">
          <h2 className="work-page-title">รายการผลงาน</h2>

          <div className="work-header-actions">
            <Select 
              value={userType} 
              onChange={handleChangeType} 
              className="work-select"
            >
              <Option value="teacher">อาจารย์</Option>
              <Option value="staff">เจ้าหน้าที่</Option>
              <Option value="student">นักศึกษา</Option>
            </Select>

            <Input
              placeholder="ค้นหา รหัส / ชื่อ"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="work-search-input"
              allowClear
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddWork}
              className="work-add-btn"
            >
              เพิ่มผลงาน
            </Button>
          </div>
        </div>
        <Table
          rowKey="id"
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 8, responsive: true }}
          loading={loading} 
          className="work-table"
          scroll={{ x: 700 }} 
        />
      </Card>
    </div>
  );
}