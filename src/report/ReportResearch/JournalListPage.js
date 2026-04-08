import React, { useEffect, useState, useMemo } from "react";
import { Card, Table, Select, Button, message } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable"; // นำเข้าสำหรับจัดการ PDF ให้สวยงาม
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { SarabunRegular } from "./../../fonts/SarabunRegular";
import "./../../style/stylereport/ReportJournalPage.css"; 

const { Option } = Select;
const ALL = "__ALL__"; // กำหนดค่าคงที่สำหรับตัวเลือกทั้งหมด

export default function ReportJournalPage() {
  const [journals, setJournals] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const API_BASE_URL = "http://localhost:8081/api";

  const normalizeJournalData = (works) =>
    works
      .filter((w) => w.journal_name || w.work_type === "journal" || w.type === "journal")
      .map((w) => ({
        id: w.id,
        teacherId: w.teacher_id,
        title: w.title_name || w.title || "ไม่ระบุชื่อบทความ",
        journalName: w.journal_name || w.journal_name_en || "-", 
        year: w.academic_year || w.edition_year || "-",
        type: "บทความวารสาร",
        teacherName: w.first_name_th ? `${w.prefix_th || ''}${w.first_name_th} ${w.last_name_th}` : "ไม่ระบุชื่อ",
        original_data: w
      }));

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/teachers`).then((res) => {
      setTeachers(res.data.map((t) => ({
        id: t.id,
        fullNameTH: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`,
      })));
    });
    axios.get(`${API_BASE_URL}/reports/only-journals`).then((res) => {
      setJournals(normalizeJournalData(res.data));
      setLoading(false);
    }).catch((err) => {
      console.error("Fetch Journals Error:", err);
      message.error("โหลดข้อมูลวารสารล้มเหลว");
      setLoading(false);
    });
  }, []);

  const teachersWithJournals = useMemo(() => {
    const validTeacherIds = new Set(journals.map((j) => j.teacherId));
    return teachers.filter((t) => validTeacherIds.has(t.id));
  }, [teachers, journals]);

  const allYears = useMemo(() => {
    const years = journals.map((j) => j.year).filter((y) => y !== "-");
    return [...new Set(years)].sort((a, b) => b - a);
  }, [journals]);

  // ==========================================
  // Logic การกรอง: รองรับ "ทั้งหมด" อย่างถูกต้อง
  // ==========================================
  const filteredJournals = useMemo(() => {
    // ถ้ายังไม่ได้เลือกอาจารย์ หรือยังไม่ได้เลือกปี ให้ส่งตารางว่าง
    if (selectedTeachers.length === 0 || !selectedYear) return []; 
    
    let filtered = journals;
    
    // 1. กรองตามอาจารย์: ถ้าไม่ได้เลือกทั้งหมด ค่อยทำการกรองทิ้ง
    if (!selectedTeachers.includes(ALL)) {
      filtered = filtered.filter((j) => selectedTeachers.includes(j.teacherId));
    }
    
    // 2. กรองตามปี: ถ้าไม่ได้เลือกทั้งหมด ค่อยทำการกรองปีทิ้ง
    if (selectedYear !== ALL) {
      filtered = filtered.filter((j) => String(j.year) === String(selectedYear));
    }
    
    return filtered;
  }, [selectedTeachers, selectedYear, journals]);

  // ==========================================
  // จัดกลุ่มข้อมูลตามปี และเรียงจากน้อยไปมาก
  // ==========================================
  const formatDataForExport = (dataToExport) => {
    // เรียงปีจากน้อยไปมาก (a - b)
    const uniqueYears = [...new Set(dataToExport.map(item => String(item.year)))].sort((a, b) => a - b);
    const yearList = [];

    uniqueYears.forEach(currentYear => {
      const itemsInYear = dataToExport.filter(item => String(item.year) === currentYear);
      if (itemsInYear.length === 0) return;

      const formattedItems = itemsInYear.map((item, idx) => {
        const d = item.original_data;
        const authorName = `${d.first_name_en || ""} ${d.last_name_en || ""}`.trim();
        return {
          index: idx + 1,
          fullText: `${authorName || "-"}, ${d.title_name_en || d.title_name || "-"}, ${d.journal_name_en || d.journal_name || "-"}, ฉบับที่ ${d.volume || "-"}, ปีที่ ${d.edition_year || "-"}, เลขหน้า ${d.page_no || "-"}`,
          ...d // เอาข้อมูลดิบไปใช้กับ Word ได้ด้วยเผื่อต้องการแยก Field
        };
      });

      yearList.push({
        year_th: currentYear,
        items: formattedItems
      });
    });

    return yearList;
  };

  const handleExportPDF = () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกวารสารที่ต้องการออกรายงาน");
    
    try {
      const selectedData = filteredJournals.filter(item => selectedRowKeys.includes(`${item.type}-${item.id}`));
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
        // เช็คที่ว่างก่อนพิมพ์หัวข้อปี ถ้าเหลือน้อยกว่า 30mm ให้ขึ้นหน้าใหม่
        if (index > 0 && currentY > 260) {
          doc.addPage();
          currentY = 20;
        }

        // 1. พิมพ์หัวข้อปีการศึกษา
        doc.setFontSize(16);
        doc.text(`ปีการศึกษา ${yearData.year_th}`, 20, currentY);
        currentY += 10;

        // 2. พิมพ์หัวข้อรายงาน
        doc.setFontSize(14);
        doc.text("1. บทความวิจัยที่ตีพิมพ์ในวารสารทางวิชาการระดับนานาชาติตามประกาศ ก.พ.อ.", 20, currentY);
        currentY += 5;

        const rows = yearData.items.map(item => [
          `1.${item.index}`,
          item.fullText
        ]);

        // 3. สร้างตารางเนื้อหา
        doc.autoTable({
            startY: currentY,
            body: rows.length > 0 ? rows : [["", "-"]],
            theme: 'plain',
            styles: { font: "Sarabun", fontSize: 11, cellPadding: { top: 1, right: 0, bottom: 4, left: 2 } },
            columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 160 } },
            margin: { left: 20, right: 15 },
            didDrawPage: (data) => { currentY = data.cursor.y; }
        });

        currentY += 10; // ระยะห่างก่อนเริ่มปีใหม่ (ถ้ามี)
      });

      doc.save(`รายงานวารสาร_${new Date().getTime()}.pdf`);
      message.success("สร้างไฟล์ PDF สำเร็จ");
    } catch (e) {
      console.error(e);
      message.error("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  const handleExportWord = async () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกข้อมูล");
    const selectedData = filteredJournals.filter(item => selectedRowKeys.includes(`${item.type}-${item.id}`));
    
    // ใช้ฟังก์ชันจัดกลุ่มที่สร้างไว้เพื่อให้ปีเรียงจากน้อยไปมาก
    const formattedYearsData = formatDataForExport(selectedData);

    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/templates/template_journal.docx?t=${timestamp}`);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '[[', end: ']]' } });
      
      // ส่งข้อมูลเข้า Word ในรูปแบบ { years: [...] }
      doc.render({ years: formattedYearsData });
      
      const blob = doc.getZip().generate({ type: "blob" });
      saveAs(blob, `รายงานวารสาร_${timestamp}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) {
      console.error(error);
      message.error("เกิดข้อผิดพลาดในการสร้าง Word");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-journal-container">
      <Card 
        className="report-card"
        title={<span className="card-title">ระบบออกรายงานบทความวารสาร</span>}
        extra={
          <div className="report-actions">
            <Button icon={<FilePdfOutlined />} className="btn-pdf" onClick={handleExportPDF} disabled={selectedRowKeys.length === 0}>
              PDF
            </Button>
            <Button icon={<FileWordOutlined />} type="primary" onClick={handleExportWord} disabled={selectedRowKeys.length === 0}>
              Word
            </Button>
          </div>
        }
      >
        <div className="report-filters">
          <Select 
            mode="multiple" 
            placeholder="เลือกอาจารย์" 
            className="filter-teacher"
            value={selectedTeachers} 
            onChange={setSelectedTeachers} 
            allowClear
            style={{ width: '300px' }}
          >
            {/* ตัวเลือกทั้งหมดสำหรับอาจารย์ */}
            <Option key={ALL} value={ALL}>เลือกทั้งหมด</Option>
            {teachersWithJournals.map(t => <Option key={t.id} value={t.id}>{t.fullNameTH}</Option>)}
          </Select>

          <Select 
            placeholder="เลือกปีงบประมาณ" 
            className="filter-year"
            value={selectedYear || undefined} 
            onChange={setSelectedYear} 
            allowClear
            style={{ width: '200px', marginLeft: '10px' }}
            disabled={selectedTeachers.length === 0}
          >
            {/* ตัวเลือกทั้งหมดสำหรับปีงบประมาณ */}
            <Option value={ALL}>ทั้งหมด</Option>
            {allYears.map(y => <Option key={y} value={y}>{y}</Option>)}
          </Select>
        </div>

        <Table
          rowKey={(record) => `${record.type}-${record.id}`}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={[
            { title: "ชื่อบทความ", dataIndex: "title" },
            { title: "วารสาร", dataIndex: "journalName", width: 220 },
            { title: "อาจารย์", dataIndex: "teacherName", width: 180 },
            { title: "ปี", dataIndex: "year", width: 80 },
          ]}
          dataSource={filteredJournals}
          loading={loading}
          bordered
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <div style={{ padding: '30px 0', color: '#8c8c8c' }}>
                {(selectedTeachers.length === 0 || !selectedYear)
                  ? "กรุณาเลือก อาจารย์ และ ปีงบประมาณ ให้ครบเพื่อแสดงข้อมูลรายงาน" 
                  : "ไม่พบข้อมูลที่ตรงตามเงื่อนไข"}
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
}