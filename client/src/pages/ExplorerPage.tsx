import { useState, useEffect } from 'react';
import { Compass, Image, Video, Music, Loader2, Share2 } from 'lucide-react';

interface ExplorerData {
  images: any[];
  videos: any[];
  music: any[];
}

export default function ExplorerPage() {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'music'>('images');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'images'
              ? 'bg-indigo-500 text-white'
              : 'glass hover:bg-slate-700/50'
          }`}
        >
          <Image className="w-5 h-5" />
          Hình ảnh ({data?.images.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'videos'
              ? 'bg-purple-500 text-white'
              : 'glass hover:bg-slate-700/50'
          }`}
        >
          <Video className="w-5 h-5" />
          Video ({data?.videos.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'music'
              ? 'bg-green-500 text-white'
              : 'glass hover:bg-slate-700/50'
          }`}
        >
          <Music className="w-5 h-5" />
          Nhạc ({data?.music.length || 0})
        </button>
      </div>

      {activeTab === 'images' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.images.map((item) => (
            <div key={item.id} className="glass rounded-xl overflow-hidden hover:scale-105 transition-transform">
              <img src={item.image_url} alt={item.prompt} className="w-full h-64 object-cover" />
              <div className="p-4">
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-sm line-clamp-2 mb-3">{item.prompt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  <button
                    onClick={() => handleShare(item.image_url)}
                    className="flex items-center gap-1 hover:text-indigo-400"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!data?.images || data.images.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có hình ảnh công khai nào
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid md:grid-cols-2 gap-6">
          {data?.videos.map((item) => (
            <div key={item.id} className="glass rounded-xl overflow-hidden hover:scale-105 transition-transform">
              <video src={item.video_url} controls className="w-full h-64 bg-black" />
              <div className="p-4">
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-sm line-clamp-2 mb-3">{item.prompt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  <button
                    onClick={() => handleShare(item.video_url)}
                    className="flex items-center gap-1 hover:text-purple-400"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!data?.videos || data.videos.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có video công khai nào
            </div>
          )}
        </div>
      )}

      {activeTab === 'music' && (
        <div className="grid md:grid-cols-2 gap-6">
          {data?.music.map((item) => (
            <div key={item.id} className="glass rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{item.title || 'Untitled'}</h3>
                  <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                  <p className="text-sm line-clamp-2 mb-3">{item.prompt}</p>
                  <audio src={item.audio_url} controls className="w-full mb-3" />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    <button
                      onClick={() => handleShare(item.audio_url)}
                      className="flex items-center gap-1 hover:text-green-400"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!data?.music || data.music.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có nhạc công khai nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
