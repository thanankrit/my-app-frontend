import React, { useState } from "react";
import { Card, Button, Modal, Select, Row, Col, Typography, message, Spin } from "antd";
import { 
  FileWordOutlined, 
  FilePdfOutlined, 
  ArrowLeftOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  TeamOutlined 
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { SarabunRegular } from "./../../fonts/SarabunRegular";
import "../../style/insuranceReport/insuranceReport.css";

const { Title, Text } = Typography;
const API_URL = "http://localhost:8081/api";

const InsuranceReportPage = () => {
  const navigate = useNavigate();

 
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchStartYear, setResearchStartYear] = useState(null);
  const [researchEndYear, setResearchEndYear] = useState(null);
  const [researchRawData, setResearchRawData] = useState([]);
  const [researchAvailableYears, setResearchAvailableYears] = useState([]);


  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalSurveysList, setEvalSurveysList] = useState([]);
  const [evalAvailableYears, setEvalAvailableYears] = useState([]);
  const [evalSelectedYear, setEvalSelectedYear] = useState(null);

  
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingStartYear, setTrainingStartYear] = useState(null);
  const [trainingEndYear, setTrainingEndYear] = useState(null);
  const [trainingRawData, setTrainingRawData] = useState([]);
  const [trainingAvailableYears, setTrainingAvailableYears] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [staffsList, setStaffsList] = useState([]);


  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workLoading, setWorkLoading] = useState(false);
  const [workStartYear, setWorkStartYear] = useState(null);
  const [workEndYear, setWorkEndYear] = useState(null);
  const [workRawData, setWorkRawData] = useState([]);
  const [workAvailableYears, setWorkAvailableYears] = useState([]);

  
  // ==========
  // สำหรับ"รายงานวิจัย"
  
  const openResearchModal = async () => {
    setResearchStartYear(null);
    setResearchEndYear(null);
    setIsResearchModalOpen(true);
    setResearchLoading(true);

    try {
      const [journalsRes, conferencesRes] = await Promise.all([
        axios.get(`${API_URL}/reports/only-journals`),
        axios.get(`${API_URL}/reports/conferences-formatted`)
      ]);

      const journalsData = journalsRes.data.map(item => ({ 
        ...item, report_type: 'journal',
        teacherName: item.first_name_th ? `${item.prefix_th || ''}${item.first_name_th} ${item.last_name_th}` : "ไม่ระบุชื่อ"
      }));

      const conferencesData = conferencesRes.data.map(item => ({ 
        ...item, report_type: 'conference',
        teacherName: item.first_name_th ? `${item.prefix_th || ''}${item.first_name_th} ${item.last_name_th}` : "ไม่ระบุชื่อ"
      }));

      const combinedWorks = [...journalsData, ...conferencesData];
      setResearchRawData(combinedWorks);

      if (combinedWorks.length > 0) {
        const uniqueYears = [...new Set(combinedWorks.map(w => w.year || w.academic_year))].filter(y => y && y !== "-").sort((a, b) => a - b); 
        setResearchAvailableYears(uniqueYears);
      } else {
        setResearchAvailableYears([]);
      }
    } catch (error) {
      console.error(error);
      message.error("ไม่สามารถดึงข้อมูลผลงานในระบบได้");
    } finally {
      setResearchLoading(false);
    }
  };

  const formatDataForExport = () => {
    const sYear = parseInt(researchStartYear);
    const eYear = parseInt(researchEndYear);
    const minYear = Math.min(sYear, eYear);
    const maxYear = Math.max(sYear, eYear);
    const yearList = [];

    for (let y = minYear; y <= maxYear; y++) {
      const currentYear = String(y);
      const itemsInYear = researchRawData.filter(item => String(item.year || item.academic_year) === currentYear);
      if (itemsInYear.length === 0) continue;

      const nationalItems = itemsInYear.filter(item => item.report_type === 'conference' && (item.conference_level === "national" || item.conference_level === "ระดับชาติ")).map((item, idx) => ({
        index: `1.${idx + 1}.`, first_name_en: item.first_name_en || "", last_name_en: item.last_name_en || "", authors: item.authors_en || "-", title: item.article_title_en || item.article_title || "-", conference: item.conference_name_en || item.conference_name || "-", location: item.location || "-", year: item.edition_year || currentYear
      }));

      const internationalItems = itemsInYear.filter(item => item.report_type === 'conference' && (item.conference_level === "international" || item.conference_level === "ระดับนานาชาติ")).map((item, idx) => ({
        index: `2.${idx + 1}.`, first_name_en: item.first_name_en || "", last_name_en: item.last_name_en || "", authors: item.authors_en || "-", title: item.article_title_en || item.article_title || "-", conference: item.conference_name_en || item.conference_name || "-", location: item.location || "-", year: item.edition_year || currentYear
      }));

      const journalItems = itemsInYear.filter(item => item.report_type === 'journal').map((item, idx) => ({
        index: `3.${idx + 1}.`, first_name_en: item.first_name_en || "", last_name_en: item.last_name_en || "", title_name_en: item.title_name_en || item.title || "-", journal_name_en: item.journal_name_en || item.journal_name || "-", volume: item.volume || "-", edition_year: item.edition_year || currentYear, page_no: item.page_no || "-"
      }));

      yearList.push({ year_th: currentYear, national: nationalItems, international: internationalItems, items: journalItems });
    }
    return yearList;
  };

  const handleExportWordResearch = async () => {
    const formattedYearsData = formatDataForExport();
    if (formattedYearsData.length === 0) return message.warning("ไม่พบข้อมูลในช่วงปีที่เลือก");

    try {
      setResearchLoading(true);
      const response = await fetch(`/templates/template_allresearch.docx`); 
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "[[", end: "]]" } });

      doc.render({ years: formattedYearsData });
      const blob = doc.getZip().generate({ type: "blob" });
      saveAs(blob, `รายงานผลงานวิชาการ_${Math.min(researchStartYear, researchEndYear)}-${Math.max(researchStartYear, researchEndYear)}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) {
      console.error("Word Export Error:", error);
      message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Word");
    } finally {
      setResearchLoading(false);
    }
  };

const handleExportPDFResearch = () => {
    const formattedYearsData = formatDataForExport();
    if (formattedYearsData.length === 0) return message.warning("ไม่พบข้อมูลในช่วงปีที่เลือก");
    const minYear = Math.min(researchStartYear, researchEndYear);
    const maxYear = Math.max(researchStartYear, researchEndYear);
    const yearFileText = minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;

    const doc = new jsPDF('p', 'mm', 'a4');
    let fontData = SarabunRegular.ttf ? SarabunRegular.ttf : SarabunRegular;
    if (typeof fontData === 'string' && fontData.includes("base64,")) fontData = fontData.split("base64,")[1];
    
    doc.addFileToVFS("Sarabun-Regular.ttf", fontData);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun", "normal"); 

    let yPos = 20; const marginX = 15; const maxWidth = 180;
    const checkPageBreak = (lines = 1) => { if (yPos + (lines * 6) > 280) { doc.addPage(); yPos = 20; } };

    doc.setFontSize(16); 

    formattedYearsData.forEach(yearData => {
      checkPageBreak(2); doc.setFontSize(14); doc.text(`ปีการศึกษา ${yearData.year_th}`, marginX, yPos); yPos += 8; doc.setFontSize(12);
      
      // ==========================================
      // 1. การประชุมวิชาการระดับชาติ
      // ==========================================
      checkPageBreak(2); doc.text(`1. การประชุมวิชาการระดับชาติ`, marginX + 5, yPos); yPos += 6; 
      if (yearData.national && yearData.national.length > 0) {
        yearData.national.forEach(item => {
          const splitText = doc.splitTextToSize(`${item.index} ${item.first_name_en} ${item.last_name_en}, ${item.title}, ${item.conference}, ${item.location}, ${item.year}`, maxWidth - 15);
          checkPageBreak(splitText.length); doc.text(splitText, marginX + 10, yPos); yPos += (splitText.length * 6);
        });
      } else {
        doc.text(`-`, marginX + 10, yPos); yPos += 6;
      }
      yPos += 2; 

      // ==========================================
      // 2. การประชุมวิชาการระดับนานาชาติ
      // ==========================================
      checkPageBreak(2); doc.text(`2. การประชุมวิชาการระดับนานาชาติ`, marginX + 5, yPos); yPos += 6; 
      if (yearData.international && yearData.international.length > 0) {
        yearData.international.forEach(item => {
          const splitText = doc.splitTextToSize(`${item.index} ${item.first_name_en} ${item.last_name_en}, ${item.title}, ${item.conference}, ${item.location}, ${item.year}`, maxWidth - 15);
          checkPageBreak(splitText.length); doc.text(splitText, marginX + 10, yPos); yPos += (splitText.length * 6);
        });
      } else {
        doc.text(`-`, marginX + 10, yPos); yPos += 6;
      }
      yPos += 2;

      // ==========================================
      // 3. บทความวิจัยที่ตีพิมพ์ในวารสารระดับนานาชาติ
      // ==========================================
      checkPageBreak(2); doc.text(`3. บทความวิจัยที่ตีพิมพ์ในวารสารระดับนานาชาติ`, marginX + 5, yPos); yPos += 6; 
      if (yearData.items && yearData.items.length > 0) {
        yearData.items.forEach(item => {
          const splitText = doc.splitTextToSize(`${item.index} ${item.first_name_en} ${item.last_name_en}, ${item.title_name_en}, ${item.journal_name_en}, ${item.volume}, ${item.edition_year}, ${item.page_no}`, maxWidth - 15);
          checkPageBreak(splitText.length); doc.text(splitText, marginX + 10, yPos); yPos += (splitText.length * 6);
        });
      } else {
        doc.text(`-`, marginX + 10, yPos); yPos += 6;
      }
      yPos += 7;
    });
    
    doc.save(`รายงานผลงานวิชาการ_${yearFileText}.pdf`);
  };

  // =================================================================================
  // สำหรับ"รายงานประเมิน"
  // =================================================================================

  const getYearFromSurvey = (s) => s.academic_year ? s.academic_year.toString() : (new Date(s.created_date || s.created_at).getFullYear() + 543).toString();

  const openEvalModal = async () => {
    setEvalSelectedYear(null);
    setIsEvalModalOpen(true);
    setEvalLoading(true);

    try {
      const res = await axios.get(`${API_URL}/surveys`);
      const studentSurveys = res.data.filter(s => {
        const target = (s.targetGroup || s.target_group || "").toLowerCase();
        return target.includes('นักศึกษา') || target === 'student';
      });
      setEvalSurveysList(studentSurveys);
      const uniqueYears = [...new Set(studentSurveys.map(getYearFromSurvey))].filter(y => y && y !== "NaN").sort((a, b) => parseInt(a) - parseInt(b));
      setEvalAvailableYears(uniqueYears);
    } catch (error) {
      console.error(error); message.error("ไม่สามารถดึงข้อมูลปีการศึกษาแบบสอบถามได้");
    } finally {
      setEvalLoading(false);
    }
  };

  const getScoreLevel = (score) => {
    const s = parseFloat(score);
    if (s >= 4.5) return "ดีมาก";
    if (s >= 3.5) return "ดี";
    if (s >= 2.5) return "ปานกลาง";
    if (s >= 1.5) return "พอใช้";
    return "แย่";
  };

  const fetchEvalDataForExport = async () => {
    if (!evalSelectedYear) return message.warning("กรุณาเลือกปีการศึกษา");

    const currYearStr = evalSelectedYear.toString();
    const currSurveys = evalSurveysList.filter(s => getYearFromSurvey(s) === currYearStr);

    if (currSurveys.length === 0) {
      message.warning(`ไม่พบข้อมูลแบบสอบถามของนักศึกษาในปีการศึกษา ${currYearStr}`);
      return null;
    }

    const surveysData = [];

    for (const currSurvey of currSurveys) {
      let pastReports = [];
      for (let i = 1; i <= 4; i++) {
        const pYear = (parseInt(currYearStr) - i).toString();
        const pSurvey = evalSurveysList.find(s => 
          getYearFromSurvey(s) === pYear && 
          ((s.title && s.title === currSurvey.title) || (s.name && s.name === currSurvey.name) || (s.code && s.code === currSurvey.code))
        );

        if (pSurvey) {
          try {
            const resPrev = await axios.get(`${API_URL}/surveys/${pSurvey.id}/report`);
            if (resPrev.data && resPrev.data.length > 0) {
              pastReports.push({ year: pYear, data: resPrev.data });
            }
          } catch(e) { }
        }
      }

      pastReports.sort((a, b) => parseInt(a.year) - parseInt(b.year));
      const pastCount = pastReports.length;

      const surveyContext = {
        survey_name: currSurvey.title || currSurvey.name || "รายงานผลการประเมิน",
        curr_year: currYearStr,
        past_count: pastCount,
        has_0_prev: pastCount === 0,
        has_1_prev: pastCount === 1,
        has_2_prev: pastCount === 2,
        has_3_prev: pastCount === 3,
        has_4_prev: pastCount === 4,
        has_5_prev: pastCount === 5,
      };

      const prevScoresMaps = {};
      pastReports.forEach((pr, idx) => {
        surveyContext[`prev_year_${idx + 1}`] = pr.year;
        if(idx === 0) surveyContext.prev_year = pr.year; 
        const map = {};
        pr.data.forEach(topic => { topic.questions.forEach(q => { map[q.question_text] = q.average_score; }); });
        prevScoresMaps[idx + 1] = map;
      });

      const resCurr = await axios.get(`${API_URL}/surveys/${currSurvey.id}/report`);
      const currReport = resCurr.data;

      // =========================================================
      // ข้อมูลสำหรับ "ตารางสรุปรายด้าน"
      // =========================================================
      let grandTotalScore = 0;
      let totalQuestionsCount = 0;

      const topicsData = currReport.map((topic, tIdx) => {
        let topicScoreSum = 0;
        const questionsCount = topic.questions.length;
        const topicQuestions = topic.questions.map((q, qIdx) => {
          const score = parseFloat(q.average_score) || 0;
          topicScoreSum += score;
          grandTotalScore += score;
          totalQuestionsCount++;
          return {
            question_index: `${tIdx + 1}.${qIdx + 1}`,
            question_text: q.question_text,
            average_score: score.toFixed(2),
            level: getScoreLevel(score)
          };
        });

        const topicAvg = questionsCount > 0 ? (topicScoreSum / questionsCount) : 0;
        return {
          topic_index: tIdx + 1,
          topic_name: topic.topic_name || `ด้านที่ ${tIdx + 1}`,
          questions_by_topic: topicQuestions,
          topic_avg: topicAvg.toFixed(2),
          topic_level: getScoreLevel(topicAvg)
        };
      });

      const grandAvg = totalQuestionsCount > 0 ? (grandTotalScore / totalQuestionsCount) : 0;
      surveyContext.topics = topicsData;
      surveyContext.grand_total_avg = grandAvg.toFixed(2);
      surveyContext.grand_total_level = getScoreLevel(grandAvg);

      // =========================================================
      //  ข้อมูลสำหรับ "ตารางเปรียบเทียบย้อนหลัง"
      // =========================================================
      let flatQuestions = [];
      let index = 1;

      currReport.forEach(topic => {
        topic.questions.forEach(q => {
          let qObj = {
            question_index: index++,
            question_text: q.question_text,
            curr_score: parseFloat(q.average_score || 0).toFixed(2),
            level: getScoreLevel(q.average_score)
          };
          for (let i = 1; i <= pastCount; i++) {
            let pScore = prevScoresMaps[i][q.question_text];
            qObj[`prev_score_${i}`] = pScore ? parseFloat(pScore).toFixed(2) : "-";
          }
          qObj.prev_score = qObj.prev_score_1 || "-"; 
          flatQuestions.push(qObj);
        });
      });

      surveyContext.questions = flatQuestions;
      surveysData.push(surveyContext);
    }

    return { surveys: surveysData };
  };

  const handleExportWordEval = async () => {
    setEvalLoading(true);
    const exportData = await fetchEvalDataForExport();
    if (!exportData) { setEvalLoading(false); return; }

    try {
      const response = await fetch(`/templates/template_allsurveys.docx`); 
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "[[", end: "]]" }, nullGetter: () => "" });

      doc.render(exportData);
      const blob = doc.getZip().generate({ type: "blob" });
      saveAs(blob, `รายงานแบบประเมินนักศึกษา_${evalSelectedYear}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) {
      console.error("Word Export Error:", error);
      message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Word");
    } finally {
      setEvalLoading(false);
    }
  };

const handleExportPDFEval = async () => {
    setEvalLoading(true);
    const exportData = await fetchEvalDataForExport();
    if (!exportData) { setEvalLoading(false); return; }

    const doc = new jsPDF('p', 'mm', 'a4');
    let fontData = SarabunRegular.ttf ? SarabunRegular.ttf : SarabunRegular;
    if (typeof fontData === 'string' && fontData.includes("base64,")) fontData = fontData.split("base64,")[1];
    doc.addFileToVFS("Sarabun-Regular.ttf", fontData);
    
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun", "normal");

    let currentY = 20;

    exportData.surveys.forEach((survey, index) => {
      if (index > 0) { doc.addPage(); currentY = 20; }

      // ==========================================================
      //จัดการความยาวของชื่อแบบสอบถาม 
      // ==========================================================
      doc.setFont("Sarabun", "normal");
      let titleFontSize = 16;
      doc.setFontSize(titleFontSize);
      const maxWidth = 182; 
      while (doc.getTextWidth(survey.survey_name) > maxWidth && titleFontSize > 11) {
        titleFontSize -= 1;
        doc.setFontSize(titleFontSize);
      }

      
      const splitTitle = doc.splitTextToSize(survey.survey_name, maxWidth);
      doc.text(splitTitle, 14, currentY);
    
      currentY += (splitTitle.length * (titleFontSize * 0.4)); 
      currentY += 2; 

      doc.setFontSize(14); 
      doc.text(`ประจำปีการศึกษา ${survey.curr_year}`, 14, currentY); currentY += 6;

      // ==========================================================
      // วาดตารางที่ 1 (สรุปรายด้าน)
      // ==========================================================
      const headRow1 = ['หัวข้อประเมิน', 'คะแนนเฉลี่ย', 'ระดับ'];
      const bodyRows1 = [];

      survey.topics.forEach(topic => {
        bodyRows1.push([
          { content: `${topic.topic_index}. ${topic.topic_name}`, colSpan: 3, styles: { fontStyle: 'normal' } }
        ]);
        
        topic.questions_by_topic.forEach(q => {
          bodyRows1.push([`  ${q.question_index} ${q.question_text}`, q.average_score, q.level]);
        });
        
        bodyRows1.push([
          { content: `รวมค่าเฉลี่ยด้านที่ ${topic.topic_index}`, styles: { fontStyle: 'normal', halign: 'right' } }, 
          { content: topic.topic_avg, styles: { fontStyle: 'normal', halign: 'center' } }, 
          { content: topic.topic_level, styles: { fontStyle: 'normal', halign: 'center' } }
        ]);
      });

      bodyRows1.push([
        { content: `รวมค่าเฉลี่ยทุกด้าน`, styles: { fontStyle: 'normal', halign: 'right' } }, 
        { content: survey.grand_total_avg, styles: { fontStyle: 'normal', halign: 'center' } }, 
        { content: survey.grand_total_level, styles: { fontStyle: 'normal', halign: 'center' } }
      ]);

      doc.autoTable({
        startY: currentY,
        head: [headRow1],
        body: bodyRows1,
        showHead: 'firstPage', 
        theme: 'grid', 
        styles: { 
          font: "Sarabun", 
          fontSize: 10,
          fontStyle: 'normal', 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0] 
        },
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          halign: 'center', 
          fontStyle: 'normal', 
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        columnStyles: { 0: { cellWidth: 110 }, 1: { halign: 'center' }, 2: { halign: 'center' } }
      });

      currentY = doc.lastAutoTable.finalY + 12;

      // ==========================================================
      // วาดตารางที่ 2 (เปรียบเทียบย้อนหลัง)
      // ==========================================================
      doc.setFontSize(14); 
      doc.setFont("Sarabun", "normal"); 

      const table2Title = doc.splitTextToSize(survey.survey_name, maxWidth);
      doc.text(table2Title, 14, currentY); 
      currentY += (table2Title.length * 6);

      const headRow2 = ['หัวข้อในการประเมิน'];
      for (let i = 1; i <= survey.past_count; i++) {
        headRow2.push(`คะแนนเฉลี่ย\nปี ${survey[`prev_year_${i}`]}`);
      }
      headRow2.push(`คะแนนเฉลี่ย\nปี ${survey.curr_year}`);
      headRow2.push(`การแปลผลของปี\n${survey.curr_year}`);

      const bodyRows2 = survey.questions.map(q => {
        const row = [`${q.question_index}. ${q.question_text}`];
        for (let i = 1; i <= survey.past_count; i++) { row.push(q[`prev_score_${i}`]); }
        row.push(q.curr_score); row.push(q.level);
        return row;
      });

      const colStyles2 = { 0: { cellWidth: 65 } };
      for (let i = 1; i <= survey.past_count + 2; i++) { colStyles2[i] = { halign: 'center' }; }

      doc.autoTable({
        startY: currentY, 
        head: [headRow2], 
        body: bodyRows2,
        showHead: 'firstPage', 
        theme: 'grid', 
        styles: { 
          font: "Sarabun", 
          fontSize: 10,
          fontStyle: 'normal', 
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          halign: 'center', 
          fontStyle: 'normal', 
          lineWidth: 0.1,
          lineColor: [0, 0, 0]
        },
        columnStyles: colStyles2
      });
    });

    doc.save(`รายงานแบบประเมินนักศึกษา_${evalSelectedYear}.pdf`);
    setEvalLoading(false);
  };

  // =================================================================================
  //  สำหรับ "รายงานอบรมสัมมนา "
  // =================================================================================
  const openTrainingModal = async () => {
    setTrainingStartYear(null);
    setTrainingEndYear(null);
    setIsTrainingModalOpen(true);
    setTrainingLoading(true);

    try {
      const [trainRes, teachRes, staffRes] = await Promise.all([
        axios.get(`${API_URL}/trainings`),
        axios.get(`${API_URL}/teachers`),
        axios.get(`${API_URL}/staffs`)
      ]);
      setTrainingRawData(trainRes.data); setTeachersList(teachRes.data); setStaffsList(staffRes.data);
      const uniqueYears = [...new Set(trainRes.data.map(t => t.academic_year))].filter(y => y && y !== "-").sort((a, b) => a - b);
      setTrainingAvailableYears(uniqueYears);
    } catch (error) {
      console.error(error); message.error("ไม่สามารถดึงข้อมูลผลการอบรมได้");
    } finally {
      setTrainingLoading(false);
    }
  };

  const formatTrainingDataForExport = () => {
    const sYear = parseInt(trainingStartYear); const eYear = parseInt(trainingEndYear);
    const minYear = Math.min(sYear, eYear); const maxYear = Math.max(sYear, eYear);
    const TARGET_TYPES = [ "การจัดอบรม/เชิงปฏิบัติการ", "การจัดสัมมนา/เชิงปฏิบัติการ", "การจัดประชุมวิชาการ", "การจัดเสวนา", "การจัดบรรยาย", "การจัดการศึกษาดูงาน" ];
    
    const filteredData = trainingRawData.filter(item => { const y = parseInt(item.academic_year); return y >= minYear && y <= maxYear; });
    const mappedData = filteredData.map(item => {
      let ownerName = "ไม่ระบุชื่อ"; let roleType = "unknown";
      if (item.teacher_id) { const t = teachersList.find(t => t.id === item.teacher_id); if (t) ownerName = `${t.prefix_th || ''}${t.first_name_th} ${t.last_name_th}`; roleType = "teacher"; } 
      else if (item.staff_id) { const s = staffsList.find(s => s.id === item.staff_id); if (s) ownerName = `${s.prefix_th || ''}${s.first_name_th} ${s.last_name_th}`; roleType = "staff"; }
      return { ...item, ownerName, roleType };
    });

    const grouped = mappedData.reduce((acc, curr) => {
      const ownerId = curr.teacher_id ? `t_${curr.teacher_id}` : `s_${curr.staff_id}`;
      if (!acc[ownerId]) { acc[ownerId] = { ownerName: curr.ownerName, roleType: curr.roleType, typesCount: {}, trainings: [], sum_hours: 0 }; }
      if (curr.training_type) { acc[ownerId].typesCount[curr.training_type] = (acc[ownerId].typesCount[curr.training_type] || 0) + 1; }
      const startDate = new Date(curr.start_date).toLocaleDateString('th-TH'); const endDate = new Date(curr.end_date).toLocaleDateString('th-TH');
      const dateRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
      acc[ownerId].trainings.push({ date: dateRange, description: (curr.description || "-").replace(/[\r\n]+/g, ' ').trim(), total_hours: Number(curr.total_hours) || 0 });
      acc[ownerId].sum_hours += Number(curr.total_hours) || 0; return acc;
    }, {});

    const personsArray = Object.values(grouped);
    personsArray.sort((a, b) => { if (a.roleType === 'teacher' && b.roleType !== 'teacher') return -1; if (a.roleType !== 'teacher' && b.roleType === 'teacher') return 1; return a.ownerName.localeCompare(b.ownerName, 'th'); });

    const persons = personsArray.map((person, idx) => {
      const rowData = { index: idx + 1, ownerName: person.ownerName, total: 0, sum_hours: person.sum_hours, trainings: person.trainings.map((t, tIdx) => ({ ...t, index: tIdx + 1 })) };
      TARGET_TYPES.forEach((type, index) => { const count = person.typesCount[type] || 0; rowData[`t${index + 1}`] = count; rowData.total += count; });
      return rowData;
    });
    return { persons, uniqueTypes: TARGET_TYPES };
  };

  const handleExportWordTraining = async () => {
    const exportData = formatTrainingDataForExport();
    if (exportData.persons.length === 0) return message.warning("ไม่พบข้อมูลในช่วงปีที่เลือก");
    try {
      setTrainingLoading(true);
      const response = await fetch(`/templates/template_alltraining.docx`); const arrayBuffer = await response.arrayBuffer(); const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "[[", end: "]]" }, nullGetter: () => "" });
      doc.render({ persons: exportData.persons }); const blob = doc.getZip().generate({ type: "blob" });
      saveAs(blob, `รายงานสรุปอบรมสัมมนา_${Math.min(trainingStartYear, trainingEndYear)}-${Math.max(trainingStartYear, trainingEndYear)}.docx`);
      message.success("สร้างไฟล์ Word สำเร็จ");
    } catch (error) { console.error("Word Export Error:", error); message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Word"); } finally { setTrainingLoading(false); }
  };

const handleExportPDFTraining = () => {
    const exportData = formatTrainingDataForExport();
    if (exportData.persons.length === 0) return message.warning("ไม่พบข้อมูลในช่วงปีที่เลือก");

    const minYear = Math.min(trainingStartYear, trainingEndYear);
    const maxYear = Math.max(trainingStartYear, trainingEndYear);
    const yearTitleText = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
    const yearFileText = minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;

    const doc = new jsPDF('p', 'mm', 'a4'); 
    let fontData = SarabunRegular.ttf ? SarabunRegular.ttf : SarabunRegular;
    if (typeof fontData === 'string' && fontData.includes("base64,")) fontData = fontData.split("base64,")[1];
    doc.addFileToVFS("Sarabun-Regular.ttf", fontData); 
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal"); 
    doc.setFont("Sarabun", "normal");

    doc.setFontSize(16); doc.text(`รายงานสรุปจำนวนการได้รับการพัฒนาบุคลากร (อบรม/สัมมนา)`, 14, 20);
    doc.setFontSize(14); doc.text(`ประจำปีการศึกษา ${yearTitleText}`, 14, 28);

    const headRow = ['ลำดับ', 'ชื่อ-นามสกุล', 'หน่วยงาน', ...exportData.uniqueTypes, 'รวม'];
    const bodyRows = exportData.persons.map(p => { 
        const row = [p.index, p.ownerName, 'CS']; 
        for (let i = 0; i < exportData.uniqueTypes.length; i++) { 
            row.push(p[`t${i + 1}`] === 0 ? '0' : p[`t${i + 1}`]); 
        } 
        row.push(p.total); 
        return row; 
    });
    
    // ==========================================================
    // ตารางที่ 1 (ภาพรวม) 
    // ==========================================================
    doc.autoTable({ 
        startY: 35, 
        head: [headRow], 
        body: bodyRows, 
        theme: 'grid',
        styles: { 
          font: "Sarabun", 
          fontSize: 9, 
          fontStyle: 'normal', 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0], 
          cellPadding: 2 
        }, 
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          halign: 'center', 
          valign: 'middle', 
          fontStyle: 'normal', 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0] 
        }, 
        columnStyles: { 
          0: { halign: 'center', cellWidth: 12 }, 
          2: { halign: 'center', cellWidth: 18 }, 
          3: { halign: 'center', cellWidth: 10 }, 
          4: { halign: 'center', cellWidth: 10 },
          5: { halign: 'center', cellWidth: 10 },
          6: { halign: 'center', cellWidth: 10 },
          7: { halign: 'center', cellWidth: 10 },
          8: { halign: 'center', cellWidth: 10 },
          9: { halign: 'center', cellWidth: 12 }  
        },
        didParseCell: function(data) {
            if (data.section === 'head' && data.row.index === 0 && data.column.index >= 3 && data.column.index <= 8) {
                data.cell.styles.minCellHeight = 45; 
                data.cell.text = ['']; 
            }
        },
        didDrawCell: function(data) {
            if (data.section === 'head' && data.row.index === 0 && data.column.index >= 3 && data.column.index <= 8) {
                const text = exportData.uniqueTypes[data.column.index - 3];
                doc.setFont("Sarabun", "normal");
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                
                const x = data.cell.x + (data.cell.width / 2) + 1.2; 
                const y = data.cell.y + data.cell.height - 2; 
                
                doc.text(text, x, y, { angle: 90 }); 
            }
        }
    });

    let currentY = doc.lastAutoTable.finalY + 15;
    exportData.persons.forEach((person) => {
      if (currentY > 260) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14); doc.text(`${person.ownerName}`, 14, currentY); currentY += 6;
      
      // ==========================================================
      // ตารางที่ 2 (รายบุคคล)
      // ==========================================================
      doc.autoTable({
        startY: currentY, 
        head: [['ลำดับ', 'วัน เดือน ปี', 'หัวข้อ', 'จำนวนชั่วโมง']], 
        body: person.trainings.map(t => [t.index, t.date, t.description, t.total_hours]),
        foot: [[ { content: 'รวม', colSpan: 3, styles: { halign: 'right', fontStyle: 'normal' } }, { content: person.sum_hours.toString(), styles: { halign: 'center', fontStyle: 'normal' } } ]],
        
        showHead: 'firstPage', 
        showFoot: 'lastPage',  
        
        theme: 'grid',
        styles: { 
          font: "Sarabun", 
          fontSize: 10, 
          fontStyle: 'normal', 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0] 
        }, 
        headStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          halign: 'center', 
          fontStyle: 'normal', 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0] 
        }, 
        footStyles: { 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          fontStyle: 'normal', 
          lineWidth: 0.1, 
          lineColor: [0, 0, 0] 
        },
        columnStyles: { 
          0: { halign: 'center', cellWidth: 15 }, 
          1: { halign: 'center', cellWidth: 35 }, 
          3: { halign: 'center', cellWidth: 25 } 
        }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });
    
    doc.save(`รายงานสรุปอบรมสัมมนา_${yearFileText}.pdf`);
  };

  // =================================================================================
  //  สำหรับ "รายงานผลงาน 
  // =================================================================================
  
  const openWorkModal = async () => {
    setWorkStartYear(null);
    setWorkEndYear(null);
    setIsWorkModalOpen(true);
    setWorkLoading(true);

    try {
      const [resT, resStf, resStd, resTWork, resStfWork, resStdWork] = await Promise.all([
        axios.get(`${API_URL}/teachers`),
        axios.get(`${API_URL}/staffs`),
        axios.get(`${API_URL}/students`),
        axios.get(`${API_URL}/teacher-works`),
        axios.get(`${API_URL}/staff-works`),
        axios.get(`${API_URL}/student-works`),
      ]);

      const teachers = resT.data;
      const staffs = resStf.data;
      const students = resStd.data;

      const getSafeFullName = (obj) => {
        if (!obj) return "ไม่พบชื่อ";
        const p = obj.prefix_th || obj.prefix || "";
        const f = obj.first_name_th || obj.first_name || "";
        const l = obj.last_name_th || obj.last_name || "";
        return `${p}${f} ${l}`.trim() || "ไม่พบชื่อ";
      };
      const combinedWorks = [
        ...resTWork.data.map(w => {
          const owner = teachers.find(o => String(o.id) === String(w.teacher_id)) || {};
          return { 
            ...w, 
            ownerFullname: getSafeFullName(owner),
            prefix_th: owner.prefix_th || owner.prefix || "",
            first_name_th: owner.first_name_th || owner.first_name || getSafeFullName(owner), 
            last_name_th: owner.last_name_th || owner.last_name || ""
          };
        }),
        ...resStfWork.data.map(w => {
          const owner = staffs.find(o => String(o.id) === String(w.staff_id)) || {};
          return { 
            ...w, 
            ownerFullname: getSafeFullName(owner),
            prefix_th: owner.prefix_th || owner.prefix || "",
            first_name_th: owner.first_name_th || owner.first_name || getSafeFullName(owner),
            last_name_th: owner.last_name_th || owner.last_name || ""
          };
        }),
        ...resStdWork.data.map(w => {
          const owner = students.find(o => String(o.student_id || o.id) === String(w.student_id)) || {};
          return { 
            ...w, 
            ownerFullname: getSafeFullName(owner),
            prefix_th: owner.prefix_th || owner.prefix || "",
            first_name_th: owner.first_name_th || owner.first_name || getSafeFullName(owner),
            last_name_th: owner.last_name_th || owner.last_name || ""
          };
        })
      ];

      setWorkRawData(combinedWorks);
      
      const uniqueYears = [...new Set(combinedWorks.map(w => w.academic_year))]
        .filter(y => y && y !== "-")
        .sort((a, b) => a - b);
      setWorkAvailableYears(uniqueYears);

    } catch (error) {
      console.error(error);
      message.error("ไม่สามารถดึงข้อมูลผลงานได้");
    } finally {
      setWorkLoading(false);
    }
  };

  const formatWorkDataForExport = () => {
    const sYear = parseInt(workStartYear);
    const eYear = parseInt(workEndYear);
    const minYear = Math.min(sYear, eYear);
    const maxYear = Math.max(sYear, eYear);

    const filtered = workRawData.filter(item => {
      const y = parseInt(item.academic_year);
      return y >= minYear && y <= maxYear;
    });

    // เรียงตามปี และชื่อ
    return filtered.sort((a, b) => 
      String(a.academic_year).localeCompare(String(b.academic_year)) || 
      String(a.ownerFullname).localeCompare(String(b.ownerFullname), 'th')
    );
  };

const handleExportPDFWork = () => {
    const data = formatWorkDataForExport();
    if (data.length === 0) return message.warning("ไม่พบข้อมูลในช่วงปีที่เลือก");

    const doc = new jsPDF('p', 'mm', 'a4');
    let fontData = SarabunRegular.ttf ? SarabunRegular.ttf : SarabunRegular;
    if (typeof fontData === 'string' && fontData.includes("base64,")) fontData = fontData.split("base64,")[1];
    doc.addFileToVFS("Sarabun-Regular.ttf", fontData);
    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.setFont("Sarabun", "normal");

    let currentY = 20;
    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.academic_year]) acc[curr.academic_year] = [];
      acc[curr.academic_year].push(curr);
      return acc;
    }, {});

    Object.keys(grouped).sort().forEach((year, idx) => {
      if (idx > 0 && currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(16);
      doc.text(`ปีการศึกษา ${year}`, 20, currentY);
      currentY += 8;
      const rows = grouped[year].map((item) => [
        "-", 
        `${item.ownerFullname}, ${item.work_name}, ${item.description || "-"}, ${item.organization || "-"}, ${new Date(item.work_date).toLocaleDateString('th-TH')}`
      ]);

      doc.autoTable({
        startY: currentY,
        body: rows,
        theme: 'plain',
        styles: { 
          font: "Sarabun", 
          fontSize: 11,
          valign: 'top', 
          cellPadding: { top: 1, bottom: 4, left: 0, right: 0 } 
        },
        columnStyles: { 
  
          0: { cellWidth: 8, halign: 'left' }, 
 
          1: { cellWidth: 140, halign: 'left' } 
        },

        margin: { left: 28, right: 30 }, 
        didDrawPage: (d) => { currentY = d.cursor.y; }
      });
      currentY += 8;
    });

    doc.save(`รายงานผลงาน_${workStartYear}-${workEndYear}.pdf`);
  };

  const handleExportWordWork = async () => {
    const data = formatWorkDataForExport();
    if (data.length === 0) return message.warning("ไม่พบข้อมูลในช่วงปีที่เลือก");
    setWorkLoading(true);
    try {
      const response = await fetch("/templates/work_template.docx");
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: "[[", end: "]]" } });
      let lastYear = null;
      const exportData = data.map((item, index) => {
        const isNewYear = item.academic_year !== lastYear;
        if (isNewYear) {
          lastYear = item.academic_year; 
        }

        return { 
          index: index + 1, 
          ...item, 
          work_date: new Date(item.work_date).toLocaleDateString('th-TH'),
          is_new_year: isNewYear,
          academic_year_display: isNewYear ? item.academic_year : ""
        };
      });
      // ----------------------------------------------------

      doc.render({ works: exportData, total_count: exportData.length, type_text: "บุคลากรและนักศึกษา" });
      const out = doc.getZip().generate({ type: "blob" });
      saveAs(out, `รายงานผลงาน_${workStartYear}-${workEndYear}.docx`);
    } catch (error) { 
      message.error("เกิดข้อผิดพลาดในการสร้างไฟล์ Word"); 
    } finally { 
      setWorkLoading(false); 
    }
  };

  return (
    <div className="insurance-container">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>ย้อนกลับ</Button>
      <Card className="settings-main-card">
        <Title level={4} style={{ textAlign: 'center', marginBottom: 32 }}>สร้างรายงานสำหรับส่งประกัน</Title>
        <div className="report-card-grid">
          <Button className="report-item-btn" onClick={openResearchModal}><div className="report-icon-wrapper"><ExperimentOutlined /></div><Text strong>รายงานวารสาร/วิจัย</Text></Button>
          <Button className="report-item-btn" onClick={openEvalModal}><div className="report-icon-wrapper"><CheckCircleOutlined /></div><Text strong>รายงานประเมิน</Text></Button>
          <Button className="report-item-btn" onClick={openTrainingModal}><div className="report-icon-wrapper"><TeamOutlined /></div><Text strong>รายงานอบรมสัมมนา</Text></Button>
          <Button className="report-item-btn" onClick={openWorkModal}><div className="report-icon-wrapper"><FileWordOutlined /></div><Text strong>รายงานผลงาน</Text></Button>
        </div>
      </Card>

      <Modal title={<b>เลือกช่วงปีการศึกษา - รายงานวารสาร/วิจัย</b>} open={isResearchModalOpen} onCancel={() => setIsResearchModalOpen(false)} footer={null} centered width={450}>
        <Spin spinning={researchLoading}>
          <div style={{ padding: "10px 0" }}>
            <Row gutter={[16, 16]}>
              <Col span={11}><Text type="secondary">ตั้งแต่ปี</Text><Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={researchStartYear} onChange={setResearchStartYear} disabled={researchAvailableYears.length === 0}>{researchAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}</Select></Col>
              <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 25 }}>-</Col>
              <Col span={11}><Text type="secondary">ถึงปี</Text><Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={researchEndYear} onChange={setResearchEndYear} disabled={researchAvailableYears.length === 0}>{researchAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}</Select></Col>
            </Row>
            <div style={{ marginTop: 40 }}><Text strong>ส่งออกเป็นไฟล์:</Text><Row gutter={12} style={{ marginTop: 12 }}><Col span={12}><Button block danger icon={<FilePdfOutlined />} disabled={!researchStartYear || !researchEndYear} onClick={handleExportPDFResearch}>PDF</Button></Col><Col span={12}><Button block type="primary" icon={<FileWordOutlined />} style={{ backgroundColor: '#2b579a' }} disabled={!researchStartYear || !researchEndYear} onClick={handleExportWordResearch}>Word</Button></Col></Row></div>
          </div>
        </Spin>
      </Modal>

      {/* ============================== Modal ประเมิน ============================== */}
      <Modal title={<b>เลือกปีการศึกษา - รายงานประเมิน</b>} open={isEvalModalOpen} onCancel={() => setIsEvalModalOpen(false)} footer={null} centered width={450}>
        <Spin spinning={evalLoading}>
          <div style={{ padding: "10px 0" }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text type="secondary">เลือกปีการศึกษา</Text>
                <Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={evalSelectedYear} onChange={setEvalSelectedYear} disabled={evalAvailableYears.length === 0}>
                  {evalAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                </Select>
              </Col>
            </Row>
            <div style={{ marginTop: 40 }}><Text strong>ส่งออกเป็นไฟล์:</Text><Row gutter={12} style={{ marginTop: 12 }}><Col span={12}><Button block danger icon={<FilePdfOutlined />} disabled={!evalSelectedYear} onClick={handleExportPDFEval}>PDF</Button></Col><Col span={12}><Button block type="primary" icon={<FileWordOutlined />} style={{ backgroundColor: '#2b579a' }} disabled={!evalSelectedYear} onClick={handleExportWordEval}>Word</Button></Col></Row></div>
          </div>
        </Spin>
      </Modal>

      <Modal title={<b>เลือกช่วงปีการศึกษา - รายงานอบรมสัมมนา</b>} open={isTrainingModalOpen} onCancel={() => setIsTrainingModalOpen(false)} footer={null} centered width={450}>
        <Spin spinning={trainingLoading}>
          <div style={{ padding: "10px 0" }}>
            <Row gutter={[16, 16]}>
              <Col span={11}><Text type="secondary">ตั้งแต่ปี</Text><Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={trainingStartYear} onChange={setTrainingStartYear} disabled={trainingAvailableYears.length === 0}>{trainingAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}</Select></Col>
              <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 25 }}>-</Col>
              <Col span={11}><Text type="secondary">ถึงปี</Text><Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={trainingEndYear} onChange={setTrainingEndYear} disabled={trainingAvailableYears.length === 0}>{trainingAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}</Select></Col>
            </Row>
            <div style={{ marginTop: 40 }}><Text strong>ส่งออกเป็นไฟล์:</Text><Row gutter={12} style={{ marginTop: 12 }}><Col span={12}><Button block danger icon={<FilePdfOutlined />} disabled={!trainingStartYear || !trainingEndYear} onClick={handleExportPDFTraining}>PDF</Button></Col><Col span={12}><Button block type="primary" icon={<FileWordOutlined />} style={{ backgroundColor: '#2b579a' }} disabled={!trainingStartYear || !trainingEndYear} onClick={handleExportWordTraining}>Word</Button></Col></Row></div>
          </div>
        </Spin>
      </Modal>
      {/* ============================== Modal รายงานผลงาน ============================== */}
      <Modal 
        title={<b>เลือกช่วงปีการศึกษา - รายงานผลงาน</b>} 
        open={isWorkModalOpen} 
        onCancel={() => setIsWorkModalOpen(false)} 
        footer={null} 
        centered 
        width={450}
      >
        <Spin spinning={workLoading}>
          <div style={{ padding: "10px 0" }}>
            <Row gutter={[16, 16]}>
              <Col span={11}>
                <Text type="secondary">ตั้งแต่ปี</Text>
                <Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={workStartYear} onChange={setWorkStartYear} disabled={workAvailableYears.length === 0}>
                  {workAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                </Select>
              </Col>
              <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 25 }}>-</Col>
              <Col span={11}>
                <Text type="secondary">ถึงปี</Text>
                <Select placeholder="เลือกปี" style={{ width: '100%', marginTop: 8 }} value={workEndYear} onChange={setWorkEndYear} disabled={workAvailableYears.length === 0}>
                  {workAvailableYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                </Select>
              </Col>
            </Row>
            <div style={{ marginTop: 40 }}>
              <Text strong>ส่งออกเป็นไฟล์:</Text>
              <Row gutter={12} style={{ marginTop: 12 }}>
                <Col span={12}><Button block danger icon={<FilePdfOutlined />} disabled={!workStartYear || !workEndYear} onClick={handleExportPDFWork}>PDF</Button></Col>
                <Col span={12}><Button block type="primary" icon={<FileWordOutlined />} style={{ backgroundColor: '#2b579a' }} disabled={!workStartYear || !workEndYear} onClick={handleExportWordWork}>Word</Button></Col>
              </Row>
            </div>
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default InsuranceReportPage;