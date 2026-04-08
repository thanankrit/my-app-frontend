import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Home from "./components/Home";
import Callback from "./components/Callback"; 
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./components/ForgotPassword"; 

// ===== เมนูและหน้าต่างๆ =====
import InternStudentMainPage from "./pages/InternStudentMainPage";
import ResearchMainPage from "./pages/ResearchMainPage";
import SurveyMainPage from "./pages/SurveyMainPage";
import TrainingMainPage from "./pages/TrainingMainPage";
import WorkMainPage from "./pages/WorkMainPage";
import ReportMainPage from './pages/ReportMainPage';
import SettingsMainPage from "./pages/SettingsMainPage";
import Dashboard from "./pages/Dashboard";

// ===== หน้า Setting ต่างๆ =====
import ResearchPage from "./pagesetting/research/SettingResearchPage";
import AddResearchPage from "./pagesetting/research/AddResearchPage";
import ResearchByTeacherPage from "./pagesetting/research/ResearchByTeacherPage";
import EditResearchPage from "./pagesetting/research/EditResearchPage";

import TrainingSeminarListPage from "./pagesetting/training/TrainingSeminarListPage";
import AddTrainingPage from "./pagesetting/training/AddTrainingPage";
import TrainingByUserPage from "./pagesetting/training/TrainingByUserPage";
import EditTrainingPage from "./pagesetting/training/EditTrainingPage";

import WorkListPage from "./pagesetting/Works/WorkListPage";
import AddWorkPage from "./pagesetting/Works/AddWorkPage";
import WorkByUserPage from "./pagesetting/Works/WorkByUserPage";
import EditWorkPage from "./pagesetting/Works/EditWorkPage";

import PermissionPage from "./pagesetting/Permission/SettingPermissionPage";
import AddPermissionPage from "./pagesetting/Permission/AddPermissionPage";
import EditPermissionPage from "./pagesetting/Permission/EditPermissionPage";

import SurveyListPage from "./pagesetting/survey/SurveyListPage";
import AddSurvey from "./pagesetting/survey/AddSurvey";
import EditSurveyPage from "./pagesetting/survey/EditSurveyPage";

import InternStudentListPage from "./pagesetting/addintern/InternStudentListPage";
import InternshipCreatePage from "./pagesetting/addintern/InternshipCreatePage";
import InternshipEditPage from "./pagesetting/addintern/InternshipEditPage";

import UserTypeSelectionPage from "./pagesetting/user/UserTypeSelectionPage";
import TeacherManagementPage from "./pagesetting/user/TeacherManagementPage";
import AddUserPage from "./pagesetting/user/AddUserPage";
import EditUserPage from "./pagesetting/user/EditUserPage";
import StaffManagementPage from "./pagesetting/user/StaffManagementPage";
import AddStaffPage from "./pagesetting/user/AddStaffPage";
import EditStaffPage from "./pagesetting/user/EditStaffPage";

import AddstudentTypeSelectionPage from "./pagesetting/addstudent/AddstudentTypeSelectionPage";

// ===== หน้า Report =====
import ResearchSelectionPage from "./report/ReportResearch/ResearchSelectionPage";
import ResearchListPage from "./report/ReportResearch/ResearchListPage";
import JournalListPage from "./report/ReportResearch/JournalListPage"; 
import ConferenceListPage from "./report/ReportResearch/ConferenceListPage";
import ReportTrainingPage from "./report/Reporttraning/ReportTrainingPage";
import ReportWorkPage from "./report/ReportWorkPage/ReportWorkPage";
import ReportSurveyPage from "./report/ReportSurveyPage/ReportSurveyPage";
import InsuranceReportPage from "./pagesetting/ReportPage/InsuranceReportPage"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> 
          <Route path="/auth/callback" element={<Callback />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ProtectedRoute requiredPermission="view_basic_data"><Dashboard /></ProtectedRoute>} />
            <Route path="trainingmainpage" element={<ProtectedRoute requiredPermission="view_basic_data"><TrainingMainPage /></ProtectedRoute>} />
            <Route path="workmainpage" element={<ProtectedRoute requiredPermission="view_basic_data"><WorkMainPage /></ProtectedRoute>} />
            <Route path="InternStudentmainpage" element={<ProtectedRoute requiredPermission="view_internship"><InternStudentMainPage /></ProtectedRoute>} />
            <Route path="researchmainpage" element={<ProtectedRoute requiredPermission="view_basic_data"><ResearchMainPage /></ProtectedRoute>} />
            
            <Route path="surveymainpage" element={<ProtectedRoute><SurveyMainPage /></ProtectedRoute>} />
            <Route path="surveymainpage/:surveyId" element={<ProtectedRoute><SurveyMainPage /></ProtectedRoute>} />
            
            <Route path="report" element={<ProtectedRoute requiredPermission="view_reports"><ReportMainPage /></ProtectedRoute>} />
            <Route path="report/research" element={<ProtectedRoute requiredPermission="view_reports"><ResearchSelectionPage /></ProtectedRoute>} />
            <Route path="report/research/list" element={<ProtectedRoute requiredPermission="view_reports"><ResearchListPage /></ProtectedRoute>} />
            <Route path="report/journal/list" element={<ProtectedRoute requiredPermission="view_reports"><JournalListPage /></ProtectedRoute>} />
            <Route path="report/conference/list" element={<ProtectedRoute requiredPermission="view_reports"><ConferenceListPage /></ProtectedRoute>} />
            <Route path="report/Training" element={<ProtectedRoute requiredPermission="view_reports"><ReportTrainingPage /></ProtectedRoute>} />
            <Route path="report/work" element={<ProtectedRoute requiredPermission="view_reports"><ReportWorkPage /></ProtectedRoute>} />
            <Route path="report/survey" element={<ProtectedRoute requiredPermission="view_reports"><ReportSurveyPage /></ProtectedRoute>} />
            <Route path="setting" element={<ProtectedRoute requiredPermission="manage_settings"><SettingsMainPage /></ProtectedRoute>} />
            

            <Route path="setting/research" element={<ProtectedRoute requiredPermission="manage_research"><ResearchPage /></ProtectedRoute>} />
            <Route path="setting/research/add" element={<ProtectedRoute requiredPermission="manage_research"><AddResearchPage /></ProtectedRoute>} />
            <Route path="setting/research/by-teacher/:teacherId" element={<ProtectedRoute requiredPermission="manage_research"><ResearchByTeacherPage /></ProtectedRoute>} />
            <Route path="setting/research/edit/:type/:id" element={<ProtectedRoute requiredPermission="manage_research"><EditResearchPage /></ProtectedRoute>} />
          
            <Route path="setting/training" element={<ProtectedRoute requiredPermission="manage_training"><TrainingSeminarListPage /></ProtectedRoute>} />
            <Route path="setting/training/add" element={<ProtectedRoute requiredPermission="manage_training"><AddTrainingPage /></ProtectedRoute>} />
            <Route path="setting/training/user/:userType/:userId" element={<ProtectedRoute requiredPermission="manage_training"><TrainingByUserPage /></ProtectedRoute>} />
            <Route path="setting/training/edit/:id" element={<ProtectedRoute requiredPermission="manage_training"><EditTrainingPage /></ProtectedRoute>} />
            <Route path="setting/training/by-staff/:id" element={<ProtectedRoute requiredPermission="manage_training"><TrainingByUserPage/></ProtectedRoute>} />

            <Route path="setting/work" element={<ProtectedRoute requiredPermission="manage_works"><WorkListPage /></ProtectedRoute>} />
            <Route path="setting/work/add" element={<ProtectedRoute requiredPermission="manage_works"><AddWorkPage /></ProtectedRoute>} />
            <Route path="setting/work/by/:type/:id" element={<ProtectedRoute requiredPermission="manage_works"><WorkByUserPage /></ProtectedRoute>} />
            <Route path="setting/work/by/:type/:id/edit/:workId" element={<ProtectedRoute requiredPermission="manage_works"><EditWorkPage /></ProtectedRoute>} />

            <Route path="setting/permission" element={<ProtectedRoute requiredPermission="manage_permissions"><PermissionPage /></ProtectedRoute>} />
            <Route path="setting/permission/add" element={<ProtectedRoute requiredPermission="manage_permissions"><AddPermissionPage /></ProtectedRoute>} />
            <Route path="setting/permission/edit/:id" element={<ProtectedRoute requiredPermission="manage_permissions"><EditPermissionPage /></ProtectedRoute>} />
          
       
            <Route path="setting/survey" element={<ProtectedRoute requiredPermission="manage_surveys"><SurveyListPage /></ProtectedRoute>} />
            <Route path="setting/survey/create" element={<ProtectedRoute requiredPermission="manage_surveys"><AddSurvey /></ProtectedRoute>} />
            <Route path="setting/survey/edit/:id" element={<ProtectedRoute requiredPermission="manage_surveys"><EditSurveyPage /></ProtectedRoute>} />
            
        
            <Route path="setting/internship/create" element={<ProtectedRoute requiredPermission="manage_interns"><InternshipCreatePage /></ProtectedRoute>} />
            <Route path="setting/internstudent" element={<ProtectedRoute requiredPermission="manage_interns"><InternStudentListPage /></ProtectedRoute>} />
            <Route path="setting/internship/edit/:id" element={<ProtectedRoute requiredPermission="manage_interns"><InternshipEditPage /></ProtectedRoute>} />

            <Route path="setting/UserTypeSelectionPage" element={<ProtectedRoute requiredPermission="manage_users"><UserTypeSelectionPage/></ProtectedRoute>} />
            <Route path="setting/teacher" element={<ProtectedRoute requiredPermission="manage_users"><TeacherManagementPage /></ProtectedRoute>} />
            <Route path="setting/adduser/:type" element={<ProtectedRoute requiredPermission="manage_users"><AddUserPage /></ProtectedRoute>} />
            <Route path="setting/teacher/edit/:id" element={<ProtectedRoute requiredPermission="manage_users"><EditUserPage /></ProtectedRoute>} /> 
            
            <Route path="setting/staff" element={<ProtectedRoute requiredPermission="manage_users"><StaffManagementPage /></ProtectedRoute>} />
            <Route path="setting/adduser/staff" element={<ProtectedRoute requiredPermission="manage_users"><AddStaffPage /></ProtectedRoute>} />
            <Route path="setting/staff/edit/:id" element={<ProtectedRoute requiredPermission="manage_users"><EditStaffPage /></ProtectedRoute>} /> 

             
            <Route path="setting/insurance-report" element={ <ProtectedRoute requiredPermission="manage_insurance_reports">  <InsuranceReportPage /></ProtectedRoute>  } />
    
            <Route path="setting/AddstudentTypeSelectionPage" element={<ProtectedRoute requiredPermission="manage_users"><AddstudentTypeSelectionPage /></ProtectedRoute>} />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;