import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Loader2, Zap, Check, Upload, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import VideoPlayer from '../components/VideoPlayer'

interface GenerationResult {
  status?: string;
  videoUrl?: string;
  error?: string;
}

export default function VideoUpscalePage() {
  const { theme } = useTheme()
  const { token, isAuthenticated, refreshUser } = useAuth()
  const navigate = useNavigate()
  
  const [videoUrl, setVideoUrl] = useState('')
  const [upscaleFactor, setUpscaleFactor] = useState('4x')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser()
    }
  }, [isAuthenticated, token])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('video', file)

    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      const data = await response.json()
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
      } else {
        alert(data.error || 'Upload thất bại')
      }
    } catch (err: any) {
      alert('Lỗi upload: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 120

    const poll = async (): Promise<any> => {
      try {
        const response = await fetch(`/api/task/topaz-video/${taskId}${selectedServer ? `?apiKeyId=${selectedServer}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()

        if (data.error) return { error: data.error }
        
        setProgress(Math.min(95, 10 + (attempts * 1.5)))

        if (data.status === 'completed' || data.status === 'success') {
          setProgress(100)
          return { status: 'completed', videoUrl: data.videoUrl }
        }

        if (data.status === 'failed') return { error: 'Nâng cấp thất bại' }

        attempts++
        if (attempts >= maxAttempts) return { error: 'Hết thời gian xử lý' }

        await new Promise(r => setTimeout(r, 5000))
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

  const handleUpscale = async () => {
    if (!videoUrl.trim()) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!selectedServer) return;

    const currentToolCredits = 72; // Hardcoded from the button text
    const server = servers.find(s => s.id === selectedServer);
    if (server && server.credits < currentToolCredits) {
      alert('Server này không đủ credit!');
      return;
    }

    setLoading(true)
    setResult(null)
    setProgress(5)

    try {
      const response = await fetch('/api/generate/topaz-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ videoUrl, upscaleFactor, apiKeyId: selectedServer })
      })

      const data = await response.json()
      if (data.error) {
        setResult({ error: data.error })
        setLoading(false)
        return
      }

      if (data.taskId) {
        const finalResult = await pollTaskStatus(data.taskId)
        setResult(finalResult)
      }
    } catch (err: any) {
      setResult({ error: err.message })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-[#4D96FF] to-[#6BCBFF] flex items-center justify-center shadow-lg transform rotate-3">
          <Sparkles className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SIÊU NÂNG CẤP VIDEO</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6BCB77] animate-pulse" />
            <p className={`font-bold uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>TOPAZ AI ENHANCER</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className={`md:col-span-3 rounded-[2.5rem] p-8 transition-all border-b-8 active:translate-y-1 active:border-b-4 ${
          theme === 'dark' 
            ? 'bg-[#2a2d3e] border-[#1e202f] text-white' 
            : 'bg-white border-slate-200 shadow-xl text-slate-900'
        }`}>
          <h2 className="font-black text-2xl tracking-tight mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD93D] flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-[#6B4E00]" />
            </div>
            CÀI ĐẶT
          </h2>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Chọn Server (KIE AI)</label>
            <select
              value={selectedServer || ''}
              onChange={(e) => setSelectedServer(Number(e.target.value))}
              className={`w-full p-3 rounded-xl border transition-all ${
                theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {servers.map(server => (
                <option key={server.id} value={server.id} disabled={server.credits < 72}>
                  {server.name || `Server ${server.id}`} - {server.credits} credits {(server.credits < 72) ? '(Không đủ)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Video đầu vào
            </label>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Dán link hoặc tải file bên dưới"
                  className={`w-full p-4 pr-12 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
                <Upload className="absolute right-4 top-4 w-5 h-5 text-slate-400" />
              </div>
              
              <div className="flex items-center gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  theme === 'dark' ? 'border-slate-700 hover:border-slate-500 bg-slate-800/30' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : (
                    <Upload className="w-5 h-5 text-blue-500" />
                  )}
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {uploading ? 'Đang tải lên...' : 'Tải file từ máy tính'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Tỷ lệ nâng cấp
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['1x', '2x', '4x'].map((factor) => (
                <button
                  key={factor}
                  onClick={() => setUpscaleFactor(factor)}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    upscaleFactor === factor
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                      : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {factor}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpscale}
            disabled={loading || !videoUrl.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {polling ? `Đang xử lý (${progress}%)` : 'Đang gửi yêu cầu...'}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                Nâng cấp chất lượng (72 Credits)
              </>
            )}
          </button>
        </div>

        <div className={`md:col-span-2 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] transition-all ${
          theme === 'dark' ? 'bg-slate-900/40 border border-dashed border-slate-700' : 'bg-slate-50 border border-dashed border-slate-300'
        }`}>
          {result?.videoUrl ? (
            <div className="w-full h-full flex flex-col gap-4">
              <div className="flex items-center gap-2 text-green-500 font-semibold">
                <Check className="w-5 h-5" /> Kết quả hoàn tất
              </div>
              <VideoPlayer videoUrl={result.videoUrl} />
              <a
                href={result.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-slate-800 text-white text-center font-medium hover:bg-slate-700 transition-colors"
              >
                Tải Video về máy
              </a>
            </div>
          ) : result?.error ? (
            <div className="text-center p-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 font-medium">{result.error}</p>
              <button onClick={() => setResult(null)} className="mt-4 text-blue-400 text-sm underline">Thử lại</button>
            </div>
          ) : loading ? (
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                  style={{ clipPath: `inset(0 0 ${100-progress}% 0)` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-500">
                  {progress}%
                </div>
              </div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                AI đang làm nét video của bạn...
              </p>
            </div>
          ) : (
            <div className="text-center opacity-40">
              <Video className="w-16 h-16 mx-auto mb-4" />
              <p>Xem trước video kết quả tại đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
