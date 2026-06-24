import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';

// Import Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentList } from './pages/students/StudentList';
import { StudentDetail } from './pages/students/StudentDetail';
import { StudentForm } from './pages/students/StudentForm';
import { DailyReportList } from './pages/daily-reports/DailyReportList';
import { DailyReportForm } from './pages/daily-reports/DailyReportForm';
import { AssessmentList } from './pages/assessments/AssessmentList';
import { AssessmentForm } from './pages/assessments/AssessmentForm';
import { GalleryList } from './pages/gallery/GalleryList';
import { EvaluationList } from './pages/evaluations/EvaluationList';
import { EvaluationForm } from './pages/evaluations/EvaluationForm';
import { EvaluationRekap } from './pages/evaluations/EvaluationRekap';
import { UserList } from './pages/users/UserList';
import { ReportIndex } from './pages/reports/ReportIndex';
import { ReportPrint } from './pages/reports/ReportPrint';

// Private Route wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500">Memuat sesi...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <ToastContainer />
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Print View - No layout wrapper */}
            <Route 
              path="/reports/:id/print" 
              element={
                <PrivateRoute>
                  <ReportPrint />
                </PrivateRoute>
              } 
            />

            {/* Protected Routes inside Layout */}
            <Route 
              path="/*" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      
                      {/* Students Module */}
                      <Route path="/students" element={<StudentList />} />
                      <Route path="/students/:id" element={<StudentDetail />} />
                      <Route path="/students/add" element={<PrivateRoute allowedRoles={['admin']}><StudentForm /></PrivateRoute>} />
                      <Route path="/students/:id/edit" element={<PrivateRoute allowedRoles={['admin']}><StudentForm /></PrivateRoute>} />
                      
                      {/* Daily Reports Module */}
                      <Route path="/daily-reports" element={<DailyReportList />} />
                      <Route path="/daily-reports/add" element={<PrivateRoute allowedRoles={['pendamping']}><DailyReportForm /></PrivateRoute>} />
                      <Route path="/daily-reports/:id/edit" element={<PrivateRoute allowedRoles={['pendamping']}><DailyReportForm /></PrivateRoute>} />

                      {/* Assessments Module */}
                      <Route path="/assessments" element={<AssessmentList />} />

                      {/* Gallery Module */}
                      <Route path="/gallery" element={<GalleryList />} />

                      {/* Evaluations Module */}
                      <Route path="/evaluations" element={<PrivateRoute allowedRoles={['admin']}><EvaluationList /></PrivateRoute>} />
                      <Route path="/evaluations/add" element={<PrivateRoute allowedRoles={['admin']}><EvaluationForm /></PrivateRoute>} />
                      <Route path="/evaluations/rekap" element={<PrivateRoute allowedRoles={['admin']}><EvaluationRekap /></PrivateRoute>} />

                      {/* Users Module */}
                      <Route path="/users" element={<PrivateRoute allowedRoles={['admin']}><UserList /></PrivateRoute>} />

                      {/* Reports Module */}
                      <Route path="/reports" element={<ReportIndex />} />
                      <Route path="/reports/:id" element={<ReportPrint isEmbed />} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
