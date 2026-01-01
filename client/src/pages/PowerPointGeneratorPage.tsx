import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Presentation, Loader2, Download, Wand2, Type, Image as ImageIcon, Move, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import WaterDropAnimation from '../components/WaterDropAnimation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Rnd } from 'react-rnd';

export default function PowerPointGeneratorPage() {
  const [searchParams] = useSearchParams()
  const [prompt, setPrompt] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Professional');
  const { theme } = useTheme();
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showWaterDrop, setShowWaterDrop] = useState(false);
  const generateButtonRef = useRef<HTMLButtonElement>(null);
  const loadingAreaRef = useRef<HTMLDivElement>(null);
  const { token, isAuthenticated, user, refreshUser } = useAuth();

  // Refresh user data on mount to check for Pro status updates
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const autoPrompt = searchParams.get('autoPrompt')
    if (autoPrompt) {
      setPrompt(autoPrompt)
    }
  }, [searchParams])

  useEffect(() => {
    const autoPrompt = searchParams.get('autoPrompt')
    if (autoPrompt && !generating) {
      setTimeout(() => {
        handleGenerate()
      }, 800)
    }
  }, [])

  const templates = [
    {
      id: 'Professional',
      name: 'Chuyên nghiệp',
      description: 'Lịch lãm, tin cậy với tông màu xanh navy và xám.',
      preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
      color: '#1e3c58'
    },
    {
      id: 'Creative',
      name: 'Sáng tạo',
      description: 'Năng động, nổi bật với nền tối và điểm nhấn vàng.',
      preview: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
      color: '#ffd166'
    },
    {
      id: 'Minimalist',
      name: 'Tối giản',
      description: 'Sạch sẽ, tinh tế tập trung tối đa vào nội dung.',
      preview: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2067&auto=format&fit=crop',
      color: '#ffffff'
    },
    {
      id: 'FloralPink',
      name: 'Hồng Nhẹ Nhàng',
      description: 'Phong cách sơ yếu lý lịch, tươi mới với họa tiết hoa anh đào.',
      preview: 'https://png.pngtree.com/thumb_back/fh260/back_pic/04/16/32/495826f01a37c04.jpg',
      color: '#ffb7c5'
    }
  ];

  const handleGenerateFromHtml = async () => {
    if (!htmlContent) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/generate/pptx-from-raw-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ htmlContent }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'presentation_from_html.pptx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setShowHtmlModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Lỗi khi xuất file từ HTML');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setShowWaterDrop(true);
    setTimeout(() => setShowWaterDrop(false), 1200);
    setGenerating(true);
    setSlides([]);
    setCurrentSlideIndex(0);

    try {
      const response = await fetch('/api/generate-pptx-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, style: selectedTemplate }),
      });

      const data = await response.json();
      if (response.ok) {
        const layoutSlides = data.slides.map((s: any, index: number) => {
          const slideElements = [
            { id: `title-${index}`, type: 'text', content: s.title, x: 50, y: 50, width: 700, height: 60, fontSize: 32, fontWeight: 'bold' },
            { id: `content-${index}`, type: 'text', content: Array.isArray(s.bullets) ? s.bullets.join('\n') : s.bullets, x: 50, y: 150, width: 400, height: 250, fontSize: 18, fontWeight: 'normal' }
          ];

          if (s.imageUrl) {
            slideElements.push({
              id: `image-${index}`,
              type: 'image',
              content: s.imageUrl,
              x: 480,
              y: 120,
              width: 280,
              height: 280,
              fontSize: 0,
              fontWeight: 'normal'
            });
          }

          return {
            ...s,
            elements: slideElements
          };
        });
        setSlides(layoutSlides);
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

  const updateElement = (slideIndex: number, elementId: string, updates: any) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      const slide = { ...newSlides[slideIndex] };
      slide.elements = slide.elements.map((el: any) => 
        el.id === elementId ? { ...el, ...updates } : el
      );
      newSlides[slideIndex] = slide;
      return newSlides;
    });
  };

  const generateFinalPPTX = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate/pptx-from-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          slides: slides.map(s => ({
            title: s.elements.find((el: any) => el.id === 'title')?.content || s.title,
            content: (s.elements.find((el: any) => el.id === 'content')?.content || '').split('\n').filter((p: string) => p.trim())
          }))
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'presentation.pptx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        alert(data.error || 'Lỗi khi xuất file');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto py-8 px-4 fade-in ${theme === 'light' ? 'bg-white/50' : ''}`}>
      <WaterDropAnimation 
        isActive={showWaterDrop}
        fromButton={generateButtonRef}
        toLoading={loadingAreaRef}
      />
      
      {showHtmlModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-orange-500" />
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Nhập mã HTML/CSS</h2>
              </div>
              <button onClick={() => setShowHtmlModal(false)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">✕</button>
            </div>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Dán mã HTML/CSS chứa nội dung bài giảng của bạn vào đây. AI sẽ tự động tách slide và tạo file PPTX.</p>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Paste <html> or CSS/HTML snippets here..."
              className={`w-full h-64 border rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowHtmlModal(false)}
                className={`px-6 py-2 rounded-xl font-medium ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateFromHtml}
                disabled={generating || !htmlContent}
                className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Tạo PowerPoint ngay
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <Presentation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Trình thiết kế Slide AI</h1>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Thiết kế và chỉnh sửa slide trực quan</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowHtmlModal(true)}
            className={`flex items-center gap-2 px-5 py-3 border-2 rounded-xl font-bold transition-all shadow-md ${
              theme === 'dark' 
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100' 
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
            }`}
          >
            <Code className="w-5 h-5" />
            Nhập HTML
          </button>
          {slides.length > 0 && (
            <button
              onClick={generateFinalPPTX}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Xuất PPTX
            </button>
          )}
        </div>
      </div>

      {!slides.length ? (
        <div className={`rounded-2xl p-8 max-w-2xl mx-auto space-y-6 ${theme === 'dark' ? 'glass' : 'bg-white shadow-lg border border-slate-200'}`}>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Chủ đề bài thuyết trình</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Tương lai của AI trong giáo dục..."
              className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[120px] transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-700 text-slate-100 placeholder-slate-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white'
              }`}
            />
          </div>

          <div className="space-y-4">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Chọn mẫu Slide có sẵn</label>
            <div className="grid grid-cols-3 gap-4">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`group relative flex flex-col gap-2 p-2 rounded-xl border-2 transition-all ${
                    selectedTemplate === t.id 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      : 'border-slate-200 bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                    <img src={t.preview} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{t.name}</span>
                    <span className={`text-[10px] line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.description}</span>
                  </div>
                  {selectedTemplate === t.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Wand2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center pt-4">
            <button
              ref={generateButtonRef}
              onClick={handleGenerate}
              disabled={generating || !prompt}
              className="w-full max-w-xs bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95"
            >
              {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
              Bắt đầu thiết kế ngay
            </button>
          </div>
        </div>
      ) : (
        <div ref={loadingAreaRef} className="grid lg:grid-cols-[1fr_300px] gap-8 h-[700px]">
          <div className="flex flex-col gap-4">
            <div className={`flex items-center justify-between px-4 py-2 rounded-xl ${
              theme === 'dark' 
                ? 'glass' 
                : 'bg-slate-100 border border-slate-200'
            }`}>
              <div className="flex gap-2">
                <button className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-slate-700 text-slate-300'
                    : 'hover:bg-slate-200 text-slate-600'
                }`} title="Thêm Text"><Type className="w-5 h-5" /></button>
                <button className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-slate-700 text-slate-300'
                    : 'hover:bg-slate-200 text-slate-600'
                }`} title="Thêm Ảnh"><ImageIcon className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className={`p-1 rounded disabled:opacity-30 ${
                    theme === 'dark'
                      ? 'hover:bg-slate-700'
                      : 'hover:bg-slate-200'
                  }`}
                >
                  <ChevronLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-600'}`} />
                </button>
                <div className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Slide {currentSlideIndex + 1} / {slides.length}
                </div>
                <button 
                  onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className={`p-1 rounded disabled:opacity-30 ${
                    theme === 'dark'
                      ? 'hover:bg-slate-700'
                      : 'hover:bg-slate-200'
                  }`}
                >
                  <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-600'}`} />
                </button>
              </div>
            </div>

            <div className={`flex-1 border rounded-2xl relative shadow-2xl overflow-auto p-12 flex justify-center items-start ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-50 border-slate-300'
            }`}>
              <div 
                className="bg-white rounded shadow-2xl relative shrink-0" 
                style={{ width: '800px', height: '450px' }}
              >
                {slides[currentSlideIndex].elements.map((el: any) => (
                  <Rnd
                    key={el.id}
                    size={{ width: el.width, height: el.height }}
                    position={{ x: el.x, y: el.y }}
                    onDragStop={(e, d) => updateElement(currentSlideIndex, el.id, { x: d.x, y: d.y })}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      updateElement(currentSlideIndex, el.id, {
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        ...position
                      });
                    }}
                    bounds="parent"
                    className="group"
                  >
                    <div className="w-full h-full relative border-2 border-transparent hover:border-blue-500 transition-colors">
                      <div className="absolute -top-6 left-0 hidden group-hover:flex items-center gap-1 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded shadow">
                        <Move className="w-3 h-3" /> Chỉnh sửa
                      </div>
                      {el.type === 'text' ? (
                        <textarea
                          value={el.content}
                          onChange={(e) => updateElement(currentSlideIndex, el.id, { content: e.target.value })}
                          className="w-full h-full p-2 bg-transparent resize-none focus:outline-none border-none text-slate-900 overflow-hidden leading-snug"
                          style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight }}
                        />
                      ) : (
                        <div className="w-full h-full overflow-hidden rounded-lg shadow-inner bg-slate-100 border border-slate-200">
                          <img 
                            src={el.content} 
                            alt="Slide element" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = 'https://placehold.co/600x400?text=Image+Load+Error';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </Rnd>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex flex-col gap-4 overflow-hidden p-4 rounded-2xl border ${
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-slate-100 border-slate-200'
          }`}>
            <h3 className={`font-bold px-2 uppercase tracking-widest text-xs ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>Danh sách Slide</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-full aspect-video rounded-xl border-2 transition-all overflow-hidden relative group ${
                    theme === 'dark' ? 'bg-slate-900' : 'bg-white'
                  } ${
                    currentSlideIndex === idx ? 'border-orange-500 ring-2 ring-orange-500/20' : theme === 'dark' ? 'border-slate-700 hover:border-slate-600' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="absolute inset-0 bg-white origin-top-left scale-[0.25] pointer-events-none opacity-80">
                     {slide.elements.map((el: any) => (
                       <div 
                         key={el.id} 
                         style={{ 
                           position: 'absolute', 
                           left: el.x, 
                           top: el.y, 
                           width: el.width, 
                           height: el.height,
                           backgroundColor: el.id === 'title' ? '#cbd5e1' : '#f1f5f9',
                           borderRadius: '4px'
                         }}
                       />
                     ))}
                  </div>
                  <div className={`absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded z-10 ${
                    theme === 'dark'
                      ? 'bg-slate-900/80 text-white'
                      : 'bg-slate-800 text-white'
                  }`}>
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {isAuthenticated && user && !user.is_pro && <div className="hidden">Free Mode Active</div>}
    </div>
  );
}
