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
  const [manusPool, setManusPool] = useState<any[]>([]);
  const [newPoolKey, setNewPoolKey] = useState('');
  const [addingPoolKey, setAddingPoolKey] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
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
      loadManusPool();
      
      const interval = setInterval(() => {
        loadUsersNoFlagent();
        loadAllUsersFlagent();
        loadFlagentLogs();
        loadManusPool();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, adminToken]);

  const loadManusPool = async () => {
    try {
      console.log('[FlagentAdmin] Loading manus pool with token:', adminToken?.substring(0, 10) + '...');
      const res = await fetch('/api/admin/manus-pool', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[FlagentAdmin] Loaded manus pool:', data);
        setManusPool(data.filter((item: any) => !item.is_used));
      } else {
        const errorText = await res.text();
        console.error('[FlagentAdmin] Failed to load manus pool:', res.status, errorText);
        setError(`Lỗi load pool (${res.status}): ${errorText}`);
      }
    } catch (err: any) {
      console.error('Error loading manus pool:', err);
      setError(`Lỗi kết nối pool: ${err.message}`);
    }
  };

  const addPoolKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolKey.trim()) return;
    setAddingPoolKey(true);
    try {
      const res = await fetch('/api/admin/manus-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ api_key: newPoolKey })
      });
      if (res.ok) {
        setNewPoolKey('');
        setSuccess('Đã thêm key vào vùng chứa');
        setError('');
        loadManusPool();
        loadAllUsersFlagent(); // Tải lại danh sách user để thấy key mới được cấp
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Không thể thêm API key');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingPoolKey(false);
    }
  };

  const autoAssignKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auto-assign-keys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Đã cấp tự động cho ${data.assignedCount} tài khoản`);
        loadAllUsersFlagent();
        loadManusPool();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsersFlagent = async () => {
    try {
      console.log('[FlagentAdmin] Loading all users with token:', adminToken?.substring(0, 10) + '...');
      const res = await fetch('/api/admin/users-all-flagent', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[FlagentAdmin] Loaded users:', data);
        setAllUsersFlagent(data);
      } else {
        const errorText = await res.text();
        console.error('[FlagentAdmin] Failed to load users:', res.status, errorText);
        setError(`Lỗi load users (${res.status}): ${errorText}`);
      }
    } catch (err: any) {
      console.error('Error loading all flagent users:', err);
      setError(`Lỗi kết nối users: ${err.message}`);
    }
  };

  const loadFlagentLogs = async () => {
    try {
      const res = await fetch('/api/admin/flagent-logs', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFlagentLogs(data);
      } else {
        const errorText = await res.text();
        console.error('[FlagentAdmin] Failed to load logs:', res.status, errorText);
        setError(`Lỗi load logs (${res.status}): ${errorText}`);
      }
    } catch (err: any) {
      console.error('Error loading flagent logs:', err);
      setError(`Lỗi kết nối logs: ${err.message}`);
    }
  };

  const loadUsersNoFlagent = async () => {
    try {
      const res = await fetch('/api/admin/users-no-flagent', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) setUsersNoFlagent(await res.json());
    } catch (err) {
      console.error('Error loading users without flagent key:', err);
    }
  };

  const assignFlagentKey = async (userId: number, key: string) => {
    if (!key) return;
    try {
      const res = await fetch('/api/admin/update-user-flagent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
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
        <div className="space-y-8">
          {/* API Pool Section */}
          <div className="glass rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-32 h-32" />
            </div>
            
            <h2 className="text-xl font-black flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              VÙNG CHỨA API DỰ PHÒNG
            </h2>

            <form onSubmit={addPoolKey} className="flex gap-3 relative z-10">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={newPoolKey}
                  onChange={(e) => setNewPoolKey(e.target.value)}
                  placeholder="Nhập API Manus mới..."
                  className="w-full pl-4 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
              <button 
                type="submit"
                disabled={addingPoolKey}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
              >
                {addingPoolKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'THÊM'}
              </button>
            </form>

            <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {manusPool.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 font-medium">Vùng chứa hiện đang trống</p>
                </div>
              ) : (
                manusPool.map(item => (
                  <div key={item.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 flex justify-between items-center hover:border-slate-700 transition-all group/item">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      <div className="font-mono text-xs text-slate-400 group-hover/item:text-slate-200 transition-colors">
                        {item.api_key.substring(0, 15)}...{item.api_key.substring(item.api_key.length - 6)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.is_failed ? (
                        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full border border-red-500/20 uppercase">Lỗi</span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase">Sẵn sàng</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User List Section */}
          <div className="glass rounded-3xl p-8 border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                DANH SÁCH TÀI KHOẢN
              </h2>
              <button 
                onClick={autoAssignKeys}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                CẤP TỰ ĐỘNG
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {allUsersFlagent.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 font-medium">Chưa có dữ liệu người dùng</p>
                </div>
              ) : (
                allUsersFlagent.map(user => (
                  <div key={user.id} className="p-5 bg-slate-900/40 rounded-3xl border border-slate-800/50 space-y-4 hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-slate-300">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{user.email.split('@')[0]}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                      {(!user.flagent_api_key || user.flagent_api_key === '') ? (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20 uppercase">Thiếu Key</span>
                      ) : (
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded-full border border-indigo-500/20 uppercase">Đã cấp</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        defaultValue={user.flagent_api_key || ''}
                        placeholder="Nhập Flagent API Key..."
                        className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
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
                        className="px-5 py-2.5 bg-slate-800 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all active:scale-95"
                      >
                        LƯU
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="glass rounded-3xl p-8 border border-slate-700/50 flex flex-col h-full min-h-[600px]">
          <h2 className="text-xl font-black flex items-center gap-2 mb-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            HỆ THỐNG LOG LỖI
          </h2>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {flagentLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                <p className="text-slate-400 font-medium">Hệ thống hoạt động ổn định</p>
                <p className="text-xs text-slate-500">Không có log lỗi nào được ghi nhận</p>
              </div>
            ) : (
              flagentLogs.map((log, i) => (
                <div key={i} className="p-5 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-3 hover:bg-red-500/10 transition-all">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-red-400 text-sm">{log.email}</span>
                    <span className="text-slate-500 text-[10px] font-medium px-2 py-1 bg-slate-800 rounded-lg">
                      {new Date(log.updated_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-2xl font-mono text-[11px] text-slate-400 border border-slate-800/50 leading-relaxed break-all">
                    <span className="text-indigo-400">Prompt:</span> {log.prompt}
                  </div>
                  <div className="bg-red-900/10 p-3 rounded-2xl text-[11px] text-red-300 border border-red-500/10">
                    <span className="font-bold">Lỗi:</span> {log.error}
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
