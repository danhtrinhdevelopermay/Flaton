import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Image, Loader2, Download, Zap, Check, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const imageTools = [
  { id: 'nano-banana', name: 'Flaton Image V1', credits: 4, provider: 'Nhanh, tiết kiệm' },
  { id: 'seedream', name: 'Flaton Image V2', credits: 6.5, provider: 'Chi tiết 4K' },
  { id: 'midjourney', name: 'Flaton Image Pro', credits: 8, provider: 'Nghệ thuật, 4 biến thể' },
]

const aspectRatios = [
  { value: '1:1', label: '1:1 (Vuông)' },
  { value: '16:9', label: '16:9 (Ngang)' },
  { value: '9:16', label: '9:16 (Dọc)' },
  { value: '4:3', label: '4:3 (Cổ điển)' },
  { value: '3:4', label: '3:4 (Chân dung)' },
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
  const { token, isAuthenticated } = useAuth()
  const [selectedTool, setSelectedTool] = useState(searchParams.get('tool') || 'nano-banana')
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [polling, setPolling] = useState(false)

  const currentTool = imageTools.find(t => t.id === selectedTool)

  useEffect(() => {
    const toolParam = searchParams.get('tool')
    if (toolParam && imageTools.some(t => t.id === toolParam)) {
      setSelectedTool(toolParam)
    }
  }, [searchParams])

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
    const maxAttempts = 60
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
            imageUrl: data.imageUrl || data.output?.imageUrl,
            images: data.images || data.output?.images,
          }
        }

        if (data.status === 'failed') {
          return { error: 'Generation failed' }
        }

        attempts++
        if (attempts >= maxAttempts) {
          return { error: 'Timeout - please try again' }
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

    setLoading(true)
    setResult(null)

    const currentPrompt = prompt
    const currentModel = selectedTool
    const currentAspectRatio = aspectRatio

    try {
      const response = await fetch(`/api/generate/${selectedTool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, aspectRatio: currentAspectRatio }),
      })

      const data = await response.json()

      if (data.error) {
        setResult({ error: data.error })
        setLoading(false)
        return
      }

      if (data.taskId) {
        const taskType = data.taskType || (selectedTool === 'midjourney' ? 'midjourney' : 'gpt4o-image')
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Image className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tạo hình ảnh AI</h1>
          <p className="text-slate-400">Biến ý tưởng thành hình ảnh với AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Cấu hình</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Chọn mô hình AI</label>
            <div className="grid grid-cols-1 gap-3">
              {imageTools.map((tool) => (
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
                      <div className="text-sm text-slate-400">{tool.provider}</div>
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Mô tả hình ảnh (Prompt)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả chi tiết hình ảnh bạn muốn tạo... Ví dụ: A cute cat sitting on a window, soft afternoon light, watercolor style"
              className="w-full h-32 p-4 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full btn-primary py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
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

        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4">Kết quả</h2>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Image className="w-16 h-16 mb-4 opacity-50" />
              <p>Nhập mô tả và nhấn "Tạo hình ảnh"</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mb-4" />
              <p className="text-slate-300">{polling ? 'AI đang tạo hình ảnh của bạn...' : 'Đang kết nối...'}</p>
              <p className="text-sm text-slate-400 mt-2">Quá trình này có thể mất 30-60 giây</p>
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
