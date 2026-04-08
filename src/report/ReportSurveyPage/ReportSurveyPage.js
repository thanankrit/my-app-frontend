import React, { useState, useMemo, useEffect } from "react";
import { Card, Table, Select, Button, message } from "antd";
import { FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { SarabunRegular } from "./../../fonts/SarabunRegular"; 
import "./../../style/stylereport/ReportSurveyPage.css";

const { Option } = Select;

export default function ReportSurveyPage() {
  const [surveys, setSurveys] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null); 
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8081/api/surveys');
        setSurveys(response.data);
      } catch (error) {
        console.error("Error fetching surveys:", error);
        message.error("โหลดข้อมูลแบบสอบถามล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const availableYears = useMemo(() => {
    const years = surveys
      .map(s => s.academic_year || s.academicYear)
      .filter(y => y && String(y).trim() !== "");
    return [...new Set(years)].sort((a, b) => b - a);
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    if (!selectedTarget) return []; 
    return surveys.filter((item) => {
      const target = item.target_group || item.targetGroup;
      const year = item.academic_year || item.academicYear;
      
      const matchTarget = target === selectedTarget;
      const matchYear = selectedYear ? String(year) === String(selectedYear) : true; 
      
      return matchTarget && matchYear;
    });
  }, [surveys, selectedTarget, selectedYear]);

  const getLevelText = (score) => {
    const num = parseFloat(score);
    if (num >= 4.51) return "มากที่สุด";
    if (num >= 3.51) return "มาก";
    if (num >= 2.51) return "ปานกลาง";
    if (num >= 1.51) return "น้อย";
    if (num > 0) return "น้อยที่สุด";
    return "ไม่มีข้อมูล";
  };

  const fetchReportData = async () => {
    try {
      const sortedKeys = [...selectedRowKeys].sort((idA, idB) => {
        const surveyA = surveys.find(s => s.id === idA) || {};
        const surveyB = surveys.find(s => s.id === idB) || {};
        
        const yearA = parseInt(surveyA.academic_year || surveyA.academicYear || "0", 10);
        const yearB = parseInt(surveyB.academic_year || surveyB.academicYear || "0", 10);
        
        return yearA - yearB; 
      });

      const exportData = await Promise.all(
        sortedKeys.map(async (surveyId) => {
          const surveyInfo = surveys.find(s => s.id === surveyId);
          const res = await axios.get(`http://localhost:8081/api/surveys/${surveyId}/report`);
          let sumTopicAvg = 0; 

          const topicsData = res.data.map((topic, tIndex) => {
            const topicAvgNum = parseFloat(topic.topic_avg) || 0;
            sumTopicAvg += topicAvgNum;
            return {
              topic_index: tIndex + 1,
              topic_name: topic.topic_name,
              topic_avg: topic.topic_avg,
              topic_level: getLevelText(topic.topic_avg),
              questions: topic.questions.map((q, qIndex) => ({
                question_index: `${tIndex + 1}.${qIndex + 1}`,
                question_text: q.question_text,
                average_score: q.average_score,
                level: getLevelText(q.average_score)
              }))
            };
          });

          const grandTotalAvgNum = topicsData.length > 0 ? (sumTopicAvg / topicsData.length) : 0;
          const grandTotalAvg = grandTotalAvgNum.toFixed(2); 
          const nameToUse = surveyInfo ? (surveyInfo.title || surveyInfo.name) : "รายงานผลแบบสอบถาม";
          const yearToUse = surveyInfo ? (surveyInfo.academic_year || surveyInfo.academicYear || "-") : "-";

          return {
            survey_name: nameToUse,
            academic_year: yearToUse, 
            topics: topicsData,
            grand_total_avg: grandTotalAvg,        
            grand_total_level: getLevelText(grandTotalAvg) 
          };
        })
      );
      return exportData;
    } catch (error) {
      console.error("Error fetching report data:", error);
      throw error;
    }
  };

  const handleExportWord = async () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกแบบสอบถาม");
    setLoading(true);
    try {
      const exportData = await fetchReportData();
      const response = await fetch(`/templates/surveys_template.docx?t=${new Date().getTime()}`);
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '[[', end: ']]' } });
      
      doc.render({ surveys: exportData });
      
      const out = doc.getZip().generate({ type: "blob" });
      saveAs(out, `รายงานแบบสอบถาม_${new Date().getTime()}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการสร้าง Word");
    } finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    if (selectedRowKeys.length === 0) return message.warning("กรุณาเลือกแบบสอบถาม");
    setLoading(true);
    try {
      const exportData = await fetchReportData();
      const doc = new jsPDF('p', 'mm', 'a4'); 
      doc.addFileToVFS("Sarabun-Regular.ttf", SarabunRegular.ttf);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");
      
      const marginX = 14;
      const maxWidth = 182; 

      exportData.forEach((survey, index) => {
        if (index > 0) doc.addPage();
        
        doc.setFontSize(14);
        const titleText = `${survey.survey_name} ปีการศึกษา ${survey.academic_year}`;
        const splitTitle = doc.splitTextToSize(titleText, maxWidth);
        doc.text(splitTitle, marginX, 20);
        
        const tableStartY = 20 + (splitTitle.length * 7);

        const tableBody = [];
        survey.topics.forEach(topic => {
          tableBody.push([
            { content: `${topic.topic_index}. ${topic.topic_name}`, styles: { fontStyle: 'bold' } }, 
            { content: topic.topic_avg, styles: { halign: 'center' } }, 
            { content: topic.topic_level, styles: { halign: 'center' } }
          ]);
          
          topic.questions.forEach(q => {
            tableBody.push([
              `   ${q.question_index} ${q.question_text}`, 
              { content: q.average_score, styles: { halign: 'center' } }, 
              { content: q.level, styles: { halign: 'center' } }
            ]);
          });
        });
        
        tableBody.push([
          { content: `รวมค่าเฉลี่ยทุกด้าน`, styles: { fontStyle: 'bold', halign: 'right' } }, 
          { content: survey.grand_total_avg, styles: { halign: 'center' } }, 
          { content: survey.grand_total_level, styles: { halign: 'center' } }
        ]);
        
        doc.autoTable({ 
          startY: tableStartY, 
          head: [['หัวข้อประเมิน', 'คะแนนเฉลี่ย', 'ระดับ']], 
          body: tableBody, 
          theme: 'grid', 
          styles: { 
            font: "Sarabun", 
            fontSize: 10,
            lineWidth: 0.1, 
            lineColor: [0, 0, 0], 
            textColor: [0, 0, 0], 
            fillColor: null       
          }, 
          headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [0, 0, 0],       
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
          },
          columnStyles: {
            1: { cellWidth: 25 }, 
            2: { cellWidth: 25 }  
          }
        });
      });
      doc.save(`รายงานแบบสอบถาม_${new Date().getTime()}.pdf`);
    } catch (e) { 
      console.error(e);
      message.error("เกิดข้อผิดพลาดในการสร้าง PDF"); 
    } finally { 
      setLoading(false); 
    }
  };

  const columns = [
    { title: "รหัส", dataIndex: "code", key: "code", width: 100 },
    { title: "ชื่อแบบสอบถาม", key: "title", render: (_, record) => record.title || record.name || "-" },
    { title: "ปีการศึกษา", key: "academic_year", width: 100, render: (_, record) => record.academic_year || record.academicYear || "-" }, 
    { title: "วันที่สร้าง", key: "created_at", width: 120, render: (_, record) => (record.created_at || record.created_date) ? new Date(record.created_at || record.created_date).toLocaleDateString('th-TH') : "-" },
    { title: "กลุ่มเป้าหมาย", key: "target_group", width: 130, render: (_, record) => (record.target_group || record.targetGroup) === "student" ? "นักศึกษา" : "บุคคลทั่วไป" },
  ];

  return (
    <div className="report-survey-container">
      <Card 
        className="report-card"
        title={<span className="card-title">รายงานสรุปแบบสอบถาม</span>} 
        extra={
          <div className="report-actions">
            <Button icon={<FilePdfOutlined />} danger type="primary" onClick={handleExportPDF} disabled={selectedRowKeys.length === 0} loading={loading}>PDF</Button>
            <Button icon={<FileWordOutlined />} type="primary" onClick={handleExportWord} disabled={selectedRowKeys.length === 0} loading={loading}>Word</Button>
          </div>
        }
      >
        <div className="report-filters">
          <Select 
            className="filter-select"
            placeholder="เลือกกลุ่มเป้าหมาย" 
            value={selectedTarget} 
            onChange={(v) => { setSelectedTarget(v); setSelectedRowKeys([]); }} 
            allowClear
            style={{ width: 200, marginRight: 10 }}
          >
            <Option value="student">นักศึกษา</Option>
            <Option value="general">บุคคลทั่วไป</Option>
          </Select>

          <Select 
            className="filter-select"
            placeholder="เลือกปีการศึกษา" 
            value={selectedYear} 
            onChange={(v) => { setSelectedYear(v); setSelectedRowKeys([]); }} 
            allowClear
            style={{ width: 150 }}
          >
            {availableYears.map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
        </div>

        <Table
          rowKey="id"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filteredSurveys}
          bordered
          scroll={{ x: 700 }}
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{ 
            emptyText: (
              <div style={{ padding: '30px 0', color: '#8c8c8c' }}>
                {!selectedTarget
                  ? "กรุณาเลือกกลุ่มเป้าหมาย เพื่อแสดงข้อมูลรายงาน" 
                  : "ไม่พบข้อมูลที่ตรงตามเงื่อนไข"}
              </div>
            ) 
          }}
        />
      </Card>
    </div>
  );
}