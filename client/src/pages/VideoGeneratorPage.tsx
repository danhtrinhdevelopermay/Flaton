import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Video, Loader2, Zap, Check, RefreshCw, Sparkles, LogIn, Rocket, Crown, Image as ImageIcon, Shield, CheckCircle, ChevronDown } from 'lucide-react'
import WaterDropAnimation from '../components/WaterDropAnimation'
import VideoPlayer from '../components/VideoPlayer'
import ProFeatureOverlay from '../components/ProFeatureOverlay'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const videoTools = [
  { id: 'veo3-fast', name: 'Flaton Video V1', credits: 60, provider: 'Flaton', type: 'text', description: 'Text to Video, 720P', icon: Rocket, color: 'text-blue-400' },
  { id: 'sora2', name: 'Flaton VXX Pro', credits: 80, provider: 'OpenAI', type: 'text', description: 'Tạo video chân thực và âm thanh sống động hơn', icon: Crown, color: 'text-yellow-400' },
]

const aspectRatios = [
  { value: '16:9', label: '16:9 (Ngang)' },
  { value: '9:16', label: '9:16 (Dọc)' },
]

const sora2AspectRatios = [
  { value: 'landscape', label: 'Landscape (Ngang)' },
  { value: 'portrait', label: 'Portrait (Dọc)' },
]

const sora2Durations = [
  { value: '10', label: '10 giây' },
  { value: '15', label: '15 giây' },
]

interface GenerationResult {
  taskId?: string
  status?: string
  videoUrl?: string
  error?: string
  canUpgrade1080p?: boolean
}

export default function VideoGeneratorPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { token, isAuthenticated, loading: authLoading, user, refreshUser } = useAuth()
  const [selectedTool, setSelectedTool] = useState(searchParams.get('tool') || 'veo3-fast')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [sora2Ratio, setSora2Ratio] = useState('landscape')
  const [sora2Type, setSora2Type] = useState<'text' | 'image'>('text')
  const [duration, setDuration] = useState('10')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)
  const [upgrading1080p, setUpgrading1080p] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [showWaterDrop, setShowWaterDrop] = useState(false)
  const generateButtonRef = useRef<HTMLButtonElement>(null) as React.MutableRefObject<HTMLButtonElement>
  const loadingAreaRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>

  const currentTool = videoTools.find(t => t.id === selectedTool)

  // Refresh user data on mount to check for Pro status updates
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const toolParam = searchParams.get('tool')
    if (toolParam && videoTools.some(t => t.id === toolParam)) {
      setSelectedTool(toolParam)
    }
    const autoPrompt = searchParams.get('autoPrompt')
    if (autoPrompt) {
      setPrompt(autoPrompt)
    }
  }, [searchParams])

  useEffect(() => {
    const autoPrompt = searchParams.get('autoPrompt')
    if (autoPrompt && !loading) {
      setTimeout(() => {
        handleGenerate()
      }, 800)
    }
  }, [])

  const saveVideoToHistory = async (videoUrl: string, generationPrompt: string, generationImageUrl: string, generationModel: string, generationAspectRatio: string, isImageTool: boolean) => {
    if (!isAuthenticated || !token) return

    try {
      await fetch('/api/products/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          videoUrl,
          prompt: generationPrompt,
          imageUrl: isImageTool ? generationImageUrl : undefined,
          model: generationModel,
          aspectRatio: generationAspectRatio
        })
      })
    } catch (err) {
      console.error('Failed to save video to history:', err)
    }
  }

  const pollTaskStatus = async (taskId: string, taskType: string) => {
    setPolling(true)
    setProgress(5)
    setProgressMessage('Bắt đầu tạo video...')
    const maxAttempts = 120
    let attempts = 0

    const poll = async (): Promise<GenerationResult> => {
      try {
        const response = await fetch(`/api/task/${taskType}/${taskId}${selectedServer ? `?apiKeyId=${selectedServer}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()

        if (data.error) {
          return { error: data.error }
        }

        // Update progress based on attempts
        const calculatedProgress = Math.min(90, 10 + (attempts * 2))
        setProgress(calculatedProgress)
        
        if (attempts < 10) {
          setProgressMessage('AI đang phân tích yêu cầu...')
        } else if (attempts < 30) {
          setProgressMessage('Đang render các khung hình...')
        } else if (attempts < 60) {
          setProgressMessage('Đang tổng hợp video...')
        } else {
          setProgressMessage('Sắp hoàn thành...')
        }

        if (data.status === 'completed' || data.status === 'success') {
          setProgress(100)
          setProgressMessage('Hoàn thành!')
          return {
            status: 'completed',
            videoUrl: data.videoUrl || data.output?.videoUrl,
          }
        }

        if (data.status === 'failed') {
          return { error: 'Tạo video thất bại' }
        }

        attempts++
        if (attempts >= maxAttempts) {
          return { error: 'Hết giờ - vui lòng thử lại' }
        }

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

  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch('/api/admin/kie-keys', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setServers(data);
        if (data.length > 0) setSelectedServer(data[0].id);
      } catch (err) {
        console.error('Failed to fetch servers:', err);
      }
    };
    if (isAuthenticated && token) fetchServers();
  }, [isAuthenticated, token]);

  const handleGenerate = async () => {
    const isTextTool = currentTool?.type === 'text'
    const isSora2 = selectedTool === 'sora2'
    const isImageTool = isSora2 && sora2Type === 'image'
    
    if (!prompt.trim() || !selectedServer) return;
    if (isImageTool && !imageUrl.trim()) return
    
    if (!isAuthenticated || !token) {
      navigate('/login')
      return
    }

    const currentToolCredits = currentTool?.credits || 0;
    const server = servers.find(s => s.id === selectedServer);
    if (server && server.credits < currentToolCredits) {
      alert('Server này không đủ credit!');
      return;
    }

    setShowWaterDrop(true)
    setTimeout(() => setShowWaterDrop(false), 1200)

    setLoading(true)
    setResult(null)

    const currentPrompt = prompt
    const currentImageUrl = imageUrl
    const currentModel = selectedTool
    const currentVideoAspectRatio = isSora2 ? sora2Ratio : aspectRatio

    try {
      let body: any = { prompt: currentPrompt, apiKeyId: selectedServer }
      
      if (isSora2) {
        body.aspectRatio = sora2Ratio
        body.duration = duration
        if (isImageTool) {
          body.imageUrl = currentImageUrl
        }
      } else {
        body.aspectRatio = aspectRatio
      }

      const endpoint = selectedTool === 'sora2' 
        ? `/api/generate/sora2-${sora2Type}`
        : `/api/generate/${selectedTool}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.error) {
        setResult({ error: data.error })
        setLoading(false)
        return
      }

      if (data.taskId) {
        const taskType = data.taskType || 'veo3'
        
        setCurrentTaskId(data.taskId)
        const finalResult = await pollTaskStatus(data.taskId, taskType)
        
        // Enable 1080p upgrade for Veo 3 videos
        if (selectedTool === 'veo3-fast' && finalResult.videoUrl) {
          finalResult.canUpgrade1080p = true
        }
        
        setResult(finalResult)
        
        if (finalResult.status === 'completed' && finalResult.videoUrl) {
          await saveVideoToHistory(finalResult.videoUrl, currentPrompt, currentImageUrl, currentModel, currentVideoAspectRatio, isImageTool)
        }
      } else if (data.videoUrl) {
        const videoResult = {
          status: 'completed',
          videoUrl: data.videoUrl,
        }
        setResult(videoResult)
        await saveVideoToHistory(data.videoUrl, currentPrompt, currentImageUrl, currentModel, currentVideoAspectRatio, isImageTool)
      } else {
        setResult({ status: 'pending', taskId: data.taskId || 'unknown' })
      }
    } catch (err: any) {
      setResult({ error: err.message })
    }

    setLoading(false)
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      window.open(url, '_blank')
    }
  }

  const handleUpgrade1080p = async () => {
    if (!currentTaskId) return
    
    if (!isAuthenticated || !token) {
      navigate('/login')
      return
    }
    
    setUpgrading1080p(true)
    try {
      const response = await fetch(`/api/veo3/1080p/${currentTaskId}?index=0`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success && data.videoUrl) {
        setResult(prev => prev ? { ...prev, videoUrl: data.videoUrl, canUpgrade1080p: false } : prev)
      } else {
        alert(data.message || 'Video 1080P is not ready yet. Please try again in a few minutes.')
      }
    } catch (err: any) {
      alert('Failed to get 1080P video: ' + err.message)
    }
    setUpgrading1080p(false)
  }

  return (
    <div className="fade-in">
      <WaterDropAnimation 
        isActive={showWaterDrop}
        fromButton={generateButtonRef}
        toLoading={loadingAreaRef}
      />
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-[#4D96FF] to-[#6BCBFF] flex items-center justify-center shadow-lg transform rotate-3">
          <Video className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>TẠO VIDEO SIÊU CẤP</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6BCB77] animate-pulse" />
            <p className={`font-bold uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>CINEMATIC AI MAGIC</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className={`rounded-[2.5rem] p-8 transition-all border-b-8 active:translate-y-1 active:border-b-4 ${
          theme === 'dark' 
            ? 'bg-[#2a2d3e] border-[#1e202f] text-white' 
            : 'bg-white border-slate-200 shadow-xl text-slate-900'
        }`}>
          <h2 className="font-black text-2xl tracking-tight mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD93D] flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-[#6B4E00]" />
            </div>
            CẤU HÌNH
          </h2>

          <div className="mb-8">
            <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Cơ sở hạ tầng (KIE AI)
            </label>
            <div className="relative group">
              <select
                value={selectedServer || ''}
                onChange={(e) => setSelectedServer(Number(e.target.value))}
                className={`w-full appearance-none pl-12 pr-10 py-4 rounded-2xl border-2 transition-all cursor-pointer font-bold text-sm ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700 text-white hover:border-slate-600 focus:border-indigo-500' 
                    : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 focus:border-indigo-500 shadow-sm'
                }`}
              >
                {servers.map(server => {
                  const isDisabled = server.credits < (currentTool?.credits || 0);
                  return (
                    <option key={server.id} value={server.id} disabled={isDisabled}>
                      {server.name || `Server ${server.id}`} ({server.credits} Credits) {isDisabled ? '- KHÔNG ĐỦ' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Shield className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Chọn mô hình AI</label>
            <div className="grid grid-cols-1 gap-3">
              {videoTools.map((tool) => {
                const IconComponent = tool.icon;
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : theme === 'dark' 
                          ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50' 
                          : 'border-slate-300 hover:border-slate-400 bg-slate-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-white shadow-inner'} ${tool.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {tool.name}
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {tool.description} • {tool.type === 'text' ? 'V.Ima' : 'V.Vid'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold">{tool.credits}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Tỷ lệ khung hình</label>
            <div className="grid grid-cols-2 gap-2">
              {selectedTool.startsWith('sora2') ? (
                sora2AspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setSora2Ratio(ratio.value)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      sora2Ratio === ratio.value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 font-bold'
                        : theme === 'dark'
                          ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                          : 'border-slate-300 hover:border-slate-400 bg-slate-100 text-slate-700 shadow-sm'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))
              ) : (
                aspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      aspectRatio === ratio.value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 font-bold'
                        : theme === 'dark'
                          ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                          : 'border-slate-300 hover:border-slate-400 bg-slate-100 text-slate-700 shadow-sm'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedTool.startsWith('sora2') && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Thời lượng video</label>
              <div className="grid grid-cols-2 gap-2">
                {sora2Durations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      duration === d.value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 font-bold'
                        : theme === 'dark'
                          ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTool === 'sora2' && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Loại tạo video</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSora2Type('text')}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    sora2Type === 'text'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 font-bold'
                      : theme === 'dark'
                        ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
                  }`}
                >
                  Văn bản → Video
                </button>
                <button
                  onClick={() => setSora2Type('image')}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    sora2Type === 'image'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 font-bold'
                      : theme === 'dark'
                        ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
                  }`}
                >
                  Hình ảnh → Video
                </button>
              </div>
            </div>
          )}

          {selectedTool === 'sora2' && sora2Type === 'image' && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>URL hình ảnh</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={`w-full p-4 border rounded-xl focus:outline-none focus:border-indigo-500 transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                }`}
              />
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Hỗ trợ: JPEG, PNG, WebP (tối đa 10MB)</p>
            </div>
          )}

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Mô tả video (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả chi tiết video bạn muốn tạo... Ví dụ: A majestic eagle soaring through mountain peaks at sunset, cinematic lighting"
              className={`w-full h-32 p-4 border rounded-xl focus:outline-none focus:border-indigo-500 resize-none transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>

          <button
            ref={generateButtonRef}
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || (selectedTool === 'sora2' && sora2Type === 'image' && !imageUrl.trim())}
            className="w-full bubble-btn btn-primary py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {polling ? 'Đang tạo video...' : 'Đang gửi yêu cầu...'}
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Tạo video ({currentTool?.credits} credits)
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Video sẽ được tạo trong khoảng 1-3 phút
          </p>
        </div>

        <div ref={loadingAreaRef} className={`rounded-2xl p-6 transition-all ${theme === 'dark' ? 'glass border border-slate-700' : 'bg-white shadow-xl border border-slate-200'}`}>
          <h2 className={`font-semibold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Kết quả</h2>

          {!result && !loading && (
            <div className={`flex flex-col items-center justify-center h-64 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-300'}`}>
              <Video className="w-16 h-16 mb-4 opacity-50" />
              <p>Nhập thông tin và nhấn "Tạo video"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <div className="custom-loader-video mb-6">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <defs>
                    <mask id="clipping-video">
                      <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                      <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                      <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                      <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                      <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                      <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                      <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    </mask>
                  </defs>
                </svg>
                <div className="loader-box"></div>
              </div>
              
              {polling && (
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{progressMessage}</span>
                    <span className="text-purple-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="progress-bar-container-video">
                    <div 
                      className="progress-bar-fill-video" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {!polling && (
                <p className="text-slate-300">Đang kết nối...</p>
              )}
              
              <p className="text-sm text-slate-400 mt-3">Quá trình này có thể mất 1-3 phút</p>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
              <p className="font-medium mb-1">Lỗi</p>
              <p className="text-sm">{result.error}</p>
              <button
                onClick={handleGenerate}
                className="mt-3 flex items-center gap-2 text-sm hover:text-red-300"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          )}

          {result?.videoUrl && (
            <div className="space-y-4">
              <VideoPlayer
                videoUrl={result.videoUrl}
                title={`AI Generated Video - ${currentTool?.name}`}
                description={`${currentTool?.provider} • ${currentTool?.description}`}
                onDownload={() => handleDownload(result.videoUrl!, `ai-video-${Date.now()}.mp4`)}
                autoPlay={true}
              />
              
              {result.canUpgrade1080p && (
                <button
                  onClick={handleUpgrade1080p}
                  disabled={upgrading1080p}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                >
                  {upgrading1080p ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading 1080P...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Get 1080P HD Video
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {isAuthenticated && user && !user.is_pro && <ProFeatureOverlay featureName="Tạo video AI" />}
    </div>
  )
}
