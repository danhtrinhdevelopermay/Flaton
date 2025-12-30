import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userEmail: string;
  token: string;
}

export default function UpgradeProModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  token
}: UpgradeProModalProps) {
  const { theme } = useTheme();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/upgrade-pro-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          userName,
          userEmail,
          reason: reason.trim()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setReason('');
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 2000);
      } else {
        alert('Lỗi khi gửi yêu cầu. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      alert('Đã xảy ra lỗi. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
      <div className={`relative mx-4 rounded-2xl p-8 max-w-md pointer-events-auto ${
        theme === 'dark'
          ? 'bg-slate-900 border border-slate-700'
          : 'bg-white border border-slate-200'
      }`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {!submitted ? (
          <>
            <h2 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Yêu cầu nâng cấp Pro
            </h2>
            <p className={`text-sm mb-6 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Hãy cho chúng tôi biết tại sao bạn cần nâng cấp tài khoản Pro
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Lý do nâng cấp
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn tạo nhiều video hơn, cần tính năng unlimited..."
                  maxLength={500}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                  rows={4}
                />
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  {reason.length}/500 ký tự
                </p>
              </div>

              {/* Zalo Admin Button */}
              <a
                href="https://zalo.me/0786831513"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Liên hệ Admin qua Zalo
              </a>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className={`font-bold text-lg ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Yêu cầu đã được gửi!
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Admin sẽ xem xét yêu cầu của bạn trong thời gian sớm nhất
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
