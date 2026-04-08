import React, { useState, useEffect } from "react";
import { Card, Table, Button, Space, Popconfirm, Input, Select, Switch, message, Tag, Modal, List, Divider } from "antd";
import { useNavigate } from "react-router-dom";
import { EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/th";
import "../../style/stylesurvey/SurveyListPage.css";

const { Search } = Input;
const { Option } = Select;

const API_URL = "http://localhost:8081/api";

export default function SurveyListPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterTarget, setFilterTarget] = useState("ทั้งหมด");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/surveys`);
      setSurveys(res.data);
    } catch (error) {
      message.error("ไม่สามารถดึงข้อมูลแบบสอบถามได้");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleView = async (record) => {
    setPreviewLoading(true);
    try {
      const res = await axios.get(`${API_URL}/surveys/${record.id}`);
      setCurrentSurvey(res.data);
      setPreviewVisible(true);
    } catch (error) {
      message.error("ไม่สามารถดึงรายละเอียดแบบสอบถามได้");
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleActive = async (record) => {
    try {
      const newStatus = !record.is_active;
      await axios.patch(`${API_URL}/surveys/${record.id}/status`, { 
        isActive: newStatus 
      });
      message.success(`เปลี่ยนสถานะเป็น ${newStatus ? "เปิด" : "ปิด"} เรียบร้อย`);
      fetchSurveys();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  const handleDelete = async (record) => {
    try {
      await axios.delete(`${API_URL}/surveys/${record.id}`);
      message.success("ลบแบบสอบถามเรียบร้อย");
      fetchSurveys();
    } catch (error) {
      message.error("ลบไม่สำเร็จ (อาจมีการใช้งานอยู่)");
    }
  };

  const filteredData = surveys.filter(survey => {
    const title = survey.title || "";
    const targetThai = survey.target_group === 'student' ? "นักศึกษา" : "บุคคลทั่วไป";
    const matchesSearch = title.toLowerCase().includes(searchText.toLowerCase());
    const matchesTarget = filterTarget === "ทั้งหมด" || targetThai === filterTarget;
    return matchesSearch && matchesTarget;
  });

  const columns = [
    { 
      title: "รหัส", 
      dataIndex: "code", 
      key: "code",
      width: 100,
    },
    { 
      title: "ชื่อแบบสอบถาม", 
      dataIndex: "title", 
      key: "title",
      width: 250,
    },
    { 
      title: "ปีการศึกษา", 
      dataIndex: "academic_year", 
      key: "academic_year",
      width: 100,
      render: (text) => text ? text : "-"
    },
    { 
      title: "วันที่สร้าง", 
      dataIndex: "created_at", 
      key: "created_at",
      width: 120,
      render: (text) => text ? dayjs(text).format("DD/MM/YYYY") : "-"
    },
    { 
      title: "กลุ่มเป้าหมาย", 
      dataIndex: "target_group", 
      key: "target_group",
      width: 120,
      render: (text) => (
        text === 'student' 
          ? <Tag color="blue">นักศึกษา</Tag> 
          : <Tag color="green">บุคคลทั่วไป</Tag>
      )
    },
    {
      title: "สถานะ",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (val, record) => (
        <Switch
          checked={!!val}
          onChange={() => toggleActive(record)}
          checkedChildren="เปิด"
          unCheckedChildren="ปิด"
        />
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      width: 250, 
      render: (_, record) => (
        <Space size="small" wrap className="slp-action-space">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            ดู
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => navigate(`/home/setting/survey/edit/${record.id}`)}
          >
            แก้ไข
          </Button>
          <Popconfirm
            title="ยืนยันการลบ?"
            description="หากลบแล้ว ข้อมูลที่เกี่ยวข้องทั้งหมดจะหายไป"
            onConfirm={() => handleDelete(record)}
            okText="ลบ"
            cancelText="ยกเลิก"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              ลบ
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="slp-container">
      <Card
        title="รายการแบบสอบถาม"
        className="slp-main-card"
        extra={
          <div className="slp-card-actions">
              <Button icon={<ReloadOutlined />} onClick={fetchSurveys}>รีเฟรช</Button>
              <Button type="primary" onClick={() => navigate("/home/setting/survey/create")}>สร้างแบบสอบถาม</Button>
          </div>
        }
      >
        <div className="slp-filter-container">
          <Search 
            placeholder="ค้นหาชื่อแบบสอบถาม" 
            allowClear 
            onSearch={setSearchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            className="slp-search-input" 
          />
          <Select 
            value={filterTarget} 
            onChange={setFilterTarget} 
            className="slp-select-filter"
          >
            <Option value="ทั้งหมด">ทั้งหมด</Option>
            <Option value="นักศึกษา">นักศึกษา</Option>
            <Option value="บุคคลทั่วไป">บุคคลทั่วไป</Option>
          </Select>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 'max-content' }} 
          className="slp-table"
        />
      </Card>

      <Modal
        title={`ตัวอย่างแบบสอบถาม: ${currentSurvey?.title || ""}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[<Button key="close" onClick={() => setPreviewVisible(false)}>ปิด</Button>]}
        width={800}
        loading={previewLoading}
      >
        {currentSurvey && (
          <div className="slp-preview-content">
            <p><b>รหัส:</b> {currentSurvey.code}</p>
            <p><b>ปีการศึกษา:</b> {currentSurvey.academic_year || currentSurvey.academicYear || "-"}</p>
            <p><b>กลุ่มเป้าหมาย:</b> {currentSurvey.target_group === 'student' ? 'นักศึกษา' : 'บุคคลทั่วไป'}</p>
            <Divider orientation="left">หัวข้อและคำถาม</Divider>
            
            {currentSurvey.mainTopics && currentSurvey.mainTopics.map((topic, tIdx) => (
              <div key={tIdx} className="slp-preview-topic">
                <h4 className="slp-preview-topic-title">
                  {tIdx + 1}. {topic.title}
                </h4>
                <List
                  size="small"
                  bordered
                  dataSource={topic.subTopics}
                  renderItem={(item, qIdx) => (
                    <List.Item>
                      {tIdx + 1}.{qIdx + 1} {item.title}
                    </List.Item>
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}