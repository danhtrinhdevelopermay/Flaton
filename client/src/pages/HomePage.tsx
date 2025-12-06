import { Link } from 'react-router-dom'
import { Image, Video, Zap, Sparkles, ArrowRight, Star } from 'lucide-react'

const tools = [
  {
    id: 'nano-banana',
    name: 'Flaton Image V1',
    description: 'Tạo hình ảnh chất lượng cao - nhanh chóng, chính xác và tiết kiệm chi phí',
    credits: 4,
    category: 'image',
    provider: 'Flaton',
    featured: true,
  },
  {
    id: 'seedream',
    name: 'Flaton Image V2',
    description: 'Tạo hình ảnh 4K với độ chi tiết cao, hiển thị văn bản rõ nét và phong cách điện ảnh',
    credits: 6.5,
    category: 'image',
    provider: 'Flaton',
    featured: true,
  },
  {
    id: 'midjourney',
    name: 'Flaton Image Pro',
    description: 'Tạo hình ảnh nghệ thuật với phong cách đặc trưng, tạo ra 4 biến thể từ một prompt',
    credits: 8,
    category: 'image',
    provider: 'Flaton',
    featured: false,
  },
  {
    id: 'veo3-fast',
    name: 'Flaton Video V1',
    description: 'Tạo video nhanh chóng với chất lượng cao, hỗ trợ âm thanh đồng bộ trong video 8 giây',
    credits: 60,
    category: 'video',
    provider: 'Flaton',
    featured: true,
  },
  {
    id: 'midjourney-video',
    name: 'Flaton Video Pro',
    description: 'Chuyển đổi hình ảnh thành video 5 giây với chuyển động mượt mà và tự nhiên',
    credits: 40,
    category: 'video',
    provider: 'Flaton',
    featured: false,
  },
]

export default function HomePage() {
  const imageTools = tools.filter(t => t.category === 'image')
  const videoTools = tools.filter(t => t.category === 'video')

  return (
    <div className="fade-in">
      <section className="text-center py-12 md:py-20">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span className="text-indigo-400 font-medium">Powered by Flaton AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="gradient-text">Công cụ AI</span> mạnh mẽ
          <br />ngay trên trình duyệt
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          Tạo hình ảnh và video chất lượng cao với các mô hình AI tiên tiến nhất. 
          Đơn giản, nhanh chóng và hiệu quả về chi phí.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/image-generator"
            className="btn-primary px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2"
          >
            <Image className="w-5 h-5" />
            Tạo hình ảnh
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/video-generator"
            className="glass px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 hover:bg-slate-700/50 transition-all"
          >
            <Video className="w-5 h-5" />
            Tạo video
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="flex items-center gap-3 mb-8">
          <Image className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Công cụ tạo hình ảnh</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageTools.map((tool) => (
            <Link
              key={tool.id}
              to={`/image-generator?tool=${tool.id}`}
              className="glass rounded-2xl p-6 card-hover relative overflow-hidden group"
            >
              {tool.featured && (
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{tool.name}</h3>
                  <p className="text-sm text-slate-400">{tool.provider}</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4">{tool.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{tool.credits} credits</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="flex items-center gap-3 mb-8">
          <Video className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl md:text-3xl font-bold">Công cụ tạo video</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {videoTools.map((tool) => (
            <Link
              key={tool.id}
              to={`/video-generator?tool=${tool.id}`}
              className="glass rounded-2xl p-6 card-hover relative overflow-hidden group"
            >
              {tool.featured && (
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{tool.name}</h3>
                  <p className="text-sm text-slate-400">{tool.provider}</p>
                </div>
              </div>
              <p className="text-slate-300 mb-4">{tool.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{tool.credits} credits</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Tại sao chọn Flaton?</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Chi phí thấp</h3>
              <p className="text-slate-400">Tiết kiệm đến 60% so với các nền tảng khác với hệ thống tính phí theo credit linh hoạt</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Chất lượng cao</h3>
              <p className="text-slate-400">Sử dụng các mô hình AI độc quyền với nhiều phiên bản đa dạng</p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Dễ sử dụng</h3>
              <p className="text-slate-400">Giao diện đơn giản, trực quan - chỉ cần nhập mô tả và nhận kết quả ngay lập tức</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
