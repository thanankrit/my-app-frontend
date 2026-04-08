import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Avatar,
  Table,
  message,
  Select,
  Input,
  Modal,
  Form,
  DatePicker,
  List,
  Tooltip,
  Empty,
} from "antd";
import { 
  UserOutlined, 
  ArrowLeftOutlined, 
  EyeOutlined, 
  FilePdfOutlined, 
  PaperClipOutlined 
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../style/MainTraining.css";

const { Option } = Select;
const API_URL = "http://localhost:8081/api"; 
const UPLOAD_URL = "http://localhost:8081/uploads"; 
const TEACHER_IMG_URL = "http://localhost:8081/uploads/teachers";
const STAFF_IMG_URL = "http://localhost:8081/uploads/staffs";

export default function TrainingMainPage() {
  const [selectedType, setSelectedType] = useState(
    () => localStorage.getItem("selectedType") || "teacher"
  );
  
  const [list, setList] = useState([]); 
  const [selectedPerson, setSelectedPerson] = useState(null); 
  const [trainingList, setTrainingList] = useState([]); 
  const [allTrainings, setAllTrainings] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalFiles, setModalFiles] = useState([]); 
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const personEndpoint = selectedType === "teacher" ? "/teachers" : "/staffs";
        const trainingEndpoint = selectedType === "teacher" ? "/teacher-trainings" : "/staff-trainings";

        const [personRes, trainingRes] = await Promise.all([
          axios.get(`${API_URL}${personEndpoint}`),
          axios.get(`${API_URL}${trainingEndpoint}`)
        ]);

        const peopleData = personRes.data;
        const trainingData = trainingRes.data;

        setAllTrainings(trainingData); 

        const currentImgBaseUrl = selectedType === "teacher" ? TEACHER_IMG_URL : STAFF_IMG_URL;

        const peopleWithTrainings = peopleData.filter((p) => {
          if (selectedType === "teacher") {
            return trainingData.some((t) => t.teacher_id === p.id);
          } else {
            return trainingData.some((t) => t.staff_id === p.id);
          }
        });

        const mappedPeople = peopleWithTrainings.map(p => ({
            id: p.id,
            prefixTH: p.prefix_th || p.prefix || "", 
            firstNameTH: p.first_name_th || p.first_name || p.staff_name, 
            lastNameTH: p.last_name_th || p.last_name || p.staff_lastname,
            shortName: p.short_name || p.teacher_code || p.staff_code, 
            image: p.photo ? `${currentImgBaseUrl}/${p.photo}` : null 
        }));

        setList(mappedPeople);

      } catch (error) {
        console.error(error);
        message.error("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedType]);

  const handleTypeChange = (value) => {
    setSelectedType(value);
    localStorage.setItem("selectedType", value);
    setSelectedPerson(null);
    setTrainingList([]);
    setSearchText("");
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setLoading(true);
    
    const personTrainings = allTrainings.filter(t => 
       selectedType === "teacher" 
         ? t.teacher_id === person.id 
         : t.staff_id === person.id
    );

    const mappedTrainings = personTrainings.map(t => ({
        id: t.id,
        workCode: t.work_code,
        type: t.training_type, 
        trainingName: t.training_name,
        location: t.location,
        year: t.academic_year,
        dateFrom: t.start_date,
        dateTo: t.end_date,
        hours: t.total_hours,
    }));

    setTrainingList(mappedTrainings);
    setLoading(false);
  };

  const getFullName = (p) =>
    `${p.prefixTH || ""}${p.firstNameTH || ""} ${p.lastNameTH || ""}`.trim();


  const handleViewTraining = async (record) => {
    setLoading(true);
    try {
        const endpoint = selectedType === "teacher" 
            ? `/teacher-trainings/${record.id}`
            : `/staff-trainings/${record.id}`;
        
        const res = await axios.get(`${API_URL}${endpoint}`);
        const data = res.data;

        setModalFiles(data.files || []); 

        setModalOpen(true);
        form.setFieldsValue({
            id: data.work_code,
            year: data.academic_year,
            type: data.training_type, 
            ownerName: getFullName(selectedPerson),
            trainingName: data.training_name,
            location: data.location,
            dateRange: data.start_date && data.end_date
                ? [dayjs(data.start_date), dayjs(data.end_date)]
                : [],
            hours: data.total_hours,
            description: data.description || "-",
        });

    } catch (error) {
        console.error(error);
        message.error("ไม่สามารถดึงรายละเอียดได้");
    } finally {
        setLoading(false);
    }
  };

  const filteredTrainingList = trainingList.filter((t) =>
    t.trainingName?.toLowerCase().includes(searchText.toLowerCase()) || 
    t.workCode?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.type?.toLowerCase().includes(searchText.toLowerCase()) 
  );

  const columns = [
    { title: "รหัส", dataIndex: "workCode", width: 90, align: "center" },
    { title: "ปี", dataIndex: "year", width: 60, align: "center" },
    { 
      title: "ประเภท", 
      dataIndex: "type", 
      width: 130, 
      ellipsis: true, 
    },
    { 
      title: "ชื่องาน", 
      dataIndex: "trainingName",
      ellipsis: true, 
    },
    { 
      title: "สถานที่", 
      dataIndex: "location", 
      width: 140, 
      ellipsis: true, 
    },
    {
      title: "วันอบรม",
      dataIndex: "dateFrom",
      width: 160,
      align: "center",
      render: (_, record) =>
        record.dateFrom && record.dateTo
          ? `${dayjs(record.dateFrom).format("DD/MM/YY")} - ${dayjs(record.dateTo).format("DD/MM/YY")}`
          : "-"
    },
    {
      title: "ดู",
      width: 60, 
      align: "center",
      fixed: 'right', 
      render: (_, record) => (
        <Tooltip title="ดูรายละเอียด">
          <Button 
              type="primary"
              size="small"
              shape="circle" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewTraining(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="training-main-container">
      {!selectedPerson && (
        <Row gutter={[16, 16]} align="middle" className="training-header-row" style={{ marginBottom: 24 }}>
          <Col xs={24} md={16}>
            <div className="training-header" style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ข้อมูลอบรม/สัมมนา อาจารย์ และเจ้าหน้าที่
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Select
              size="large"
              value={selectedType}
              onChange={handleTypeChange}
              className="type-select-responsive"
              style={{ width: '100%', maxWidth: 300 }}
            >
              <Option value="teacher">อาจารย์</Option>
              <Option value="staff">เจ้าหน้าที่</Option>
            </Select>
          </Col>
        </Row>
      )}

      {!selectedPerson && list.length > 0 && (
        <Row gutter={[16, 16]} className="person-grid">
          {list.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card
                className="person-card"
                hoverable
                loading={loading}
                onClick={() => handleSelectPerson(item)}
              >
                <Avatar 
                    size={80} 
                    src={item.image}
                    icon={<UserOutlined />} 
                    style={{ marginBottom: 10 }}
                />
                <div className="person-name">
                    {getFullName(item)}
                </div>
                <div className="person-shortname" style={{ color: '#666', marginTop: 4 }}>
                    {item.shortName || "-"}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {!selectedPerson && list.length === 0 && !loading && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Empty description="ไม่พบข้อมูลบุคคลที่มีผลงาน" />
        </div>
      )}

      {selectedPerson && (
        <Card
          title={
            <Row justify="space-between" align="middle" gutter={[8, 8]}>
              <Col>
                <Space>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setSelectedPerson(null)}
                  >
                    กลับ
                  </Button>
                  <span className="person-title-text">ประวัติ: {getFullName(selectedPerson)}</span>
                </Space>
              </Col>
            </Row>
          }
          style={{ marginTop: 20 }}
        >
          <div className="table-header-responsive">
            <Input
              placeholder="ค้นหาชื่องาน, รหัส หรือประเภท..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input-responsive"
              style={{ marginBottom: 16, maxWidth: 300 }}
            />
          </div>

          <Table
            bordered
            size="small"
            scroll={{ x: 800 }} 
            rowKey="id"
            columns={columns}
            dataSource={filteredTrainingList}
            loading={loading}
            pagination={{ pageSize: 10, size: "small" }}
          />
        </Card>
      )}

      <Modal
        title="รายละเอียดอบรม/สัมมนา"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
            <Button key="close" onClick={() => setModalOpen(false)}>ปิด</Button>
        ]}
        width={700}
        centered
      >
        <Form layout="vertical" form={form} disabled>
            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item label="รหัสงาน" name="id"><Input /></Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item label="ปีการศึกษา" name="year"><Input /></Form.Item>
                </Col>
            </Row>

          <Form.Item label="ประเภทการจัดงาน" name="type">
            <Input />
          </Form.Item>
          
          <Form.Item label="ชื่อผู้เข้าร่วม" name="ownerName">
            <Input />
          </Form.Item>
          <Form.Item label="ชื่องาน" name="trainingName">
            <Input />
          </Form.Item>
          <Form.Item label="สถานที่" name="location">
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
              <Col xs={24} sm={16}>
                 <Form.Item label="วันอบรม" name="dateRange">
                    <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                 </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                 <Form.Item label="จำนวนชั่วโมง" name="hours">
                    <Input suffix="ชม." />
                 </Form.Item>
              </Col>
          </Row>
            
          <Form.Item label="รายละเอียดเพิ่มเติม" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <div style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                <PaperClipOutlined /> ไฟล์แนบ ({modalFiles.length})
            </div>
            
            {modalFiles.length > 0 ? (
                <List
                    size="small"
                    bordered
                    dataSource={modalFiles}
                    renderItem={(file, index) => (
                        <List.Item>
                            <a 
                                href={`${UPLOAD_URL}/${file.file_path}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
                            >
                                <FilePdfOutlined style={{ color: 'red', marginTop: 4 }} /> 
                                <span style={{ wordBreak: 'break-all' }}>{index + 1}. {file.file_name}</span>
                            </a>
                        </List.Item>
                    )}
                />
            ) : (
                <div style={{ color: '#999', fontStyle: 'italic' }}>ไม่มีไฟล์แนบ</div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
}