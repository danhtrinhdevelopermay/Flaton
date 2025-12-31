import { useState, useRef } from 'react';
import { FileText, Loader2, Download, Wand2 } from 'lucide-react';
import WaterDropAnimation from '../components/WaterDropAnimation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function WordGeneratorPage() {
  const [content, setContent] = useState('');
  const [contentLink, setContentLink] = useState('');
  const [useLink, setUseLink] = useState(false);
  const [addImages, setAddImages] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [showWaterDrop, setShowWaterDrop] = useState(false);
  const generateButtonRef = useRef<HTMLButtonElement>(null);
  const loadingAreaRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { token, isAuthenticated } = useAuth();

  const handleGenerate = async () => {
    if (!isAuthenticated || !token) {
      alert('Vui lòng đăng nhập trước');
      return;
    }

    if (!content && !contentLink) {
      alert('Vui lòng nhập nội dung hoặc link');
      return;
    }

    setShowWaterDrop(true);
    setTimeout(() => setShowWaterDrop(false), 1200);
    setGenerating(true);
    setDownloadUrl('');

    try {
      const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: useLink ? contentLink : content,
          isLink: useLink,
          addImages: addImages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Lỗi tạo file Word');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Auto-download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      alert('Tạo file Word thành công!');
    } catch (error) {
      console.error('Error:', error);
      alert('Đã xảy ra lỗi');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fade-in">
      <WaterDropAnimation 
        isActive={showWaterDrop}
        fromButton={generateButtonRef}
        toLoading={loadingAreaRef}
      />
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Word Generator
          </h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            Tạo tài liệu Word bằng AI từ nội dung hoặc link
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`rounded-xl transition-colors ${
        theme === 'dark'
          ? 'glass'
          : 'bg-white border border-slate-200 shadow-sm'
      } p-6 md:p-8`}>
        {/* Input Mode Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setUseLink(false)}
            className={`px-4 py-2 rounded-lg transition-all ${
              !useLink
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                  ? 'glass hover:bg-slate-700/50'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📝 Nhập Nội Dung
          </button>
          <button
            onClick={() => setUseLink(true)}
            className={`px-4 py-2 rounded-lg transition-all ${
              useLink
                ? 'bg-blue-500 text-white'
                : theme === 'dark'
                  ? 'glass hover:bg-slate-700/50'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🔗 Dán Link
          </button>
        </div>

        {/* Input Area */}
        {!useLink ? (
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Nội dung
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung bạn muốn tạo thành tài liệu Word..."
              className={`w-full h-48 p-4 rounded-lg border transition-colors resize-none ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            />
          </div>
        ) : (
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Link đến tài liệu
            </label>
            <input
              type="url"
              value={contentLink}
              onChange={(e) => setContentLink(e.target.value)}
              placeholder="https://example.com hoặc link Google Docs, Wikipedia, etc..."
              className={`w-full p-4 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            />
            <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
              AI sẽ tổng hợp nội dung từ link và tạo tài liệu Word chuyên nghiệp
            </p>
          </div>
        )}

        {/* Add Images Option */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            id="addImages"
            checked={addImages}
            onChange={(e) => setAddImages(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          />
          <label htmlFor="addImages" className={`text-sm font-medium cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            ✨ Thêm ảnh từ Pexels (AI sẽ tự chọn ảnh phù hợp)
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            generating
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Tạo Tài Liệu Word
            </>
          )}
        </button>

        {/* Download Section */}
        {downloadUrl && (
          <div className={`mt-6 p-4 rounded-lg ${
            theme === 'dark'
              ? 'bg-green-500/20 border border-green-500/30'
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                <p className="font-medium">✅ Tài liệu Word đã sẵn sàng!</p>
                <p className="text-sm">Nhấn nút dưới để tải về máy</p>
              </div>
              <a
                href={downloadUrl}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Tải Xuống
              </a>
            </div>
          </div>
        )}

        {/* Info */}
        <div className={`mt-8 p-4 rounded-lg ${
          theme === 'dark'
            ? 'bg-slate-900/50 border border-slate-700'
            : 'bg-slate-50 border border-slate-200'
        }`}>
          <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            💡 Cách sử dụng:
          </h3>
          <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            <li>✓ Nhập nội dung hoặc dán link tới tài liệu web</li>
            <li>✓ AI sẽ tổng hợp và định dạng thành tài liệu Word chuyên nghiệp</li>
            <li>✓ Tải file Word về máy và chỉnh sửa theo ý muốn</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
