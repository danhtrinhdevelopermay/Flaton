import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ImageGeneratorPage from './pages/ImageGeneratorPage'
import VideoGeneratorPage from './pages/VideoGeneratorPage'
import MusicGeneratorPage from './pages/MusicGeneratorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import StatusPage from './pages/StatusPage'
import AdminPage from './pages/AdminPage'
import ExplorerPage from './pages/ExplorerPage'
import ProfilePage from './pages/ProfilePage'
import LessonDetailPage from './pages/LessonDetailPage'
import LessonsListPage from './pages/LessonsListPage'
import PowerPointGeneratorPage from './pages/PowerPointGeneratorPage'
import WordGeneratorPage from './pages/WordGeneratorPage'
import AdminUpgradePage from './pages/AdminUpgradePage'
import MilestonesPage from './pages/MilestonesPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/image-generator" element={<ImageGeneratorPage />} />
          <Route path="/video-generator" element={<VideoGeneratorPage />} />
          <Route path="/music-generator" element={<MusicGeneratorPage />} />
          <Route path="/pptx-generator" element={<PowerPointGeneratorPage />} />
          <Route path="/word-generator" element={<WordGeneratorPage />} />
          <Route path="/lessons" element={<LessonsListPage />} />
          <Route path="/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/flaton-admin-secret" element={<AdminPage />} />
          <Route path="/flaton-admin-secret/upgrade-requests" element={<AdminUpgradePage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  </ThemeProvider>
)
}

export default App
