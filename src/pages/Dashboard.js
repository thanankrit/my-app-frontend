import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import "../style/Dashboard.css"; 

const getAutoColor = (index, hueStart = 0, hueStep = 137.5) => {
  const hue = (hueStart + index * hueStep) % 360; 
  return `hsl(${hue}, 65%, 60%)`; 
};

const WorkTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <h4>{data.teacher_name}</h4>
        <p className="highlight-orange">ผลงานรวม: {data.total_works} ชิ้น</p>
        <hr />
        <ul>
          <li>📘 งานวิจัย: {data.researches_count || 0} ชิ้น</li>
          <li>📗 วารสาร: {data.journals_count || 0} ชิ้น</li>
          <li>📙 ประชุมวิชาการ: {data.conferences_count || 0} ชิ้น</li>
          <li>📕 หนังสือ/ตำรา: {data.books_count || 0} ชิ้น</li>
        </ul>
      </div>
    );
  }
  return null;
};

const GeneralWorkTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <h4>{data.name}</h4>
        <p className="highlight-green">🏆 จำนวนผลงาน: {data.total_works || 0} ชิ้น</p>
      </div>
    );
  }
  return null;
};

const TrainingTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <h4>{data.name}</h4>
        <p className="highlight-dark">⏱️ อบรมรวม: {data.total_hours || 0} ชั่วโมง</p>
        <p className="sub-text">📅 จำนวนโครงการ: {data.training_count || 0} ครั้ง</p>
      </div>
    );
  }
  return null;
};

const SurveyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; 
    return (
      <div className="custom-tooltip survey-tooltip">
        <h4>{data.survey_name || data.name}</h4>
        <p className="sub-text">กลุ่มเป้าหมาย: {data.target_group_th || data.name}</p>
        <p className="highlight-purple">👥 จำนวนคนทำ: {data.respondents} คน</p>
        <p className="highlight-green">⭐ คะแนนเฉลี่ย: {data.average_score} / 5</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [worksData, setWorksData] = useState([]);
  const [teacherTrainData, setTeacherTrainData] = useState([]);
  const [staffTrainData, setStaffTrainData] = useState([]);
  const [teacherWorksCount, setTeacherWorksCount] = useState([]);
  const [staffWorksCount, setStaffWorksCount] = useState([]);
  const [studentWorksCount, setStudentWorksCount] = useState([]);
  const [surveyData, setSurveyData] = useState([]);
  const [selectedSurveyCode, setSelectedSurveyCode] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const urls = [
          'http://localhost:8081/api/teacher-works-summary',
          'http://localhost:8081/api/teacher-trainings-summary',
          'http://localhost:8081/api/staff-trainings-summary',
          'http://localhost:8081/api/teacher-works-count',
          'http://localhost:8081/api/staff-works-count',
          'http://localhost:8081/api/student-works-count',
          'http://localhost:8081/api/survey-summary' 
        ];
        const responses = await Promise.all(urls.map(url => fetch(url).then(res => res.json())));
        setWorksData(Array.isArray(responses[0]) ? responses[0] : []);
        setTeacherTrainData(Array.isArray(responses[1]) ? responses[1] : []);
        setStaffTrainData(Array.isArray(responses[2]) ? responses[2] : []);
        setTeacherWorksCount(Array.isArray(responses[3]) ? responses[3] : []);
        setStaffWorksCount(Array.isArray(responses[4]) ? responses[4] : []);
        setStudentWorksCount(Array.isArray(responses[5]) ? responses[5] : []);
        setSurveyData(Array.isArray(responses[6]) ? responses[6] : []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSurveyData = selectedSurveyCode === 'ALL' 
    ? surveyData 
    : surveyData.filter(item => item.code === selectedSurveyCode);

  if (isLoading) return <div className="dashboard-loading">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="dashboard-container">
      

      <h2 className="dashboard-title blue-border">ผลงานวิชาการ</h2>
      <div className="dashboard-card main-pie-card"> 
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={worksData} cx="50%" cy="50%" innerRadius="30%" outerRadius="80%" paddingAngle={4}
              dataKey="total_works" nameKey="teacher_name" cornerRadius={8}
            >
              {worksData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getAutoColor(index, 0)} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<WorkTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <h2 className="dashboard-title orange-border">สถิติการอบรมสัมมนา</h2>
      <div className="dashboard-grid-2">
        <div className="dashboard-card">
          <h3 className="card-subtitle">อาจารย์ (Teacher)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={teacherTrainData} dataKey="total_hours" nameKey="name" innerRadius="50%" outerRadius="80%">
                {teacherTrainData.map((entry, index) => (
                  <Cell key={`cell-t-${index}`} fill={getAutoColor(index, 160)} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<TrainingTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3 className="card-subtitle">เจ้าหน้าที่ (Staff)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={staffTrainData} dataKey="total_hours" nameKey="name" innerRadius="50%" outerRadius="80%">
                {staffTrainData.map((entry, index) => (
                  <Cell key={`cell-s-${index}`} fill={getAutoColor(index, 210)} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<TrainingTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="dashboard-title green-border">ผลงาน</h2>
      <div className="dashboard-grid-3">
        <div className="dashboard-card">
          <h3 className="card-subtitle">อาจารย์ (Teacher)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={teacherWorksCount} dataKey="total_works" nameKey="name" innerRadius="45%" outerRadius="75%">
                {teacherWorksCount.map((entry, index) => (
                  <Cell key={`cell-tw-${index}`} fill={getAutoColor(index, 30)} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<GeneralWorkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3 className="card-subtitle">เจ้าหน้าที่ (Staff)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={staffWorksCount} dataKey="total_works" nameKey="name" innerRadius="45%" outerRadius="75%">
                {staffWorksCount.map((entry, index) => (
                  <Cell key={`cell-sw-${index}`} fill={getAutoColor(index, 200)} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<GeneralWorkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3 className="card-subtitle">นักศึกษา (Student)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={studentWorksCount} dataKey="total_works" nameKey="name" innerRadius="45%" outerRadius="75%">
                {studentWorksCount.map((entry, index) => (
                  <Cell key={`cell-stw-${index}`} fill={getAutoColor(index, 300)} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<GeneralWorkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <h2 className="dashboard-title purple-border">สถิติแบบสอบถาม</h2>
      <div className="dashboard-card">
        <div className="filter-container">
          <label className="filter-label">เลือกดูข้อมูลแบบสอบถาม:</label>
          <select 
            className="filter-select"
            value={selectedSurveyCode} 
            onChange={(e) => setSelectedSurveyCode(e.target.value)}
          >
            <option value="ALL">ทุกแบบสอบถาม</option>
            {surveyData.map((survey) => (
              <option key={survey.code} value={survey.code}>
                [{survey.code}] {survey.survey_name}
              </option>
            ))}
          </select>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={filteredSurveyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="code" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 5]} />
            <Tooltip content={<SurveyTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="respondents" name="จำนวนคน (คน)" fill="#8884d8" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="average_score" name="คะแนนเฉลี่ย" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 

export default Dashboard;