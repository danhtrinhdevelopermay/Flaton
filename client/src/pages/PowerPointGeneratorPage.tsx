import { useState } from 'react';
import { Presentation, Loader2, Download, Wand2, Type, Image as ImageIcon, Move, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Rnd } from 'react-rnd';

export default function PowerPointGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Professional');
  const [imageSource, setImageSource] = useState('internet');
  const [generating, setGenerating] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { token } = useAuth();

  const handleGenerate = async () => {
    if (!prompt) return;
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
        body: JSON.stringify({ prompt, style, imageSource }),
      });

      const data = await response.json();
      if (response.ok) {
        const layoutSlides = data.slides.map((s: any) => {
          const slideElements = [
            { id: 'title', type: 'text', content: s.title, x: 50, y: 50, width: 700, height: 60, fontSize: 32, fontWeight: 'bold' },
            { id: 'content', type: 'text', content: Array.isArray(s.bullets) ? s.bullets.join('\n') : s.bullets, x: 50, y: 150, width: 400, height: 250, fontSize: 18, fontWeight: 'normal' }
          ];

          if (s.imageUrl) {
            slideElements.push({
              id: 'image',
              type: 'image',
              content: s.imageUrl,
              x: 480,
              y: 120,
              width: 280,
              height: 280
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <Presentation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Trình thiết kế Slide AI</h1>
            <p className="text-slate-400">Thiết kế và chỉnh sửa slide trực quan</p>
          </div>
        </div>
        
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

      {!slides.length ? (
        <div className="glass rounded-2xl p-8 max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Chủ đề bài thuyết trình</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Tương lai của AI trong giáo dục..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[120px]"
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
                <option value="Minimalist">Tối giản</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Thiết kế Slide
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-8 h-[700px]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-2 glass rounded-xl">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="Thêm Text"><Type className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="Thêm Ảnh"><ImageIcon className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className="text-sm font-medium text-slate-400">
                  Slide {currentSlideIndex + 1} / {slides.length}
                </div>
                <button 
                  onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl relative shadow-2xl overflow-auto p-12 flex justify-center items-start">
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

          <div className="flex flex-col gap-4 overflow-hidden bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className="font-bold text-slate-300 px-2 uppercase tracking-widest text-xs">Danh sách Slide</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-full aspect-video rounded-xl border-2 transition-all overflow-hidden relative group bg-slate-900 ${
                    currentSlideIndex === idx ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-700 hover:border-slate-600'
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
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] px-2 py-0.5 rounded text-white z-10">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
