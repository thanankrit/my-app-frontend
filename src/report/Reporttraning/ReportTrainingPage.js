import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Select, Button, message } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { SarabunRegular } from "./../../fonts/SarabunRegular"; 
import "./../../style/stylereport/ReportTrainingPage.css";

const { Option } = Select;
const ALL = "__ALL__";

export default function ReportTrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [staffsList, setStaffsList] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://localhost:8081/api";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resTrain, resTeach, resStaff] = await Promise.all([
          axios.get(`${API_BASE_URL}/trainings`).then(res => res.data),
          axios.get(`${API_BASE_URL}/teachers`).then(res => res.data),
          axios.get(`${API_BASE_URL}/staffs`).then(res => res.data),
        ]);
        setTrainings(resTrain);
        setTeachersList(resTeach);
        setStaffsList(resStaff);
      } catch (error) {
        message.error("โหลดข้อมูลล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const teachers = useMemo(() => teachersList.map((t) => ({ id: t.id, name: `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}` })), [teachersList]);
  const staffs = useMemo(() => staffsList.map((s) => ({ id: s.id, name: `${s.prefix_th || ''}${s.first_name_th} ${s.last_name_th}` })), [staffsList]);
  const owners = useMemo(() => selectedType === "teacher" ? teachers : (selectedType === "staff" ? staffs : []), [selectedType, teachers, staffs]);
  const years = useMemo(() => [...new Set(trainings.map((t) => t.academic_year))].sort((a, b) => b - a), [trainings]);


  const filteredData = useMemo(() => {
    if (!selectedType || selectedOwnerIds.length === 0 || !selectedYear) return [];
    
    return trainings.filter((item) => {
      const isMatchYear = item.academic_year === selectedYear;
      const isMatchType = item.userType === selectedType;
      const ownerKey = selectedType === "teacher" ? "teacher_id" : "staff_id";
      const isMatchOwner = selectedOwnerIds.includes(item[ownerKey]);
      
      return isMatchType && isMatchYear && isMatchOwner;
    });
  }, [trainings, selectedType, selectedOwnerIds, selectedYear]);

  const handleOwnerChange = (values) => {
    if (values.includes(ALL)) {
      setSelectedOwnerIds(owners.map((o) => o.id));
      return;
    }
    setSelectedOwnerIds(values);
  };

  const getGroupedData = () => {
    const selectedData = filteredData.filter(item => selectedRowKeys.includes(item.id));
    const grouped = selectedData.reduce((acc, curr) => {
      const ownerId = curr.teacher_id || curr.staff_id;
      const ownerName = curr.teacherName || curr.staffName || "ไม่ระบุชื่อ";
      if (!acc[ownerId]) acc[ownerId] = { ownerName, trainings: [] };
      const startDate = new Date(curr.start_date).toLocaleDateString('th-TH');
      const endDate = new Date(curr.end_date).toLocaleDateString('th-TH');
      const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      acc[ownerId].trainings.push({ date: dateRange, description: (curr.description || curr.training_name || "-").replace(/[\r\n]+/g, ' ').trim(), total_hours: Number(curr.total_hours) || 0 });
      return acc;
    }, {});
    return Object.values(grouped).map(person => ({
      ownerName: person.ownerName,
      sum_hours: person.trainings.reduce((sum, t) => sum + t.total_hours, 0),
      trainings: person.trainings.map((t, index) => ({ index: index + 1, ...t }))
    }));
  };

  const handleExportWord = async () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกรายการ");
    setLoading(true);
    try {
      const groupedData = getGroupedData();
      const response = await fetch(`/templates/Training_template.docx?t=${new Date().getTime()}`);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '[[', end: ']]' } });
      doc.render({ persons: groupedData });
      saveAs(doc.getZip().generate({ type: "blob" }), `รายงานอบรมสัมมนา_${new Date().getTime()}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) { message.error("Export Word Error"); } finally { setLoading(false); }
  };


  const handleExportPDF = () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกรายการ");
    const doc = new jsPDF('p', 'mm', 'a4'); 
    doc.addFileToVFS("Sarabun-Regular.ttf", SarabunRegular.ttf);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun");
    
    const groupedData = getGroupedData();
    let currentY = 20;

    groupedData.forEach((person, pIndex) => {
      if (pIndex > 0) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(16);
      doc.text(`รายงานการอบรม / สัมมนา`, 14, currentY);
      currentY += 8;
      
      doc.setFontSize(14);
      doc.text(`${person.ownerName}`, 14, currentY);
      currentY += 6;

      doc.autoTable({
        startY: currentY,
        head: [['ลำดับ', 'วัน เดือน ปี', 'หัวข้อ', 'จำนวนชั่วโมง']],
        body: person.trainings.map(t => [t.index, t.date, t.description, t.total_hours]),
        foot: [[{ content: 'รวมจำนวนชั่วโมงการอบรมทั้งสิ้น', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: person.sum_hours.toString(), styles: { halign: 'center', fontStyle: 'bold' } }]],
        theme: 'grid', 
        styles: { 
          font: "Sarabun", 
          fontSize: 10,
          lineColor: [0, 0, 0], 
          lineWidth: 0.1,
          textColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          halign: 'center',
          fontStyle: 'bold'
        },
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1
        },
        columnStyles: { 
          0: { cellWidth: 15, halign: 'center' }, 
          1: { cellWidth: 40, halign: 'center' }, 
          3: { cellWidth: 25, halign: 'center' } 
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
    });
    
    doc.save(`รายงานอบรมสัมมนา_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="report-training-container">
      <Card 
        className="report-card"
        title={<span className="card-title">รายงานการอบรม / สัมมนา</span>} 
        extra={
          <div className="report-actions">
            <Button icon={<FilePdfOutlined />} danger type="primary" onClick={handleExportPDF} disabled={selectedRowKeys.length === 0}>PDF</Button>
            <Button icon={<FileWordOutlined />} type="primary" onClick={handleExportWord} loading={loading} disabled={selectedRowKeys.length === 0}>Word</Button>
          </div>
        }
      >
        <div className="report-filters">
          <Select className="select-type" placeholder="เลือกประเภท" value={selectedType} onChange={(v) => { setSelectedType(v); setSelectedOwnerIds([]); }} allowClear>
            <Option value="teacher">อาจารย์</Option>
            <Option value="staff">เจ้าหน้าที่</Option>
          </Select>
          <Select mode="multiple" className="select-owner" placeholder="เลือกชื่อ" value={selectedOwnerIds} onChange={handleOwnerChange} disabled={!selectedType || owners.length === 0} allowClear maxTagCount="responsive">
            {owners.length > 0 && <Option value={ALL}>เลือกทั้งหมด</Option>}
            {owners.map((o) => <Option key={o.id} value={o.id}>{o.name}</Option>)}
          </Select>
          <Select className="select-year" allowClear placeholder="เลือกปีการศึกษา" value={selectedYear} onChange={setSelectedYear}>
            {years.map((y) => <Option key={y} value={y}>{y}</Option>)}
          </Select>
        </div>

        <Table
          rowKey="id"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={[
            { title: "ชื่องานอบรม / สัมมนา", dataIndex: "training_name", key: "training_name", minWidth: 200 },
            { title: "ชื่อ – สกุล", key: "fullName", width: 180, render: (_, r) => r.teacherName || r.staffName || "-" },
            { title: "ปีการศึกษา", dataIndex: "academic_year", key: "academic_year", width: 100 },
            { title: "สถานที่", dataIndex: "location", key: "location", width: 150 },
            { title: "ชั่วโมง", dataIndex: "total_hours", key: "total_hours", width: 90 },
          ]}
          dataSource={filteredData}
          bordered
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{
            emptyText: (!selectedType || selectedOwnerIds.length === 0 || !selectedYear)
              ? "กรุณาเลือกประเภท, ชื่อ และปีการศึกษาให้ครบถ้วนเพื่อแสดงข้อมูลรายงาน"
              : "ไม่พบข้อมูลที่ตรงตามเงื่อนไข"
          }}
        />
      </Card>
    </div>
  );
}