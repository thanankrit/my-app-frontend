import React, { useEffect, useState } from "react";
import { 
  Card, Button, Avatar, Table, message, Select, Input, Modal, Form, 
  DatePicker, List, Typography, Row, Col, Empty
} from "antd";
import { UserOutlined, ArrowLeftOutlined, EyeOutlined, DownloadOutlined, FileOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../style/MainWork.css";

const { Option } = Select;
const { Text } = Typography;

const API_URL = "http://localhost:8081/api";
const FILE_URL = "http://localhost:8081/uploads";
const TEACHER_IMG_URL = "http://localhost:8081/uploads/teachers";
const STAFF_IMG_URL = "http://localhost:8081/uploads/staffs";

export default function WorkMainPage() {
  const [selectedType, setSelectedType] = useState("teacher");
  const [list, setList] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [workList, setWorkList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [form] = Form.useForm();

  const getFullName = (p) => {
    if (!p) return "";
    return `${p.prefix_th || p.prefixTH || ""}${p.first_name_th || p.firstNameTH || ""} ${p.last_name_th || p.lastNameTH || ""}`.trim();
  };

  const getPersonId = (p) => {
    return p.code || p.id;
  };

  useEffect(() => {
    if (!selectedType) return;

    const fetchList = async () => {
      setLoading(true);
      try {
        const endpoint = `/work-summary/${selectedType}s`; 
        const res = await axios.get(`${API_URL}${endpoint}`);
        const peopleData = res.data || [];

        let currentImgBaseUrl = "";
        if (selectedType === "teacher") currentImgBaseUrl = TEACHER_IMG_URL;
        else if (selectedType === "staff") currentImgBaseUrl = STAFF_IMG_URL;

        const mappedPeople = peopleData.map(p => ({
          ...p,
          shortName: p.short_name || "",
          image: p.photo ? `${currentImgBaseUrl}/${encodeURIComponent(p.photo)}` : null
        }));

        setList(mappedPeople);
      } catch (error) {
        console.error("Fetch People Error:", error);
        message.error("โหลดข้อมูลรายชื่อไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [selectedType]);

  const handleTypeChange = (value) => {
    setSelectedType(value);
    setSelectedPerson(null);
    setWorkList([]);
    setSearchText("");
  };

  const handleSelectPerson = async (person) => {
    setSelectedPerson(person);
    setLoading(true);
    const userId = person.id; 

    try {
      const res = await axios.get(`${API_URL}/works/${selectedType}/${userId}`);
      setWorkList(res.data || []);
    } catch (error) {
      console.error("Fetch Works Error:", error);
      message.error("โหลดข้อมูลผลงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleViewWork = async (work) => {
    try {
      const response = await axios.get(`${API_URL}/work-details/${selectedType}/${work.id}`);
      const workData = response.data;
      setModalOpen(true);

      const finalWorkCode = workData.workCode || workData.work_code || workData.id;
      const finalAcademicYear = workData.academicYear || workData.academic_year;
      const finalWorkName = workData.workName || workData.work_name;
      const finalWorkDate = workData.workDate || workData.work_date;

      form.setFieldsValue({
        id: finalWorkCode,
        ownerName: workData.ownerName || getFullName(selectedPerson),
        academicYear: finalAcademicYear,
        date: finalWorkDate ? dayjs(finalWorkDate) : null,
        workName: finalWorkName,
        organization: workData.organization || "-",
        location: workData.location || "-",
        description: workData.description || "-",
      });
      setSelectedFiles(workData.files || []);
    } catch (error) {
      console.error("View Work Details Error:", error);
      message.error("โหลดข้อมูลรายละเอียดไม่สำเร็จ");
    }
  };

  const getFileDownloadUrl = (fileName) => {
    let folder = "";
    if (selectedType === "teacher") folder = "teacher_works";
    else if (selectedType === "staff") folder = "staff_works";
    else if (selectedType === "student") folder = "student_works";
    return `${FILE_URL}/${folder}/${encodeURIComponent(fileName)}`;
  };

  const filteredWorkList = workList.filter((w) => {
    const searchString = `${w.work_code || ""} ${w.work_name || ""} ${w.academic_year || ""}`.toLowerCase();
    return searchString.includes(searchText.toLowerCase());
  });

  const columns = [
    { 
      title: "รหัสผลงาน", 
      dataIndex: "work_code", 
      key: "work_code",
      width: 120,
      fixed: 'left', 
      render: (text, record) => text || record.id 
    },
    { 
      title: "ชื่อผลงาน", 
      dataIndex: "work_name", 
      key: "work_name",
      minWidth: 200
    },
    { 
      title: "ปีการศึกษา", 
      dataIndex: "academic_year", 
      key: "academic_year", 
      width: 100,
      align: "center"
    },
    {
      title: "หน่วยงาน/สถานที่",
      width: 200,
      render: (_, r) => {
        const org = r.organization || "-";
        const loc = r.location || "-";
        return `${org} / ${loc}`;
      },
    },
    {
      title: "ดูข้อมูล",
      width: 100,
      align: "center",
      fixed: 'right', 
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={() => handleViewWork(record)}
          size="small"
        />
      ),
    },
  ];

  return (
    <div className="work-page-wrapper">
      <Card 
        variant="outlined" 
        title={<span className="card-title-large">ข้อมูลผลงาน</span>}
        className="work-main-container"
      >
        {!selectedPerson && (
          <div className="work-header-row">
            <div className="work-type-select">
              <Select
                size="large"
                value={selectedType}
                onChange={handleTypeChange}
                style={{ width: '100%', minWidth: 220 }}
              >
                <Option value="teacher">อาจารย์</Option>
                <Option value="staff">เจ้าหน้าที่</Option>
                <Option value="student">นักศึกษา</Option>
              </Select>
            </div>
          </div>
        )}

        {!selectedPerson && list.length > 0 && (
          <Row gutter={[16, 16]} className="teacher-grid">
            {list.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={getPersonId(item)}>
                <Card
                  variant="outlined"
                  hoverable
                  className="teacher-select-card"
                  onClick={() => handleSelectPerson(item)}
                >
                  <Avatar 
                    size={100} 
                    src={item.image} 
                    icon={!item.image && <UserOutlined />} 
                  />
                  <div className="teacher-info">
                    <div className="teacher-name">{getFullName(item)}</div>
                    <div className="teacher-id">
                      {selectedType === "teacher" 
                        ? item.shortName || "-" 
                        : `${getPersonId(item)}`
                      }
                    </div>
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
            variant="outlined"
            className="research-table-card"
            title={
              <div className="table-header-flex">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => setSelectedPerson(null)}
                  className="back-btn"
                >
                  กลับ
                </Button>
                <span className="table-title">ผลงานของ {getFullName(selectedPerson)}</span>
              </div>
            }
          >
            <Input
              placeholder="ค้นหา รหัสผลงาน / ชื่อผลงาน / ปี"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, maxWidth: 350, width: '100%' }}
            />

            <Table
              bordered
              rowKey="id"
              columns={columns}
              dataSource={filteredWorkList}
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }} 
            />
          </Card>
        )}

        <Modal
          title="รายละเอียดผลงาน"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          footer={null}
          width={700}
          className="responsive-modal"
          centered
        >
          <Form layout="vertical" form={form} disabled className="work-detail-form">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="รหัสผลงาน" name="id"><Input /></Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="ปีการศึกษา" name="academicYear"><Input /></Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="ชื่อเจ้าของผลงาน" name="ownerName"><Input /></Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="ชื่อผลงาน" name="workName"><Input /></Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="วัน/เดือน/ปี" name="date">
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="หน่วยงาน" name="organization"><Input /></Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="สถานที่" name="location"><Input /></Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="รายละเอียด" name="description">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div className="file-section">
            <Text strong style={{ display: "block", marginBottom: 8 }}>ไฟล์แนบ:</Text>
            {selectedFiles.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={selectedFiles}
                renderItem={(file) => (
                  <List.Item
                    actions={[
                      <a href={getFileDownloadUrl(file.file_name)} target="_blank" rel="noopener noreferrer" key="download">
                        <Button type="primary" size="small" icon={<DownloadOutlined />}>ดาวน์โหลด</Button>
                      </a>
                    ]}
                  >
                    <List.Item.Meta avatar={<FileOutlined />} title={file.original_file_name} />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">ไม่มีไฟล์แนบ</Text>
            )}
          </div>
        </Modal>
      </Card>
    </div>
  );
}