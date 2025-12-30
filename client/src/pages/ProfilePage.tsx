import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileItem {
  id: string;
  type: 'image' | 'video' | 'music';
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  prompt: string;
  model: string;
  title?: string;
  created_at: string;
}

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  created_at: string;
  itemCount: number;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setItems(data.items || []);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>Profile không tìm thấy</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`sticky top-20 z-40 backdrop-blur-xl border-b transition-colors ${
        theme === 'dark' ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 mb-4 transition-colors ${
              theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </div>

      {/* Profile Header - TikTok Style */}
      <div className={`sticky top-36 z-30 backdrop-blur-xl border-b transition-colors ${
        theme === 'dark' ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold transition-colors ${
              theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {profile.email.charAt(0).toUpperCase()}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {profile.name || profile.email}
              </h1>
              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                @{profile.email.split('@')[0]}
              </p>
              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="font-semibold">{profile.itemCount}</span> bài đăng
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                Tham gia từ {new Date(profile.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid - TikTok Style Vertical */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          <div className={`text-center py-20 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            <p>Chưa có bài đăng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`group rounded-xl overflow-hidden transition-all hover:scale-105 ${
                  theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-white hover:bg-slate-100'
                } border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-square bg-black/20 overflow-hidden">
                  {item.type === 'image' && (
                    <img src={item.image_url} alt={item.prompt} className="w-full h-full object-cover" />
                  )}
                  {item.type === 'video' && (
                    <video src={item.video_url} className="w-full h-full object-cover" />
                  )}
                  {item.type === 'music' && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎵</div>
                        <p className="text-white font-semibold text-sm">{item.title || 'Nhạc'}</p>
                      </div>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    {item.type === 'image' && (
                      <div className="px-3 py-1 rounded-full bg-indigo-500/90 text-white text-xs font-medium">
                        🖼️ Ảnh
                      </div>
                    )}
                    {item.type === 'video' && (
                      <div className="px-3 py-1 rounded-full bg-purple-500/90 text-white text-xs font-medium">
                        🎬 Video
                      </div>
                    )}
                    {item.type === 'music' && (
                      <div className="px-3 py-1 rounded-full bg-pink-500/90 text-white text-xs font-medium">
                        🎵 Nhạc
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className={`text-sm font-medium mb-2 line-clamp-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {item.prompt}
                  </p>
                  <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {item.model}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Sản phẩm AI',
                            text: item.prompt,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Đã sao chép!');
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
