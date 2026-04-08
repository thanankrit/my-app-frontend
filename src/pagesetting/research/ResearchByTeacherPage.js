import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Select, Button, Card, Modal, message, Tag, Space } from "antd";
import { ArrowLeftOutlined, SearchOutlined, FileSearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs"; 
import "dayjs/locale/th"; 
import ResearchForm from "./ResearchForm";
import "../../style/styleresearch/ResearchByTeacherPage.css";

const { Option } = Select;

export default function ResearchByTeacherPage() {
  const navigate = useNavigate();
  const { teacherId } = useParams();

  const [teacherName, setTeacherName] = useState("กำลังโหลด...");
  const [searchText, setSearchText] = useState("");
  const [filterYear, setFilterYear] = useState(undefined);
  const [filterType, setFilterType] = useState(undefined);
  const [researchList, setResearchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);

  const API_URL = "http://localhost:8081/api";

  const safeDayjs = (dateStr) => {
    if (!dateStr) return null;
    const d = dayjs(dateStr);
    return d.isValid() ? d : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const teacherRes = await axios.get(`${API_URL}/teachers/${teacherId}`);
        const teacherData = Array.isArray(teacherRes.data) ? teacherRes.data[0] : teacherRes.data;

        if (teacherData) {
          const prefix = teacherData.prefix_th || teacherData.prefix || '';
          const firstName = teacherData.first_name_th || teacherData.firstname || teacherData.first_name || '';
          const lastName = teacherData.last_name_th || teacherData.lastname || teacherData.last_name || '';
          setTeacherName(`${prefix}${firstName} ${lastName}`);
        }
      } catch (err) {
        console.warn("ไม่สามารถดึงชื่ออาจารย์ได้:", err);
        setTeacherName("ไม่ระบุชื่อ (Load Error)");
      }

      try {
        const res = await axios.get(`${API_URL}/research/teacher/${teacherId}`);
        
        const mappedData = res.data.map(item => ({
          ...item,
          authors: typeof item.authors === 'string' ? JSON.parse(item.authors || '[]') : (item.authors || []),
          files: typeof item.files === 'string' ? JSON.parse(item.files || '[]') : (item.files || []),
          workCode: item.work_code,
          year: item.academic_year ? String(item.academic_year) : "-", 
        }));
  
        setResearchList(mappedData);
      } catch (err) {
        console.error("Error fetching research list:", err);
        message.error("ไม่สามารถโหลดรายการผลงานได้");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
        fetchData();
    }
  }, [teacherId]);

  const uniqueYears = useMemo(() => {
    const years = researchList.map(item => item.year).filter(y => y && y !== "-");
    return [...new Set(years)].sort().reverse();
  }, [researchList]);

  const formatId = (item) => item?.workCode || item?.id || "-";

  const getTitle = (item) => {
    if (!item) return "-";
    switch (item.type) {
      case "research": return item.research_name || item.research_name_en || "-";
      case "journal": return item.title_name || item.title_name_en || item.journal_name || "-";
      case "conference": return item.article_title || item.article_title_en || item.conference_name || "-";
      case "book": return item.book_name || item.book_name_en || "-";
      default: return "-";
    }
  };


  const filteredData = researchList.filter((item) => {
    const searchLower = searchText.toLowerCase();
    const itemYear = String(item.year || "");
    const itemCode = String(item.workCode || item.id || "");
    const title = getTitle(item).toLowerCase();

    return (
      (!filterYear || itemYear === filterYear) &&
      (!filterType || item.type === filterType) &&
      (itemCode.includes(searchLower) || title.includes(searchLower))
    );
  });

  const fixThaiText = (text) => {
    if (!text) return "";
    try {
      return decodeURIComponent(escape(text));
    } catch (e) {
      return text;
    }
  };

  const handleView = (record) => {
    let authorsArray = Array.isArray(record.authors) ? record.authors : [];
    const formattedAuthors = authorsArray.map(a => ({
        ...a,
        prefix: a.prefix || "",
        prefixEn: a.prefix_en || "", 
        firstName: a.first_name || a.firstname || a.firstName || "",
        firstNameEn: a.first_name_en || "",
        lastName: a.last_name || a.lastname || a.lastName || "",
        lastNameEn: a.last_name_en || "",
        position: a.position || "",
    }));

    let fileList = [];
    const uploadFolder = record.type === 'book' ? 'books' : 'researches'; 

    if (record.files && Array.isArray(record.files)) {
        fileList = record.files.map(f => {
            const correctName = fixThaiText(f.file_name); 
            return {
                uid: f.id,
                name: correctName, 
                status: 'done',
                url: `http://localhost:8081/uploads/${uploadFolder}/${encodeURIComponent(f.file_path)}`,
            };
        });
    }

    let viewData = {
        id: record.id,
        type: record.type,
        work_code: record.work_code, 
        displayTitle: getTitle(record),
        teacherId: record.teacher_id,
        authors: formattedAuthors, 
        file: fileList,
        fileLink: record.external_link || record.document_link || "", 
    };

    if (record.type === "research") {
        const firstAuthor = formattedAuthors[0] || {};
        const authorThStr = `${firstAuthor.prefix || ''}${firstAuthor.firstName || ''} ${firstAuthor.lastName || ''}`.trim();
        const authorEnStr = `${firstAuthor.prefixEn || ''}${firstAuthor.firstNameEn || ''} ${firstAuthor.lastNameEn || ''}`.trim();

        viewData = {
            ...viewData,
            researchName: record.research_name,
            researchNameEn: record.research_name_en,
            author: authorThStr,
            authorEn: authorEnStr,
            year: record.academic_year,
            volume: record.volume,
            order: record.order_no,
            location: record.location,
            editionYear: record.edition_year,
            budget: record.budget,
            organization: record.organization,
            projectName: record.project_name, 
            date: safeDayjs(record.start_date), 
            printDate: safeDayjs(record.publish_date),
            external_link: record.external_link,
        };
    } else if (record.type === "journal") {
        viewData = {
            ...viewData,
            academicYear: record.academic_year,
            titleName: record.title_name,
            titleNameEn: record.title_name_en,
            journalName: record.journal_name,
            journalNameEn: record.journal_name_en,
            authorOrg: record.author_org, 
            page: record.page_no,
            volume: record.volume,
            issue: record.issue,
            editionYear: record.edition_year,
            date: safeDayjs(record.publish_date),
            document_link: record.document_link,
        };
    } else if (record.type === "conference") {
        viewData = {
            ...viewData,
            academicYear: record.academic_year,
            articleTitle: record.article_title,
            articleTitleEn: record.article_title_en,
            conferenceName: record.conference_name,
            conferenceNameEn: record.conference_name_en,
            conferenceLevel: record.conference_level,
            country: record.country,
            conferenceLocation: record.location, 
            editionYear: record.edition_year,
            date: safeDayjs(record.conference_date),  
            document_link: record.document_link,         
        };
    } else if (record.type === "book") { 
        viewData = {
            ...viewData,
            bookName: record.book_name,
            bookNameEn: record.book_name_en,
            semester: record.semester,
            subject: record.subject,
            credits: record.credits,
            academicYear: record.academic_year,
            publisher: record.publisher, 
            editionYear: record.edition_year,
            document_link: record.document_link,
        };
    }

    setSelectedResearch(viewData);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบผลงาน",
      content: (
        <div>
          <p>คุณต้องการลบผลงานนี้ใช่หรือไม่?</p>
          <p><b>รหัส:</b> {formatId(record)}</p>
          <p><b>ชื่อ:</b> {getTitle(record)}</p>
          <p style={{ color: 'red' }}>*การลบนี้จะไม่สามารถย้อนกลับได้</p>
        </div>
      ),
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await axios.delete(`${API_URL}/research/${record.type}/${record.id}`);
          
          if (response.status === 200 || response.status === 204) {
            message.success("ลบข้อมูลเรียบร้อยแล้ว");
            
            setResearchList((prev) => 
              prev.filter((i) => !(i.id === record.id && i.type === record.type))
            );
          }
        } catch (err) {
          console.error("Delete Error Detail:", err.response?.data || err.message);
          message.error(`ลบไม่สำเร็จ: ${err.response?.data?.message || "เกิดข้อผิดพลาด"}`);
        }
      },
    });
  };

  const columns = [
    { 
        title: "รหัสผลงาน", 
        width: 120, 
        render: (_, record) => <span style={{ fontWeight: 500 }}>{formatId(record)}</span> 
    },
    {
      title: "ประเภท",
      dataIndex: "type",
      width: 100,
      align: "center",
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
    { 
        title: "ปีการศึกษา", 
        dataIndex: "year", 
        width: 100, 
        align: "center",
        render: (text) => text || "-", 
    },
    { 
        title: "ชื่อผลงาน", 
        render: (_, record) => (
            <div className="research-title-text">
                {getTitle(record)}
            </div>
        )
    },
    {
      title: "จัดการ",
      width: 260,
      align: "center",
      render: (_, record) => (
        <Space wrap justifyContent="center" className="action-buttons">
          <Button size="small" type="default" icon={<FileSearchOutlined />} onClick={() => handleView(record)}>ดู</Button>
          <Button size="small" onClick={() => navigate(`/home/setting/research/edit/${record.type}/${record.id}`)}> แก้ไข</Button>
          <Button size="small" type="primary" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>ลบ</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="research-teacher-container">
      <Card
        className="research-teacher-card"
        title={
          <div className="card-header">
            <Button className="back-btn" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>กลับ</Button>
            <div className="title-text">
                ผลงานวิชาการของ: <b>{teacherName}</b>
            </div>
          </div>
        }
      >
        <div className="research-teacher-filter">
          <Input 
            className="filter-input"
            placeholder="ค้นหา รหัส / ชื่อผลงาน" 
            prefix={<SearchOutlined />} 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
          />
          <Select 
            className="filter-select"
            placeholder="ทุกประเภท" 
            allowClear 
            value={filterType} 
            onChange={setFilterType}
          >
            <Option value="research">งานวิจัย</Option>
            <Option value="journal">วารสาร</Option>
            <Option value="conference">งานประชุม</Option>
            <Option value="book">หนังสือ</Option> 
          </Select>

          <Select 
            className="filter-select"
            placeholder="ทุกปีการศึกษา" 
            allowClear 
            value={filterYear} 
            onChange={setFilterYear}
          >
            {uniqueYears.length > 0 ? (
                uniqueYears.map((y) => (
                    <Option key={y} value={y}>{y}</Option>
                ))
            ) : (
                <Option disabled>ไม่มีข้อมูลปี</Option>
            )}
          </Select>
        </div>

        <Table
          bordered
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => `${record.type}-${record.id}`}
          className="research-teacher-table"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }} 
        />

        <Modal
            open={modalVisible}
            width={900}
            style={{ top: 20 }} 
            title={`รายละเอียดผลงาน: ${selectedResearch ? selectedResearch.displayTitle : ""}`}
            onCancel={() => setModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setModalVisible(false)}>ปิด</Button>
            ]}
            destroyOnClose
            className="responsive-modal"
          >
            {selectedResearch && (
              <ResearchForm
                type={selectedResearch.type}
                mode="view" 
                initialValues={selectedResearch}
                disabled={true} 
              />
            )}
          </Modal>
      </Card>
    </div>
  );
}