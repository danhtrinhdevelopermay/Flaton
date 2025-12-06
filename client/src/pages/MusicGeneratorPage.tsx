import { useState } from 'react'
import { Music, Loader2, Zap, RefreshCw, Mic, Piano } from 'lucide-react'
import MusicPlayer from '../components/MusicPlayer'
import { useAuth } from '../contexts/AuthContext'

const sunoModels = [
  { value: 'V4', label: 'Suno V4', desc: 'Ổn định, nhanh' },
  { value: 'V4_5', label: 'Suno V4.5', desc: 'Chất lượng cao hơn' },
  { value: 'V5', label: 'Suno V5', desc: 'Mới nhất' },
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
  const { token, isAuthenticated } = useAuth()
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
        const response = await fetch(`/api/task/${taskType}/${taskId}`)
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
          return { error: data.error || 'Music generation failed' }
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
    if (!songDescription.trim() && !prompt.trim()) return
    if (customMode && (!style.trim() || !title.trim())) return

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
        headers: { 'Content-Type': 'application/json' },
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tạo nhạc AI</h1>
          <p className="text-slate-400">Tạo nhạc với Suno AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Cấu hình</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Chọn phiên bản</label>
            <div className="grid grid-cols-3 gap-2">
              {sunoModels.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setModel(m.value)}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    model === m.value
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setCustomMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                !customMode
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Chế độ đơn giản</span>
            </button>
            <button
              onClick={() => setCustomMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                customMode
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-slate-600 hover:border-slate-500'
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
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>Có lời</span>
            </button>
            <button
              onClick={() => setInstrumental(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                instrumental
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <Piano className="w-5 h-5" />
              <span>Instrumental</span>
            </button>
          </div>

          {customMode && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Tiêu đề bài hát *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Summer Vibes"
                  maxLength={80}
                  className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Phong cách nhạc *</label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Ví dụ: Pop, Upbeat, Electronic"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
              </div>

              {!instrumental && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Giọng hát</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setVocalGender('')}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        vocalGender === ''
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      Tự động
                    </button>
                    <button
                      onClick={() => setVocalGender('m')}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        vocalGender === 'm'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      Nam
                    </button>
                    <button
                      onClick={() => setVocalGender('f')}
                      className={`p-3 rounded-xl border text-sm transition-all ${
                        vocalGender === 'f'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-600 hover:border-slate-500'
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Mô tả bài nhạc</label>
            <textarea
              value={songDescription}
              onChange={(e) => setSongDescription(e.target.value)}
              placeholder="Mô tả chung về bài nhạc... Ví dụ: A happy upbeat song about summer vacation"
              maxLength={500}
              className="w-full h-24 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              {songDescription.length}/500 ký tự
            </p>
          </div>

          {customMode && !instrumental && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Lời bài hát (Prompt)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập lời bài hát của bạn..."
                maxLength={5000}
                className="w-full h-32 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                {prompt.length}/5000 ký tự
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Loại trừ phong cách (tùy chọn)</label>
            <input
              type="text"
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
              placeholder="Ví dụ: Heavy Metal, Loud Drums"
              className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || (!songDescription.trim() && !prompt.trim()) || (customMode && (!style.trim() || !title.trim()))}
            className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Kết quả</h2>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
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
                    : `Suno AI • ${model} • ${instrumental ? 'Instrumental' : 'Có lời'}`
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
                            : `Suno AI • ${model} • ${instrumental ? 'Instrumental' : 'Có lời'}`
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
    </div>
  )
}
