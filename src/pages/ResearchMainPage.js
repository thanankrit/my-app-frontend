import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Tag,
  Row,
  Col,
  Avatar,
  Button,
  message,
  Modal,
  Descriptions,
  Dropdown,
  Empty,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  FilePdfOutlined,
  PaperClipOutlined 
} from "@ant-design/icons";
import axios from "axios";

import "./../style/MainResearch.css";

const { Search } = Input;

export default function ResearchMainPage() {
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [researchList, setResearchList] = useState([]);
  
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState(""); 
  const [loading, setLoading] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);

  const API_URL = "http://localhost:8081/api";
  const UPLOAD_URL = "http://localhost:8081/uploads"; 
  const TEACHER_IMG_URL = "http://localhost:8081/uploads/teachers";
  
  useEffect(() => {
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
        const mappedTeachers = teachersWithWorksStatus
          .filter((t) => t.hasWorks)
          .map((t) => ({
            id: t.id,
            shortName: t.short_name || "-",
            prefixTH: t.prefix_th || t.prefix,
            firstNameTH: t.first_name_th || t.firstname,
            lastNameTH: t.last_name_th || t.lastname,
            image: t.photo ? `${TEACHER_IMG_URL}/${encodeURIComponent(t.photo)}` : null,
          }));

        setTeacherList(mappedTeachers);
      } catch (err) {
        console.error(err);
        message.error("โหลดรายชื่ออาจารย์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    setSearchText("");
    setFilterType("");
    setFilterYear(""); 
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/research/teacher/${teacher.id}`);

      const mappedData = res.data.map((item) => {
        const authors = typeof item.authors === "string" ? JSON.parse(item.authors || "[]") : item.authors || [];
        const files = typeof item.files === "string" ? JSON.parse(item.files || "[]") : item.files || [];
        const authorNames = authors.map((a) =>
          `${a.first_name || a.firstName || ""} ${a.last_name || a.lastName || ""}`.trim()
        );

        let commonData = {
          id: item.work_code || item.id,
          type: item.type,
          year: item.academic_year, 
          academicYear: item.academic_year,
          authors: authorNames,
          author: authorNames.join(", "),
          files: files,
          fileLink: item.external_link || item.document_link || "",
        };

        if (item.type === "research") {
          return {
            ...commonData,
            researchName: item.research_name,
            projectName: item.project_name,
            organization: item.organization,
            location: item.location,
            budget: item.budget,
            date: item.start_date,
          };
        } else if (item.type === "journal") {
          return {
            ...commonData,
            titleName: item.title_name,
            journalName: item.journal_name,
            volume: item.volume,
            page: item.page_no,
          };
        } else if (item.type === "conference") {
          return {
            ...commonData,
            articleTitle: item.article_title,
            conferenceName: item.conference_name,
            conferenceLocation: item.location,
            date: item.conference_date,
          };
        } else if (item.type === "book") { 
            return {
              ...commonData,
              bookName: item.book_name,
              subject: item.subject,
              semester: item.semester,
            };
        }
        return commonData;
      });
      mappedData.sort((a, b) => {
        const yearA = Number(a.year) || 0;
        const yearB = Number(b.year) || 0;
        if (yearA !== yearB) return yearA - yearB; 
        return getTitle(a).localeCompare(getTitle(b), 'th');
      });

      setResearchList(mappedData);
    } catch (err) {
      console.error(err);
      message.error("โหลดข้อมูลงานวิจัยไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTeacher(null);
    setResearchList([]);
  };

  const handleViewDetail = (record) => {
    setSelectedWork(record);
    setOpenDetail(true);
  };

  const getTitle = (item) => {
    if (item.type === "research") return item.researchName;
    if (item.type === "journal") return item.titleName || item.journalName;
    if (item.type === "conference") return item.articleTitle || item.conferenceName;
    if (item.type === "book") return item.bookName; 
    return "-";
  };
  
  const availableYears = [...new Set(researchList.map((item) => item.year).filter((y) => y))]
    .sort((a, b) => b - a);

  const filteredData = researchList.filter((item) => {
    const text = searchText.toLowerCase();
    const idMatch = String(item.id).toLowerCase().includes(text);
    const titleMatch = getTitle(item)?.toLowerCase().includes(text);
    const matchText = idMatch || titleMatch;
    const matchType = !filterType || item.type === filterType;
    const matchYear = !filterYear || String(item.year) === filterYear;
    return matchText && matchType && matchYear;
  });

  const renderDetailByType = (work) => {
    if (!work) return null;
    switch (work.type) {
      case "research":
        return (
          <>
            <Descriptions.Item label="ชื่องานวิจัย">{work.researchName}</Descriptions.Item>
            <Descriptions.Item label="ชื่อโครงการ">{work.projectName || "-"}</Descriptions.Item>
            <Descriptions.Item label="ผู้วิจัย">{work.author}</Descriptions.Item>
            <Descriptions.Item label="หน่วยงาน">{work.organization}</Descriptions.Item>
            <Descriptions.Item label="สถานที่">{work.location}</Descriptions.Item>
            <Descriptions.Item label="งบประมาณ">
              {work.budget ? `${Number(work.budget).toLocaleString()} บาท` : "-"}
            </Descriptions.Item>
          </>
        );
      case "journal":
        return (
          <>
            <Descriptions.Item label="ชื่อบทความ">{work.titleName}</Descriptions.Item>
            <Descriptions.Item label="ชื่อวารสาร">{work.journalName}</Descriptions.Item>
            <Descriptions.Item label="รายชื่อผู้แต่ง">{work.author}</Descriptions.Item>
            <Descriptions.Item label="เล่ม">{work.volume}</Descriptions.Item>
            <Descriptions.Item label="หน้า">{work.page}</Descriptions.Item>
          </>
        );
      case "conference":
        return (
          <>
            <Descriptions.Item label="ชื่อบทความ">{work.articleTitle}</Descriptions.Item>
            <Descriptions.Item label="ชื่อการประชุม">{work.conferenceName}</Descriptions.Item>
            <Descriptions.Item label="รายชื่อผู้แต่ง">{work.author}</Descriptions.Item>
            <Descriptions.Item label="สถานที่จัด">{work.conferenceLocation}</Descriptions.Item>
            <Descriptions.Item label="วันที่จัด">
              {work.date ? new Date(work.date).toLocaleDateString("th-TH") : "-"}
            </Descriptions.Item>
          </>
        );
      case "book": 
        return (
          <>
            <Descriptions.Item label="ชื่อหนังสือ">{work.bookName}</Descriptions.Item>
            <Descriptions.Item label="รายวิชา">{work.subject}</Descriptions.Item>
            <Descriptions.Item label="เทอม">{work.semester}</Descriptions.Item>
            <Descriptions.Item label="รายชื่อผู้แต่ง">{work.author}</Descriptions.Item>
          </>
        );
      default:
        return null;
    }
  };

  const openFile = (fileObj, type) => {
    if (!fileObj) return;
    const path = fileObj.file_path || fileObj.url || fileObj;
    const folder = type === 'book' ? 'books' : 'researches';
    window.open(`${UPLOAD_URL}/${folder}/${encodeURIComponent(path)}`, "_blank");
  };

  const columns = [
    { title: "รหัส", dataIndex: "id", width: 100, fixed: 'left' },
    {
      title: "ประเภท",
      dataIndex: "type",
      width: 100,
      render: (type) => {
        const map = {
          research: <Tag color="blue">งานวิจัย</Tag>,
          journal: <Tag color="green">วารสาร</Tag>,
          conference: <Tag color="orange">งานประชุม</Tag>,
          book: <Tag color="magenta">หนังสือ</Tag>, 
        };
        return map[type] || <Tag>{type}</Tag>;
      },
    },
    { title: "ชื่อผลงาน", render: (_, r) => getTitle(r), minWidth: 200 },
    { title: "ปี", dataIndex: "year", width: 80, align: "center" },
    {
      title: "ไฟล์",
      width: 150,
      render: (_, r) => {
        const files = r.files || [];
        if (files.length === 0) return "-";
        if (files.length === 1) {
          return (
            <div className="file-link-single" onClick={() => openFile(files[0], r.type)}>
              <FilePdfOutlined /> <span>PDF</span>
            </div>
          );
        }
        const items = files.map((f, i) => ({
          key: i,
          label: <div onClick={() => openFile(f, r.type)}>{f.original_name || `ไฟล์ ${i+1}`}</div>
        }));
        return (
          <Dropdown menu={{ items }}>
            <Button size="small" icon={<PaperClipOutlined />}>{files.length} ไฟล์</Button>
          </Dropdown>
        );
      }
    },
    {
      title: "ดู",
      width: 60,
      align: "center",
      fixed: 'right',
      render: (_, r) => <EyeOutlined className="view-icon-btn" onClick={() => handleViewDetail(r)} />,
    },
  ];

  return (
    <div className="main-research-container">
      <Card variant="outlined" title={<span className="card-title-large">ผลงานวิชาการของอาจารย์</span>}>
        
        {!selectedTeacher && teacherList.length > 0 && (
          <Row gutter={[16, 16]} className="teacher-grid">
            {teacherList.map((t) => (
              <Col xs={24} sm={12} md={8} lg={6} key={t.id}>
                <Card
                  variant="outlined"
                  hoverable
                  className="teacher-select-card"
                  onClick={() => handleSelectTeacher(t)}
                >
                  <Avatar size={100} src={t.image} icon={<UserOutlined />} className="teacher-avatar" />
                  <div className="teacher-info">
                    <div className="teacher-name">{t.prefixTH} {t.firstNameTH} {t.lastNameTH}</div>
                    <div className="teacher-id">{t.shortName}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!selectedTeacher && teacherList.length === 0 && !loading && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Empty description="ไม่พบข้อมูลบุคคลที่มีผลงาน" />
          </div>
        )}

        {selectedTeacher && (
          <div className="research-content">
            <div className="table-header-responsive">
               <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="back-btn">กลับ</Button>
               <h3 className="selected-teacher-title">ผลงานของ {selectedTeacher.prefixTH}{selectedTeacher.firstNameTH}</h3>
            </div>

            <div className="filter-bar-responsive">
              <Search
                placeholder="ค้นหา..."
                allowClear
                className="search-box"
                onChange={(e) => setSearchText(e.target.value)}
              />
              <div className="select-group">
                <select className="responsive-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">ทุกประเภท</option>
                  <option value="research">งานวิจัย</option>
                  <option value="journal">วารสาร</option>
                  <option value="conference">งานประชุม</option>
                  <option value="book">หนังสือ</option> 
                </select>
                <select className="responsive-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="">ทุกปี</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <Table
              bordered
              rowKey="id"
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              pagination={{ pageSize: 10, size: "small" }}
              scroll={{ x: 800 }} 
              className="responsive-table"
            />
          </div>
        )}

        <Modal
          title="รายละเอียดผลงาน"
          open={openDetail}
          onCancel={() => setOpenDetail(false)}
          footer={null}
          width="90%"
          style={{ maxWidth: '700px' }}
        >
          {selectedWork && (
            <Descriptions bordered column={1} size="small" className="responsive-descriptions">
              <Descriptions.Item label="รหัส">{selectedWork.id}</Descriptions.Item>
              <Descriptions.Item label="ประเภท"><Tag color="blue">{selectedWork.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="ชื่อผลงาน">{getTitle(selectedWork)}</Descriptions.Item>
              <Descriptions.Item label="ปีการศึกษา">{selectedWork.year || "-"}</Descriptions.Item>
              {renderDetailByType(selectedWork)}
              <Descriptions.Item label="ไฟล์แนบ">
                {selectedWork.files?.map((f, i) => (
                  <div key={i} className="modal-file-link" onClick={() => openFile(f, selectedWork.type)}>
                    <FilePdfOutlined /> {f.original_name || `ไฟล์ที่ ${i+1}`}
                  </div>
                ))}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Card>
    </div>
  );
}