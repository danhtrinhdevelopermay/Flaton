import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, CheckCircle, AlertCircle, Clock, FileText, Download, Code, Eye, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { AnimatePresence, motion } from 'framer-motion'

interface ManusFile {
  id: string
  name: string
  url: string
  type?: string
  size?: number
  html?: string
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
  const [previewFile, setPreviewFile] = useState<ManusFile | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [manusApiKey, setManusApiKey] = useState('')

  useEffect(() => {
    if (token) {
      loadTasks()
      fetchUserApiKey()
    }
  }, [token])

  const fetchUserApiKey = async () => {
    try {
      const res = await fetch('/api/user/manus-key', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.apiKey) setManusApiKey(data.apiKey)
    } catch (err) {
      console.error('[Manus UI] Error fetching API key:', err)
    }
  }

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/manus/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setTasks(data)
        const runningTask = data.find(t => t.status === 'pending' || t.status === 'running')
        if (runningTask) setCurrentTask(runningTask)
      }
    } catch (err) {
      console.error('[Manus UI] Error loading tasks:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;
    try {
      const res = await fetch(`/api/manus/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (currentTask?.id === taskId) setCurrentTask(null);
      }
    } catch (err) {
      console.error('[Manus UI] Error deleting task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return
    setLoading(true)
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
      }
    } catch (err) {
      console.error('[Manus UI] Connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentTask && (currentTask.status === 'pending' || currentTask.status === 'running')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/manus/tasks/${currentTask.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (data.status) {
            const finalStatus = data.status === 'success' ? 'completed' : 
                               (data.status === 'failed' || data.status === 'fail' || data.status === 'error') ? 'failed' : 
                               data.status;
            const resultData = data.result || data.output;
            setCurrentTask(prev => prev ? { ...prev, status: finalStatus, result: resultData, error: data.error } : null)
            setTasks(prev => prev.map(t => t.id === data.id ? { ...t, status: finalStatus, result: resultData, error: data.error } : t))
            if (finalStatus === 'completed' || finalStatus === 'failed') clearInterval(interval)
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
    const findFiles = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(item => findFiles(item));
        return;
      }
      const addFile = (fileObj: any) => {
        const url = fileObj.download_url || fileObj.fileUrl || fileObj.url;
        if (!url) return;
        const name = fileObj.file_name || fileObj.fileName || fileObj.name || 'Generated File';
        if (!files.some(f => f.url === url)) {
          files.push({
            id: fileObj.id || Math.random().toString(36).substr(2, 9),
            name: name,
            url: url,
            type: url.split('?')[0].split('.').pop()
          });
        }
      };
      if (obj.download_url || obj.fileUrl || obj.url) addFile(obj);
      if (obj.all_files && Array.isArray(obj.all_files)) obj.all_files.forEach(addFile);
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') findFiles(obj[key]);
      });
    };
    findFiles(result);
    if (files.length === 0) return null;
    return (
      <div className="mt-4 space-y-3">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-4 rounded-xl border-l-4 border-indigo-500 bg-slate-800/50 transition-all">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-500" />
              <p className="font-bold text-sm truncate">{file.name}</p>
            </div>
            <button
              onClick={() => window.open(`/api/manus/download?url=${encodeURIComponent(file.url)}&token=${token}`, '_blank')}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all"
            >
              TẢI XUỐNG
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (!manusApiKey) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Brain className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-black mb-4">Chúng tôi đang chuẩn bị cho bạn không gian mới</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Tính năng Manus AI sẽ khả dụng ngay khi tài khoản của bạn được cấp API Key.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg transform rotate-3">
          <Brain className="w-8 h-8 text-white drop-shadow-md" />
        </div>
        <div>
          <h1 className="text-3xl font-black">FLATON MANUS AI</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Tự động hóa & Phân tích thông minh</p>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] p-8 mb-8 border-b-8 transition-all">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <label className="block text-sm font-bold opacity-70 uppercase tracking-wider">Mục tiêu của bạn là gì?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Lập kế hoạch du lịch Đà Lạt 3 ngày cho gia đình..."
            className="w-full h-32 p-4 rounded-2xl border-2 bg-slate-900 border-slate-700 focus:border-indigo-500 outline-none transition-all resize-none"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            THỰC THI NHIỆM VỤ
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">NHIỆM VỤ GẦN ĐÂY</h2>
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-slate-800/50 border-b-4 border-slate-700"
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
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              {task.status === 'completed' && renderFiles(task.result)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
