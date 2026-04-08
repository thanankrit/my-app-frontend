import React, { useEffect, useState, useMemo } from "react";
import { Card, Table, Select, Button, message } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable"; // สำคัญ: ต้อง import เพื่อให้ตารางใน PDF จัดย่อหน้าได้
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

import { SarabunRegular } from "./../../fonts/SarabunRegular";
import "./../../style/stylereport/ReportConferencePage.css";

const { Option } = Select;
const ALL_VALUE = "ALL"; // กำหนดค่าคงที่สำหรับตัวเลือก "ทั้งหมด"

export default function ReportConferencePage() {
  const [conferences, setConferences] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(""); 
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const API_BASE_URL = "http://localhost:8081/api";

  const normalizeConferenceData = (works) =>
    works.map((w) => {
      const levelTH = w.conference_level === "international" ? "ระดับนานาชาติ" : "ระดับชาติ";
      return {
        id: w.id,
        teacherId: w.teacher_id,
        title: w.article_title_en || w.article_title || "ไม่ระบุชื่อบทความ",
        year: w.academic_year || w.edition_year || "-",
        type: "ประชุมวิชาการ",
        teacherName: w.first_name_th ? `${w.prefix_th || ''}${w.first_name_th} ${w.last_name_th}` : "ไม่ระบุชื่อ",
        level_th: levelTH,
        original_data: w 
      };
    });

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/teachers`).then((res) => {
      setTeachers(res.data.map((t) => ({
        id: t.id,
        fullNameTH: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`,
      })));
    });

    axios.get(`${API_BASE_URL}/reports/conferences-formatted`).then((res) => {
      setConferences(normalizeConferenceData(res.data));
      setLoading(false);
    }).catch(() => {
      message.error("โหลดข้อมูลล้มเหลว");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedTeachers.length === 0) {
      setSelectedRowKeys([]);
    }
  }, [selectedTeachers]);

  const teachersWithConferences = useMemo(() => {
    const validTeacherIds = new Set(conferences.map((c) => c.teacherId));
    return teachers.filter((t) => validTeacherIds.has(t.id));
  }, [teachers, conferences]);

  // ==========================================
  // Logic สำหรับรองรับการเลือก "ทั้งหมด"
  // ==========================================
  const filteredConferences = useMemo(() => {
    if (selectedTeachers.length === 0 || !selectedYear || !selectedLevel) return [];
    
    let filtered = conferences;

    // 1. กรองอาจารย์
    if (!selectedTeachers.includes(ALL_VALUE)) {
      filtered = filtered.filter((c) => selectedTeachers.includes(c.teacherId));
    }
    
    // 2. กรองปีงบประมาณ
    if (selectedYear !== ALL_VALUE) {
      filtered = filtered.filter((c) => String(c.year) === String(selectedYear));
    }
    
    // 3. กรองระดับ
    if (selectedLevel !== ALL_VALUE) {
      filtered = filtered.filter((c) => c.level_th === selectedLevel);
    }
    
    return filtered;
  }, [selectedTeachers, selectedYear, selectedLevel, conferences]);

  // ==========================================
  // เรียงลำดับจากปีน้อยไปปีมาก (a - b)
  // ==========================================
  const formatDataForExport = (dataToExport) => {
    const uniqueYears = [...new Set(dataToExport.map(item => String(item.year)))].sort((a, b) => a - b);
    const yearList = [];

    uniqueYears.forEach(currentYear => {
      const itemsInYear = dataToExport.filter(item => String(item.year) === currentYear);
      if (itemsInYear.length === 0) return;

      const nationalItems = itemsInYear.filter(item => item.level_th === "ระดับชาติ").map((item, idx) => {
        const d = item.original_data;
        const coAuthors = d.authors_en && d.authors_en !== "-" ? `, ${d.authors_en}` : ""; 
        return {
          index: `1.${idx + 1}`,
          first_name_en: d.first_name_en || "", 
          last_name_en: d.last_name_en || "",   
          authors: coAuthors,
          title: d.article_title_en || d.article_title || "-",
          conference: d.conference_name_en || d.conference_name || "-",
          location: d.location || "-",
          year: d.edition_year || currentYear
        };
      });

      const internationalItems = itemsInYear.filter(item => item.level_th === "ระดับนานาชาติ").map((item, idx) => {
        const d = item.original_data;
        const coAuthors = d.authors_en && d.authors_en !== "-" ? `, ${d.authors_en}` : "";
        return {
          index: `2.${idx + 1}`,
          first_name_en: d.first_name_en || "", 
          last_name_en: d.last_name_en || "",   
          authors: coAuthors,
          title: d.article_title_en || d.article_title || "-",
          conference: d.conference_name_en || d.conference_name || "-",
          location: d.location || "-",
          year: d.edition_year || currentYear
        };
      });

      yearList.push({
        year_th: currentYear,
        national: nationalItems,
        international: internationalItems
      });
    });

    return yearList;
  };

  // ==========================================
  // ส่งออก PDF แบบข้อมูลต่อกันยาวๆ
  // ==========================================
  const handleExportPDF = () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกรายการที่ต้องการ");
    
    try {
      const selectedData = filteredConferences.filter(item => selectedRowKeys.includes(`${item.type}-${item.id}`));
      const formattedYearsData = formatDataForExport(selectedData);
      
      const doc = new jsPDF('p', 'mm', 'a4');
      
      let fontData = SarabunRegular.ttf ? SarabunRegular.ttf : SarabunRegular;
      if (typeof fontData === 'string') {
        if (fontData.includes("base64,")) fontData = fontData.split("base64,")[1];
        fontData = fontData.replace(/\s+/g, ""); 
      }
      doc.addFileToVFS("Sarabun-Regular.ttf", fontData);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun", "normal");

      let currentY = 20;

      formattedYearsData.forEach((yearData, index) => {
        // เช็คพื้นที่ก่อนขึ้นปีใหม่ ถ้าเหลือน้อยกว่า 30mm ค่อยขึ้นหน้าใหม่
        if (index > 0 && currentY > 260) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(16);
        doc.text(`ปี ${yearData.year_th}`, 20, currentY);
        currentY += 10;

        doc.setFontSize(14);
        doc.text("1. การประชุมวิชาการระดับชาติ", 20, currentY);
        currentY += 5;

        const nationalRows = yearData.national.length > 0 
          ? yearData.national.map(item => [
              item.index, 
              `${item.first_name_en} ${item.last_name_en}${item.authors}, ${item.title}, ${item.conference}, ${item.location}, ${item.year}`
            ])
          : [["", "-"]];

        doc.autoTable({
          startY: currentY,
          body: nationalRows,
          theme: 'plain',
          styles: { font: "Sarabun", fontSize: 11, cellPadding: { top: 1, bottom: 3, left: 2 } },
          columnStyles: {
            0: { cellWidth: 15, halign: 'right' }, 
            1: { cellWidth: 155 } 
          },
          margin: { left: 20 },
          didDrawPage: (data) => { currentY = data.cursor.y; }
        });

        currentY += 10;

        // เช็คพื้นที่ก่อนขึ้นหัวข้อระดับนานาชาติ
        if (currentY > 270) { doc.addPage(); currentY = 20; }
        
        doc.setFontSize(14);
        doc.text("2. การประชุมวิชาการระดับนานาชาติ", 20, currentY);
        currentY += 5;

        const internationalRows = yearData.international.length > 0 
          ? yearData.international.map(item => [
              item.index, 
              `${item.first_name_en} ${item.last_name_en}${item.authors}, ${item.title}, ${item.conference}, ${item.location}, ${item.year}`
            ])
          : [["", "-"]];

        doc.autoTable({
          startY: currentY,
          body: internationalRows,
          theme: 'plain',
          styles: { font: "Sarabun", fontSize: 11, cellPadding: { top: 1, bottom: 3, left: 2 } },
          columnStyles: {
            0: { cellWidth: 15, halign: 'right' }, 
            1: { cellWidth: 155 } 
          },
          margin: { left: 20 },
          didDrawPage: (data) => { currentY = data.cursor.y; }
        });
        
        currentY += 10; // เพิ่มระยะห่างก่อนขึ้นปีถัดไป
      });

      doc.save(`รายงานประชุมวิชาการ_${new Date().getTime()}.pdf`);
      message.success("ส่งออก PDF สำเร็จ");
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  const handleExportWord = async () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกข้อมูล");
    const selectedData = filteredConferences.filter(item => selectedRowKeys.includes(`${item.type}-${item.id}`));
    const formattedYearsData = formatDataForExport(selectedData);

    try {
      setLoading(true);
      const response = await fetch(`/templates/template_conference.docx`);
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      const doc = new Docxtemplater(zip, { 
        paragraphLoop: true, 
        linebreaks: true, 
        delimiters: { start: "[[", end: "]]" } 
      });

      doc.render({
        years: formattedYearsData
      });

      const blob = doc.getZip().generate({ type: "blob" });
      saveAs(blob, `รายงานประชุมวิชาการ_${new Date().getTime()}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) {
      console.error("Word Export Error:", error);
      message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Word");
    } finally {
      setLoading(false);
    }
  };

  const allYears = useMemo(() => {
    const years = conferences.map((c) => c.year).filter((y) => y !== "-");
    return [...new Set(years)].sort((a, b) => b - a); 
  }, [conferences]);

  const columns = [
    { title: "ชื่อบทความ", dataIndex: "title", minWidth: 250 },
    { title: "ระดับ", dataIndex: "level_th", width: 140 }, 
    { title: "ผู้นำเสนอ", dataIndex: "teacherName", width: 180 },
    { title: "ปี", dataIndex: "year", width: 80 },
  ];

  return (
    <div className="report-container">
      <Card 
        className="report-card"
        title={<span className="card-title">ระบบออกรายงานงานประชุมวิชาการ</span>}
        extra={
          <div className="report-export-buttons">
            <Button icon={<FilePdfOutlined />} danger type="primary" onClick={handleExportPDF} disabled={selectedRowKeys.length === 0}>PDF</Button>
            <Button icon={<FileWordOutlined />} type="primary" onClick={handleExportWord} disabled={selectedRowKeys.length === 0}>Word</Button>
          </div>
        }
      >
        <div className="report-filter-section">
          <Select 
            mode="multiple" 
            placeholder="เลือกอาจารย์" 
            className="filter-select-teacher" 
            value={selectedTeachers} 
            onChange={setSelectedTeachers} 
            allowClear
          >
            <Option key={ALL_VALUE} value={ALL_VALUE}>เลือกทั้งหมด</Option>
            {teachersWithConferences.map(t => <Option key={t.id} value={t.id}>{t.fullNameTH}</Option>)}
          </Select>
          
          <div className="filter-group-small">
            <Select 
              placeholder="ปีงบประมาณ" 
              className="filter-select-small"
              value={selectedYear || undefined} 
              onChange={setSelectedYear} 
              allowClear 
              disabled={selectedTeachers.length === 0}
            >
              <Option value={ALL_VALUE}>ทั้งหมด</Option>
              {allYears.map(y => <Option key={y} value={y}>{y}</Option>)}
            </Select>

            <Select 
              placeholder="เลือกระดับ" 
              className="filter-select-small"
              value={selectedLevel || undefined} 
              onChange={setSelectedLevel} 
              allowClear 
              disabled={selectedTeachers.length === 0}
            >
              <Option value={ALL_VALUE}>ทั้งหมด</Option>
              <Option value="ระดับชาติ">ระดับชาติ</Option>
              <Option value="ระดับนานาชาติ">ระดับนานาชาติ</Option>
            </Select>
          </div>
        </div>

        <Table
          rowKey={(record) => `${record.type}-${record.id}`}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filteredConferences}
          loading={loading}
          bordered
          scroll={{ x: 800 }} 
          pagination={{ pageSize: 10 }}
          locale={{ 
            emptyText: (
              <div style={{ padding: '30px 0', color: '#8c8c8c' }}>
                {(selectedTeachers.length === 0 || !selectedYear || !selectedLevel)
                  ? "กรุณาเลือก อาจารย์, ปีงบประมาณ และ ระดับ ให้ครบเพื่อแสดงข้อมูลรายงาน" 
                  : "ไม่พบข้อมูลที่ตรงตามเงื่อนไข"}
              </div>
            ) 
          }}
        />
      </Card>
    </div>
  );
}