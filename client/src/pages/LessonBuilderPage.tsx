import { useState } from 'react';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LessonBuilderPage() {
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    gradeLevel: '',
    duration: '45',
    objectives: [''],
    teachingStyle: 'interactive',
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleAddObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, ''],
    });
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({
      ...formData,
      objectives: newObjectives,
    });
  };

  const handleCreateLesson = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          objectives: formData.objectives.filter((obj) => obj.trim()),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStep('success');
        setTimeout(() => {
          navigate(`/lessons/${data.id}`);
        }, 2000);
      } else {
        console.error('Error creating lesson');
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tạo Bài Giảng</h1>
          <p className="text-slate-400">Thiết kế bài giảng tự động với AI</p>
        </div>
      </div>

      {step === 'input' && (
        <div className="glass rounded-xl p-8 max-w-2xl">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Tiêu đề bài giảng</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ví dụ: Photosynthesis - Quang hợp"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Subject & Grade */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Môn học</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ví dụ: Sinh học"
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cấp học</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Chọn cấp học</option>
                  <option value="elementary">Tiểu học</option>
                  <option value="middle">THCS</option>
                  <option value="high">THPT</option>
                  <option value="college">Đại học</option>
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">Thời lượng (phút)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                min="15"
                max="180"
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Learning Objectives */}
            <div>
              <label className="block text-sm font-medium mb-2">Mục tiêu học tập</label>
              <div className="space-y-2">
                {formData.objectives.map((obj, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={obj}
                    onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                    placeholder={`Mục tiêu ${idx + 1}`}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                ))}
                <button
                  onClick={handleAddObjective}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  + Thêm mục tiêu
                </button>
              </div>
            </div>

            {/* Teaching Style */}
            <div>
              <label className="block text-sm font-medium mb-2">Phong cách giảng dạy</label>
              <select
                value={formData.teachingStyle}
                onChange={(e) => setFormData({ ...formData, teachingStyle: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="interactive">Tương tác</option>
                <option value="formal">Chính thức</option>
                <option value="casual">Thân thiện</option>
                <option value="socratic">Socratic</option>
              </select>
            </div>

            <button
              onClick={() => setStep('review')}
              disabled={!formData.title || !formData.subject || !formData.gradeLevel}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-medium transition-colors"
            >
              Tiếp tục
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="glass rounded-xl p-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Xác nhận thông tin bài giảng</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Tiêu đề:</span>
              <span className="font-medium">{formData.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Môn học:</span>
              <span className="font-medium">{formData.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cấp học:</span>
              <span className="font-medium">{formData.gradeLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Thời lượng:</span>
              <span className="font-medium">{formData.duration} phút</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-2">Mục tiêu học tập:</span>
              <ul className="space-y-1">
                {formData.objectives.map(
                  (obj, idx) =>
                    obj && (
                      <li key={idx} className="text-sm">
                        • {obj}
                      </li>
                    )
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('input')}
              className="flex-1 px-6 py-3 rounded-lg glass hover:bg-slate-700/50 text-white font-medium transition-colors"
            >
              Quay lại
            </button>
            <button
              onClick={handleCreateLesson}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo bài giảng'
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="glass rounded-xl p-8 max-w-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Tạo bài giảng thành công!</h2>
          <p className="text-slate-400 mb-6">Đang chuyển hướng tới bài giảng của bạn...</p>
          <div className="animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
          </div>
        </div>
      )}
    </div>
  );
}
