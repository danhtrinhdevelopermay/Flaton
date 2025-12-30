import { Crown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ProFeatureOverlayProps {
  featureName: string;
}

export default function ProFeatureOverlay({ featureName }: ProFeatureOverlayProps) {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Content */}
      <div className="relative mx-4 rounded-2xl p-8 max-w-sm pointer-events-auto">
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
        <button className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:shadow-lg transition-shadow">
          Nâng cấp tài khoản
        </button>

        {/* Info text */}
        <p className={`text-xs text-center mt-4 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Nhận quyền truy cập vào tất cả các tính năng premium
        </p>
      </div>
    </div>
  );
}
