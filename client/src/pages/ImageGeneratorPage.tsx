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
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
          <Image className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>TẠO ẢNH SIÊU CẤP</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6BCB77] animate-pulse" />
            <p className={`font-bold uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>AI POWERED MAGIC</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className={`rounded-[2.5rem] p-8 transition-all border-b-8 active:translate-y-1 active:border-b-4 ${
          theme === 'dark' 
            ? 'bg-[#2a2d3e] border-[#1e202f] text-white' 
            : 'bg-white border-slate-200 shadow-xl text-slate-900'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FFD93D] flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-[#6B4E00]" />
            </div>
            <h2 className="font-black text-2xl tracking-tight">CẤU HÌNH</h2>
          </div>

          <div className="mb-8">
            <label className={`block text-sm font-black uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>1. CHỌN MÁY CHỦ AI</label>
            <div className="grid grid-cols-1 gap-4">
              {imageTools.map((tool) => {
                const IconComponent = tool.icon;
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`flex items-center justify-between p-5 rounded-[1.5rem] border-b-4 transition-all active:translate-y-1 active:border-b-0 ${
                      isSelected
                        ? 'border-[#4D96FF] bg-[#4D96FF]/10 ring-4 ring-[#4D96FF]/20'
                        : theme === 'dark' 
                          ? 'border-[#1e202f] bg-[#1e202f]/50 hover:bg-[#32354a]' 
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isSelected ? 'bg-[#4D96FF] text-white' : 'bg-white ' + tool.color}`}>
                        <IconComponent className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-lg flex items-center gap-2">
                          {tool.name.toUpperCase()}
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#6BCB77]" />}
                        </div>
                        <div className={`text-xs font-bold uppercase tracking-tighter ${isSelected ? 'text-[#4D96FF]' : 'text-slate-400'}`}>{tool.provider}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFF5E4] border-b-2 border-[#FFE3B3]">
                      <Zap className="w-4 h-4 text-[#FF9F29] fill-[#FF9F29]" />
                      <span className="text-[#FF9F29] font-black text-xl">{tool.credits}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <label className={`block text-sm font-black uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>2. TỶ LỆ KHUNG HÌNH</label>
            <div className="grid grid-cols-3 gap-3">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  className={`p-4 rounded-2xl border-b-4 font-black transition-all active:translate-y-1 active:border-b-0 ${
                    aspectRatio === ratio.value
                      ? 'border-[#6BCB77] bg-[#6BCB77]/10 text-[#56B362] ring-4 ring-[#6BCB77]/20'
                      : theme === 'dark'
                        ? 'border-[#1e202f] bg-[#1e202f]/50 text-slate-400'
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  {ratio.value}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className={`block text-sm font-black uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>3. Ý TƯỞNG CỦA BẠN</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Nhập phép màu tại đây... ✨"
              className={`w-full h-40 p-6 border-4 rounded-[2rem] font-bold text-lg focus:outline-none focus:border-[#4D96FF] resize-none transition-all shadow-inner ${
                theme === 'dark'
                  ? 'bg-[#1e202f] border-[#32354a] text-white placeholder-slate-600'
                  : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <button
            ref={generateButtonRef}
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full h-20 bg-[#FF6B6B] border-b-[10px] border-[#EE5253] text-white rounded-[2rem] font-black text-2xl hover:translate-y-1 hover:border-b-4 active:translate-y-2 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="animate-pulse">{polling ? 'ĐANG BIẾN HÌNH...' : 'ĐANG KẾT NỐI...'}</span>
              </>
            ) : (
              <>
                <Rocket className="w-8 h-8" />
                TẠO NGAY!
              </>
            )}
          </button>
        </div>

        <div ref={loadingAreaRef} className={`rounded-[2.5rem] p-8 transition-all border-b-8 ${
          theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f]' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#6BCB77] flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className={`font-black text-2xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>KẾT QUẢ</h2>
          </div>
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
            <div className="flex flex-col items-center justify-center w-full max-w-md space-y-6">
              <div className="flex items-center justify-between w-full">
                <span className={`font-black text-xl italic uppercase ${theme === 'dark' ? 'text-[#4D96FF]' : 'text-indigo-600'}`}>{progressMessage}</span>
                <span className="bg-[#4D96FF] text-white px-4 py-1 rounded-full font-black text-2xl shadow-lg">{progress}%</span>
              </div>
              <div className="h-10 w-full bg-[#FFF5E4] rounded-full p-2 border-b-4 border-[#FFE3B3] shadow-inner overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#4D96FF] to-[#6BCBFF] rounded-full transition-all duration-500 ease-out border-r-4 border-white shadow-md relative" 
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-center">
                <div className="animate-bounce">
                  <Rocket className="w-12 h-12 text-[#FF6B6B]" />
                </div>
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
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="uiverse-container">
                          <label className="uiverse-label">
                            <input 
                              type="checkbox" 
                              className="uiverse-input" 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleDownload(img, `ai-image-${Date.now()}-${index + 1}.png`);
                                  setTimeout(() => {
                                    e.target.checked = false;
                                  }, 4000);
                                }
                              }}
                            />
                            <span className="uiverse-circle">
                              <svg
                                className="uiverse-icon"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                  d="M12 19V5m0 14-4-4m4 4 4-4"
                                ></path>
                              </svg>
                              <div className="uiverse-square"></div>
                            </span>
                            <p className="uiverse-title">Download</p>
                            <p className="uiverse-title">Done</p>
                          </label>
                        </div>
                      </div>
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
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="uiverse-container">
                        <label className="uiverse-label">
                          <input 
                            type="checkbox" 
                            className="uiverse-input" 
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleDownload(result.images?.[0] || result.imageUrl!, `ai-image-${Date.now()}.png`);
                                setTimeout(() => {
                                  e.target.checked = false;
                                }, 4000);
                              }
                            }}
                          />
                          <span className="uiverse-circle">
                            <svg
                              className="uiverse-icon"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M12 19V5m0 14-4-4m4 4 4-4"
                              ></path>
                            </svg>
                            <div className="uiverse-square"></div>
                          </span>
                          <p className="uiverse-title">Download</p>
                          <p className="uiverse-title">Done</p>
                        </label>
                      </div>
                    </div>
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
