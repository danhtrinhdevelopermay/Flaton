import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Video, Loader2, Zap, Check, Rocket, Shield, Wand2, Info, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import WaterDropAnimation from '../components/WaterDropAnimation'
import VideoPlayer from '../components/VideoPlayer'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

interface GenerationResult {
  taskId?: string
  status?: string
  videoUrl?: string
  error?: string
}

export default function KlingMotionControlPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { token, isAuthenticated, user, refreshUser } = useAuth()
  
  const [prompt, setPrompt] = useState(searchParams.get('autoPrompt') || 'The cartoon character is dancing.')
  const [imageUrl, setImageUrl] = useState('https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png')
  const [videoUrl, setVideoUrl] = useState('https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4')
  const [mode, setMode] = useState<'720p' | '1080p'>('720p')
  
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [showWaterDrop, setShowWaterDrop] = useState(false)
  
  const generateButtonRef = useRef<HTMLButtonElement>(null) as React.MutableRefObject<HTMLButtonElement>
  const loadingAreaRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser();
    }
  }, [isAuthenticated, token]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image') setUploadingImage(true);
    else setUploadingVideo(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = type === 'image' ? '/api/upload-image' : '/api/upload-video';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        if (type === 'image') setImageUrl(data.url);
        else setVideoUrl(data.url);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload error: ' + err);
    } finally {
      if (type === 'image') setUploadingImage(false);
      else setUploadingVideo(false);
    }
  };

  const pollTaskStatus = async (taskId: string, taskType: string) => {
    setPolling(true)
    setProgress(5)
    setProgressMessage('Bắt đầu xử lý Motion Control...')
    const maxAttempts = 120
    let attempts = 0

    const poll = async (): Promise<GenerationResult> => {
      try {
        const response = await fetch(`/api/task/${taskType}/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()

        if (data.error) return { error: data.error }

        const calculatedProgress = Math.min(95, 10 + (attempts * 1.5))
        setProgress(calculatedProgress)
        
        if (attempts < 20) setProgressMessage('Đang phân tích cấu trúc chuyển động...')
        else if (attempts < 50) setProgressMessage('Đang áp dụng Motion Control lên hình ảnh...')
        else setProgressMessage('Đang render kết quả cuối cùng...')

        if (data.status === 'completed' || data.status === 'success') {
          setProgress(100)
          setProgressMessage('Hoàn thành!')
          const videoUrl = data.videoUrl || data.data?.videoUrl;
          return { status: 'completed', videoUrl: videoUrl }
        }

        if (data.status === 'failed') return { error: 'Xử lý thất bại' }

        attempts++
        if (attempts >= maxAttempts) return { error: 'Hết thời gian chờ' }

        await new Promise(resolve => setTimeout(resolve, 5000))
        return poll()
      } catch (err: any) {
        return { error: err.message }
      }
    }

    const finalResult = await poll()
    setPolling(false)
    return finalResult
  }

  const handleGenerate = async () => {
    if (!isAuthenticated || !token) {
      navigate('/login')
      return
    }

    setShowWaterDrop(true)
    setTimeout(() => setShowWaterDrop(false), 1200)

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/generate/kling-motion', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          input_urls: [imageUrl],
          video_urls: [videoUrl],
          mode
        }),
      })

      const data = await response.json()

      if (data.error) {
        setResult({ error: data.error })
        setLoading(false)
        return
      }

      if (data.taskId) {
        const finalResult = await pollTaskStatus(data.taskId, 'kling')
        setResult(finalResult)
      }
    } catch (err: any) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 fade-in">
      <WaterDropAnimation 
        isActive={showWaterDrop}
        fromButton={generateButtonRef}
        toLoading={loadingAreaRef}
      />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg transform rotate-3">
          <Wand2 className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>KLING MOTION CONTROL</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            <p className={`font-bold uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>ĐIỀU KHIỂN CHUYỂN ĐỘNG AI</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className={`rounded-[2.5rem] p-8 border-b-8 transition-all ${
          theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f] text-white' : 'bg-white border-slate-200 shadow-xl text-slate-900'
        }`}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider">Mô tả hành động</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: The character is dancing happily..."
                className={`w-full h-24 p-4 rounded-2xl border-2 focus:border-indigo-500 focus:outline-none transition-all ${
                  theme === 'dark' ? 'bg-[#1e202f] border-[#32354a]' : 'bg-slate-50 border-slate-100'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider">Hình ảnh gốc</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL Hình ảnh..."
                    className={`flex-1 p-4 rounded-xl border-2 focus:border-indigo-500 focus:outline-none transition-all ${
                      theme === 'dark' ? 'bg-[#1e202f] border-[#32354a]' : 'bg-slate-50 border-slate-100'
                    }`}
                  />
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className={`px-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center ${
                      theme === 'dark' ? 'border-[#32354a] hover:border-indigo-500 text-slate-400' : 'border-slate-200 hover:border-indigo-500 text-slate-500'
                    }`}
                  >
                    {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider">Video mẫu (Motion)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="URL Video mẫu..."
                    className={`flex-1 p-4 rounded-xl border-2 focus:border-indigo-500 focus:outline-none transition-all ${
                      theme === 'dark' ? 'bg-[#1e202f] border-[#32354a]' : 'bg-slate-50 border-slate-100'
                    }`}
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={(e) => handleFileUpload(e, 'video')}
                    className="hidden"
                    accept="video/*"
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className={`px-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center ${
                      theme === 'dark' ? 'border-[#32354a] hover:border-indigo-500 text-slate-400' : 'border-slate-200 hover:border-indigo-500 text-slate-500'
                    }`}
                  >
                    {uploadingVideo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-wider">Độ phân giải</label>
              <div className="grid grid-cols-2 gap-4">
                {(['720p', '1080p'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${
                      mode === m 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' 
                        : theme === 'dark' ? 'border-[#32354a] hover:border-slate-500' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              ref={generateButtonRef}
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-5 rounded-[2rem] bg-indigo-500 text-white font-black text-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
              BẮT ĐẦU TẠO (48 CREDITS)
            </button>
          </div>
        </div>

        <div ref={loadingAreaRef} className={`rounded-[2.5rem] p-8 min-h-[500px] flex flex-col ${
          theme === 'dark' ? 'bg-[#2a2d3e] border-2 border-[#32354a]' : 'bg-slate-50 border-2 border-slate-100 shadow-inner'
        }`}>
          <h2 className="font-black text-2xl mb-6">KẾT QUẢ</h2>
          
          {!loading && !result && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <Video className="w-24 h-24 mb-4" />
              <p className="font-bold">Video của bạn sẽ xuất hiện tại đây</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm space-y-4">
                <div className="h-4 w-full bg-slate-700/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center font-bold text-indigo-500">{progressMessage}</p>
              </div>
            </div>
          )}

          {result?.videoUrl && (
            <div className="space-y-6">
              <VideoPlayer 
                videoUrl={result.videoUrl} 
                title="Kling Motion Control Result"
                description={`Tạo bởi Kling 2.6 • ${mode.toUpperCase()}`}
              />
              <a 
                href={result.videoUrl}
                download
                className="block w-full py-4 rounded-2xl bg-[#6BCB77] text-white font-black text-center shadow-lg hover:bg-[#56B362] transition-all"
              >
                TẢI XUỐNG VIDEO
              </a>
            </div>
          )}

          {result?.error && (
            <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/20 text-red-500 font-bold flex items-center gap-3">
              <Shield className="w-6 h-6" />
              {result.error}
            </div>
          )}

          <div className={`mt-auto p-4 rounded-2xl flex items-start gap-3 ${
            theme === 'dark' ? 'bg-slate-900/50' : 'bg-white'
          }`}>
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm opacity-60 font-medium">
              Motion Control cho phép bạn áp dụng chuyển động từ một video mẫu lên một hình ảnh tĩnh. Tỷ lệ khớp phụ thuộc vào cấu trúc của nhân vật.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

