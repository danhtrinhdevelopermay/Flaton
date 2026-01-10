import { useState, useEffect } from 'react';
import { Shield, Key, Plus, Trash2, RefreshCw, Loader2, AlertTriangle, CheckCircle, Lock, LogOut, Zap, Brain, ArrowLeft } from 'lucide-react';

interface ApiKey {
  id: number;
  key_value: string;
  key_name: string;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manusKey, setManusKey] = useState('');
  const [savingManus, setSavingManus] = useState(false);
  
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
      loadSettings();
      
      // Set up 10s interval
      const interval = setInterval(() => {
        loadData();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, adminToken]);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.manus_api_key) setManusKey(data.manus_api_key);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const saveManusKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManus(true);
    setError('');
    try {
      console.log('Saving Manus Key:', manusKey);
      // Use standard auth token if adminToken is just a password string
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key: 'manus_api_key', value: manusKey })
      });
      
      const data = await res.json();
      console.log('Save Manus Key response:', data);

      if (res.ok) {
        setSuccess('Đã lưu Manus API Key');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Không thể lưu Manus API Key');
      }
    } catch (err: any) {
      console.error('Save Manus Key error:', err);
      setError(err.message);
    } finally {
      setSavingManus(false);
    }
  };

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
    console.log('[Admin] Attempting to add API key:', { name: newKeyName, key: newApiKey.substring(0, 5) + '...' });
    
    try {
      const res = await fetch(`/api/admin/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ apiKey: newApiKey, name: newKeyName })
      });

      console.log('[Admin] Add API key response status:', res.status);
      const data = await res.json();

      if (res.ok) {
        console.log('[Admin] API key added successfully');
        setNewApiKey('');
        setNewKeyName('');
        setSuccess('Thêm API key thành công!');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('[Admin] Add API key failed:', data);
        setError(data.error || 'Không thể thêm API key');
      }
    } catch (err: any) {
      console.error('[Admin] Add API key exception:', err);
      setError(err.message);
    } finally {
      setAddingKey(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa API key này?')) return;
    
    try {
      console.log('Deleting API key with id:', id);
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log('Delete response status:', res.status);
      
      if (res.ok) {
        setSuccess('Đã xóa API key');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        console.error('Delete error:', data);
        setError(data.error || 'Không thể xóa API key');
      }
    } catch (err: any) {
      console.error('Delete exception:', err);
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
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Bảng điều khiển Admin</h1>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mật khẩu Admin
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Mật khẩu mặc định: admin123</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all"
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
    <div className="fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bảng điều khiển Admin</h1>
            <p className="text-slate-400">Quản lý API Keys Kie.ai</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/manus"
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl flex items-center gap-2 transition-all"
          >
            <Brain className="w-4 h-4" />
            Quản lý Manus
          </Link>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-2 transition-all"
          >
            <Lock className="w-4 h-4" />
            Đổi mật khẩu
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
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

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div key={alert.id} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {alert.message}
              </div>
              <button
                onClick={() => markAlertRead(alert.id)}
                className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-sm"
              >
                Đã đọc
              </button>
            </div>
          ))}
        </div>
      )}

      {showChangePassword && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Đổi mật khẩu Admin</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-medium flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Đổi mật khẩu
            </button>
          </form>
        </div>
      )}

      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Tổng API Keys</div>
            <div className="text-2xl font-bold">{systemStatus.totalKeys}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Keys hoạt động</div>
            <div className="text-2xl font-bold text-green-400">{systemStatus.activeKeys}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Tổng Credits</div>
            <div className="text-2xl font-bold text-indigo-400">{systemStatus.totalCredits.toFixed(2)}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Key đang dùng</div>
            <div className="text-lg font-bold text-yellow-400">
              {systemStatus.currentKey?.key_name || systemStatus.currentKey?.key_value || 'Chưa có'}
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-indigo-500" />
          Cấu hình Manus AI (Mặc định)
        </h2>
        <form onSubmit={saveManusKey} className="flex gap-4">
          <input
            type="password"
            value={manusKey}
            onChange={(e) => setManusKey(e.target.value)}
            placeholder="Nhập Manus API Key..."
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={savingManus}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-all"
          >
            {savingManus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu Key'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Key className="w-5 h-5" />
            Thêm API Key mới
          </h2>
        </div>
        
        <form onSubmit={addApiKey} className="flex gap-4 flex-wrap">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Tên key (tùy chọn)"
            className="flex-1 min-w-[150px] px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Nhập API key..."
            className="flex-[2] min-w-[300px] px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={addingKey}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-medium flex items-center gap-2 transition-all"
          >
            {addingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Thêm Key
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Danh sách API Keys</h2>
          <button
            onClick={refreshAllKeys}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Làm mới tất cả
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Chưa có API key nào. Thêm key mới để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="pb-3 px-2">Tên</th>
                  <th className="pb-3 px-2">API Key</th>
                  <th className="pb-3 px-2">Credits</th>
                  <th className="pb-3 px-2">Trạng thái</th>
                  <th className="pb-3 px-2">Lần check cuối</th>
                  <th className="pb-3 px-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(key => (
                  <tr key={key.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-2">{key.key_name || '-'}</td>
                    <td className="py-3 px-2 font-mono text-sm text-slate-400">{key.key_value}</td>
                    <td className="py-3 px-2">
                      <span className={`font-bold ${key.credits < 10 ? 'text-red-400' : 'text-green-400'}`}>
                        {key.credits}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        {key.is_current && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Đang dùng
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          key.is_active 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {key.is_active ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-400">
                      {key.last_checked ? new Date(key.last_checked).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => refreshKey(key.id)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-all"
                          title="Làm mới credit"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {!key.is_current && key.is_active && (
                          <button
                            onClick={() => setCurrentKey(key.id)}
                            className="p-2 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all"
                            title="Đặt làm key chính"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteApiKey(key.id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                          title="Xóa key"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Hướng dẫn</h2>
        <div className="space-y-2 text-slate-400 text-sm">
          <p>• Hệ thống sẽ tự động kiểm tra credit của API key đang sử dụng.</p>
          <p>• Nếu API key có dưới 10 credits, hệ thống sẽ tự động chuyển sang key khác.</p>
          <p>• Các key có dưới 10 credits sẽ được đánh dấu "Vô hiệu" và không được sử dụng.</p>
          <p>• Khi tất cả keys đều dưới 10 credits, bạn sẽ nhận được cảnh báo để thêm keys mới.</p>
          <p>• Nhấn "Làm mới" để cập nhật credit mới nhất cho từng key.</p>
        </div>
      </div>
    </div>
  );
}
