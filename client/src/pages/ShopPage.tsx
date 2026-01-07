import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const MODELS = [
  {
    id: 'kling-motion',
    name: 'Kling 2.6 Motion Control',
    provider: 'Kling',
    tags: ['Motion Control', 'Professional'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
    path: '/kling-motion'
  },
  {
    id: 1,
    name: 'Kling 2.6 Motion Control',
    provider: 'Kling',
    tags: ['Video to Video'],
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
    secondImage: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    name: 'Seedance 1.5 Pro',
    provider: 'ByteDance',
    tags: ['Text to Video', 'Image to Video'],
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    name: 'Animate Anyone',
    provider: 'Alibaba',
    tags: ['Image to Video'],
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800'
  }
];

export default function ShopPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">All Models</h1>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            theme === 'dark' 
              ? 'bg-white/5 border-white/10 hover:bg-white/10' 
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filters (0)</span>
          </button>
        </div>
        <p className="text-sm opacity-50 mb-6 font-medium">50 models found</p>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 opacity-40" />
          </div>
          <input
            type="text"
            placeholder="Search models..."
            className={`w-full py-4 pl-12 pr-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              theme === 'dark'
                ? 'bg-[#161922] border-white/5 placeholder:text-white/20'
                : 'bg-white border-slate-200 placeholder:text-slate-400 shadow-sm'
            }`}
          />
        </div>

        {/* Models Grid */}
        <div className="space-y-6">
          {MODELS.map((model) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => model.path && navigate(model.path)}
              className={`group relative overflow-hidden rounded-[2.5rem] aspect-[4/3] cursor-pointer border transition-all duration-300 ${
                theme === 'dark' ? 'border-white/5 bg-[#161922]' : 'border-slate-200 bg-white shadow-lg'
              }`}
            >
              {/* Image Container */}
              <div className="absolute inset-0 flex">
                <div className={`relative flex-1 h-full overflow-hidden ${model.secondImage ? 'w-1/2' : 'w-full'}`}>
                  <img 
                    src={model.image} 
                    alt={model.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                {model.secondImage && (
                  <div className="relative flex-1 h-full overflow-hidden w-1/2">
                    <img 
                      src={model.secondImage} 
                      alt={model.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col gap-2">
                <span className="text-sm font-semibold text-white/70">{model.provider}</span>
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{model.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {model.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-4 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

