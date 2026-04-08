import React, { useMemo, useState, useEffect } from "react";
import { Card, List, Button, Select, message, Spin, Alert, Tag, Empty } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import SurveySummaryCard from "../pages/SurveySummaryCard";
import StudentSurveyForm from "../pagesetting/survey/UserStudentForm";
import GeneralSurveyForm from "../pagesetting/survey/UserGeneralForm";

import "./../style/SurveyMainPage.css"; 

const { Option } = Select;
const STORAGE_KEY = "surveyType";
const API_URL = "http://localhost:8081/api";

export default function SurveyMainPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surveyType, setSurveyType] = useState("all");

  const isManageable = useMemo(() => {
    return user?.permissions?.includes("manage_surveys") || 
           user?.role === "admin" || 
           user?.roleName === "ผู้ดูแลระบบ";
  }, [user]);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/surveys`);
      setSurveys(res.data);
    } catch (error) {
      message.error("ไม่สามารถโหลดรายการแบบสอบถามได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const userRole = user.role ? String(user.role).toLowerCase().trim() : "";

    if (isManageable) {
      const saved = localStorage.getItem(STORAGE_KEY);
      setSurveyType(saved || "all");
    } else if (userRole === "student") {
      setSurveyType("student"); 
    } else {
      setSurveyType("general"); 
    }
  }, [user, isManageable]);

  const handleSurveyTypeChange = (value) => {
    setSurveyType(value);
    if (isManageable) {
      localStorage.setItem(STORAGE_KEY, value);
    }
  };

 
  const availableSurveys = useMemo(() => {
    if (!user || surveys.length === 0) return [];
    
    const now = new Date();
    const userRole = user.role ? String(user.role).toLowerCase().trim() : "";

    console.log("Current User Role:", userRole);
    console.log("Total Surveys from API:", surveys.length);

    const filtered = surveys.filter((s) => {
      if (isManageable) return true;

      const isActive = String(s.is_active) === "1" || s.is_active === true;
      if (!isActive) return false;

      if (s.start_at && now < new Date(s.start_at)) return false;
      if (s.end_at && now > new Date(s.end_at)) return false;

      const target = s.target_group ? String(s.target_group).toLowerCase().trim() : "";

      if (userRole === "student") {
        if (target !== "student") return false; 

        const allowedYears = s.allowedYears || s.allowed_years || [];
        const matchDigits = user?.username ? String(user.username).match(/\d{2}/) : null;
        const studentPrefix = matchDigits ? matchDigits[0] : "";

        if (allowedYears.length > 0 && !allowedYears.includes(studentPrefix)) {
          return false;
        }
        return true;
      } 
      return target === "general";
    });

    console.log("Filtered Surveys:", filtered);
    return filtered;
  }, [user, surveys, isManageable]);

  const studentSurveys = useMemo(
    () => availableSurveys.filter((s) => s.target_group === "student"),
    [availableSurveys]
  );

  const generalSurveys = useMemo(
    () => availableSurveys.filter((s) => s.target_group === "general"),
    [availableSurveys]
  );

  if (surveyId) {
    const currentSurvey = surveys.find((s) => String(s.id) === String(surveyId));
    const hasPermission = availableSurveys.some((s) => String(s.id) === String(surveyId));

    if (!currentSurvey || (!hasPermission && !isManageable)) {
       return (
         <div className="survey-main-container" style={{ padding: '20px' }}>
           <Alert 
             message="ไม่พบข้อมูลแบบสอบถาม หรือคุณไม่มีสิทธิ์เข้าถึง" 
             description="แบบสอบถามนี้อาจถูกปิดไปแล้ว หรือไม่ได้เปิดให้กลุ่มผู้ใช้งานของคุณ"
             type="error" 
             showIcon 
           />
           <Button style={{ marginTop: 16 }} onClick={() => navigate('/home/surveymainpage')}>กลับหน้าหลัก</Button>
         </div>
       );
    }

    if (isManageable) {
      return (
        <div className="survey-main-container">
          <SurveySummaryCard survey={currentSurvey} />
        </div>
      );
    }

    return (
      <div className="survey-main-container">
        <Card title={currentSurvey?.title}>
          {String(user.role).toLowerCase().trim() === "student" ? (
            <StudentSurveyForm
              surveyId={surveyId}
              studentCode={user.studentCode || user.username}
            />
          ) : (
            <GeneralSurveyForm surveyId={surveyId} />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="survey-main-container">
      <Spin spinning={loading}>
        {isManageable && (
          <Card style={{ marginBottom: 16 }}>
            <div className="admin-filter-container">
              <strong>มุมมองผู้ดูแลระบบ:</strong>
              <Select
                value={surveyType}
                onChange={handleSurveyTypeChange}
                className="admin-filter-select"
              >
                <Option value="all">แสดงแบบสอบถามทั้งหมด</Option>
                <Option value="student">แบบสอบถามสำหรับนักศึกษา</Option>
                <Option value="general">แบบสอบถามสำหรับบุคคลทั่วไป</Option>
              </Select>
            </div>
          </Card>
        )}

        {!isManageable && availableSurveys.length === 0 && !loading && (
          <Card style={{ marginTop: 16, padding: '40px 0' }}>
            <Empty description={<span style={{ fontSize: '16px', color: '#888' }}>ไม่มีแบบประเมินสำหรับท่านขณะนี้</span>} />
          </Card>
        )}
        {(surveyType === "all" || surveyType === "student") && studentSurveys.length > 0 && (
          <Card 
            title={<span>แบบสอบถามสำหรับนักศึกษา {isManageable && <Tag color="blue" style={{ marginLeft: 8 }}>Admin View</Tag>}</span>} 
            style={{ marginBottom: 16 }}
          >
            <List
              className="responsive-survey-list" 
              dataSource={studentSurveys}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => navigate(String(item.id))}
                    >
                      {isManageable ? "ดูผลสรุป" : "เริ่มทำแบบสอบถาม"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={isManageable ? `สถานะ: ${item.is_active ? 'เปิด' : 'ปิด'} | กลุ่ม: ${item.target_group}` : "กรุณาตอบข้อมูลตามความเป็นจริง"}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {(surveyType === "all" || surveyType === "general") && generalSurveys.length > 0 && (
          <Card title={<span>แบบสอบถามสำหรับบุคคลทั่วไป {isManageable && <Tag color="blue" style={{ marginLeft: 8 }}>Admin View</Tag>}</span>}>
            <List
              className="responsive-survey-list" 
              dataSource={generalSurveys}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => navigate(String(item.id))}
                    >
                      {isManageable ? "ดูผลสรุป" : "เริ่มทำแบบสอบถาม"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={isManageable ? `สถานะ: ${item.is_active ? 'เปิด' : 'ปิด'}` : "สำหรับบุคคลภายนอกและผู้เข้าเยี่ยมชม"}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Spin>
    </div>
  );
}