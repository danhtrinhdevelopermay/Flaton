import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ImageGeneratorPage from './pages/ImageGeneratorPage'
import VideoGeneratorPage from './pages/VideoGeneratorPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/image-generator" element={<ImageGeneratorPage />} />
        <Route path="/video-generator" element={<VideoGeneratorPage />} />
      </Routes>
    </Layout>
  )
}

export default App
