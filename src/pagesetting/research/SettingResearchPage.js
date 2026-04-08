import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Space, Card, Input, message, Tag } from "antd";
import { FileSearchOutlined, PlusOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../style/styleresearch/ResearchListPage.css"; 

export default function ResearchListPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [teachers, setTeachers] = useState([]); 
  const [loading, setLoading] = useState(false); 

  const API_URL = "http://localhost:8081/api";

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/teachers`);
      const allTeachers = res.data;
      const teachersWithWorksStatus = await Promise.all(
        allTeachers.map(async (t) => {
          try {
            const workRes = await axios.get(`${API_URL}/research/teacher/${t.id}`);
            return { ...t, hasWorks: workRes.data && workRes.data.length > 0 };
          } catch (err) {
            return { ...t, hasWorks: false };
          }
        })
      );
      const formattedData = teachersWithWorksStatus
        .filter((t) => t.hasWorks)
        .map((t) => {
          const prefix = t.prefix_th || t.prefix || '';
          const fName = t.first_name_th || t.firstname || t.first_name || '';
          const lName = t.last_name_th || t.lastname || t.last_name || '';
          const fNameEn = t.first_name_en || t.firstname_en || '';
          const lNameEn = t.last_name_en || t.lastname_en || '';

          return {
            id: t.id, 
            teacherCode: t.teacher_code || "-", 
            fullNameTH: `${prefix}${fName} ${lName}`.trim(),
            fullNameEN: `${fNameEn} ${lNameEn}`.trim(), 
          };
        });
      
      setTeachers(formattedData);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      message.error("ไม่สามารถดึงข้อมูลอาจารย์ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResearch = (teacherId) => {
    navigate(`/home/setting/research/by-teacher/${teacherId}`);
  };

  const handleAddResearch = () => {
    navigate("/home/setting/research/add");
  };

  const filteredData = useMemo(() => {
    return teachers.filter((item) => {
      const search = searchText.toLowerCase();
      const code = (item.teacherCode || "").toLowerCase();
      const nameTh = (item.fullNameTH || "").toLowerCase();
      const nameEn = (item.fullNameEN || "").toLowerCase();

      return code.includes(search) || nameTh.includes(search) || nameEn.includes(search);
    });
  }, [searchText, teachers]);

  const columns = [
    { 
      title: "รหัสอาจารย์", 
      dataIndex: "teacherCode", 
      key: "teacherCode", 
      width: 120, 
      align: "center",
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    { 
      title: "ชื่อ-นามสกุล", 
      key: "name", 
      minWidth: 200, 
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 500, fontSize: '1rem' }}>
                <UserOutlined style={{ marginRight: 8, color: '#888' }} />
                {record.fullNameTH}
            </span>
            {record.fullNameEN && (
                <span style={{ fontSize: '0.85rem', color: '#888', marginLeft: 24 }}>
                    {record.fullNameEN}
                </span>
            )}
        </div>
      )
    },
    {
      title: "จัดการ",
      key: "action",
      width: 150, 
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<FileSearchOutlined />}
            onClick={() => handleViewResearch(record.id)} 
          >
            ดูผลงาน
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="research-container">
      <Card className="research-card">
        <div className="research-header">
          <h2 className="research-title">รายชื่ออาจารย์ (ผลงานวิชาการ)</h2>
          <div className="research-actions">
            <Input
              className="research-search"
              placeholder="ค้นหา รหัส / ชื่อไทย / อังกฤษ"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddResearch}
              className="research-add-btn"
            >
              เพิ่มผลงาน
            </Button>
          </div>
        </div>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id" 
          pagination={{ pageSize: 8 }}
          className="research-table"
          loading={loading}
          scroll={{ x: 'max-content' }} 
        />
      </Card>
    </div>
  );
}