import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, CheckCircle, AlertCircle, Clock, FileText, Download, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

interface ManusFile {
  id: string
  name: string
  url: string
  type?: string
  size?: number
}

interface ManusTask {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  prompt: string
  result?: any
  error?: string
  createdAt: string
}

export default function ManusPage() {
  const { theme } = useTheme()
  const { token } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<ManusTask[]>([])
  const [currentTask, setCurrentTask] = useState<ManusTask | null>(null)

  useEffect(() => {
    if (token) {
      loadTasks()
    }
  }, [token])

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/manus/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setTasks(data)
        // Check if any task is still running
        const runningTask = data.find(t => t.status === 'pending' || t.status === 'running')
        if (runningTask) {
          setCurrentTask(runningTask)
        }
      }
    } catch (err) {
      console.error('[Manus UI] Error loading tasks:', err)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    console.log('[Manus UI] Sending task request:', prompt)
    try {
      const res = await fetch('/api/manus/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      console.log('[Manus UI] Create task response:', data)
      
      if (data.task_id || data.id) {
        const newTask: ManusTask = {
          id: data.task_id || data.id,
          status: 'pending',
          prompt: prompt,
          createdAt: new Date().toISOString()
        }
        setCurrentTask(newTask)
        setTasks(prev => [newTask, ...prev])
        setPrompt('')
      } else {
        const errorMsg = data.error || data.message || 'Không thể tạo task'
        console.error('[Manus UI] Error creating task:', errorMsg)
        alert(`Lỗi: ${errorMsg}`)
      }
    } catch (err) {
      console.error('[Manus UI] Connection error:', err)
      alert('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentTask && (currentTask.status === 'pending' || currentTask.status === 'running')) {
      interval = setInterval(async () => {
        try {
          console.log('[Manus UI] Polling status for:', currentTask.id)
          const res = await fetch(`/api/manus/tasks/${currentTask.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          console.log('[Manus UI] Poll result:', data)
          
          if (data.status) {
            const finalStatus = data.status === 'success' ? 'completed' : 
                               (data.status === 'failed' || data.status === 'fail' || data.status === 'error') ? 'failed' : 
                               data.status;
            
            const resultData = data.result || data.output;
            
            setCurrentTask(prev => prev ? { ...prev, status: finalStatus, result: resultData, error: data.error } : null)
            setTasks(prev => prev.map(t => t.id === data.id ? { ...t, status: finalStatus, result: resultData, error: data.error } : t))
            
            if (finalStatus === 'completed' || finalStatus === 'failed') {
              console.log('[Manus UI] Task finished with status:', finalStatus)
              clearInterval(interval)
            }
          }
        } catch (err) {
          console.error('[Manus UI] Polling error:', err)
        }
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [currentTask, token])

  const renderFiles = (result: any) => {
    if (!result) return null;

    let files: ManusFile[] = [];
    
    // Parse files from different possible Manus result structures
    if (Array.isArray(result)) {
      // Look for output_file types in the message content
      result.forEach(item => {
        if (item.content && Array.isArray(item.content)) {
          item.content.forEach((c: any) => {
            if (c.type === 'output_file' && c.output_file) {
              files.push({
                id: c.output_file.id,
                name: c.output_file.file_name,
                url: c.output_file.download_url,
                type: c.output_file.file_extension
              });
            }
          });
        }
      });
    } else if (result.files && Array.isArray(result.files)) {
      files = result.files;
    } else if (result.output && Array.isArray(result.output)) {
      return renderFiles(result.output);
    }

    if (files.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm font-bold opacity-70 uppercase tracking-wider mb-2">Tệp kết quả:</p>
        {files.map((file) => (
          <div 
            key={file.id} 
            className={`flex items-center justify-between p-4 rounded-xl border-l-4 border-indigo-500 transition-all ${
              theme === 'dark' ? 'bg-[#1e202f] hover:bg-[#252839]' : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm truncate max-w-[200px] sm:max-w-[400px]">{file.name}</p>
                {file.type && <p className="text-[10px] font-bold opacity-50 uppercase">{file.type}</p>}
              </div>
            </div>
            <a 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" />
              TẢI XUỐNG
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg transform rotate-3">
          <Brain className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>MANUS AI AGENT</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            <p className={`font-bold uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>ĐẠI LÝ AI TỰ HÀNH</p>
          </div>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 mb-8 border-b-8 transition-all ${
        theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f] text-white' : 'bg-white border-slate-200 shadow-xl text-slate-900'
      }`}>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <label className="block text-sm font-bold opacity-70 uppercase tracking-wider">Mục tiêu của bạn là gì?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Lập kế hoạch du lịch Đà Lạt 3 ngày cho gia đình, bao gồm chi phí dự kiến và các địa điểm đẹp..."
            className={`w-full h-32 p-4 rounded-2xl border-2 focus:border-indigo-500 focus:outline-none transition-all resize-none ${
              theme === 'dark' ? 'bg-[#1e202f] border-[#32354a]' : 'bg-slate-50 border-slate-100'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            THỰC THI NHIỆM VỤ
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>NHIỆM VỤ GẦN ĐÂY</h2>
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-2xl border-b-4 transition-all ${
                theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f]' : 'bg-white border-slate-100 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-bold text-lg mb-2">{task.prompt}</p>
                  <div className="flex items-center gap-4 text-xs font-bold opacity-60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 rounded-md uppercase ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      task.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>

              {task.status === 'completed' && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-green-500 font-bold mb-4">
                    <CheckCircle className="w-5 h-5" /> Nhiệm vụ hoàn thành
                  </div>
                  {renderFiles(task.result)}
                </div>
              )}

              {task.status === 'failed' && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 text-red-500">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-5 h-5" /> Lỗi: {task.error || 'Nhiệm vụ thất bại'}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
