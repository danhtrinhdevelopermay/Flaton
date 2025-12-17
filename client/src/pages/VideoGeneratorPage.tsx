import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Video, Loader2, Zap, Check, RefreshCw, Upload, Sparkles, LogIn, Rocket, Film, Clapperboard, ImagePlay, Crown } from 'lucide-react'
import VideoPlayer from '../components/VideoPlayer'
import { useAuth } from '../contexts/AuthContext'

const videoTools = [
  { id: 'veo3-fast', name: 'Flaton Video V1', credits: 60, provider: 'Flaton', type: 'text', description: 'Nhanh, 720P', icon: Rocket, color: 'text-blue-400' },
  { id: 'veo3', name: 'Flaton Video V2', credits: 100, provider: 'Flaton', type: 'text', description: 'Chất lượng cao, chậm hơn', icon: Film, color: 'text-purple-400' },
  { id: 'grok-t2v', name: 'Flaton Video X (Text)', credits: 20, provider: 'Flaton', type: 'text', description: 'Text to Video', icon: Clapperboard, color: 'text-green-400' },
  { id: 'grok-i2v', name: 'Flaton Video X (Image)', credits: 20, provider: 'Flaton', type: 'image', description: 'Image to Video', icon: ImagePlay, color: 'text-orange-400' },
  { id: 'midjourney-video', name: 'Flaton Video Pro', credits: 40, provider: 'Flaton', type: 'image', description: 'Image to Video', icon: Crown, color: 'text-yellow-400' },
]

const aspectRatios = [
  { value: '16:9', label: '16:9 (Ngang)' },
  { value: '9:16', label: '9:16 (Dọc)' },
  { value: '1:1', label: '1:1 (Vuông)' },
]

const grokAspectRatios = [
  { value: '3:2', label: '3:2 (Ngang)' },
  { value: '2:3', label: '2:3 (Dọc)' },
  { value: '1:1', label: '1:1 (Vuông)' },
]

const grokModes = [
  { value: 'normal', label: 'Normal', desc: 'Chế độ chuẩn' },
  { value: 'fun', label: 'Fun', desc: 'Vui nhộn, sáng tạo' },
  { value: 'spicy', label: 'Spicy', desc: 'Nghệ thuật, táo bạo' },
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
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const [selectedTool, setSelectedTool] = useState(searchParams.get('tool') || 'veo3-fast')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [grokAspectRatio, setGrokAspectRatio] = useState('3:2')
  const [grokMode, setGrokMode] = useState('normal')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)
  const [upgrading1080p, setUpgrading1080p] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')

  const currentTool = videoTools.find(t => t.id === selectedTool)

  useEffect(() => {
    const toolParam = searchParams.get('tool')
    if (toolParam && videoTools.some(t => t.id === toolParam)) {
      setSelectedTool(toolParam)
    }
  }, [searchParams])

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
        const response = await fetch(`/api/task/${taskType}/${taskId}`, {
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
          return { error: 'Video generation failed' }
        }

        attempts++
        if (attempts >= maxAttempts) {
          return { error: 'Timeout - please try again' }
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

  const handleGenerate = async () => {
    const isTextTool = currentTool?.type === 'text'
    const isImageTool = currentTool?.type === 'image'
    
    if (isTextTool && !prompt.trim()) return
    if (isImageTool && !imageUrl.trim()) return
    
    if (!isAuthenticated || !token) {
      navigate('/login')
      return
    }

    setLoading(true)
    setResult(null)

    const currentPrompt = prompt
    const currentImageUrl = imageUrl
    const currentModel = selectedTool
    const currentVideoAspectRatio = selectedTool === 'grok-t2v' ? grokAspectRatio : 
                                     (selectedTool === 'grok-i2v' || selectedTool === 'midjourney-video') ? '1:1' : 
                                     aspectRatio

    try {
      let body: any = {}
      
      if (selectedTool === 'veo3-fast' || selectedTool === 'veo3') {
        body = { prompt: currentPrompt, aspectRatio }
      } else if (selectedTool === 'grok-t2v') {
        body = { prompt: currentPrompt, aspectRatio: grokAspectRatio, mode: grokMode }
      } else if (selectedTool === 'grok-i2v') {
        body = { imageUrl: currentImageUrl, prompt: currentPrompt, mode: grokMode }
      } else if (selectedTool === 'midjourney-video') {
        body = { imageUrl: currentImageUrl, prompt: currentPrompt }
      }

      const response = await fetch(`/api/generate/${selectedTool}`, {
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
        // Use taskType from response if available, otherwise fallback to mapping
        let taskType = data.taskType || 'midjourney'
        if (!data.taskType) {
          if (selectedTool === 'veo3-fast' || selectedTool === 'veo3') taskType = 'veo3'
          else if (selectedTool.startsWith('grok')) taskType = 'grok'
          else if (selectedTool === 'midjourney-video') taskType = 'midjourney-video'
        }
        
        setCurrentTaskId(data.taskId)
        const finalResult = await pollTaskStatus(data.taskId, taskType)
        
        // Enable 1080p upgrade for Veo 3 videos
        if ((selectedTool === 'veo3-fast' || selectedTool === 'veo3') && finalResult.videoUrl) {
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tạo video AI</h1>
          <p className="text-slate-400">Tạo video từ văn bản hoặc hình ảnh</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Cấu hình</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Chọn mô hình AI</label>
            <div className="grid grid-cols-1 gap-3">
              {videoTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedTool === tool.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center ${tool.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium flex items-center gap-2">
                          {tool.name}
                          {selectedTool === tool.id && <Check className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div className="text-sm text-slate-400">
                          {tool.description} • {tool.type === 'text' ? 'Text to Video' : 'Image to Video'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold">{tool.credits}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {(selectedTool === 'veo3-fast' || selectedTool === 'veo3') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Tỷ lệ khung hình</label>
              <div className="grid grid-cols-3 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      aspectRatio === ratio.value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTool === 'grok-t2v' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Tỷ lệ khung hình</label>
                <div className="grid grid-cols-3 gap-2">
                  {grokAspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setGrokAspectRatio(ratio.value)}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        grokAspectRatio === ratio.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Chế độ tạo video</label>
                <div className="grid grid-cols-3 gap-2">
                  {grokModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setGrokMode(mode.value)}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        grokMode === mode.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedTool === 'grok-i2v' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">URL hình ảnh nguồn</label>
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">Nhập URL công khai của hình ảnh bạn muốn chuyển thành video</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Chế độ tạo video</label>
                <div className="grid grid-cols-3 gap-2">
                  {grokModes.filter(m => m.value !== 'spicy').map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setGrokMode(mode.value)}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        grokMode === mode.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{mode.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Lưu ý: Chế độ Spicy không hỗ trợ với ảnh bên ngoài</p>
              </div>
            </>
          )}

          {selectedTool === 'midjourney-video' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">URL hình ảnh nguồn</label>
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">Nhập URL công khai của hình ảnh bạn muốn chuyển thành video</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {currentTool?.type === 'text' ? 'Mô tả video (Prompt)' : 'Mô tả chuyển động'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                currentTool?.type === 'text'
                  ? "Mô tả chi tiết video bạn muốn tạo... Ví dụ: A majestic eagle soaring through mountain peaks at sunset, cinematic lighting"
                  : "Mô tả chuyển động bạn muốn... Ví dụ: Camera slowly zooms in, gentle wind effect"
              }
              className="w-full h-32 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || (currentTool?.type === 'text' ? !prompt.trim() : !imageUrl.trim())}
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

        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Kết quả</h2>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
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
    </div>
  )
}
