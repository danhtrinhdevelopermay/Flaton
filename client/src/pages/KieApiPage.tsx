import { useState, useEffect } from 'react';
import { Key, Save, Loader2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function KieApiPage() {
  const { theme } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/admin/kie-key', { credentials: 'include' });
      const data = await res.json();
      if (data.key) setApiKey(data.key);
    } catch (err) {
      console.error('Failed to fetch API key');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/kie-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã cập nhật API Key thành công!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi cập nhật' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối server' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 fade-in">
      <div className={`rounded-3xl overflow-hidden border-b-8 transition-all ${
        theme === 'dark' 
          ? 'bg-[#1e202f] border-[#151621] shadow-2xl shadow-indigo-500/10' 
          : 'bg-white border-slate-200 shadow-xl shadow-slate-200'
      }`}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">Cấu hình KIE.AI</h1>
              <p className="text-indigo-100 text-sm font-medium">Quản lý API Key cho các dịch vụ AI</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {message.text && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="font-bold text-sm uppercase">{message.text}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className={`block text-xs font-black uppercase tracking-widest opacity-50 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              KIE API KEY
            </label>
            <div className="relative">
              <Key className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Nhập API Key từ kie.ai..."
                className={`w-full pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-sm ${
                  theme === 'dark'
                    ? 'bg-[#2a2d3e] border-2 border-[#1e202f] text-white placeholder-slate-600'
                    : 'bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder-slate-400 shadow-inner'
                }`}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              * Key này được sử dụng để gọi các model Image, Video, Music.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-b-4 border-indigo-800 active:border-b-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Lưu cấu hình
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`mt-8 p-6 rounded-2xl border-2 border-dashed ${
        theme === 'dark' ? 'border-slate-800 bg-slate-800/20 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Hướng dẫn
        </h3>
        <ul className="text-[11px] font-bold space-y-2 uppercase leading-relaxed">
          <li>1. Truy cập vào trang quản trị của KIE.AI</li>
          <li>2. Tạo hoặc copy API Key hiện có</li>
          <li>3. Dán vào ô bên trên và nhấn "Lưu cấu hình"</li>
          <li>4. Hệ thống sẽ sử dụng Key mới ngay lập tức cho các yêu cầu AI</li>
        </ul>
      </div>
    </div>
  );
}