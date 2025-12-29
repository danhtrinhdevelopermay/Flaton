import { useState, useEffect } from 'react';
import { Compass, Image, Video, Music, Loader2, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragStart(clientX);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = dragStart - clientX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const renderItem = (item: any) => {
    switch (activeTab) {
      case 'images':
        return (
          <div className="w-full h-full flex flex-col">
            <img src={item.image_url} alt={item.prompt} className="w-full h-96 object-cover rounded-xl" />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-lg font-semibold mb-3">{item.prompt}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
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
            <video src={item.video_url} controls className="w-full h-96 bg-black rounded-xl" />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-lg font-semibold mb-3">{item.prompt}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
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
            <div className="w-full h-96 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Music className="w-24 h-24 text-white opacity-50" />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-semibold mb-2">{item.title || 'Untitled'}</h3>
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-lg mb-4">{item.prompt}</p>
                <audio src={item.audio_url} controls className="w-full mb-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Explorer</h1>
          <p className="text-slate-400">Khám phá các sản phẩm AI được chia sẻ công khai</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
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

      {items.length === 0 ? (
        <div className={`rounded-xl p-12 text-center ${
          theme === 'dark'
            ? 'glass'
            : 'bg-slate-100 border border-slate-200'
        }`}>
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{emptyMessage[activeTab]}</p>
        </div>
      ) : (
        <div className={`rounded-xl p-6 overflow-hidden ${
          theme === 'dark'
            ? 'glass'
            : 'bg-white border border-slate-200 shadow-sm'
        }`}>
          <div
            className="relative touch-pan-y"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="min-h-[600px]"
              >
                {renderItem(items[currentIndex])}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className={`flex items-center justify-between mt-6 pt-6 border-t ${
            theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <button
              onClick={handlePrev}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'glass hover:bg-slate-700/50'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Trước
            </button>

            <div className="flex items-center gap-2">
              <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                {currentIndex + 1} / {items.length}
              </span>
              <div className="flex gap-1">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-indigo-500 w-6' : theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'glass hover:bg-slate-700/50'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sau
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
