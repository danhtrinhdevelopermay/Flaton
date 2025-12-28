import { useState } from 'react';
import { Presentation, Loader2, Download, Wand2, Layout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PowerPointGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Professional');
  const [imageSource, setImageSource] = useState('internet');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const { token } = useAuth();

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setResult(null);
    setSlides([]);

    try {
      const response = await fetch('/api/generate-pptx-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, style, imageSource }),
      });

      const data = await response.json();
      if (response.ok) {
        setSlides(data.slides);
        setResult({ slides: data.slides });
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

  const handleSlideChange = (index: number, field: string, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const generateFinalPPTX = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/export-pptx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ slides, style, imageSource }),
      });

      const data = await response.json();
      if (response.ok) {
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${data.file}`;
        link.download = data.fileName || 'presentation.pptx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || 'Lỗi khi xuất file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = () => {
    generateFinalPPTX();
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nguồn ảnh</label>
                <select
                  value={imageSource}
                  onChange={(e) => setImageSource(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="internet">Ảnh trên Internet (Unsplash)</option>
                  <option value="ai">Ảnh tạo bởi AI (Flaton Image V1)</option>
                </select>
              </div>
              <div className="flex items-end md:col-span-2">
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

          {slides.length > 0 && (
            <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layout className="w-6 h-6 text-orange-500" />
                Chỉnh sửa Slide
              </h2>
              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <div key={index} className="glass rounded-2xl p-6 space-y-4 border-slate-700 hover:border-orange-500/50 transition-colors">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                      <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-bold">Slide {index + 1}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Tiêu đề Slide</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Nội dung (Phân cách bằng dấu xuống dòng)</label>
                      <textarea
                        value={Array.isArray(slide.bullets) ? slide.bullets.join('\n') : slide.bullets}
                        onChange={(e) => handleSlideChange(index, 'bullets', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[100px] text-sm leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass border-green-500/30 rounded-2xl p-6 flex items-center justify-between sticky bottom-4 z-10 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Presentation className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Xong rồi!</h3>
                    <p className="text-slate-400 text-sm">Tải bản PowerPoint đã chỉnh sửa</p>
                  </div>
                </div>
                <button
                  onClick={generateFinalPPTX}
                  disabled={generating}
                  className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Xuất & Tải PPTX
                </button>
              </div>
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