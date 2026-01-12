import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, CheckCircle, AlertCircle, Clock, FileText, Trash2, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

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
        body: JSON.stringify({ prompt: prompt })
      })
      const data = await res.json()
      console.log('[Flagent UI] Create task raw response:', data)
      
      const taskId = data.task_id || data.id || data.data?.task_id || data.data?.id
      if (taskId) {
        const newTask: FlagentTask = {
          id: taskId,
          status: 'pending',
          prompt: prompt,
          createdAt: new Date().toISOString()
        }
        setCurrentTask(newTask)
        setTasks(prev => [newTask, ...prev])
        setPrompt('')
      } else {
        console.error('[Flagent UI] Task ID not found in response:', data)
        alert('Không thể tạo nhiệm vụ. Vui lòng kiểm tra lại API Key hoặc thử lại sau.')
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
      <div className="mt-8 space-y-4">
        {files.map((file) => (
          <div 
            key={file.id} 
            className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 group ${
              theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 shadow-lg' 
                : 'bg-white border-slate-100 hover:border-indigo-500/50 shadow-xl'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className={`font-black text-base truncate max-w-[180px] sm:max-w-md ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-[9px] font-black uppercase tracking-widest opacity-60">
                    {file.type || 'FILE'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.open(`/api/flagent/download?url=${encodeURIComponent(file.url)}&token=${token}`, '_blank')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              TẢI XUỐNG
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (!flagentApiKey) {
    return (
      <div className={`max-w-4xl mx-auto py-24 px-4 text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl relative ${
          theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'
        }`}>
          <Brain className="w-16 h-16 text-indigo-500 relative z-10" />
          <div className="absolute inset-0 rounded-[3rem] bg-indigo-500/20 animate-ping opacity-20" />
        </div>
        <h1 className="text-4xl font-black mb-6 tracking-tight">Chúng tôi đang chuẩn bị cho bạn không gian mới</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs max-w-lg mx-auto leading-loose">
          Tính năng Flagent đang được thiết lập. Tài khoản của bạn sẽ sớm được cấp API Key để trải nghiệm sức mạnh của AI Agent.
        </p>
      </div>
    )
  }

  return (
    <div className={`max-w-6xl mx-auto py-12 px-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <Brain className="w-12 h-12 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">FLATON FLAGENT</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">AI AGENT ECOSYSTEM</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-[3.5rem] p-12 mb-16 border border-slate-700/10 shadow-2xl relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-slate-900/40 backdrop-blur-xl' 
          : 'bg-white/80 backdrop-blur-xl'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <form onSubmit={handleCreateTask} className="space-y-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
            <label className="text-sm font-black uppercase tracking-widest text-slate-500">NHIỆM VỤ TIẾP THEO?</label>
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tôi có thể giúp bạn phân tích dữ liệu, viết code, thiết kế kế hoạch hoặc thực hiện bất kỳ nhiệm vụ phức tạp nào..."
              className={`w-full h-48 p-8 rounded-[2.5rem] border-2 text-2xl font-bold outline-none resize-none transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-950/50 border-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                  : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-7 rounded-[2.5rem] text-white font-black text-2xl flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl active:scale-95 ${
              loading || !prompt.trim()
                ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30'
            }`}
          >
            {loading ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <>
                <Zap className="w-8 h-8 fill-current" />
                <span>KÍCH HOẠT AGENT</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-12">
        <div className="flex items-center justify-between border-b border-slate-700/10 pb-6">
          <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4">
            <Clock className="w-8 h-8 text-indigo-500" />
            LỊCH SỬ NHIỆM VỤ
          </h2>
          <div className="px-5 py-2 rounded-2xl bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] border border-indigo-500/20">
            {tasks.length} LẦN CHẠY
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {tasks.length === 0 ? (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Chưa có nhiệm vụ nào</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-10 rounded-[3.5rem] border transition-all duration-300 group hover:scale-[1.01] ${
                  theme === 'dark' 
                    ? 'bg-slate-900/30 border-slate-800 hover:bg-slate-900/50 hover:border-slate-700' 
                    : 'bg-white border-slate-100 shadow-xl hover:shadow-2xl'
                }`}
              >
                <div className="flex items-start justify-between gap-8 mb-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                        task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        task.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'
                      }`}>
                        {task.status === 'completed' ? '• Hoàn tất' :
                           task.status === 'failed' ? '• Thất bại' :
                           task.status === 'running' ? '• Đang thực thi' : '• Đang chờ'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest bg-slate-500/5 px-4 py-2 rounded-2xl">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(task.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className={`font-black text-2xl leading-tight tracking-tight max-w-3xl ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{task.prompt}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
                      theme === 'dark' ? 'bg-red-500/5 text-red-500 hover:bg-red-500/10' : 'bg-red-50 text-red-500 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="w-7 h-7" />
                  </button>
                </div>
                
                {task.status === 'completed' && task.result && (
                  <div className="mt-10 pt-10 border-t border-slate-700/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">TÀI LIỆU ĐÃ TẠO</span>
                    </div>
                    {renderFiles(task.result)}
                  </div>
                )}

                {task.status === 'failed' && (
                  <div className="mt-8 p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10 flex items-start gap-4 text-red-400">
                    <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                      <p className="font-black text-xs uppercase tracking-widest">Lỗi hệ thống</p>
                      <p className="text-sm font-bold opacity-80">{task.error || 'Nhiệm vụ bị gián đoạn, vui lòng thử lại.'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
