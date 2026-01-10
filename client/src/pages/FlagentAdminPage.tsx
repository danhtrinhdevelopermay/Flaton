import { useState, useEffect } from 'react';
import { Shield, Loader2, AlertTriangle, CheckCircle, Brain, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FlagentAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [allUsersFlagent, setAllUsersFlagent] = useState<any[]>([]);
  const [flagentLogs, setFlagentLogs] = useState<any[]>([]);
  const [usersNoFlagent, setUsersNoFlagent] = useState<any[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setAdminToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadUsersNoFlagent();
      loadAllUsersFlagent();
      loadFlagentLogs();
      
      const interval = setInterval(() => {
        loadUsersNoFlagent();
        loadAllUsersFlagent();
        loadFlagentLogs();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, adminToken]);

  const loadAllUsersFlagent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users-all-flagent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[FlagentAdmin] Loaded users:', data);
        setAllUsersFlagent(data);
      } else {
        console.error('[FlagentAdmin] Failed to load users:', res.status);
      }
    } catch (err) {
      console.error('Error loading all flagent users:', err);
    }
  };

  const loadFlagentLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/flagent-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFlagentLogs(data);
      }
    } catch (err) {
      console.error('Error loading flagent logs:', err);
    }
  };

  const loadUsersNoFlagent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users-no-flagent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsersNoFlagent(await res.json());
    } catch (err) {
      console.error('Error loading users without flagent key:', err);
    }
  };

  const assignFlagentKey = async (userId: number, key: string) => {
    if (!key) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/update-user-flagent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, apiKey: key })
      });
      if (res.ok) {
        setSuccess('Đã cập nhật API Key cho người dùng');
        loadUsersNoFlagent();
        loadAllUsersFlagent();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass p-8 rounded-2xl text-center max-w-md w-full">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Vui lòng đăng nhập Admin</h1>
          <Link to="/admin" className="text-indigo-500 hover:underline">Đi tới trang đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-slate-800 rounded-lg transition-all">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">QUẢN LÝ FLAGENT</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Hệ thống giám sát & Cấp phát API</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            DANH SÁCH TÀI KHOẢN
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {allUsersFlagent.length === 0 ? (
              <p className="text-slate-500">Chưa có dữ liệu người dùng.</p>
            ) : (
              allUsersFlagent.map(user => (
                <div key={user.id} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{user.email.split('@')[0]}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                    {(!user.flagent_api_key || user.flagent_api_key === '') && (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black rounded-full uppercase">Chưa có Key</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      defaultValue={user.flagent_api_key || ''}
                      placeholder="Flagent API Key..."
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-sm focus:border-indigo-500 outline-none"
                      onBlur={(e) => {
                        if (e.target.value !== (user.flagent_api_key || '')) {
                          assignFlagentKey(user.id, e.target.value);
                        }
                      }}
                    />
                    <button 
                      onClick={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        assignFlagentKey(user.id, input.value);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all"
                    >
                      LƯU
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            HỆ THỐNG LOG LỖI
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {flagentLogs.length === 0 ? (
              <p className="text-slate-500">Không có log lỗi nào.</p>
            ) : (
              flagentLogs.map((log, i) => (
                <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-red-400">{log.email}</span>
                    <span className="text-slate-500">{new Date(log.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg font-mono text-slate-400 break-all">
                    Prompt: {log.prompt}
                  </div>
                  <div className="bg-red-900/20 p-2 rounded-lg text-red-300">
                    Lỗi: {log.error}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
