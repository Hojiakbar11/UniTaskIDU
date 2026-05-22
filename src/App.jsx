import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

// ProtectedRoute: Auth holatini tekshiradi va foydalanuvchini faqat o'ziga ruxsat etilgan panelga yo'naltiradi
function ProtectedRoute({ children, allowedRole }) {
  const userString = localStorage.getItem('unitask_user');
  
  if (!userString) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userString);
    if (allowedRole && user.role !== allowedRole) {
      // Boshqa panelga kirishga harakat qilsa, o'zining roliga mos keladiganiga qaytarib yuboramiz
      return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
    }
  } catch (e) {
    localStorage.removeItem('unitask_user');
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login sahifasi */}
        <Route path="/" element={<LoginPage />} />

        {/* Himoyalangan O'qituvchi sahifasi */}
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Himoyalangan Talaba sahifasi */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Noto'g'ri marshrut kiritilsa, login sahifasiga qaytaradi */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
