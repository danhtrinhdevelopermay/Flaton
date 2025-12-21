import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/image-generator" element={<ImageGeneratorPage />} />
          <Route path="/video-generator" element={<VideoGeneratorPage />} />
          <Route path="/music-generator" element={<MusicGeneratorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/flaton-admin-secret" element={<AdminPage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App
