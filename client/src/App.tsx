import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ImageGeneratorPage from './pages/ImageGeneratorPage'
import VideoGeneratorPage from './pages/VideoGeneratorPage'
import MusicGeneratorPage from './pages/MusicGeneratorPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/image-generator" element={<ImageGeneratorPage />} />
        <Route path="/video-generator" element={<VideoGeneratorPage />} />
        <Route path="/music-generator" element={<MusicGeneratorPage />} />
      </Routes>
    </Layout>
  )
}

export default App
