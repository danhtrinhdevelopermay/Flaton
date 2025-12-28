import { useState, useEffect } from 'react';
import { BookOpen, Plus, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LessonsListPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchLessons();
  }, [isAuthenticated]);

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này? Tất cả nội dung và quy trình liên quan sẽ bị xóa.')) {
      return;
    }

    setDeletingId(lessonId);
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setLessons(lessons.filter(l => l.id !== lessonId));
      } else {
        const data = await response.json();
        alert(`Lỗi: ${data.error || 'Không thể xóa bài giảng'}`);
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Đã xảy ra lỗi khi xóa bài giảng');
    } finally {
      setDeletingId(null);
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Bài Giảng của Tôi</h1>
            <p className="text-slate-400">Quản lý và chỉnh sửa các bài giảng</p>
          </div>
        </div>
        <Link
          to="/lesson-builder"
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tạo bài giảng
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-6">Chưa có bài giảng nào</p>
          <Link
            to="/lesson-builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tạo bài giảng đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lessons/${lesson.id}`}
              className="glass rounded-xl p-6 hover:bg-slate-700/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-slate-700 text-xs font-medium text-slate-300">
                    {lesson.status}
                  </span>
                  <button
                    onClick={(e) => handleDeleteLesson(e, lesson.id)}
                    disabled={deletingId === lesson.id}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    title="Xóa bài giảng"
                  >
                    {deletingId === lesson.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors">{lesson.title}</h3>
              <p className="text-sm text-slate-400 mb-3">{lesson.subject}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{lesson.grade_level}</span>
                <span>•</span>
                <span>{lesson.duration_minutes} phút</span>
              </div>
              {lesson.script_content && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-green-400">✓ Kịch bản đã sinh</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
