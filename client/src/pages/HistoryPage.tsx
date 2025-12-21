import { useState, useEffect } from 'react';
import { History, Image, Video, Music, Loader2, Download, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HistoryData {
  images: any[];
  videos: any[];
  music: any[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'music'>('images');
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchHistory();
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/products/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const handlePublish = async (type: 'image' | 'video' | 'music', id: number) => {
    try {
      const response = await fetch('/api/products/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, id })
      });

      if (response.ok) {
        alert('Đã đăng công khai sản phẩm!');
        fetchHistory();
      } else {
        alert('Lỗi khi đăng sản phẩm');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Lỗi khi đăng sản phẩm');
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
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lịch sử tạo</h1>
          <p className="text-slate-400">Xem lại các sản phẩm đã tạo</p>
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
          Hình ảnh ({history?.images.length || 0})
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
          Video ({history?.videos.length || 0})
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
          Nhạc ({history?.music.length || 0})
        </button>
      </div>

      {activeTab === 'images' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history?.images.map((item) => (
            <div key={item.id} className="glass rounded-xl overflow-hidden">
              <img src={item.image_url} alt={item.prompt} className="w-full h-64 object-cover" />
              <div className="p-4">
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-sm line-clamp-2 mb-3">{item.prompt}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    <button
                      onClick={() => handleDownload(item.image_url, `image-${item.id}.png`)}
                      className="flex items-center gap-1 hover:text-indigo-400"
                    >
                      <Download className="w-4 h-4" />
                      Tải về
                    </button>
                  </div>
                  {!item.is_public && (
                    <button
                      onClick={() => handlePublish('image', item.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Đăng công khai
                    </button>
                  )}
                  {item.is_public && (
                    <div className="w-full text-center py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                      ✓ Đã đăng công khai
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!history?.images || history.images.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có hình ảnh nào
            </div>
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid md:grid-cols-2 gap-6">
          {history?.videos.map((item) => (
            <div key={item.id} className="glass rounded-xl overflow-hidden">
              <video src={item.video_url} controls className="w-full h-64 bg-black" />
              <div className="p-4">
                <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                <p className="text-sm line-clamp-2 mb-3">{item.prompt}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    <button
                      onClick={() => handleDownload(item.video_url, `video-${item.id}.mp4`)}
                      className="flex items-center gap-1 hover:text-purple-400"
                    >
                      <Download className="w-4 h-4" />
                      Tải về
                    </button>
                  </div>
                  {!item.is_public && (
                    <button
                      onClick={() => handlePublish('video', item.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Đăng công khai
                    </button>
                  )}
                  {item.is_public && (
                    <div className="w-full text-center py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                      ✓ Đã đăng công khai
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!history?.videos || history.videos.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có video nào
            </div>
          )}
        </div>
      )}

      {activeTab === 'music' && (
        <div className="grid md:grid-cols-2 gap-6">
          {history?.music.map((item) => (
            <div key={item.id} className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{item.title || 'Untitled'}</h3>
                  <p className="text-sm text-slate-400 mb-2">{item.model}</p>
                  <p className="text-sm line-clamp-2 mb-3">{item.prompt}</p>
                  <audio src={item.audio_url} controls className="w-full mb-3" />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                      <button
                        onClick={() => handleDownload(item.audio_url, `music-${item.id}.mp3`)}
                        className="flex items-center gap-1 hover:text-green-400"
                      >
                        <Download className="w-4 h-4" />
                        Tải về
                      </button>
                    </div>
                    {!item.is_public && (
                      <button
                        onClick={() => handlePublish('music', item.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Đăng công khai
                      </button>
                    )}
                    {item.is_public && (
                      <div className="w-full text-center py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                        ✓ Đã đăng công khai
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!history?.music || history.music.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              Chưa có nhạc nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
