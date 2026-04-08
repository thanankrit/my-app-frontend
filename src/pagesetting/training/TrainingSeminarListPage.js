import React, { useState, useEffect } from "react";
import { Table, Button, Card, Input, Select, message } from "antd";
import { FileSearchOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios"; 
import "../../style/styletraining/TrainingSeminarListPage.css";

const { Option } = Select;
const API_URL = "http://localhost:8081/api"; 

export default function TrainingSeminarListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultType = searchParams.get("type") || "teacher";
  const [userType, setUserType] = useState(defaultType);
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        let usersRes, trainingsRes;
        if (userType === "teacher") {
          [usersRes, trainingsRes] = await Promise.all([
            axios.get(`${API_URL}/teachers`),
            axios.get(`${API_URL}/teacher-trainings`) 
          ]);
        } else {
          [usersRes, trainingsRes] = await Promise.all([
            axios.get(`${API_URL}/staffs`), 
            axios.get(`${API_URL}/staff-trainings`) 
          ]);
        }

        const users = usersRes.data;
        const trainings = trainingsRes.data;
        
        
        const trainingMap = trainings.reduce((acc, t) => {
          const key = userType === "teacher" ? t.teacher_id : t.staff_id;
          if (!acc[key]) acc[key] = [];
          acc[key].push(t);
          return acc;
        }, {});

        
        const formattedData = users
          .filter((u) => trainingMap[u.id] && trainingMap[u.id].length > 0) 
          .map((u) => {
            const prefix = u.prefix_th || "";
            const firstName = u.first_name_th || u.first_name || "";
            const lastName = u.last_name_th || u.last_name || "";
            const code = userType === "teacher" ? u.teacher_code : u.staff_code;
              
            return {
              dbId: u.id, 
              id: code || "-",  
              name: `${prefix}${firstName} ${lastName}`.trim(),
              trainings: trainingMap[u.id], 
            };
          });

        setData(formattedData);

      } catch (error) {
        console.error("Error loading data:", error);
        message.error("โหลดข้อมูลไม่สำเร็จ");
      }
    };

    loadData();
  }, [userType]);

  const handleChangeType = (value) => {
    setUserType(value);
    setSearchParams({ type: value });
  };

  const handleAddTraining = () => {
    navigate("/home/setting/training/add");
  };

  const handleViewTraining = (record) => {
    navigate(`/home/setting/training/user/${userType}/${record.dbId}?type=${userType}`);
  };

  const filteredUserData = data.filter(
    (item) =>
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const userColumns = [
    {
      title: userType === "teacher" ? "รหัสอาจารย์" : "รหัสเจ้าหน้าที่",
      dataIndex: "id", 
      align: "center",
      width: 150,
    },
    {
      title: userType === "teacher" ? "ชื่ออาจารย์" : "ชื่อเจ้าหน้าที่",
      dataIndex: "name",
      minWidth: 200,
    },
    {
      title: "จัดการ",
      align: "center",
      width: 200,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FileSearchOutlined />}
          onClick={() => handleViewTraining(record)}
        >
          ดูงานอบรม / สัมมนา
        </Button>
      ),
    },
  ];

  return (
    <div className="training-container">
      <Card className="training-card">
        <div className="training-header">
          <h2 className="training-title">รายการงานอบรม / สัมมนา</h2>

          <div className="training-actions">
            <Select 
              value={userType} 
              onChange={handleChangeType} 
              className="training-select"
            >
              <Option value="teacher">อาจารย์</Option>
              <Option value="staff">เจ้าหน้าที่</Option>
            </Select>

            <Input
              placeholder="ค้นหา รหัส / ชื่อ"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="training-search"
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTraining}
              className="training-add-btn"
            >
              เพิ่มงานอบรม / สัมมนา
            </Button>
          </div>
        </div>

        <Table
          className="training-table"
          dataSource={filteredUserData}
          columns={userColumns}
          rowKey="id"
          pagination={{ pageSize: 8, responsive: true }}
          scroll={{ x: "max-content" }} 
        />
      </Card>
    </div>
  );
}