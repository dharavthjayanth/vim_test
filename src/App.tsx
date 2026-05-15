import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import ClassroomPage from './pages/ClassroomPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<LoginPage />} />
        <Route path="/setup"     element={<SetupPage />} />
        <Route path="/classroom" element={<ClassroomPage />} />
        <Route path="/report"    element={<ReportPage />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
