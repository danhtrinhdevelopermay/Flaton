import { ShoppingBag, CreditCard, Sparkles, Zap, Trophy, CheckCircle2, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ShopPage() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const creditPackages = [
    {
      id: 'starter',
      name: 'Starter',
      credits: 100,
      price: '50,000đ',
      popular: false,
      features: ['100 Credits', 'Cơ bản', 'Hỗ trợ email']
    },
    {
      id: 'pro',
      name: 'Professional',
      credits: 500,
      price: '200,000đ',
      popular: true,
      features: ['500 Credits', 'Ưu tiên xử lý', 'Hỗ trợ 24/7', 'Không quảng cáo']
    },
    {
      id: 'elite',
      name: 'Elite',
      credits: 2000,
      price: '700,000đ',
      popular: false,
      features: ['2000 Credits', 'Băng thông riêng', 'API Access', 'Tất cả tính năng']
    }
  ];

  return (
    <div className={`min-h-screen py-12 px-4 ${theme === 'dark' ? 'bg-[#0f111a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-6 mb-12">
          <Link
            to="/kling-motion"
            className="flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-xl hover:scale-105 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Wand2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs opacity-80 uppercase font-bold tracking-widest">Tính năng mới</p>
              <p className="text-lg">KLING MOTION CONTROL</p>
            </div>
          </Link>
        </div>

        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 font-bold mb-4"
          >
            <ShoppingBag className="w-4 h-4" />
            CỬA HÀNG CREDITS
          </motion.div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">NÂNG CẤP TRẢI NGHIỆM</h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Sở hữu thêm credits để tạo ra những nội dung AI đỉnh cao không giới hạn
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {creditPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-[2.5rem] p-8 border-4 transition-all hover:scale-105 ${
                pkg.popular
                  ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.2)]'
                  : theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-orange-500 text-white font-black rounded-full text-sm shadow-lg">
                  PHỔ BIẾN NHẤT
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-orange-500">{pkg.credits}</span>
                  <span className="font-bold opacity-60">CREDITS</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {pkg.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="font-medium opacity-80">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <div className="text-3xl font-black">{pkg.price}</div>
              </div>

              <button className={`w-full py-4 rounded-2xl font-black transition-all active:scale-95 ${
                pkg.popular
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : theme === 'dark' ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}>
                MUA NGAY
              </button>
            </motion.div>
          ))}
        </div>

        <div className={`rounded-[3rem] p-12 border-4 ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-black mb-6">TẠI SAO CHỌN FLATON?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Tốc độ siêu nhanh</h4>
                    <p className="opacity-60">Xử lý yêu cầu trong vài giây với hạ tầng mạnh mẽ.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Chất lượng 4K</h4>
                    <p className="opacity-60">Hình ảnh và video độ phân giải cao, sắc nét đến từng chi tiết.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Đa dạng mô hình</h4>
                    <p className="opacity-60">Tích hợp những AI mới nhất và mạnh mẽ nhất thế giới.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-orange-500/20 to-purple-500/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard className="w-32 h-32 text-orange-500 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
