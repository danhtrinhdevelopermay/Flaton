import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, CheckCircle, AlertCircle, Clock, FileText, Download, Code } from 'lucide-react'
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
    
    // Recursive function to find all output_file objects in the nested structure
    const findFiles = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Handle array
      if (Array.isArray(obj)) {
        obj.forEach(item => findFiles(item));
        return;
      }

      // Helper to determine if a file is desirable (not a configuration JSON)
      const isDesirable = (url: string, name: string) => {
        const lowerUrl = url.toLowerCase();
        const lowerName = name.toLowerCase();
        
        // Always include slides or document files even if they have .json extension (sometimes used for presentation data)
        if (lowerName.includes('slides') || lowerName.includes('presentation') || lowerName.includes('document')) return true;

        // Skip common technical/log files
        if (lowerUrl.includes('.log') || lowerName.includes('.log')) return false;
        
        // If it's a generic JSON without "slides" or similar in name, skip it
        if (lowerUrl.includes('.json') || lowerName.includes('.json')) {
           // If the name is very generic like "config.json" or "task.json", hide it
           const genericNames = ['config', 'task', 'status', 'meta', 'info', 'log'];
           if (genericNames.some(gn => lowerName.includes(gn))) return false;
        }

        return true;
      };

      // Helper to add file with better deduplication and type detection
      const addFile = (fileObj: any) => {
        const url = fileObj.download_url || fileObj.fileUrl || fileObj.url;
        if (!url) return;

        const name = fileObj.file_name || fileObj.fileName || fileObj.name || 'Generated File';
        
        // If it's not desirable (json/log), we skip it for the main UI
        if (!isDesirable(url, name)) return;

        if (!files.some(f => f.url === url)) {
          let type = fileObj.file_extension || fileObj.extension;
          if (!type) {
            const urlParts = url.split('?')[0].split('.');
            if (urlParts.length > 1) {
              const ext = urlParts.pop()?.toLowerCase();
              if (ext && ext.length <= 5) type = ext;
            }
          }

          files.push({
            id: fileObj.id || Math.random().toString(36).substr(2, 9),
            name: name,
            url: url,
            type: type
          });
        }
      };

      // 1. Handle all_files from server merged result (High priority)
      if (obj.all_files && Array.isArray(obj.all_files)) {
        obj.all_files.forEach((f: any) => addFile(f));
      }

      // 2. Handle data property (Manus API often wraps results in data)
      if (obj.data && Array.isArray(obj.data)) {
        obj.data.forEach((f: any) => addFile(f));
      }

      // 3. Handle explicit file fields
      if (obj.download_url || obj.fileUrl || obj.url) {
        addFile(obj);
      } 
      
      // 4. Handle output_file objects
      if (obj.type === 'output_file' && obj.output_file) {
        addFile(obj.output_file);
      } 
      
      // 5. Special case: Check result.output or result.result for files
      if (obj.output && typeof obj.output === 'object') {
        findFiles(obj.output);
      }
      if (obj.result && typeof obj.result === 'object') {
        findFiles(obj.result);
      }
      
      // Recursively check all properties
      try {
        Object.keys(obj).forEach(key => {
          // Avoid re-checking already handled special keys
          if (!['all_files', 'data', 'output', 'result'].includes(key) && obj[key] && typeof obj[key] === 'object') {
            findFiles(obj[key]);
          }
        });
      } catch (e) {}
    };

    findFiles(result);
    console.log('Total files found:', files.length, files);

    if (files.length === 0) {
      // Emergency fallback: search the whole result for anything that looks like a URL with an extension
      const searchStrings = (val: any) => {
        if (typeof val === 'string' && val.startsWith('http') && (val.includes('.pptx') || val.includes('.docx') || val.includes('.pdf') || val.includes('.zip'))) {
          if (!files.some(f => f.url === val)) {
            files.push({
              id: Math.random().toString(36).substr(2, 9),
              name: val.split('/').pop() || 'Generated File',
              url: val,
              type: val.split('.').pop()
            });
          }
        } else if (typeof val === 'object' && val !== null) {
          Object.values(val).forEach(searchStrings);
        }
      };
      searchStrings(result);
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
              <div className="min-w-0">
                <p className="font-bold text-sm truncate max-w-[150px] sm:max-w-[300px]">{file.name}</p>
                {file.type && <p className="text-[10px] font-bold opacity-50 uppercase">{file.type}</p>}
              </div>
            </div>
            <a 
              href={`/api/manus/download?url=${encodeURIComponent(file.url)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-500 font-bold mb-4">
                      <CheckCircle className="w-5 h-5" /> Nhiệm vụ hoàn thành
                    </div>
                    {renderFiles(task.result)}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const win = window.open("", "_blank");
                          if (win) {
                            win.document.write(`<pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; font-family: monospace;">${JSON.stringify(task.result || {}, null, 2)}</pre>`);
                            win.document.title = `Manus Task JSON - ${task.id}`;
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          theme === 'dark' 
                            ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' 
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        XEM DỮ LIỆU JSON
                      </button>
                    </div>
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
