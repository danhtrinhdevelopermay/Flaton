import { useState } from 'react';
import { Presentation, Loader2, Download, Wand2, Layout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PowerPointGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { token } = useAuth();

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, style }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Lỗi khi tạo slide');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = () => {
    if (!result?.file) return;
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${result.file}`;
    link.download = result.fileName || 'presentation.pptx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
          <Presentation className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Tạo Slide PowerPoint</h1>
          <p className="text-slate-400">Tự động tạo bài thuyết trình chuyên nghiệp với Gemini AI</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Chủ đề hoặc Nội dung chi tiết</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Lịch sử phát triển của Trí tuệ nhân tạo, bao gồm các mốc quan trọng và tương lai..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phong cách</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="Professional">Chuyên nghiệp</option>
                  <option value="Creative">Sáng tạo</option>
                  <option value="Educational">Giáo dục</option>
                  <option value="Minimalist">Tối giản</option>
                  <option value="Modern Corporate">Doanh nghiệp hiện đại</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang tạo slide...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Bắt đầu tạo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className="glass border-green-500/30 rounded-2xl p-6 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Presentation className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Hoàn tất!</h3>
                  <p className="text-slate-400 text-sm">File PowerPoint của bạn đã sẵn sàng</p>
                </div>
              </div>
              <button
                onClick={downloadFile}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" />
                Tải xuống .pptx
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-orange-400">
              <Layout className="w-5 h-5" />
              Hướng dẫn
            </h2>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">1.</span>
                Nhập chủ đề hoặc dán nội dung kịch bản bạn muốn chuyển thành slide.
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">2.</span>
                AI sẽ tự động tìm kiếm hình ảnh minh họa từ Unsplash và chèn vào slide.
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 font-bold">3.</span>
                Giao diện, phông chữ và bố cục sẽ được tối ưu hóa theo phong cách bạn chọn.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}