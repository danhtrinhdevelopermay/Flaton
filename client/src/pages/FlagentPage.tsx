import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, CheckCircle, AlertCircle, Clock, FileText, Download, Code, Eye, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { AnimatePresence, motion } from 'framer-motion'

interface FlagentFile {
  id: string
  name: string
  url: string
  type?: string
  size?: number
  html?: string
}

interface FlagentTask {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  prompt: string
  result?: any
  error?: string
  createdAt: string
}

export default function FlagentPage() {
  const { theme } = useTheme()
  const { token } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<FlagentTask[]>([])
  const [currentTask, setCurrentTask] = useState<FlagentTask | null>(null)
  const [previewFile, setPreviewFile] = useState<FlagentFile | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [flagentApiKey, setFlagentApiKey] = useState('')

  useEffect(() => {
    if (token) {
      loadTasks()
      fetchUserApiKey()
    }
  }, [token])

  const fetchUserApiKey = async () => {
    try {
      const res = await fetch('/api/user/flagent-key', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.apiKey) setFlagentApiKey(data.apiKey)
    } catch (err) {
      console.error('[Flagent UI] Error fetching API key:', err)
    }
  }

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/flagent/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setTasks(data)
        const runningTask = data.find(t => t.status === 'pending' || t.status === 'running')
        if (runningTask) setCurrentTask(runningTask)
      }
    } catch (err) {
      console.error('[Flagent UI] Error loading tasks:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;
    try {
      const res = await fetch(`/api/flagent/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (currentTask?.id === taskId) setCurrentTask(null);
      }
    } catch (err) {
      console.error('[Flagent UI] Error deleting task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/flagent/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      if (data.task_id || data.id) {
        const newTask: FlagentTask = {
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
      console.error('[Flagent UI] Connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentTask && (currentTask.status === 'pending' || currentTask.status === 'running')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/flagent/tasks/${currentTask.id}`, {
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
          console.error('[Flagent UI] Polling error:', err)
        }
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [currentTask, token])

  const renderFiles = (result: any) => {
    if (!result) return null;
    let files: FlagentFile[] = [];
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
      <div className="mt-4 space-y-4">
        {files.map((file) => (
          <motion.div 
            key={file.id} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all group ${
              theme === 'dark' 
                ? 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                : 'bg-white border-slate-100 hover:border-indigo-500/30 shadow-xl shadow-indigo-500/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 ${
                theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-50'
              }`}>
                <FileText className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div>
                <p className="font-black text-sm truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{file.type || 'FILE'}</p>
              </div>
            </div>
            <button
              onClick={() => window.open(`/api/flagent/download?url=${encodeURIComponent(file.url)}&token=${token}`, '_blank')}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg ${
                theme === 'dark'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30'
              }`}
            >
              TẢI XUỐNG
            </button>
          </motion.div>
        ))}
      </div>
    );
  };

  if (!flagentApiKey) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl relative ${
            theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'
          }`}
        >
          <Brain className="w-16 h-16 text-indigo-500 relative z-10" />
          <div className="absolute inset-0 rounded-[3rem] bg-indigo-500/20 animate-ping opacity-20" />
        </motion.div>
        <h1 className="text-4xl font-black mb-6 tracking-tight">Chúng tôi đang chuẩn bị cho bạn không gian mới</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs max-w-lg mx-auto leading-loose">
          Tính năng Flagent đang được thiết lập. Tài khoản của bạn sẽ sớm được cấp API Key để trải nghiệm sức mạnh của AI Agent.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 fade-in">
      <div className="flex items-center gap-6 mb-12">
        <motion.div 
          whileHover={{ rotate: 12, scale: 1.1 }}
          className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
        >
          <Brain className="w-10 h-10 text-white drop-shadow-lg" />
        </motion.div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter">FLATON FLAGENT</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">AI AGENT ECOSYSTEM</p>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`rounded-[3rem] p-10 mb-12 border-b-8 transition-all shadow-2xl ${
          theme === 'dark' 
            ? 'glass border-slate-800' 
            : 'bg-white border-slate-200'
        }`}
      >
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div className="flex items-center gap-2 text-indigo-500">
            <Send className="w-4 h-4" />
            <label className="text-xs font-black uppercase tracking-widest opacity-70">Mục tiêu của bạn là gì?</label>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Phân tích báo cáo tài chính, lập kế hoạch marketing, hoặc viết code ứng dụng..."
            className={`w-full h-40 p-6 rounded-3xl border-4 text-xl font-bold outline-none transition-all resize-none shadow-inner ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-slate-800 focus:border-indigo-500/50 text-white'
                : 'bg-slate-50 border-slate-100 focus:border-indigo-400/30 text-slate-900'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-6 rounded-[2rem] text-white font-black text-xl flex items-center justify-center gap-3 transition-all active:translate-y-2 active:border-b-0 border-b-8 ${
              loading || !prompt.trim()
                ? 'opacity-50 cursor-not-allowed bg-slate-500 border-slate-600'
                : 'bg-indigo-600 border-indigo-800 hover:bg-indigo-500 hover:translate-y-1 hover:border-b-4 shadow-xl shadow-indigo-500/20'
            }`}
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Zap className="w-8 h-8 fill-current" />}
            THỰC THI NHIỆM VỤ
          </button>
        </form>
      </motion.div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-dashed border-slate-700/20 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-500" />
            NHIỆM VỤ GẦN ĐÂY
          </h2>
          <div className="px-4 py-1.5 rounded-full bg-slate-500/10 text-[10px] font-black uppercase tracking-widest opacity-50">
            {tasks.length} THỰC THI
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-sm"
              >
                Chưa có nhiệm vụ nào được ghi lại
              </motion.div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-8 rounded-[2.5rem] border-b-4 transition-all hover:scale-[1.01] ${
                    theme === 'dark' 
                      ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50' 
                      : 'bg-white border-slate-100 shadow-xl hover:shadow-2xl'
                  }`}
                >
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          task.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          task.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                          'bg-blue-500/20 text-blue-500 animate-pulse'
                        }`}>
                          {task.status === 'completed' ? 'Thành công' :
                           task.status === 'failed' ? 'Thất bại' :
                           task.status === 'running' ? 'Đang chạy' : 'Đang chờ'}
                        </span>
                        <span className="text-[10px] font-bold opacity-30 flex items-center gap-1 uppercase">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-black text-xl leading-snug tracking-tight">{task.prompt}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className={`p-3 rounded-2xl transition-all active:scale-90 ${
                        theme === 'dark' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {task.status === 'completed' && task.result && (
                    <div className="mt-8 pt-8 border-t border-dashed border-slate-700/20">
                      <div className="flex items-center gap-2 mb-4 text-indigo-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Kết quả thực thi</span>
                      </div>
                      {renderFiles(task.result)}
                    </div>
                  )}

                  {task.status === 'failed' && (
                    <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-bold">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {task.error || 'Đã có lỗi xảy ra trong quá trình thực thi.'}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
