import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ImageGeneratorPage from './pages/ImageGeneratorPage'
import VideoGeneratorPage from './pages/VideoGeneratorPage'
import MusicGeneratorPage from './pages/MusicGeneratorPage'
import ExplorerPage from './pages/ExplorerPage'
import ProfilePage from './pages/ProfilePage'
import StatusPage from './pages/StatusPage'
import HistoryPage from './pages/HistoryPage'
import WordGeneratorPage from './pages/WordGeneratorPage'
import PowerPointGeneratorPage from './pages/PowerPointGeneratorPage'
import AdminPage from './pages/AdminPage'
import AdminUpgradePage from './pages/AdminUpgradePage'
import KieApiPage from './pages/KieApiPage'
import LessonsListPage from './pages/LessonsListPage'
import LessonDetailPage from './pages/LessonDetailPage'
import MilestonesPage from './pages/MilestonesPage'
import VideoUpscalePage from './pages/VideoUpscalePage'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/status" element={<StatusPage />} />

            {/* Protected Routes */}
            <Route path="/image-generator" element={<ProtectedRoute><ImageGeneratorPage /></ProtectedRoute>} />
            <Route path="/video-generator" element={<ProtectedRoute><VideoGeneratorPage /></ProtectedRoute>} />
            <Route path="/music-generator" element={<ProtectedRoute><MusicGeneratorPage /></ProtectedRoute>} />
            <Route path="/explorer" element={<ProtectedRoute><ExplorerPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/word-generator" element={<ProtectedRoute><WordGeneratorPage /></ProtectedRoute>} />
            <Route path="/ppt-generator" element={<ProtectedRoute><PowerPointGeneratorPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/kie" element={<ProtectedRoute><KieApiPage /></ProtectedRoute>} />
            <Route path="/flaton-admin-secret" element={<ProtectedRoute><AdminUpgradePage /></ProtectedRoute>} />
            <Route path="/admin/upgrade" element={<ProtectedRoute><AdminUpgradePage /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><LessonsListPage /></ProtectedRoute>} />
            <Route path="/lesson/:id" element={<ProtectedRoute><LessonDetailPage /></ProtectedRoute>} />
            <Route path="/milestones" element={<ProtectedRoute><MilestonesPage /></ProtectedRoute>} />
            <Route path="/video-upscale" element={<ProtectedRoute><VideoUpscalePage /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </AuthProvider>
  )
}
