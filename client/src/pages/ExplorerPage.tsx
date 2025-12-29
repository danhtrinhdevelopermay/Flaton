import { useState, useEffect } from 'react';
import { Compass, Image, Video, Music, Loader2, Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface ExplorerData {
  images: any[];
  videos: any[];
  music: any[];
}

export default function ExplorerPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'music'>('images');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [isVerticalDrag, setIsVerticalDrag] = useState(false);

  useEffect(() => {
    fetchExplore();
  }, []);

  const fetchExplore = async () => {
    try {
      const response = await fetch('/api/products/explore');
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error('Failed to fetch explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (url: string) => {
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

  const getItems = () => {
    switch (activeTab) {
      case 'images':
        return data?.images || [];
      case 'videos':
        return data?.videos || [];
      case 'music':
        return data?.music || [];
      default:
        return [];
    }
  };

  const items = getItems();
  const maxIndex = Math.max(0, items.length - 1);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart(clientY);
    setIsVerticalDrag(true);
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
    setIsVerticalDrag(false);
  };

  const renderItem = (item: any) => {
    switch (activeTab) {
      case 'images':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-black/20 rounded-xl">
              <img src={item.image_url} alt={item.prompt} className="w-full h-full object-contain" />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.model}</p>
                <p className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.prompt}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
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
        );
      case 'videos':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <video src={item.video_url} controls className="w-full h-full object-contain" />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.model}</p>
                <p className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.prompt}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
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
        );
      case 'music':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <Music className="w-24 h-24 text-white opacity-50" />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <h3 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title || 'Untitled'}</h3>
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.model}</p>
                <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{item.prompt}</p>
                <audio src={item.audio_url} controls className="w-full mb-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
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

  const emptyMessage = {
    images: 'Chưa có hình ảnh công khai nào',
    videos: 'Chưa có video công khai nào',
    music: 'Chưa có nhạc công khai nào'
  };

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

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setActiveTab('images');
            setCurrentIndex(0);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'images'
              ? 'bg-indigo-500 text-white'
              : theme === 'dark'
                ? 'glass hover:bg-slate-700/50'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Image className="w-5 h-5" />
          Hình ảnh ({data?.images.length || 0})
        </button>
        <button
          onClick={() => {
            setActiveTab('videos');
            setCurrentIndex(0);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'videos'
              ? 'bg-purple-500 text-white'
              : theme === 'dark'
                ? 'glass hover:bg-slate-700/50'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Video className="w-5 h-5" />
          Video ({data?.videos.length || 0})
        </button>
        <button
          onClick={() => {
            setActiveTab('music');
            setCurrentIndex(0);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'music'
              ? 'bg-green-500 text-white'
              : theme === 'dark'
                ? 'glass hover:bg-slate-700/50'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Music className="w-5 h-5" />
          Nhạc ({data?.music.length || 0})
        </button>
      </div>

      {/* TikTok-style Vertical Swipe Viewer */}
      {items.length === 0 ? (
        <div className={`rounded-xl p-12 text-center ${
          theme === 'dark'
            ? 'glass'
            : 'bg-slate-100 border border-slate-200'
        }`}>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{emptyMessage[activeTab]}</p>
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
                {renderItem(items[currentIndex])}
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
                  {currentIndex + 1} / {items.length}
                </span>
                <div className="flex gap-1">
                  {items.map((_, idx) => (
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
              👆 Vuốt lên/xuống hoặc nhấn nút để xem tiếp theo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
