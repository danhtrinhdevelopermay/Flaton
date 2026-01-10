import { useState, useEffect } from 'react'
import { Brain, Send, Loader2, CheckCircle, AlertCircle, Clock, FileText, Download, Code, X, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [exporting, setExporting] = useState(false);

  const handleExportPPTX = async () => {
    if (!previewFile || !previewFile.html) return;
    setExporting(true);
    try {
      const response = await fetch('/api/manus/convert-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          html: previewFile.html,
          fileName: previewFile.name.replace('.json', '')
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${previewFile.name.replace('.json', '')}.pptx`;
        a.click();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Lỗi khi chuyển đổi: ${errorData.error || 'Vui lòng kiểm tra API Key Nutrient trong cài đặt Admin.'}`);
      }
    } catch (error) {
      console.error('Export PPTX error:', error);
      alert('Lỗi kết nối khi xuất file PowerPoint.');
    } finally {
      setExporting(false);
    }
  };

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
        
        // Skip common technical/log/config files
        if (lowerUrl.includes('.log') || lowerName.includes('.log')) return false;
        
        // Hide most .json files EXCEPT if they likely contain the presentation data we want
        if (lowerUrl.includes('.json') || lowerName.includes('.json')) {
           const isPresentation = lowerName.includes('slides') || lowerName.includes('presentation') || lowerName.includes('lesson');
           if (!isPresentation) return false;
        }

        // Common valid document extensions for Manus
        const validExtensions = ['.pptx', '.docx', '.pdf', '.zip', '.xlsx', '.txt', '.csv', '.json'];
        if (validExtensions.some(ext => lowerUrl.includes(ext) || lowerName.includes(ext))) return true;

        return false;
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

      // Handle direct results array
      if (Array.isArray(obj.results)) {
        obj.results.forEach((f: any) => addFile(f));
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
          if (!['all_files', 'data', 'output', 'result', 'results'].includes(key) && obj[key] && typeof obj[key] === 'object') {
            findFiles(obj[key]);
          }
        });
      } catch (e) {}
    };

    findFiles(result);
    
    // Emergency fallback: If no files were found after filtering, try to recover any file-like objects
    if (files.length === 0 && result) {
      const recoverFiles = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach(recoverFiles);
          return;
        }
        
        const url = obj.download_url || obj.fileUrl || obj.url;
        if (url && typeof url === 'string' && url.startsWith('http')) {
          const name = obj.file_name || obj.fileName || obj.name || 'Generated File';
          if (!files.some(f => f.url === url)) {
            files.push({
              id: obj.id || Math.random().toString(36).substr(2, 9),
              name: name,
              url: url,
              type: url.split('?')[0].split('.').pop()
            });
          }
        }
        
        Object.keys(obj).forEach(key => {
          if (obj[key] && typeof obj[key] === 'object') recoverFiles(obj[key]);
        });
      };
      recoverFiles(result);
    }
    
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

    const handleDownload = (file: ManusFile) => {
      const token = localStorage.getItem('token');
      const downloadUrl = `/api/manus/download?url=${encodeURIComponent(file.url)}&token=${token}`;
      window.open(downloadUrl, '_blank');
    };

    const handlePreview = async (file: ManusFile) => {
      setPreviewLoading(true);
      try {
        const response = await fetch(file.url);
        const data = await response.json();
        
        let htmlContent = '';
        if (data.files && Array.isArray(data.files)) {
          // Cải thiện giao diện xem trước để giống Slide hơn
          htmlContent = data.files.map((f: any) => `
            <div class="mb-12 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xl bg-slate-900 aspect-video flex flex-col p-12 relative group transition-all hover:scale-[1.02]">
              <div class="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent pointer-events-none"></div>
              <h2 class="text-4xl font-black mb-8 text-indigo-400 border-b-4 border-indigo-500/30 pb-4 inline-block z-10">${f.id || 'Slide'}</h2>
              <div class="text-2xl text-slate-200 leading-relaxed z-10 flex-1 flex flex-col justify-center">
                ${f.content}
              </div>
              <div class="absolute bottom-6 right-8 text-indigo-500/50 font-black tracking-widest text-sm uppercase">Flaton AI • Manus</div>
            </div>
          `).join('');
        } else if (data.content) {
          htmlContent = data.content;
        }
        
        if (htmlContent) {
          setPreviewFile({ ...file, html: htmlContent });
        } else {
          alert('Không tìm thấy nội dung hiển thị trong file này.');
        }
      } catch (error) {
        console.error('Error fetching file content:', error);
        alert('Lỗi khi tải nội dung bản xem trước.');
      } finally {
        setPreviewLoading(false);
      }
    };

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
            <div className="flex items-center gap-2">
              {file.type === 'json' && (
                <button
                  onClick={() => handlePreview(file)}
                  disabled={previewLoading}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  XEM TRƯỚC
                </button>
              )}
              <button
                onClick={() => handleDownload(file)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                <Download className="w-4 h-4" />
                TẢI XUỐNG
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 fade-in">
      {/* ... existing header and form ... */}
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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                    BẢN XEM TRƯỚC SLIDE
                  </h3>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto bg-white p-8 custom-scrollbar">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewFile.html || '' }} 
                  className="slide-preview-content"
                />
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={handleExportPPTX}
                  disabled={exporting}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                  XUẤT POWERPOINT (.pptx)
                </button>
                <button
                  onClick={() => {
                    const fullHtml = `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="UTF-8">
                        <title>${previewFile.name}</title>
                        <style>
                          body { font-family: sans-serif; padding: 40px; }
                          .slide { margin-bottom: 60px; border-bottom: 2px solid #eee; padding-bottom: 40px; }
                        </style>
                      </head>
                      <body>
                        ${previewFile.html}
                      </body>
                      </html>
                    `;
                    const blob = new Blob([fullHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${previewFile.name.replace('.json', '.html')}`;
                    a.click();
                  }}
                  className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm transition-all active:scale-95"
                >
                  TẢI VỀ DẠNG HTML
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .slide-preview-content iframe { width: 100% !important; min-height: 400px; border: none; }
        .slide-preview-content img { max-width: 100%; height: auto; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
}
