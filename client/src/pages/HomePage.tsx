import { Link } from 'react-router-dom'
import { Image, Video, Zap, Sparkles, ArrowRight, Star, Music, Play, CheckCircle } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Hero3D from '../components/Hero3D'

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

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(Math.min(scrollTop / docHeight, 1))
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return progress
}

function AnimatedText({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000)
        }
      },
      { threshold: 0.1 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description, gradient, delay }: {
  icon: any
  title: string
  description: string
  gradient: string
  delay: number
}) {
  const { theme } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000)
        }
      },
      { threshold: 0.1 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-12 scale-95'
      }`}
    >
      <div className={`rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 h-full group hover:scale-105 transition-all duration-300 relative overflow-hidden border-b-4 md:border-b-8 active:translate-y-1 active:border-b-2 ${
        theme === 'dark' 
          ? 'bg-[#2a2d3e] border-[#1e202f] hover:border-[#3a3d4e]' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-[0_8px_0_0_rgba(0,0,0,0.05)]'
      }`}>
        <div className={`w-14 h-14 md:w-20 md:h-20 rounded-[1.2rem] md:rounded-[1.5rem] bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
          <Icon className="w-7 h-7 md:w-10 md:h-10 text-white drop-shadow-md" />
        </div>
        <h3 className={`text-xl md:text-2xl font-black mb-2 md:mb-3 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`text-base md:text-lg leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
      </div>
    </div>
  )
}

function ToolCard({ tool, index, type }: { tool: typeof tools[0], index: number, type: 'image' | 'video' }) {
  const { theme } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100)
        }
      },
      { threshold: 0.1 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index])
  
  const gradient = type === 'image' 
    ? 'from-[#FF6B6B] to-[#FF8E8E]' 
    : 'from-[#4D96FF] to-[#6BCBFF]'
  
  const Icon = type === 'image' ? Image : Video
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      <Link to={`/${type}-generator?tool=${tool.id}`}>
        <div className={`rounded-[2rem] p-6 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden h-full border-b-4 active:translate-y-1 active:border-b-0 ${
          theme === 'dark' 
            ? 'bg-[#2a2d3e] border-[#1a1c2a]' 
            : 'bg-white border-slate-100 shadow-xl'
        }`}>
          {tool.featured && (
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFD93D] border-b-2 border-[#E6C237] animate-pulse">
              <Star className="w-3 h-3 text-[#FF8E8E] fill-[#FF8E8E]" />
              <span className="text-[10px] text-[#6B4E00] font-black uppercase italic">Super!</span>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-[1.2rem] bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
              <Icon className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className={`font-black text-xl mb-0.5 tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>{tool.name}</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#6BCB77]" />
                <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{tool.provider}</p>
              </div>
            </div>
          </div>
          
          <p className={`mb-6 text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{tool.description}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFF5E4] border-b-2 border-[#FFE3B3]">
              <Zap className="w-4 h-4 text-[#FF9F29] fill-[#FF9F29]" />
              <span className="text-[#FF9F29] font-black text-lg">{tool.credits}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm transition-all ${
              theme === 'dark'
                ? 'bg-white/5 text-white group-hover:bg-[#4D96FF]'
                : 'bg-slate-50 text-slate-900 group-hover:bg-[#4D96FF] group-hover:text-white group-hover:shadow-md'
            }`}>
              <span>PLAY</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

function StatsCounter({ value, label, suffix = '' }: { value: number, label: string, suffix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.5 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  
  useEffect(() => {
    if (!isVisible) return
    
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [isVisible, value])
  
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-400">{label}</div>
    </div>
  )
}

export default function HomePage() {
  const { theme } = useTheme()
  const scrollProgress = useScrollProgress()
  const imageTools = tools.filter(t => t.category === 'image')
  const videoTools = tools.filter(t => t.category === 'video')

  return (
    <div className="relative">
      <Hero3D />
      
      <section className="min-h-screen flex items-center justify-center relative">
        <div className="text-center max-w-4xl mx-auto px-4 pt-20">
          <AnimatedText delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-400 font-medium text-sm">Powered by Flaton AI</span>
            </div>
          </AnimatedText>
          
          <AnimatedText delay={0.2}>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 md:mb-8 leading-tight tracking-tighter">
              <span className="bg-gradient-to-r from-[#FF6B6B] via-[#4D96FF] to-[#6BCB77] bg-clip-text text-transparent drop-shadow-sm">
                SÁNG TẠO
              </span>
              <br />
              <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>KHÔNG GIỚI HẠN</span>
            </h1>
          </AnimatedText>
          
          <AnimatedText delay={0.4}>
            <p className={`text-lg md:text-2xl max-w-2xl mx-auto mb-8 md:mb-12 font-bold leading-relaxed px-4 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Biến ý tưởng thành hình ảnh, video và âm nhạc <span className="text-[#4D96FF]">chỉ trong một nốt nhạc!</span> 🚀
            </p>
          </AnimatedText>
          
          <AnimatedText delay={0.6}>
            <div className="flex flex-wrap justify-center gap-3 md:gap-6">
              <Link to="/image-generator" className="w-full sm:w-auto">
                <button className="group w-full sm:px-10 py-4 md:py-5 bg-[#FF6B6B] border-b-8 border-[#EE5253] text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl hover:translate-y-1 hover:border-b-4 active:translate-y-2 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-3 shadow-xl">
                  <Image className="w-5 h-5 md:w-6 md:h-6" />
                  HÌNH ẢNH
                </button>
              </Link>
              <Link to="/video-generator" className="w-full sm:w-auto">
                <button className="group w-full sm:px-10 py-4 md:py-5 bg-[#4D96FF] border-b-8 border-[#3A7EE6] text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl hover:translate-y-1 hover:border-b-4 active:translate-y-2 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-3 shadow-xl">
                  <Video className="w-5 h-5 md:w-6 md:h-6" />
                  VIDEO
                </button>
              </Link>
              <Link to="/music-generator" className="w-full sm:w-auto">
                <button className="group w-full sm:px-10 py-4 md:py-5 bg-[#6BCB77] border-b-8 border-[#56B362] text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl hover:translate-y-1 hover:border-b-4 active:translate-y-2 active:border-b-0 transition-all duration-150 flex items-center justify-center gap-3 shadow-xl">
                  <Music className="w-5 h-5 md:w-6 md:h-6" />
                  MUSIC
                </button>
              </Link>
            </div>
          </AnimatedText>
          
          <AnimatedText delay={0.8}>
            <div className={`mt-16 flex items-center justify-center gap-8 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Không cần cài đặt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Chi phí thấp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Chất lượng cao</span>
              </div>
            </div>
          </AnimatedText>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${
            theme === 'dark' ? 'border-slate-500' : 'border-slate-400'
          }`}>
            <div className={`w-1 h-2 rounded-full animate-scroll ${
              theme === 'dark' ? 'bg-slate-400' : 'bg-slate-500'
            }`} />
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedText>
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Tại sao chọn <span className="gradient-text">Flaton</span>?
              </h2>
              <p className={`text-lg max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Nền tảng AI toàn diện với đầy đủ công cụ sáng tạo nội dung
              </p>
            </div>
          </AnimatedText>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="Chi phí tiết kiệm"
              description="Tiết kiệm đến 60% so với các nền tảng khác. Hệ thống credit linh hoạt, chỉ trả cho những gì bạn sử dụng."
              gradient="from-yellow-500 to-orange-500"
              delay={0}
            />
            <FeatureCard
              icon={Sparkles}
              title="Chất lượng đỉnh cao"
              description="Sử dụng các mô hình AI tiên tiến nhất, cho ra kết quả sắc nét, chi tiết và chuyên nghiệp."
              gradient="from-indigo-500 to-purple-500"
              delay={0.1}
            />
            <FeatureCard
              icon={Play}
              title="Dễ dàng sử dụng"
              description="Giao diện trực quan, chỉ cần nhập mô tả và nhận kết quả. Không cần kiến thức kỹ thuật."
              gradient="from-cyan-500 to-blue-500"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedText>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Image className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Tạo hình ảnh AI</h2>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Chọn mô hình phù hợp với nhu cầu của bạn</p>
              </div>
            </div>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imageTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} type="image" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedText>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>Tạo video AI</h2>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Video chất lượng cao trong vài phút</p>
              </div>
            </div>
          </AnimatedText>
          
          <div className="grid md:grid-cols-2 gap-6">
            {videoTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} type="video" />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedText>
            <div className={`rounded-3xl p-12 relative overflow-hidden ${
              theme === 'dark'
                ? 'glass'
                : 'bg-white border border-slate-200 shadow-xl'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
              
              <div className="relative z-10">
                <div className="text-center mb-12">
                  <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Bảng giá dịch vụ <span className="gradient-text">Pro</span>
                  </h2>
                  <p className={`text-lg ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Tất cả gói Pro đều bao gồm đầy đủ tính năng: Tạo ảnh, Video, Nhạc, Word & PowerPoint không giới hạn
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  {[
                    { duration: '1 Ngày', price: '2.000' },
                    { duration: '1 Tuần', price: '8.000', featured: true },
                    { duration: '1 Tháng', price: '45.000' },
                    { duration: '1 Năm', price: '90.000' }
                  ].map((plan, idx) => (
                    <div 
                      key={idx}
                      className={`p-6 rounded-2xl text-center transition-all ${
                        plan.featured 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg scale-105' 
                          : theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-2 ${plan.featured ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {plan.duration}
                      </div>
                      <div className="text-2xl font-bold">
                        {plan.price}
                      </div>
                      <div className={`text-[10px] mt-1 uppercase tracking-wider ${plan.featured ? 'text-indigo-200' : 'text-slate-400'}`}>
                        VNĐ
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Không quảng cáo
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Ưu tiên xử lý
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Hỗ trợ 24/7
                    </div>
                  </div>
                  
                  <Link to="/register">
                    <button className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all duration-300">
                      Đăng ký nâng cấp ngay
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedText>
        </div>
      </section>

      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedText>
            <div className={`rounded-3xl p-12 text-center relative overflow-hidden ${
              theme === 'dark'
                ? 'glass'
                : 'bg-white border border-slate-200'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
              <div className="relative z-10">
                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Sẵn sàng sáng tạo?
                </h2>
                <p className={`text-lg mb-8 max-w-xl mx-auto ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Đăng ký ngay hôm nay và bắt đầu tạo nội dung AI chuyên nghiệp
                </p>
                <Link to="/register">
                  <button className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all duration-300">
                    Bắt đầu miễn phí
                  </button>
                </Link>
              </div>
            </div>
          </AnimatedText>
        </div>
      </section>
    </div>
  )
}
