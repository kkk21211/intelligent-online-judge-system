import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/Admin/Dashboard';
import TeacherDashboard from './components/Teacher/Dashboard';
import StudentDashboard from './components/Student/Dashboard';
import './App.css';

// 管理员组件
import AdminOverview from './components/Admin/Overview';
import TeacherManagement from './components/Admin/TeacherManagement';
import CourseManagement from './components/Admin/CourseManagement';
import SystemSettings from './components/Admin/SystemSettings';

// 教师组件
import TeacherOverview from './components/Teacher/Overview';
import StudentManagement from './components/Teacher/StudentManagement';
import QuestionManagement from './components/Teacher/QuestionManagement';
import AssignmentManagement from './components/Teacher/AssignmentManagement';
import Statistics from './components/Teacher/Statistics';
import TeacherSettings from './components/Teacher/Settings';

// 学生组件
import StudentOverview from './components/Student/Overview';
import StudentCourses from './components/Student/Courses';
import StudentAssignments from './components/Student/Assignments';
import StudentProgress from './components/Student/Progress';
import StudentSettings from './components/Student/Settings';

function App() {
  return (
    <AuthProvider>
      <ConfigProvider locale={zhCN}>
        <Router>
          <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 管理员路由 */}
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="teachers" element={<TeacherManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
            
            {/* 教师路由 */}
            <Route path="/teacher" element={<TeacherDashboard />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<TeacherOverview />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="questions" element={<QuestionManagement />} />
              <Route path="assignments" element={<AssignmentManagement />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="settings" element={<TeacherSettings />} />
            </Route>
            
            {/* 学生路由 */}
            <Route path="/student" element={<StudentDashboard />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<StudentOverview />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="settings" element={<StudentSettings />} />
            </Route>
          </Routes>
          </div>
        </Router>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;