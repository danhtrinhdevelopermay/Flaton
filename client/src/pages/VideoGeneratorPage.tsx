import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Video, Loader2, Download, Zap, Check, RefreshCw, Upload } from 'lucide-react'

const videoTools = [
  { id: 'veo3-fast', name: 'Veo 3 Fast', credits: 60, provider: 'Google DeepMind', type: 'text' },
  { id: 'midjourney-video', name: 'Midjourney Video', credits: 40, provider: 'Midjourney', type: 'image' },
]

const aspectRatios = [
  { value: '16:9', label: '16:9 (Ngang)' },
  { value: '9:16', label: '9:16 (Dọc)' },
  { value: '1:1', label: '1:1 (Vuông)' },
]

interface GenerationResult {
  taskId?: string
  status?: string
  videoUrl?: string
  error?: string
}

export default function VideoGeneratorPage() {
  const [searchParams] = useSearchParams()
  const [selectedTool, setSelectedTool] = useState(searchParams.get('tool') || 'veo3-fast')
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)

  const currentTool = videoTools.find(t => t.id === selectedTool)

  useEffect(() => {
    const toolParam = searchParams.get('tool')
    if (toolParam && videoTools.some(t => t.id === toolParam)) {
      setSelectedTool(toolParam)
    }
  }, [searchParams])

  const pollTaskStatus = async (taskId: string, taskType: string) => {
    setPolling(true)
    const maxAttempts = 120
    let attempts = 0

    const poll = async (): Promise<GenerationResult> => {
      try {
        const response = await fetch(`/api/task/${taskType}/${taskId}`)
        const data = await response.json()

        if (data.error) {
          return { error: data.error }
        }

        if (data.status === 'completed' || data.status === 'success') {
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
    if (selectedTool === 'veo3-fast' && !prompt.trim()) return
    if (selectedTool === 'midjourney-video' && !imageUrl.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const body = selectedTool === 'veo3-fast'
        ? { prompt, aspectRatio }
        : { imageUrl, prompt }

      const response = await fetch(`/api/generate/${selectedTool}`, {
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
        const taskType = selectedTool === 'veo3-fast' ? 'veo3' : 'midjourney'
        const finalResult = await pollTaskStatus(data.taskId, taskType)
        setResult(finalResult)
      } else if (data.videoUrl) {
        setResult({
          status: 'completed',
          videoUrl: data.videoUrl,
        })
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
              {videoTools.map((tool) => (
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
                    {selectedTool === tool.id && <Check className="w-5 h-5 text-indigo-400" />}
                    <div className="text-left">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-slate-400">
                        {tool.provider} • {tool.type === 'text' ? 'Text to Video' : 'Image to Video'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">{tool.credits}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedTool === 'veo3-fast' && (
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
              {selectedTool === 'veo3-fast' ? 'Mô tả video (Prompt)' : 'Mô tả chuyển động (tùy chọn)'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                selectedTool === 'veo3-fast'
                  ? "Mô tả chi tiết video bạn muốn tạo... Ví dụ: A majestic eagle soaring through mountain peaks at sunset, cinematic lighting"
                  : "Mô tả chuyển động bạn muốn... Ví dụ: Camera slowly zooms in, gentle wind effect"
              }
              className="w-full h-32 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || (selectedTool === 'veo3-fast' ? !prompt.trim() : !imageUrl.trim())}
            className="w-full btn-primary py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
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
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
              <p className="text-slate-300">{polling ? 'AI đang tạo video của bạn...' : 'Đang kết nối...'}</p>
              <p className="text-sm text-slate-400 mt-2">Quá trình này có thể mất 1-3 phút</p>
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
              <div className="relative group">
                <video
                  src={result.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-xl"
                />
                <button
                  onClick={() => handleDownload(result.videoUrl!, `ai-video-${Date.now()}.mp4`)}
                  className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
