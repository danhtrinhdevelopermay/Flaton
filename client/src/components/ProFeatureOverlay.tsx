import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import UpgradeProModal from './UpgradeProModal';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ProFeatureOverlayProps {
  featureName: string;
}

export default function ProFeatureOverlay({ featureName }: ProFeatureOverlayProps) {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md overflow-hidden">
      {/* Content */}
      <div className={`relative mx-4 rounded-2xl p-8 max-w-sm shadow-2xl pointer-events-auto ${
        theme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Text */}
        <h2 className={`text-2xl font-bold text-center mb-3 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          Tính năng Pro
        </h2>
        
        <p className={`text-center mb-6 ${
          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
        }`}>
          Tính năng <span className="font-semibold">{featureName}</span> chỉ dành cho tài khoản Pro. Vui lòng nâng cấp tài khoản để tiếp tục sử dụng.
        </p>

        {/* Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:shadow-lg transition-shadow pointer-events-auto"
        >
          Nâng cấp tài khoản
        </button>

        {/* Info text */}
        <p className={`text-xs text-center mt-4 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Nhận quyền truy cập vào tất cả các tính năng premium
        </p>
      </div>

      {user && token && (
        <UpgradeProModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userId={user.id}
          userName={user.name || user.email}
          userEmail={user.email}
          token={token}
        />
      )}
    </div>
  );
}
