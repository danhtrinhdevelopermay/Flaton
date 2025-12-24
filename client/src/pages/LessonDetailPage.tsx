import { useState, useEffect } from 'react';
import { BookOpen, Loader2, ChevronRight, Plus, Trash2, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import WorkflowBuilder from '../components/WorkflowBuilder';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'slides' | 'workflow'>('script');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchLesson();
    if (id) fetchWorkflows();
  }, [isAuthenticated, id]);

  const fetchWorkflows = async () => {
    if (!id) return;
    setWorkflowsLoading(true);
    try {
      const response = await fetch(`/api/lessons/${id}/workflows`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setWorkflowsLoading(false);
    }
  };

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
      const data = await response.json();
      if (response.ok) {
        setLesson({ ...lesson, script_content: data.script });
        alert('Kịch bản đã được sinh thành công!');
      } else {
        alert(`Lỗi: ${data.error || 'Không thể sinh kịch bản'}`);
        console.error('Generate script error:', data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối: ' + (error instanceof Error ? error.message : 'Không xác định'));
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
      const data = await response.json();
      if (response.ok) {
        alert('Slides đã được tạo thành công!');
        fetchLesson();
      } else {
        alert(`Lỗi: ${data.error || 'Không thể sinh slides'}`);
        console.error('Generate slides error:', data);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi kết nối: ' + (error instanceof Error ? error.message : 'Không xác định'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa quy trình này?')) return;
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchWorkflows();
        alert('Quy trình đã xóa!');
      }
    } catch (error) {
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không xác định'));
    }
  };

  const handleExecuteWorkflow = async (workflow: any) => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/lessons/${id}/workflows/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: workflow.config?.steps || [],
          config: workflow.config?.config || {},
        }),
      });
      if (response.ok) {
        alert('Quy trình đã chạy thành công!');
      } else {
        const err = await response.json();
        alert('Lỗi: ' + err.error);
      }
    } catch (error) {
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Không xác định'));
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
        <div className="space-y-6">
          {/* Workflow Builder */}
          <WorkflowBuilder lessonId={id || ''} onWorkflowSave={fetchWorkflows} />

          {/* Saved Workflows */}
          <div className="glass rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4">Các quy trình đã lưu</h3>
            {workflowsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : workflows.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Chưa có quy trình nào</p>
            ) : (
              <div className="space-y-3">
                {workflows.map((workflow: any) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div>
                      <p className="font-medium text-white">{workflow.name}</p>
                      <p className="text-sm text-slate-400">
                        {workflow.config?.steps?.length || 0} bước
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExecuteWorkflow(workflow)}
                        disabled={generating}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm disabled:opacity-50"
                      >
                        <Play size={16} />
                        Chạy
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm"
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
