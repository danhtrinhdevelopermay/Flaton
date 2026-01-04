import { useState, useEffect } from 'react';
import { X, MessageCircle, Sparkles, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

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
  const { refreshUser } = useAuth();
  const [reason, setReason] = useState('');
  const [plan, setPlan] = useState('1 tháng - 45.000vnd');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const plans = [
    '1 ngày - 2.000vnd',
    '1 tuần - 8.000vnd',
    '1 tháng - 45.000vnd',
    '1 năm - 90.000vnd'
  ];

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
          reason: `Gói: ${plan} | Lý do: ${reason.trim()}`
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setReason('');
        // Refresh user data to check if is_pro was already updated by admin
        await refreshUser();
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Lỗi: ${errorData.error || 'Lỗi khi gửi yêu cầu. Vui lòng thử lại!'}`);
      }
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      alert(`Lỗi kết nối: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-xl overflow-hidden p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border-b-8 transition-all ${
          theme === 'dark'
            ? 'bg-[#2a2d3e] border-[#1e202f] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
        >
          <X className="w-6 h-6 text-slate-500" />
        </button>

        {!submitted ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD93D] to-[#FF9F29] flex items-center justify-center shadow-lg transform rotate-6">
                <Sparkles className="w-7 h-7 text-white drop-shadow-md" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight uppercase">NÂNG CẤP PRO</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6BCB77] animate-pulse" />
                  <p className="font-bold text-xs uppercase tracking-widest opacity-60">Unlock Superpowers</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  1. CHỌN GÓI CỦA BẠN
                </label>
                <div className="relative">
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className={`w-full p-4 border-4 rounded-[1.5rem] font-bold text-lg focus:outline-none focus:border-[#4D96FF] appearance-none transition-all shadow-inner ${
                      theme === 'dark'
                        ? 'bg-[#1e202f] border-[#32354a] text-white'
                        : 'bg-slate-50 border-slate-100 text-slate-900'
                    }`}
                  >
                    {plans.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none opacity-50" />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  2. LÝ DO NÂNG CẤP
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn tạo nhiều video hơn... 🚀"
                  maxLength={500}
                  className={`w-full p-4 border-4 rounded-[1.5rem] font-bold text-lg focus:outline-none focus:border-[#4D96FF] resize-none transition-all shadow-inner ${
                    theme === 'dark'
                      ? 'bg-[#1e202f] border-[#32354a] text-white placeholder-slate-600'
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'
                  }`}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <a
                  href="https://zalo.me/0786831513"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full h-14 bg-[#4D96FF] border-b-4 border-[#3A7EE6] text-white rounded-2xl font-black text-lg hover:translate-y-0.5 hover:border-b-2 active:translate-y-1 active:border-b-0 transition-all shadow-lg"
                >
                  <MessageCircle className="w-6 h-6" />
                  ZALO ADMIN
                </a>

                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="w-full h-16 bg-[#FF6B6B] border-b-[8px] border-[#EE5253] text-white rounded-2xl font-black text-xl hover:translate-y-1 hover:border-b-4 active:translate-y-2 active:border-b-0 transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU!'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-8 space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              className="w-24 h-24 mx-auto rounded-full bg-[#6BCB77] flex items-center justify-center shadow-2xl border-b-8 border-[#56B362]"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <h3 className="font-black text-3xl uppercase tracking-tight mb-2">THÀNH CÔNG!</h3>
              <p className="font-bold opacity-60">Admin sẽ duyệt yêu cầu của bạn sớm nhất! 🌈</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
