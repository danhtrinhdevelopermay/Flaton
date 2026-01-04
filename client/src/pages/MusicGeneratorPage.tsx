import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Music, Loader2, Zap, RefreshCw, Mic, Piano, LogIn, Rocket, Sparkles, Crown } from 'lucide-react'
import WaterDropAnimation from '../components/WaterDropAnimation'
import MusicPlayer from '../components/MusicPlayer'
import ProFeatureOverlay from '../components/ProFeatureOverlay'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const sunoModels = [
  { value: 'V4', label: 'Flaton Music V1', desc: 'Ổn định, nhanh', icon: Rocket, color: 'text-blue-400' },
  { value: 'V4_5', label: 'Flaton Music V1.5', desc: 'Chất lượng cao hơn', icon: Sparkles, color: 'text-purple-400' },
  { value: 'V5', label: 'Flaton Music V2', desc: 'Mới nhất', icon: Crown, color: 'text-yellow-400' },
]

interface GenerationResult {
  taskId?: string
  status?: string
  audioUrl?: string
  audioUrls?: string[]
  title?: string
  error?: string
}

export default function MusicGeneratorPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { token, isAuthenticated, loading: authLoading, user, refreshUser } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [songDescription, setSongDescription] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [instrumental, setInstrumental] = useState(false)
  const [model, setModel] = useState('V4')
  const [style, setStyle] = useState('')
  const [title, setTitle] = useState('')
  const [vocalGender, setVocalGender] = useState('')
  const [negativeTags, setNegativeTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [showWaterDrop, setShowWaterDrop] = useState(false)
  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const loadingAreaRef = useRef<HTMLDivElement>(null)

  // Refresh user data on mount to check for Pro status updates
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const autoPrompt = searchParams.get('autoPrompt')
    if (autoPrompt) {
      setSongDescription(autoPrompt)
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

  const saveMusicToHistory = async (audioUrl: string, musicTitle: string, generationPrompt: string, generationStyle: string | undefined, generationModel: string) => {
    if (!isAuthenticated || !token) return

    try {
      await fetch('/api/products/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          audioUrl,
          title: musicTitle,
          prompt: generationPrompt,
          style: generationStyle,
          model: generationModel
        })
      })
    } catch (err) {
      console.error('Failed to save music to history:', err)
    }
  }

  const getProgressInfo = (statusProgress: string) => {
    switch (statusProgress) {
      case 'PENDING':
        return { percent: 15, message: 'Đang khởi tạo yêu cầu...' }
      case 'TEXT_SUCCESS':
        return { percent: 45, message: 'Đã tạo xong lời bài hát...' }
      case 'FIRST_SUCCESS':
        return { percent: 75, message: 'Bài nhạc đầu tiên đã sẵn sàng...' }
      default:
        return { percent: 10, message: 'Đang xử lý...' }
    }
  }

  const pollTaskStatus = async (taskId: string, taskType: string) => {
    setPolling(true)
    setProgress(5)
    setProgressMessage('Bắt đầu tạo nhạc...')
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

        if (data.progress) {
          const progressInfo = getProgressInfo(data.progress)
          setProgress(progressInfo.percent)
          setProgressMessage(progressInfo.message)
        }

        if (data.status === 'completed' || data.status === 'success') {
          setProgress(100)
          setProgressMessage('Hoàn thành!')
          return {
            status: 'completed',
            audioUrl: data.audioUrl,
            audioUrls: data.audioUrls,
            title: data.title,
          }
        }

        if (data.status === 'failed') {
          return { error: data.error || 'Tạo nhạc thất bại' }
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

  const handleGenerate = async () => {
    if (!songDescription.trim() && !prompt.trim()) return
    if (customMode && (!style.trim() || !title.trim())) return
    
    if (!isAuthenticated || !token) {
      navigate('/login')
      return
    }

    setShowWaterDrop(true)
    setTimeout(() => setShowWaterDrop(false), 1200)

    setLoading(true)
    setResult(null)

    const currentPrompt = prompt
    const currentSongDescription = songDescription
    const currentCustomMode = customMode
    const currentStyle = style
    const currentTitle = title
    const currentModel = model

    try {
      const body: any = {
        prompt: currentPrompt,
        songDescription: currentSongDescription,
        customMode: currentCustomMode,
        instrumental,
        model: currentModel,
      }

      if (currentCustomMode) {
        body.style = currentStyle
        body.title = currentTitle
        if (vocalGender) body.vocalGender = vocalGender
      }

      if (negativeTags) body.negativeTags = negativeTags

      const response = await fetch('/api/generate/suno', {
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
        const finalResult = await pollTaskStatus(data.taskId, 'suno')
        setResult(finalResult)
        
        if (finalResult.status === 'completed' && finalResult.audioUrl) {
          const savedTitle = finalResult.title || currentTitle || 'Untitled'
          const savedPrompt = currentCustomMode ? currentPrompt : currentSongDescription
          const savedStyle = currentCustomMode ? currentStyle : undefined
          await saveMusicToHistory(finalResult.audioUrl, savedTitle, savedPrompt, savedStyle, currentModel)
        }
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

  return (
    <div className="fade-in">
      <WaterDropAnimation 
        isActive={showWaterDrop}
        fromButton={generateButtonRef}
        toLoading={loadingAreaRef}
      />
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-[#6BCB77] to-[#56B362] flex items-center justify-center shadow-lg transform -rotate-3">
          <Music className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>TẠO NHẠC SIÊU ĐỈNH</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFD93D] animate-pulse" />
            <p className={`font-bold uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>AI MUSICAL GENIUS</p>
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
            <div className="w-10 h-10 rounded-xl bg-[#4D96FF] flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            CẤU HÌNH
          </h2>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Chọn phiên bản</label>
            <div className="grid grid-cols-3 gap-2">
              {sunoModels.map((m) => {
                const IconComponent = m.icon;
                const isSelected = model === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setModel(m.value)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                        : theme === 'dark'
                          ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                          : 'border-slate-300 hover:border-slate-400 bg-slate-100 text-slate-700 shadow-sm'
                    }`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-white shadow-inner'} ${m.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="font-medium">{m.label}</div>
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setCustomMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                !customMode
                  ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                  : theme === 'dark'
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-100 text-slate-700 shadow-sm'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Chế độ đơn giản</span>
            </button>
            <button
              onClick={() => setCustomMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                customMode
                  ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                  : theme === 'dark'
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-100 text-slate-700 shadow-sm'
              }`}
            >
              <Piano className="w-5 h-5" />
              <span>Chế độ nâng cao</span>
            </button>
          </div>

          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setInstrumental(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                !instrumental
                  ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                  : theme === 'dark'
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>Có lời</span>
            </button>
            <button
              onClick={() => setInstrumental(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                instrumental
                  ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                  : theme === 'dark'
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
              }`}
            >
              <Piano className="w-5 h-5" />
              <span>Instrumental</span>
            </button>
          </div>

          {customMode && (
            <>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Tiêu đề bài hát *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Summer Vibes"
                  maxLength={80}
                  className={`w-full p-4 border rounded-xl focus:outline-none focus:border-green-500 transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Phong cách nhạc *</label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Ví dụ: Pop, Upbeat, Electronic"
                  className={`w-full p-4 border rounded-xl focus:outline-none focus:border-green-500 transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
              </div>

              {!instrumental && (
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Giọng hát</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setVocalGender('')}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        vocalGender === ''
                          ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                          : theme === 'dark'
                            ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
                      }`}
                    >
                      Tự động
                    </button>
                    <button
                      onClick={() => setVocalGender('m')}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        vocalGender === 'm'
                          ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                          : theme === 'dark'
                            ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
                      }`}
                    >
                      Nam
                    </button>
                    <button
                      onClick={() => setVocalGender('f')}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        vocalGender === 'f'
                          ? 'border-green-500 bg-green-500/10 text-green-600 font-bold'
                          : theme === 'dark'
                            ? 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-slate-300'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 shadow-sm'
                      }`}
                    >
                      Nữ
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Mô tả bài nhạc</label>
            <textarea
              value={songDescription}
              onChange={(e) => setSongDescription(e.target.value)}
              placeholder="Mô tả chung về bài nhạc... Ví dụ: A happy upbeat song about summer vacation"
              maxLength={500}
              className={`w-full h-24 p-4 border rounded-xl focus:outline-none focus:border-green-500 resize-none transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
              }`}
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {songDescription.length}/500 ký tự
            </p>
          </div>

          {customMode && !instrumental && (
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Lời bài hát (Prompt)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập lời bài hát của bạn..."
                maxLength={5000}
                className={`w-full h-32 p-4 border rounded-xl focus:outline-none focus:border-green-500 resize-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                }`}
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {prompt.length}/5000 ký tự
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Loại trừ phong cách (tùy chọn)</label>
            <input
              type="text"
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
              placeholder="Ví dụ: Heavy Metal, Loud Drums"
              className={`w-full p-4 border rounded-xl focus:outline-none focus:border-green-500 transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>

          <button
            ref={generateButtonRef}
            onClick={handleGenerate}
            disabled={loading || (!songDescription.trim() && !prompt.trim()) || (customMode && (!style.trim() || !title.trim()))}
            className="w-full bubble-btn py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {polling ? 'Đang tạo nhạc...' : 'Đang gửi yêu cầu...'}
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                Tạo nhạc
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-3 text-center">
            Nhạc sẽ được tạo trong khoảng 30-60 giây
          </p>
        </div>

        <div ref={loadingAreaRef} className={`rounded-2xl p-6 transition-all ${theme === 'dark' ? 'glass border border-slate-700' : 'bg-white shadow-xl border border-slate-200'}`}>
          <h2 className={`font-semibold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Kết quả</h2>

          {!result && !loading && (
            <div className={`flex flex-col items-center justify-center h-64 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-300'}`}>
              <Music className="w-16 h-16 mb-4 opacity-50" />
              <p>Nhập thông tin và nhấn "Tạo nhạc"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <div className="custom-loader mb-6">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <defs>
                    <mask id="clipping">
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
                    <span className="text-green-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {!polling && (
                <p className="text-slate-300">Đang kết nối...</p>
              )}
              
              <p className="text-sm text-slate-400 mt-3">Quá trình này có thể mất 30-60 giây</p>
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

          {result?.audioUrl && (
            <div className="space-y-4">
              <MusicPlayer
                audioUrl={result.audioUrl}
                title={result.title || 'AI Generated Music'}
                description={
                  customMode 
                    ? `${style || 'Tùy chỉnh'} • ${instrumental ? 'Instrumental' : 'Có lời'} • ${model}` 
                    : `Flaton Music • ${model} • ${instrumental ? 'Instrumental' : 'Có lời'}`
                }
                onDownload={() => handleDownload(result.audioUrl!, `ai-music-${Date.now()}.mp3`)}
                autoPlay={true}
              />

              {result.audioUrls && result.audioUrls.length > 1 && (
                <div className="mt-6">
                  <p className="text-sm text-slate-400 mb-3 font-medium">Các phiên bản khác:</p>
                  <div className="space-y-4">
                    {result.audioUrls.slice(1).map((url, index) => (
                      <MusicPlayer
                        key={index}
                        audioUrl={url}
                        title={`${result.title || 'AI Generated Music'} (Phiên bản ${index + 2})`}
                        description={
                          customMode 
                            ? `${style || 'Tùy chỉnh'} • ${instrumental ? 'Instrumental' : 'Có lời'} • ${model}` 
                            : `Flaton Music • ${model} • ${instrumental ? 'Instrumental' : 'Có lời'}`
                        }
                        onDownload={() => handleDownload(url, `ai-music-v${index + 2}-${Date.now()}.mp3`)}
                        autoPlay={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isAuthenticated && user && !user.is_pro && <ProFeatureOverlay featureName="Tạo nhạc AI" />}
    </div>
  )
}
