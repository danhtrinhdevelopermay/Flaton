import { useState, useEffect } from 'react';
import { Shield, Key, Plus, Trash2, RefreshCw, Loader2, AlertTriangle, CheckCircle, Lock, LogOut, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ApiKey {
  id: number;
  api_key: string;
  name: string;
  credits: number;
  is_active: boolean;
  is_current: boolean;
  last_checked: string | null;
  created_at: string;
}

interface SystemStatus {
  totalKeys: number;
  activeKeys: number;
  totalCredits: number;
  currentKey: ApiKey | null;
  alerts: any[];
}

interface Alert {
  id: number;
  alert_type: string;
  message: string;
  created_at: string;
}

export default function AdminPage() {
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const [newApiKey, setNewApiKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [addingKey, setAddingKey] = useState(false);
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setAdminToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const [keysRes, statusRes, alertsRes] = await Promise.all([
        fetch(`/api/admin/api-keys`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        }),
        fetch(`/api/admin/status`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        }),
        fetch(`/api/admin/alerts`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ]);
      
      if (keysRes.ok) setApiKeys(await keysRes.json());
      if (statusRes.ok) setSystemStatus(await statusRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setAdminToken(data.token);
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        setPassword('');
      } else {
        setError(data.error || 'Mật khẩu không đúng');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken('');
    setIsLoggedIn(false);
    setApiKeys([]);
    setSystemStatus(null);
  };

  const addApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) return;
    
    setAddingKey(true);
    setError('');
    
    try {
      const res = await fetch(`/api/admin/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ apiKey: newApiKey, name: newKeyName })
      });

      if (res.ok) {
        setNewApiKey('');
        setNewKeyName('');
        setSuccess('Thêm API key thành công!');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Không thể thêm API key');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingKey(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa API key này?')) return;
    
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (res.ok) {
        setSuccess('Đã xóa API key');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Không thể xóa API key');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refreshKey = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.ok) {
        loadData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setCurrentKey = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}/set-current`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.ok) {
        setSuccess('Đã đặt làm API key chính');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const refreshAllKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/refresh-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.ok) {
        setSuccess('Đã làm mới tất cả API keys');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAlertRead = async (id: number) => {
    try {
      await fetch(`/api/admin/alerts/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.ok) {
        setSuccess('Đổi mật khẩu thành công!');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Không thể đổi mật khẩu');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center fade-in">
        <div className="w-full max-w-md">
          <div className={`rounded-2xl p-8 ${theme === 'dark' ? 'glass' : 'bg-white border border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin Login</h1>
            </div>

            {error && (
              <div className={`mb-6 p-4 rounded-xl border ${theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Mật khẩu Admin
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                    }`}
                  />
                </div>
                <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Mật khẩu mặc định: admin123</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Đăng nhập Admin
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin Dashboard</h1>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Quản lý hệ thống API & Credits</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
          >
            <Lock className="w-4 h-4" />
            Đổi mật khẩu
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 rounded-xl flex items-center gap-2 transition-all font-bold"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl flex items-center gap-2 border animate-bounce-short ${
          theme === 'dark' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className={`p-4 rounded-xl flex items-center gap-2 border ${
          theme === 'dark' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-600'
        }`}>
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-xl flex items-center justify-between border ${
              theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">{alert.message}</span>
              </div>
              <button
                onClick={() => markAlertRead(alert.id)}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                  theme === 'dark' ? 'bg-amber-500/20 hover:bg-amber-500/30' : 'bg-white border border-amber-200 hover:bg-amber-50'
                }`}
              >
                Đã đọc
              </button>
            </div>
          ))}
        </div>
      )}

      {showChangePassword && (
        <div className={`rounded-3xl p-8 border-b-4 transition-all ${theme === 'dark' ? 'bg-[#1e202f] border-[#151621]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h2 className={`text-xl font-black uppercase tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Đổi mật khẩu Admin</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                    theme === 'dark' ? 'bg-slate-800/50 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                    theme === 'dark' ? 'bg-slate-800/50 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                    theme === 'dark' ? 'bg-slate-800/50 border border-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Lưu mật khẩu mới
              </button>
            </div>
          </form>
        </div>
      )}

      {systemStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-6 border-b-4 ${theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Tổng API Keys</div>
            <div className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{systemStatus.totalKeys}</div>
          </div>
          <div className={`rounded-2xl p-6 border-b-4 ${theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Keys hoạt động</div>
            <div className="text-3xl font-black text-emerald-500">{systemStatus.activeKeys}</div>
          </div>
          <div className={`rounded-2xl p-6 border-b-4 ${theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Tổng Credits</div>
            <div className="text-3xl font-black text-indigo-500">{systemStatus.totalCredits.toFixed(1)}</div>
          </div>
          <div className={`rounded-2xl p-6 border-b-4 ${theme === 'dark' ? 'bg-[#2a2d3e] border-[#1e202f]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Key đang dùng</div>
            <div className="text-xl font-black text-amber-500 truncate">
              {systemStatus.currentKey?.name || 'CHƯA CẤU HÌNH'}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-3xl p-8 border-b-4 ${theme === 'dark' ? 'bg-[#1e202f] border-[#151621]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-black uppercase tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Key className="w-8 h-8 text-indigo-500" />
            Thêm API Key mới
          </h2>
        </div>
        
        <form onSubmit={addApiKey} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Tên gợi nhớ..."
              className={`w-full px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold ${
                theme === 'dark' ? 'bg-[#2a2d3e] border-2 border-[#1e202f] text-white' : 'bg-slate-50 border-2 border-slate-100 text-slate-900'
              }`}
            />
          </div>
          <div className="md:col-span-6">
            <input
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Dán API key từ kie.ai tại đây..."
              className={`w-full px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-mono text-sm ${
                theme === 'dark' ? 'bg-[#2a2d3e] border-2 border-[#1e202f] text-white' : 'bg-slate-50 border-2 border-slate-100 text-slate-900'
              }`}
              required
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={addingKey}
              className="w-full h-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all border-b-4 border-indigo-900 active:border-b-0"
            >
              {addingKey ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <div className="flex items-center justify-center gap-2"><Plus className="w-6 h-6" /> THÊM NGAY</div>}
            </button>
          </div>
        </form>
      </div>

      <div className={`rounded-3xl overflow-hidden border-b-4 ${theme === 'dark' ? 'bg-[#1e202f] border-[#151621]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="p-8 flex items-center justify-between border-b border-dashed border-slate-700/20">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Danh sách API Keys</h2>
          <button
            onClick={refreshAllKeys}
            disabled={loading}
            className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-xs transition-all ${
              theme === 'dark' ? 'bg-[#2a2d3e] hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh All
          </button>
        </div>

        <div className="p-0">
          {apiKeys.length === 0 ? (
            <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
              <Key className="w-20 h-20 mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest">Hệ thống đang trống...</p>
            </div>
          ) : (
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className={`text-left ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <th className="py-6 px-4 font-black uppercase text-[10px] tracking-widest">THÔNG TIN KEY</th>
                    <th className="py-6 px-4 font-black uppercase text-[10px] tracking-widest">MÃ API</th>
                    <th className="py-6 px-4 font-black uppercase text-[10px] tracking-widest">CREDITS</th>
                    <th className="py-6 px-4 font-black uppercase text-[10px] tracking-widest text-center">TRẠNG THÁI</th>
                    <th className="py-6 px-4 font-black uppercase text-[10px] tracking-widest text-right">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-700/30">
                  {apiKeys.map(key => (
                    <tr key={key.id} className={`${theme === 'dark' ? 'hover:bg-indigo-500/5' : 'hover:bg-slate-50'} transition-colors group`}>
                      <td className="py-5 px-4">
                        <div className="flex flex-col">
                          <span className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{key.name || 'Không tên'}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Thêm: {new Date(key.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className={`px-3 py-2 rounded-xl font-mono text-xs inline-block ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
                          {key.api_key.substring(0, 12)}...{key.api_key.substring(key.api_key.length - 6)}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${key.credits < 20 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                          <span className={`text-xl font-black ${key.credits < 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {key.credits.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-col items-center gap-2">
                          {key.is_current && (
                            <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1 animate-pulse">
                              <Zap className="w-3 h-3 fill-current" /> Đang sử dụng
                            </span>
                          )}
                          <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border-2 ${
                            key.is_active 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {key.is_active ? 'Sẵn sàng' : 'Hết hạn'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => refreshKey(key.id)}
                            className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'bg-slate-800 hover:bg-indigo-500/20 text-white' : 'bg-slate-100 hover:bg-indigo-100 text-slate-600'}`}
                            title="Check Credit"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                          {!key.is_current && key.is_active && (
                            <button
                              onClick={() => setCurrentKey(key.id)}
                              className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-white' : 'bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white'}`}
                              title="Set Active"
                            >
                              <Zap className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteApiKey(key.id)}
                            className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white' : 'bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white'}`}
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-3xl p-8 border-b-4 border-dashed ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-50 border-slate-200'}`}>
        <h2 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Protocol vận hành hệ thống
        </h2>
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] font-black uppercase leading-relaxed tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-indigo-500 text-lg">01.</span>
              <p>Tự động giám sát credits định kỳ mỗi 30 phút. Quản trị viên có thể ép buộc kiểm tra thủ công bằng nút Refresh.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-indigo-500 text-lg">02.</span>
              <p>Cơ chế Fail-over: Hệ thống tự động kích hoạt Key dự phòng khi Key chính xuống dưới ngưỡng an toàn (10 credits).</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-indigo-500 text-lg">03.</span>
              <p>Tính sẵn sàng cao: Admin có thể chủ động đặt bất kỳ Key nào làm Key chính (Current) để tối ưu hóa chi phí và hiệu năng.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Save } from 'lucide-react';