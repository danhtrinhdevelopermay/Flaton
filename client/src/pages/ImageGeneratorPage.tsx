import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Image, Loader2, Download, Zap, Check, RefreshCw, LogIn, Rocket, Sparkles, Palette } from 'lucide-react'
import WaterDropAnimation from '../components/WaterDropAnimation'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const imageTools = [
  { id: 'nano-banana', name: 'Flaton Image V1', credits: 4, provider: 'Nhanh, tiết kiệm', icon: Rocket, color: 'text-blue-400' },
  { id: 'seedream', name: 'Flaton Image V2', credits: 6.5, provider: 'Chi tiết 4K', icon: Sparkles, color: 'text-purple-400' },
  { id: 'gpt4o-image', name: '4o Image (GPT)', credits: 0, provider: 'OpenAI GPT-4o', icon: Palette, color: 'text-emerald-400' },
]

const aspectRatios = [
  { value: '1:1', label: '1:1 (Vuông)' },
  { value: '16:9', label: '16:9 (Ngang)' },
  { value: '9:16', label: '9:16 (Dọc)' },
  { value: '4:3', label: '4:3 (Cổ điển)' },
  { value: '3:4', label: '3:4 (Chân dung)' },
  { value: '3:2', label: '3:2 (Rộng)' },
  { value: '2:3', label: '2:3 (Hẹp)' },
]

interface GenerationResult {
  taskId?: string
  status?: string
  imageUrl?: string
  images?: string[]
  error?: string
}

export default function ImageGeneratorPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const [selectedTool, setSelectedTool] = useState(searchParams.get('tool') || 'nano-banana')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [showWaterDrop, setShowWaterDrop] = useState(false)
  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const loadingAreaRef = useRef<HTMLDivElement>(null)

  const currentTool = imageTools.find(t => t.id === selectedTool)

  useEffect(() => {
    const toolParam = searchParams.get('tool')
    if (toolParam && imageTools.some(t => t.id === toolParam)) {
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

  const saveImageToHistory = async (imageUrl: string, generationPrompt: string, generationModel: string, generationAspectRatio: string) => {
    if (!isAuthenticated || !token) return

    try {
      await fetch('/api/products/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl,
          prompt: generationPrompt,
          model: generationModel,
          aspectRatio: generationAspectRatio
        })
      })
    } catch (err) {
      console.error('Failed to save image to history:', err)
    }
  }

  const pollTaskStatus = async (taskId: string, taskType: string) => {
    setPolling(true)
    setProgress(0)
    setProgressMessage('Đang khởi tạo...')
    const maxAttempts = 60
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

        if (data.status === 'completed' || data.status === 'success') {
          setProgress(100)
          setProgressMessage('Hoàn thành!')
          return {
            status: 'completed',
            imageUrl: data.imageUrl || data.output?.imageUrl,
            images: data.images || data.output?.images,
          }
        }

        if (data.status === 'failed') {
          return { error: 'Tạo hình ảnh thất bại' }
        }

        attempts++
        if (attempts >= maxAttempts) {
          return { error: 'Hết giờ - vui lòng thử lại' }
        }

        const progressPercent = Math.min(95, Math.floor((attempts / 20) * 100))
        setProgress(progressPercent)
        if (progressPercent < 30) {
          setProgressMessage('Đang phân tích prompt...')
        } else if (progressPercent < 60) {
          setProgressMessage('AI đang tạo hình ảnh...')
        } else if (progressPercent < 90) {
          setProgressMessage('Đang hoàn thiện chi tiết...')
        } else {
          setProgressMessage('Sắp xong...')
        }

        await new Promise(resolve => setTimeout(resolve, 3000))
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
    if (!prompt.trim()) return
    
    if (!isAuthenticated || !token) {
      navigate('/login')
      return
    }

    setShowWaterDrop(true)
    setTimeout(() => setShowWaterDrop(false), 1200)

    setLoading(true)
    setResult(null)

    const currentPrompt = prompt
    const currentModel = selectedTool
    const currentAspectRatio = aspectRatio

    try {
      const response = await fetch(`/api/generate/${selectedTool}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: currentPrompt, aspectRatio: currentAspectRatio }),
      })

      const data = await response.json()

      if (data.error) {
        setResult({ error: data.error })
        setLoading(false)
        return
      }

      if (data.taskId) {
        const taskType = data.taskType || (selectedTool === 'gpt4o-image' ? 'gpt4o-image' : 'playground')
        const finalResult = await pollTaskStatus(data.taskId, taskType)
        setResult(finalResult)
        
        if (finalResult.status === 'completed') {
          const imageToSave = finalResult.images?.[0] || finalResult.imageUrl
          if (imageToSave) {
            await saveImageToHistory(imageToSave, currentPrompt, currentModel, currentAspectRatio)
          }
        }
      } else if (data.imageUrl || data.images) {
        const imageResult = {
          status: 'completed',
          imageUrl: data.imageUrl,
          images: data.images,
        }
        setResult(imageResult)
        
        const imageToSave = data.images?.[0] || data.imageUrl
        if (imageToSave) {
          await saveImageToHistory(imageToSave, currentPrompt, currentModel, currentAspectRatio)
        }
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

  return (
    <div className="fade-in">
      <WaterDropAnimation 
        isActive={showWaterDrop}
        fromButton={generateButtonRef}
        toLoading={loadingAreaRef}
      />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Image className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tạo hình ảnh AI</h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Biến ý tưởng thành hình ảnh với AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className={`rounded-2xl p-6 transition-all ${theme === 'dark' ? 'glass border border-slate-700' : 'bg-white shadow-xl border border-slate-200'}`}>
          <h2 className={`font-semibold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Cấu hình</h2>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Chọn mô hình AI</label>
            <div className="grid grid-cols-1 gap-3">
              {imageTools.map((tool) => {
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
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{tool.provider}</div>
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
            <div className="grid grid-cols-3 gap-2">
              {aspectRatios.map((ratio) => (
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
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Mô tả hình ảnh (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả chi tiết hình ảnh bạn muốn tạo... Ví dụ: A cute cat sitting on a window, soft afternoon light, watercolor style"
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
            disabled={loading || !prompt.trim()}
            className="w-full bubble-btn btn-primary py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {polling ? 'Đang xử lý...' : 'Đang gửi yêu cầu...'}
              </>
            ) : (
              <>
                <Image className="w-5 h-5" />
                Tạo hình ảnh ({currentTool?.credits} credits)
              </>
            )}
          </button>
        </div>

        <div ref={loadingAreaRef} className={`rounded-2xl p-6 transition-all ${theme === 'dark' ? 'glass border border-slate-700' : 'bg-white shadow-xl border border-slate-200'}`}>
          <h2 className={`font-semibold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Kết quả</h2>

          {!result && !loading && (
            <div className={`flex flex-col items-center justify-center h-64 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-300'}`}>
              <Image className="w-16 h-16 mb-4 opacity-50" />
              <p>Nhập mô tả và nhấn "Tạo hình ảnh"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <div className="custom-loader-image mb-6">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <defs>
                    <mask id="clipping-image">
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
                <div className="loader-box-image"></div>
              </div>
              
              {polling && (
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{progressMessage}</span>
                    <span className="text-cyan-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="progress-bar-container-image">
                    <div 
                      className="progress-bar-fill-image" 
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

          {result?.status === 'completed' && (result.images?.length || result.imageUrl) && (
            <>
              {result.images && result.images.length > 1 ? (
                <div className="grid grid-cols-2 gap-4">
                  {result.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Generated ${index + 1}`}
                        className="w-full rounded-xl"
                      />
                      <button
                        onClick={() => handleDownload(img, `ai-image-${Date.now()}-${index + 1}.png`)}
                        className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={result.images?.[0] || result.imageUrl}
                      alt="Generated"
                      className="w-full rounded-xl"
                    />
                    <button
                      onClick={() => handleDownload(result.images?.[0] || result.imageUrl!, `ai-image-${Date.now()}.png`)}
                      className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
