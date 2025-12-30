import { useState, useEffect } from 'react';
import { Compass, Music, Loader2, Share2, ChevronUp, ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface ExplorerItem {
  id: string;
  type: 'image' | 'video' | 'music';
  user_id?: number;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  prompt: string;
  model: string;
  title?: string;
  created_at: string;
}

export default function ExplorerPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState(0);

  useEffect(() => {
    fetchExplore();
  }, []);

  const fetchExplore = async () => {
    try {
      const response = await fetch('/api/products/explore');
      if (response.ok) {
        const data = await response.json();
        // Gộp tất cả media vào một mảng duy nhất
        const mixed: ExplorerItem[] = [];
        
        // Thêm images
        data.images?.forEach((img: any) => {
          mixed.push({
            id: `img-${img.id || Math.random()}`,
            type: 'image',
            user_id: img.user_id,
            image_url: img.image_url,
            prompt: img.prompt,
            model: img.model,
            created_at: img.created_at
          });
        });
        
        // Thêm videos
        data.videos?.forEach((vid: any) => {
          mixed.push({
            id: `vid-${vid.id || Math.random()}`,
            type: 'video',
            user_id: vid.user_id,
            video_url: vid.video_url,
            prompt: vid.prompt,
            model: vid.model,
            created_at: vid.created_at
          });
        });
        
        // Thêm music
        data.music?.forEach((mus: any) => {
          mixed.push({
            id: `mus-${mus.id || Math.random()}`,
            type: 'music',
            user_id: mus.user_id,
            audio_url: mus.audio_url,
            prompt: mus.prompt,
            model: mus.model,
            title: mus.title,
            created_at: mus.created_at
          });
        });
        
        setAllItems(mixed);
      }
    } catch (error) {
      console.error('Failed to fetch explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (url: string | undefined) => {
    if (!url) return;
    if (navigator.share) {
      navigator.share({
        title: 'Sản phẩm được tạo bởi AI',
        text: 'Xem sản phẩm AI tuyệt vời này trên Flaton!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Đã sao chép liên kết!');
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, allItems.length - 1)));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart(clientY);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    const diff = dragStart - clientY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe up = next
        handleNext();
      } else {
        // Swipe down = prev
        handlePrev();
      }
    }
  };

  const renderItem = (item: ExplorerItem) => {
    switch (item.type) {
      case 'image':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black/20 rounded-xl">
              <img src={item.image_url} alt={item.prompt} className="w-full h-full object-contain" />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${
                  theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  🖼️ Hình ảnh
                </div>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.model}</p>
                <p className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.prompt}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                <div className="flex gap-2">
                  {item.user_id && (
                    <button
                      onClick={() => navigate(`/profile/${item.user_id}`)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 text-sm transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Tác giả
                    </button>
                  )}
                  <button
                    onClick={() => handleShare(item.image_url)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <video src={item.video_url} controls className="w-full h-full object-contain" />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${
                  theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                }`}>
                  🎬 Video
                </div>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.model}</p>
                <p className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.prompt}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                <div className="flex gap-2">
                  {item.user_id && (
                    <button
                      onClick={() => navigate(`/profile/${item.user_id}`)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 text-sm transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Tác giả
                    </button>
                  )}
                  <button
                    onClick={() => handleShare(item.video_url)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'music':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Music className="w-24 h-24 text-white opacity-50" />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${
                  theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                }`}>
                  🎵 Nhạc
                </div>
                <h3 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title || 'Untitled'}</h3>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.model}</p>
                <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{item.prompt}</p>
                <audio src={item.audio_url} controls className="w-full mb-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                <div className="flex gap-2">
                  {item.user_id && (
                    <button
                      onClick={() => navigate(`/profile/${item.user_id}`)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 text-sm transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Tác giả
                    </button>
                  )}
                  <button
                    onClick={() => handleShare(item.audio_url)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Explorer</h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Khám phá các sản phẩm AI được chia sẻ công khai</p>
        </div>
      </div>

      {/* Main Content */}
      {allItems.length === 0 ? (
        <div className={`rounded-xl p-12 text-center ${
          theme === 'dark'
            ? 'glass'
            : 'bg-slate-100 border border-slate-200'
        }`}>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Chưa có sản phẩm công khai nào</p>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'glass'
            : 'bg-white border border-slate-200 shadow-sm'
        }`}>
          {/* Main Swipe Container */}
          <div
            className="relative h-[600px] touch-pan-x"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderItem(allItems[currentIndex])}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className={`p-6 border-t transition-colors ${
            theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              {/* Up Button */}
              <button
                onClick={handlePrev}
                className={`p-3 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'glass hover:bg-slate-700/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Xem trước (vuốt xuống)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* Indicators */}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {currentIndex + 1} / {allItems.length}
                </span>
                <div className="flex gap-1">
                  {allItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`rounded-full transition-all ${
                        idx === currentIndex
                          ? 'bg-indigo-500 w-6 h-2'
                          : theme === 'dark'
                            ? 'bg-slate-600 w-2 h-2 hover:bg-slate-500'
                            : 'bg-slate-300 w-2 h-2 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Down Button */}
              <button
                onClick={handleNext}
                className={`p-3 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'glass hover:bg-slate-700/50'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Xem tiếp (vuốt lên)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Swipe Hint */}
            <div className={`text-center text-xs mt-4 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
            }`}>
              👆 Vuốt lên/xuống để xem tiếp theo (tất cả media)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
