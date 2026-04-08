import React, { useEffect, useState, useMemo } from "react";
import { Card, Table, Select, Button, message } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { SarabunRegular } from "./../../fonts/SarabunRegular";
import "./../../style/stylereport/ReportOnlyResearchPage.css";

const { Option } = Select;
const ALL = "__ALL__";

export default function ReportOnlyResearchPage() {
  const [researches, setResearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const API_BASE_URL = "http://localhost:8081/api";

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/reports/only-researches`).then((res) => {
      const formattedData = res.data.map((w) => ({
        id: w.id,
        teacherId: w.teacher_id,
        title: w.title || "ไม่ระบุชื่อโครงการ",
        year: w.year || "-",
        teacherName: w.first_name_th ? `${w.prefix_th || ''}${w.first_name_th} ${w.last_name_th}` : "ไม่ระบุชื่อ",
        original_data: w 
      }));
      setResearches(formattedData);
      setLoading(false);
    }).catch((err) => {
      message.error("โหลดข้อมูลงานวิจัยล้มเหลว");
      setLoading(false);
    });
  }, []);

  const allYears = useMemo(() => {
    const years = researches.map((r) => r.year).filter((y) => y !== "-");
    return [...new Set(years)].sort((a, b) => b - a);
  }, [researches]);

  const allTeachers = useMemo(() => {
    const uniqueTeachers = [];
    const map = new Map();
    for (const item of researches) {
        if (!map.has(item.teacherId) && item.teacherId) {
            map.set(item.teacherId, true);
            uniqueTeachers.push({ id: item.teacherId, name: item.teacherName });
        }
    }
    return uniqueTeachers;
  }, [researches]);

  // ==========================================
  // จุดที่ 1: บังคับเลือกให้ครบทั้ง อาจารย์ และ ปีงบประมาณ
  // ==========================================
  const filteredResearches = useMemo(() => {
    // ถ้ายังไม่ได้เลือกอาจารย์ หรือยังไม่ได้เลือกปี ให้ส่ง array ว่างกลับไป (ไม่แสดงข้อมูล)
    if (selectedTeachers.length === 0 || !selectedYear) return [];
    
    let filtered = researches;
    
    // กรองตามอาจารย์
    if (!selectedTeachers.includes(ALL)) {
      filtered = filtered.filter((r) => selectedTeachers.includes(r.teacherId));
    }
    
    // กรองตามปีเสมอ
    filtered = filtered.filter((r) => String(r.year) === String(selectedYear));
    
    return filtered;
  }, [selectedTeachers, selectedYear, researches]);

  const handleExportWord = async () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกงานวิจัย");
    setLoading(true);
    try {
      const selectedData = filteredResearches
        .filter(item => selectedRowKeys.includes(item.id))
        .map((item, index) => {
          const d = item.original_data;
          let authorsArray = d.authors_list ? (typeof d.authors_list === 'string' ? JSON.parse(d.authors_list) : d.authors_list) : [];
          let authorsText = authorsArray.map(a => `${a.first_name_en || ''} ${a.last_name_en || ''}`.trim()).filter(n => n !== "").join(", ");
          const publishDateText = d.publish_date ? new Date(d.publish_date).toLocaleDateString('th-TH') : "-";
          return { index: index + 1, authors: authorsText || "-", research_name_en: d.research_name_en || "-", location: d.location || "-", volume: d.volume || "-", order_no: d.order_no || "-", publish_date: publishDateText, edition_year: d.edition_year || "-" };
        });

      const response = await fetch(`/templates/research_template.docx?t=${new Date().getTime()}`);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '[[', end: ']]' } });
      doc.render({ items: selectedData });
      const out = doc.getZip().generate({ type: "blob" });
      saveAs(out, `รายงานวิจัย_${new Date().getTime()}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการสร้าง Word");
    } finally {
      setLoading(false);
    }
  };

 const handleExportPDF = () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกงานวิจัย");
    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    try {
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunRegular.ttf);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");

      const selectedData = filteredResearches
        .filter(item => selectedRowKeys.includes(item.id))
        .map((item, index) => {
          const d = item.original_data;
          let authorsArray = d.authors_list ? (typeof d.authors_list === 'string' ? JSON.parse(d.authors_list) : d.authors_list) : [];
          let authorsText = authorsArray.map(a => `${a.first_name_en || ''} ${a.last_name_en || ''}`.trim()).filter(n => n !== "").join(", ");
          
          // แยกเลขลำดับ กับ เนื้อหาออกจากกัน
          return [
            `1.${index + 1}`, // คอลัมน์ที่ 0 (เลขลำดับ)
            `${authorsText || "-"}, ${d.research_name_en || "-"}, ${d.location || "-"}, เล่ม ${d.volume || "-"}, ฉบับที่ ${d.order_no || "-"}, ${d.publish_date ? new Date(d.publish_date).toLocaleDateString('th-TH') : "-"}, หน้า ${d.edition_year || "-"}` // คอลัมน์ที่ 1 (เนื้อหา)
          ];
        });

      doc.setFontSize(14);
      doc.text("1. บทความวิจัยที่ตีพิมพ์ในวารสารทางวิชาการระดับนานาชาติตามประกาศ ก.พ.อ.", 14, 20);

      doc.autoTable({
        startY: 28,
        body: selectedData,
        theme: 'plain',
        styles: {
          font: "Sarabun",
          fontSize: 10,
          cellPadding: { top: 1, right: 0, bottom: 4, left: 2 }, // ปรับระยะห่างช่องไฟ
          overflow: 'linebreak',
        },
        columnStyles: {
          // ส่วนที่สำคัญ: กำหนดความกว้างของเลขลำดับและการเยื้อง
          0: { cellWidth: 8, halign: 'left' }, // เลข 1.1 จะอยู่แค่ใน 15mm นี้
          1: { cellWidth: 150 } // เนื้อหาที่เหลือจะถูกบีบให้อยู่ใน 165mm ไม่ไหลกลับไปหา 1.1
        },
        margin: { left: 20, right: 14 }, // เยื้องทั้งตารางเข้ามาจากขอบกระดาษ 20mm
      });

      doc.save(`รายงานวิจัย_${new Date().getTime()}.pdf`);
      message.success("สร้างไฟล์ PDF สำเร็จ");
    } catch (e) { 
      console.error(e);
      message.error("PDF Error: " + e.message); 
    }
  };

  return (
    <div className="report-research-container">
      <Card 
        className="report-card"
        title={<span className="card-title">ระบบออกรายงานเฉพาะงานวิจัย</span>}
        extra={
          <div className="report-actions">
            <Button icon={<FilePdfOutlined />} danger type="primary" onClick={handleExportPDF} disabled={selectedRowKeys.length === 0}>
              PDF
            </Button>
            <Button icon={<FileWordOutlined />} type="primary" onClick={handleExportWord} loading={loading} disabled={selectedRowKeys.length === 0}>
              Word 
            </Button>
          </div>
        }
      >
        <div className="report-filters">
          <Select
            mode="multiple"
            placeholder="เลือกอาจารย์"
            className="filter-select-teacher"
            value={selectedTeachers}
            onChange={setSelectedTeachers}
            allowClear
          >
            <Option value={ALL}>ทั้งหมด</Option>
            {allTeachers.map((t) => <Option key={t.id} value={t.id}>{t.name}</Option>)}
          </Select>

          <Select
            placeholder="เลือกปีงบประมาณ"
            className="filter-select-year"
            value={selectedYear || undefined}
            onChange={setSelectedYear}
            allowClear
            disabled={selectedTeachers.length === 0} // <-- จุดที่ 2: ปิดใช้งานถ้ายังไม่เลือกอาจารย์
          >
            {allYears.map((y) => <Option key={y} value={y}>{y}</Option>)}
          </Select>
        </div>

        <Table
          rowKey="id"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={[
            { title: "ชื่อโครงการวิจัย", dataIndex: "title", minWidth: 250 },
            { title: "ชื่อหัวหน้าโครงการ", dataIndex: "teacherName", width: 220 },
            { title: "ปีงบประมาณ", dataIndex: "year", width: 110 },
          ]}
          dataSource={filteredResearches}
          loading={loading}
          bordered
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <div style={{ padding: '30px 0', color: '#8c8c8c' }}>
                {/* ========================================== */}
                {/* จุดที่ 3: ข้อความแจ้งเตือนให้เลือกข้อมูลให้ครบ */}
                {/* ========================================== */}
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