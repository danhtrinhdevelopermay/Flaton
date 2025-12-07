import { Link } from 'react-router-dom'
import { Image, Video, Zap, Sparkles, ArrowRight, Star } from 'lucide-react'
import { 
  AnimatedCard, 
  ScrollReveal, 
  FloatingElements, 
  AnimatedButton,
  Floating3DShape,
  GlowingOrb
} from '../components/animations'

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
    <div className="relative overflow-hidden">
      <FloatingElements />
      
      <Floating3DShape 
        type="cube" 
        size={60} 
        color="rgba(99, 102, 241, 0.3)" 
        position={{ top: '10%', left: '5%' }}
        delay={0}
      />
      <Floating3DShape 
        type="sphere" 
        size={40} 
        color="rgba(236, 72, 153, 0.3)" 
        position={{ top: '20%', right: '10%' }}
        delay={1}
      />
      <Floating3DShape 
        type="ring" 
        size={80} 
        color="rgba(34, 211, 238, 0.2)" 
        position={{ bottom: '30%', left: '8%' }}
        delay={2}
      />
      <GlowingOrb 
        size={100} 
        color="rgba(139, 92, 246, 0.15)" 
        position={{ top: '15%', right: '20%' }}
      />

      <section className="text-center py-12 md:py-20 relative z-10">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span className="text-indigo-400 font-medium">Powered by Flaton AI</span>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Công cụ AI</span> mạnh mẽ
            <br />ngay trên trình duyệt
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Tạo hình ảnh và video chất lượng cao với các mô hình AI tiên tiến nhất. 
            Đơn giản, nhanh chóng và hiệu quả về chi phí.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/image-generator">
              <AnimatedButton variant="primary" size="lg" className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Tạo hình ảnh
                <ArrowRight className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <Link to="/video-generator">
              <AnimatedButton variant="glass" size="lg" className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Tạo video
                <ArrowRight className="w-4 h-4" />
              </AnimatedButton>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <section className="py-12 relative z-10">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <Image className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl md:text-3xl font-bold">Công cụ tạo hình ảnh</h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageTools.map((tool, index) => (
            <ScrollReveal key={tool.id} delay={index * 0.1}>
              <Link to={`/image-generator?tool=${tool.id}`}>
                <AnimatedCard className="glass rounded-2xl p-6 relative overflow-hidden group h-full">
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
                </AnimatedCard>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-12 relative z-10">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <Video className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl md:text-3xl font-bold">Công cụ tạo video</h2>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 gap-6">
          {videoTools.map((tool, index) => (
            <ScrollReveal key={tool.id} delay={index * 0.1}>
              <Link to={`/video-generator?tool=${tool.id}`}>
                <AnimatedCard className="glass rounded-2xl p-6 relative overflow-hidden group h-full">
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
                </AnimatedCard>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-12 relative z-10">
        <ScrollReveal>
          <AnimatedCard className="glass rounded-2xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Tại sao chọn Flaton?</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <ScrollReveal delay={0.1}>
                <div className="group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Chi phí thấp</h3>
                  <p className="text-slate-400">Tiết kiệm đến 60% so với các nền tảng khác với hệ thống tính phí theo credit linh hoạt</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <div className="group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Chất lượng cao</h3>
                  <p className="text-slate-400">Sử dụng các mô hình AI độc quyền với nhiều phiên bản đa dạng</p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <div className="group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ArrowRight className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Dễ sử dụng</h3>
                  <p className="text-slate-400">Giao diện đơn giản, trực quan - chỉ cần nhập mô tả và nhận kết quả ngay lập tức</p>
                </div>
              </ScrollReveal>
            </div>
          </AnimatedCard>
        </ScrollReveal>
      </section>
    </div>
  )
}
