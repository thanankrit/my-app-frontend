import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Select, Spin, Button, message } from "antd"; 
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable"; 
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { SarabunRegular } from "./../../fonts/SarabunRegular";
import "./../../style/stylereport/ReportWorkPage.css";

const { Option } = Select;
const ALL = "__ALL__";
const API_URL = "http://localhost:8081/api";

export default function ReportWorkPage() {
  const [ownerType, setOwnerType] = useState(null);
  const [ownerIds, setOwnerIds] = useState([]);
  const [year, setYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [masterWorks, setMasterWorks] = useState([]); 
  const [teachersList, setTeachersList] = useState([]);
  const [staffsList, setStaffsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const academicYears = ["2566", "2567", "2568", "2569"];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resT, resStf, resStd, resTWork, resStfWork, resStdWork] = await Promise.all([
        axios.get(`${API_URL}/teachers`),
        axios.get(`${API_URL}/staffs`),
        axios.get(`${API_URL}/students`),
        axios.get(`${API_URL}/teacher-works`),
        axios.get(`${API_URL}/staff-works`),
        axios.get(`${API_URL}/student-works`),
      ]);

      setTeachersList(resT.data);
      setStaffsList(resStf.data);
      setStudentsList(resStd.data);

      const combinedWorks = [
        ...resTWork.data.map(w => ({ ...w, type: 'teacher', ownerId: w.teacher_id, rowId: `teacher-${w.id}` })),
        ...resStfWork.data.map(w => ({ ...w, type: 'staff', ownerId: w.staff_id, rowId: `staff-${w.id}` })),
        ...resStdWork.data.map(w => ({ ...w, type: 'student', ownerId: w.student_id, rowId: `student-${w.id}` }))
      ];
      setMasterWorks(combinedWorks);
    } catch (error) {
      message.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const currentOwners = useMemo(() => {
    if (ownerType === "teacher") return teachersList;
    if (ownerType === "staff") return staffsList;
    if (ownerType === "student") return studentsList;
    if (ownerType === ALL) return [...teachersList, ...staffsList, ...studentsList];
    return [];
  }, [ownerType, teachersList, staffsList, studentsList]);

  const handleOwnerChange = (values) => {
    if (values.includes(ALL)) {
      setOwnerIds(currentOwners.map(o => String(o.id || o.student_id)));
      return;
    }
    setOwnerIds(values);
  };

  const filteredData = useMemo(() => {
    if (!ownerType) return [];
    return masterWorks.filter((w) => {
      if (ownerType !== ALL && w.type !== ownerType) return false;
      if (ownerIds.length > 0 && !ownerIds.includes(String(w.ownerId))) return false;
      if (year && year !== ALL && w.academic_year !== year) return false;
      return true;
    }).map(w => {
      const owner = currentOwners.find(o => String(o.id || o.student_id) === String(w.ownerId));
      return {
        ...w,
        prefix_th: owner?.prefix_th || "",
        first_name_th: owner?.first_name_th || "",
        last_name_th: owner?.last_name_th || "",
        ownerFullname: owner ? `${owner.prefix_th || ''}${owner.first_name_th} ${owner.last_name_th}` : "ไม่พบชื่อ",
      };
    });
  }, [ownerType, ownerIds, year, masterWorks, currentOwners]);

  useEffect(() => { setSelectedRowKeys([]); }, [ownerType, ownerIds, year]);

  const getDataToExport = () => {
    let data = selectedRowKeys.length > 0 
      ? filteredData.filter(item => selectedRowKeys.includes(item.rowId)) 
      : filteredData;

    const sortedData = [...data].sort((a, b) => String(a.academic_year).localeCompare(String(b.academic_year)));

    let lastYear = null;
    return sortedData.map(item => {
      const isNewYear = item.academic_year !== lastYear;
      if (isNewYear) {
        lastYear = item.academic_year; 
      }
      return { 
        ...item, 
        is_new_year: isNewYear, 
        academic_year_display: isNewYear ? item.academic_year : "" 
      };
    });
  };

  const handleExportPDF = () => {
    const data = getDataToExport();
    if (data.length === 0) return message.warning("กรุณาเลือกข้อมูล");
    
    const groupedData = [];
    let currentGroup = null;
    data.forEach(item => {
      if (item.is_new_year) {
        currentGroup = { year: item.academic_year, items: [] };
        groupedData.push(currentGroup);
      }
      currentGroup.items.push(item);
    });

    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    let fontData = SarabunRegular.ttf ? SarabunRegular.ttf : SarabunRegular;
    if (typeof fontData === 'string' && fontData.includes("base64,")) {
        fontData = fontData.split("base64,")[1];
    }
    doc.addFileToVFS("Sarabun-Regular.ttf", fontData);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun", "normal");
    
    let currentY = 20; 

    groupedData.forEach((group, index) => {
      if (index > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text(`ปีการศึกษา ${group.year}`, 20, currentY);
      currentY += 8; 

      const rows = group.items.map((item, i) => {
        const workText = `${item.ownerFullname}, ${item.work_name}, ${item.description || "-"}, ${item.organization || "-"}, ${dayjs(item.work_date).format("DD/MM/YYYY")}`;
        return [`${i + 1}.`, workText]; 
      });

      doc.autoTable({
        startY: currentY,
        body: rows,
        theme: 'plain',
        styles: { 
          font: "Sarabun", 
          fontSize: 10, 
          cellPadding: { top: 1, bottom: 4, left: 0, right: 0 } 
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'left' }, 
          1: { cellWidth: 155, halign: 'left' } 
        },
        margin: { left: 20, right: 20 },
        didDrawPage: (tableData) => { currentY = tableData.cursor.y; }
      });

      currentY += 8; 
    });
    
    doc.save(`รายงานผลงานบุคลากร_${dayjs().format("YYYYMMDD")}.pdf`);
    message.success("ส่งออก PDF สำเร็จ");
  };

  const handleExportWord = async () => {
    const data = getDataToExport();
    if (data.length === 0) return message.warning("กรุณาเลือกข้อมูล");
    setLoading(true);
    try {
      const response = await fetch("/templates/work_template.docx");
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { 
        paragraphLoop: true, 
        linebreaks: true, 
        delimiters: { start: "[[", end: "]]" } 
      });
      
      const exportData = data.map((item, index) => ({ 
        index: index + 1, 
        ...item, 
        work_date: dayjs(item.work_date).format("DD/MM/YYYY") 
      }));

      const typeText = ownerType === 'teacher' ? 'อาจารย์' 
                    : ownerType === 'staff' ? 'เจ้าหน้าที่' 
                    : ownerType === 'student' ? 'นักศึกษา' 
                    : 'บุคลากรและนักศึกษา';

      doc.render({ 
        works: exportData, 
        report_date: dayjs().format("DD/MM/YYYY"), 
        type_text: typeText, 
        total_count: exportData.length 
      });

      const out = doc.getZip().generate({ type: "blob" });
      saveAs(out, `รายงานผลงาน_${dayjs().format("YYYYMMDD")}.docx`);
      message.success("ส่งออก Word สำเร็จ");
    } catch (error) { 
      message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Word"); 
    } finally { setLoading(false); }
  };

  return (
    <div className="report-work-container">
      <Card 
        className="report-card"
        title={<span className="card-title">รายงานสรุปผลงานบุคลากรและนักศึกษา</span>}
        extra={
          <div className="report-actions">
            <Button icon={<FilePdfOutlined />} danger type="primary" onClick={handleExportPDF} disabled={filteredData.length === 0}>
              PDF {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
            <Button icon={<FileWordOutlined />} type="primary" onClick={handleExportWord} disabled={filteredData.length === 0}>
              Word {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          <div className="report-filters">
            <Select className="select-type" placeholder="เลือกประเภท" value={ownerType} onChange={(val) => { setOwnerType(val); setOwnerIds([]); }} allowClear>
              <Option value={ALL}>ทั้งหมด</Option>
              <Option value="teacher">อาจารย์</Option>
              <Option value="staff">เจ้าหน้าที่</Option>
              <Option value="student">นักศึกษา</Option>
            </Select>

            <Select mode="multiple" className="select-owner" placeholder="เลือกรายชื่อ" value={ownerIds} disabled={!ownerType} onChange={handleOwnerChange} allowClear maxTagCount="responsive">
              {currentOwners.length > 0 && <Option value={ALL}>-- เลือกทั้งหมด --</Option>}
              {currentOwners.map((o) => (
                <Option key={o.id || o.student_id} value={String(o.id || o.student_id)}>
                  {o.prefix_th}{o.first_name_th} {o.last_name_th}
                </Option>
              ))}
            </Select>

            <Select className="select-year" placeholder="ปีการศึกษา" value={year} onChange={setYear} allowClear>
              <Option value={ALL}>ทั้งหมด</Option>
              {academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
            </Select>
          </div>

          <Table
            rowKey="rowId" 
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }} 
            columns={[
              { title: "รหัสผลงาน", dataIndex: "work_code", key: "work_code", width: 120 },
              { title: "ปีการศึกษา", dataIndex: "academic_year", key: "academic_year", width: 100, align: 'center' },
              { title: "ชื่อผลงาน", dataIndex: "work_name", key: "work_name", minWidth: 150 },
              { title: "รายละเอียด", dataIndex: "description", key: "description", ellipsis: true }, 
              { title: "ชื่อ-สกุล", dataIndex: "ownerFullname", key: "ownerFullname", width: 180 },
              { title: "วันที่", dataIndex: "work_date", key: "work_date", width: 110, render: (d) => dayjs(d).format("DD/MM/YYYY") },
            ]}
            dataSource={filteredData}
            bordered
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: ownerType ? "ไม่พบข้อมูล" : "กรุณาเลือกประเภทรายงาน" }}
          />
        </Spin>
      </Card>
    </div>
  );
}