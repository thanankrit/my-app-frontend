import React, { useEffect, useState } from "react";
import { Card, Button, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios"; 
import ResearchForm from "./ResearchForm";
import "../../style/styleresearch/EditResearchPage.css"; 

export default function EditResearchPage() {
  const { type, id } = useParams(); 
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState(null);

  const API_URL = "http://localhost:8081/api";

  const safeDayjs = (dateStr) => {
    if (!dateStr) return null;
    const d = dayjs(dateStr);
    return d.isValid() ? d : null;
  };

  const fixThaiText = (text) => {
    if (!text) return "";
    try { return decodeURIComponent(escape(text)); } catch (e) { return text; }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/research/${type}/${id}`);
        const record = res.data; 

        if (!record) {
          message.error("ไม่พบข้อมูลผลงาน");
          navigate(-1);
          return;
        }

        let authorsArray = [];
        try {
            authorsArray = Array.isArray(record.authors) ? record.authors : JSON.parse(record.authors || '[]');
        } catch (e) { authorsArray = []; }

        const formattedAuthors = authorsArray.map(a => ({
            ...a,
            prefix: a.prefix || "",
            prefixEn: a.prefix_en || a.prefixEn || "",  
            firstName: a.first_name || a.firstname || a.firstName || "", 
            firstNameEn: a.first_name_en || a.firstNameEn || "", 
            lastName: a.last_name || a.lastname || a.lastName || "",     
            lastNameEn: a.last_name_en || a.lastNameEn || "",   
            position: a.position || "",
        }));

        let fileList = [];
        try {
             const filesData = Array.isArray(record.files) ? record.files : JSON.parse(record.files || '[]');
             const uploadFolder = type === 'book' ? 'books' : 'researches';
             
             if (filesData.length > 0) {
                fileList = filesData.map(f => ({
                    uid: f.id || Math.random(),
                    name: f.file_name ? fixThaiText(f.file_name) : `file-${f.id}`,
                    status: 'done',
                    url: `http://localhost:8081/uploads/${uploadFolder}/${f.file_path}`,
                    ...f
                }));
             }
        } catch (e) { console.error("File parse error", e); }


        let values = {
            id: record.id,
            type: type,
            work_code: record.work_code,
            teacherId: record.teacher_id,
            authors: formattedAuthors,
            academicYear: record.academic_year ? String(record.academic_year) : "",
            editionYear: record.edition_year,
            volume: record.volume,
            file: fileList,
            fileLink: record.external_link || record.document_link || "", 
        };

        if (type === "research") {
            const firstAuthor = formattedAuthors[0] || {};
            const authorThStr = `${firstAuthor.prefix || ''}${firstAuthor.firstName || ''} ${firstAuthor.lastName || ''}`.trim();
            const authorEnStr = `${firstAuthor.prefixEn || ''}${firstAuthor.firstNameEn || ''} ${firstAuthor.lastNameEn || ''}`.trim();

            values = {
              ...values,
              researchName: record.research_name,
              researchNameEn: record.research_name_en,
              academicYear: record.academic_year,
              year: record.academic_year,
              organization: record.organization,
              projectName: record.project_name,
              budget: record.budget,
              order: record.order_no, 
              location: record.location,
              editionYear: record.edition_year,
              volume: record.volume,
              date: safeDayjs(record.start_date),
              printDate: safeDayjs(record.publish_date),
              external_link: record.external_link,
              author: authorThStr,
              authorEn: authorEnStr,
            };
      } else if (type === "journal") {
            values = {
                ...values,
                titleName: record.title_name,
                titleNameEn: record.title_name_en,
                journalName: record.journal_name,
                journalNameEn: record.journal_name_en,
                authorOrg: record.author_org,
                page: record.page_no,
                issue: record.issue,
            };
        } else if (type === "conference") {
            values = {
                ...values,
                articleTitle: record.article_title,
                articleTitleEn: record.article_title_en,
                conferenceName: record.conference_name,
                conferenceNameEn: record.conference_name_en,
                conferenceLevel: record.conference_level,
                country: record.country,
                conferenceLocation: record.location, 
                date: safeDayjs(record.conference_date),
            };
        } else if (type === "book") {
            values = {
                ...values,
                bookName: record.book_name,
                bookNameEn: record.book_name_en,
                semester: record.semester,
                subject: record.subject,
                credits: record.credits,
                publisher: record.publisher,
            };
        }

        setInitialValues(values);
      } catch (err) {
        console.error("Fetch error:", err);
        message.error("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (id && type) {
        fetchData();
    }
  }, [id, type, navigate]); 

  const handleSuccess = () => {
    message.success("แก้ไขข้อมูลสำเร็จ");
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="edit-research-loading">
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  const getTypeLabel = (t) => {
      switch(t) {
          case 'research': return 'งานวิจัย';
          case 'journal': return 'วารสารวิชาการ';
          case 'conference': return 'งานประชุมวิชาการ';
          case 'book': return 'หนังสือ/ตำรา';
          default: return 'ผลงาน';
      }
  }

  const getDisplayTitle = (values) => {
    if (!values) return "";
    if (values.type === 'research') return values.researchName;
    if (values.type === 'journal') return values.titleName;
    if (values.type === 'conference') return values.articleTitle;
    if (values.type === 'book') return values.bookName;
    return values.work_code; 
  }

  return (
    <div className="edit-research-container">
      <Card
        className="edit-research-card"
        title={
          <div className="card-header">
            <Button className="back-btn" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              กลับ
            </Button>
            <div className="title-text">
              <span>แก้ไขข้อมูล: <b>{getDisplayTitle(initialValues)}</b></span>
              <span className="work-type">
                ({getTypeLabel(initialValues?.type)})
              </span>
            </div>
          </div>
        }
      >
        {initialValues && (
            <ResearchForm
              mode="edit"
              type={initialValues.type} 
              initialValues={initialValues}
              onSuccess={handleSuccess}
            />
        )}
      </Card>
    </div>
  );
}