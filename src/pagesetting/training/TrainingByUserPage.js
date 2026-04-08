import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Modal,
  Form,
  DatePicker,
  message,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios"; 
import "../../style/styletraining/TrainingByUserPage.css";

const { RangePicker } = DatePicker;
const API_URL = "http://localhost:8081/api"; 

export default function TrainingByUserPage() {
  const navigate = useNavigate();
  const { userType, userId } = useParams();
  const [searchParams] = useSearchParams();

  const listType = searchParams.get("type") || userType;

  const [trainingList, setTrainingList] = useState([]);
  const [userName, setUserName] = useState("");
  const [searchTraining, setSearchTraining] = useState("");
  const [openView, setOpenView] = useState(false);
  const [form] = Form.useForm();


  useEffect(() => {
    const loadUser = async () => {
      try {
        const endpoint = userType === "teacher" 
          ? `${API_URL}/teachers/${userId}` 
          : `${API_URL}/staffs/${userId}`;

        const res = await axios.get(endpoint);
        const u = res.data;

        setUserName(`${u.prefix_th || ""}${u.first_name_th} ${u.last_name_th}`);
      } catch (error) {
        console.error("Load user error:", error);
        message.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      }
    };

    loadUser();
  }, [userType, userId]);


  const loadTrainings = useCallback(async () => {
    try {
      const endpoint = userType === "teacher" 
        ? `${API_URL}/teacher-trainings` 
        : `${API_URL}/staff-trainings`;

      const res = await axios.get(endpoint);

      const myTrainings = res.data
        .filter((t) => {
           const ownerId = userType === "teacher" ? t.teacher_id : t.staff_id;
           return String(ownerId) === String(userId);
        })
        .map((t) => ({
          id: t.work_code,
          dbId: t.id,
          year: t.academic_year,
          type: t.training_type, 
          trainingName: t.training_name,
          location: t.location,
          hours: t.total_hours,
          dateFrom: t.start_date,
          dateTo: t.end_date,
          userType: userType 
        }));

      setTrainingList(myTrainings);
    } catch (error) {
      console.error("Load trainings error:", error);
    }
  }, [userId, userType]); 


  useEffect(() => {
    loadTrainings();
  }, [loadTrainings]);

  const handleView = (record) => {
    form.setFieldsValue({
      id: record.id,
      year: record.year,
      type: record.type, 
      trainingName: record.trainingName,
      location: record.location,
      hours: record.hours,
      dateRange:
        record.dateFrom && record.dateTo
          ? [dayjs(record.dateFrom), dayjs(record.dateTo)]
          : [],
    });
    setOpenView(true);
  };

  const handleEdit = (record) => {
    navigate(`/home/setting/training/edit/${record.dbId}?type=${listType}`);
  };


  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ "${record.trainingName}" หรือไม่`,
      okType: "danger",
      onOk: async () => {
        try {
          const endpoint = userType === "teacher"
            ? `${API_URL}/teacher-trainings/${record.dbId}`
            : `${API_URL}/staff-trainings/${record.dbId}`;

          await axios.delete(endpoint);

          message.success("ลบเรียบร้อย");
          loadTrainings();
        } catch (error) {
          console.error(error);
          message.error("ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const filteredTrainingData = trainingList.filter((item) =>
    `${item.trainingName} ${item.location} ${item.year} ${item.id} ${item.type || ""}`
      .toLowerCase()
      .includes(searchTraining.toLowerCase())
  );


  const trainingColumns = [
    { title: "รหัส", dataIndex: "id", align: "center", width: 120 }, 
    { title: "ปีการศึกษา", dataIndex: "year", align: "center", width: 100 },
    { title: "ประเภท", dataIndex: "type", width: 180 },
    { title: "ชื่องานอบรม / สัมมนา", dataIndex: "trainingName", minWidth: 200 },
    { title: "สถานที่", dataIndex: "location", width: 200 },
    {
      title: "จัดการ",
      align: "center",
      width: 250, 
      render: (_, record) => (
        <Space wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            ดู
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            แก้ไข
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="training-user-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/home/setting/training?type=${listType}`)}
        style={{ marginBottom: 20 }}
      >
        กลับ
      </Button>

      <Card className="training-user-card">
        <div className="training-user-header">
          <div className="training-user-title">
            <strong>งานอบรม / สัมมนา ({userName})</strong>
          </div>
          <Input
            className="training-user-search"
            placeholder="ค้นหา ชื่องาน / ประเภท / สถานที่ / ปี..."
            prefix={<SearchOutlined />}
            value={searchTraining}
            onChange={(e) => setSearchTraining(e.target.value)}
          />
        </div>

        <Table
          size="middle" 
          scroll={{ x: "max-content" }} 
          dataSource={filteredTrainingData}
          columns={trainingColumns}
          rowKey="dbId" 
          pagination={{ pageSize: 8, responsive: true }}
        />
      </Card>

      <Modal
        open={openView}
        title="ดูข้อมูลงานอบรม / สัมมนา"
        onCancel={() => setOpenView(false)}
        footer={null}
        width={600}
        style={{ top: 20 }} 
      >
        <Form layout="vertical" form={form} disabled>
          <Form.Item label="รหัสผลงาน" name="id">
            <Input />
          </Form.Item>
          <Form.Item label="ปีการศึกษา" name="year">
            <Input />
          </Form.Item>
          <Form.Item label="ประเภทการจัดงาน" name="type">
            <Input />
          </Form.Item>

          <Form.Item label="ชื่องาน" name="trainingName">
            <Input />
          </Form.Item>
          <Form.Item label="สถานที่" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="วันอบรม (จาก - ถึง)" name="dateRange">
            <RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="จำนวนชั่วโมง" name="hours">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}