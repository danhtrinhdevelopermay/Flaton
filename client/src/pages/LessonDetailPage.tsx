import { useState, useEffect } from 'react';
import { BookOpen, Loader2, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'slides' | 'workflow'>('script');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchLesson();
  }, [isAuthenticated]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setLesson(await response.json());
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/lessons/${id}/generate-script`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLesson({ ...lesson, script_content: data.script });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi sinh kịch bản');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSlides = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/lessons/${id}/generate-slides`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        alert('Slides đã được tạo!');
        fetchLesson();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi sinh slides');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{lesson?.title}</h1>
          <p className="text-slate-400">{lesson?.subject} - {lesson?.grade_level}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'script'
              ? 'bg-blue-500 text-white'
              : 'glass hover:bg-slate-700/50'
          }`}
        >
          Kịch bản
        </button>
        <button
          onClick={() => setActiveTab('slides')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'slides'
              ? 'bg-purple-500 text-white'
              : 'glass hover:bg-slate-700/50'
          }`}
        >
          Slides
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'workflow'
              ? 'bg-green-500 text-white'
              : 'glass hover:bg-slate-700/50'
          }`}
        >
          Quy trình
        </button>
      </div>

      {activeTab === 'script' && (
        <div className="glass rounded-xl p-8">
          {lesson?.script_content ? (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-300 mb-6">
                {lesson.script_content}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-6">Chưa có kịch bản. Nhấn nút dưới để sinh kịch bản từ AI.</p>
            </div>
          )}
          <button
            onClick={handleGenerateScript}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-medium transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang sinh kịch bản...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Sinh kịch bản với AI
              </>
            )}
          </button>
        </div>
      )}

      {activeTab === 'slides' && (
        <div className="glass rounded-xl p-8">
          <p className="text-slate-400 mb-6">Tạo slides từ kịch bản hiện tại</p>
          <button
            onClick={handleGenerateSlides}
            disabled={generating || !lesson?.script_content}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 text-white font-medium transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang sinh slides...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Sinh Slides
              </>
            )}
          </button>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="glass rounded-xl p-8">
          <p className="text-slate-400">Thiết lập quy trình tự động cho bài giảng này</p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center p-3 rounded-lg bg-slate-700/30 border border-slate-600">
              <span className="text-sm">1. Sinh kịch bản</span>
              <ChevronRight className="w-4 h-4 text-slate-500 mx-3" />
              <span className="text-sm">2. Sinh Slides</span>
              <ChevronRight className="w-4 h-4 text-slate-500 mx-3" />
              <span className="text-sm">3. Sinh hình ảnh</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
