import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface UpgradeRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminUpgradePage() {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'flaton-admin-secret';

  useEffect(() => {
    if (!window.location.pathname.includes(ADMIN_SECRET)) {
      navigate('/');
      return;
    }

    if (token) {
      fetchRequests();
    }
  }, [token]);

  const fetchRequests = async () => {
    if (!token) {
      console.error('No token available');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/admin/upgrade-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched upgrade requests:', data);
        setRequests(data);
      } else {
        console.error('Error response:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number, userId: number) => {
    setActionLoading(requestId);
    try {
      const response = await fetch('/api/admin/approve-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, userId })
      });

      if (response.ok) {
        setRequests(requests.map(r =>
          r.id === requestId ? { ...r, status: 'approved' } : r
        ));
      } else {
        alert('Lỗi khi duyệt yêu cầu');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Đã xảy ra lỗi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      const response = await fetch('/api/admin/reject-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      if (response.ok) {
        setRequests(requests.map(r =>
          r.id === requestId ? { ...r, status: 'rejected' } : r
        ));
      } else {
        alert('Lỗi khi từ chối yêu cầu');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Đã xảy ra lỗi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa yêu cầu này?')) return;
    
    setActionLoading(requestId);
    try {
      const response = await fetch('/api/admin/delete-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });

      if (response.ok) {
        setRequests(requests.filter(r => r.id !== requestId));
      } else {
        alert('Lỗi khi xóa yêu cầu');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Đã xảy ra lỗi');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Quản lý yêu cầu nâng cấp Pro
        </h1>

        <div className={`rounded-lg overflow-x-auto border ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <table className="w-full min-w-max">
            <thead className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
              <tr>
                <th className={`px-6 py-3 text-left font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>ID</th>
                <th className={`px-6 py-3 text-left font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>Tên</th>
                <th className={`px-6 py-3 text-left font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>Email</th>
                <th className={`px-6 py-3 text-left font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>Lý do</th>
                <th className={`px-6 py-3 text-left font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>Trạng thái</th>
                <th className={`px-6 py-3 text-left font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className={theme === 'dark' ? 'border-t border-slate-700' : 'border-t border-slate-200'}>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{req.id}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{req.user_name}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{req.user_email}</td>
                  <td className={`px-6 py-4 max-w-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} title={req.reason}>
                    <div className="truncate">{req.reason}</div>
                  </td>
                  <td className="px-6 py-4">
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <Clock className="w-4 h-4" />
                        <span>Chờ xử lý</span>
                      </div>
                    )}
                    {req.status === 'approved' && (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span>Đã duyệt</span>
                      </div>
                    )}
                    {req.status === 'rejected' && (
                      <div className="flex items-center gap-2 text-red-500">
                        <XCircle className="w-4 h-4" />
                        <span>Từ chối</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id, req.user_id)}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                    {(req.status === 'approved' || req.status === 'rejected') && (
                      <button
                        onClick={() => handleDelete(req.id)}
                        disabled={actionLoading === req.id}
                        className="px-3 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-sm disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {requests.length === 0 && (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Không có yêu cầu nâng cấp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
