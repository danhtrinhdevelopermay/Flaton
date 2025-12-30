import { useEffect, useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import {
  Rocket,
  Zap,
  Star,
  Target,
  TrendingUp,
  GitBranch,
  Cpu,
  Globe,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Flame,
} from 'lucide-react'

interface Milestone {
  id: number
  phase: string
  title: string
  subtitle: string
  date: string
  features: string[]
  status: 'completed' | 'in-progress' | 'planned'
  icon: any
  color: string
  gradient: string
}

const milestones: Milestone[] = [
  {
    id: 1,
    phase: 'Phase 1',
    title: 'Foundation Launch',
    subtitle: 'Nền tảng cơ bản',
    date: 'Q4 2024',
    status: 'completed',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
    features: [
      'Hệ thống xác thực người dùng',
      'Tạo hình ảnh AI (Nano, SeDream)',
      'Tạo video AI cơ bản',
      'Dashboard người dùng',
      'Quản lý credits',
    ],
  },
  {
    id: 2,
    phase: 'Phase 2',
    title: 'Content Expansion',
    subtitle: 'Mở rộng nội dung',
    date: 'Q1 2025',
    status: 'in-progress',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    gradient: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
    features: [
      'Tạo nhạc AI (Suno)',
      'PowerPoint tự động',
      'Word document tạo nhanh',
      'Hệ thống bài học interactiv',
      'Tích hợp nâng cấp tài khoản',
    ],
  },
  {
    id: 3,
    phase: 'Phase 3',
    title: 'AI Intelligence',
    subtitle: 'Tăng cường AI',
    date: 'Q2 2025',
    status: 'planned',
    icon: Cpu,
    color: 'from-emerald-500 to-teal-500',
    gradient: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
    features: [
      'Trợ lý AI chat thông minh',
      'Phân tích hình ảnh tự động',
      'Tối ưu hóa prompt AI',
      'Gợi ý nội dung cá nhân hóa',
      'Học máy từ lịch sử người dùng',
    ],
  },
  {
    id: 4,
    phase: 'Phase 4',
    title: 'Ecosystem Integration',
    subtitle: 'Hệ sinh thái toàn diện',
    date: 'Q3 2025',
    status: 'planned',
    icon: Globe,
    color: 'from-orange-500 to-red-500',
    gradient: 'bg-gradient-to-r from-orange-500/20 to-red-500/20',
    features: [
      'API công khai cho nhà phát triển',
      'Plugins & Extensions',
      'Tích hợp với Zapier, Make.com',
      'Marketplace cho mẫu & template',
      'Cộng đồng creator',
    ],
  },
  {
    id: 5,
    phase: 'Phase 5',
    title: 'Enterprise Solutions',
    subtitle: 'Giải pháp doanh nghiệp',
    date: 'Q4 2025',
    status: 'planned',
    icon: Lock,
    color: 'from-indigo-500 to-blue-500',
    gradient: 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20',
    features: [
      'Bảo mật cấp độ doanh nghiệp',
      'Single Sign-On (SSO)',
      'Quản lý nhóm & quyền hạn',
      'Báo cáo & phân tích nâng cao',
      'Hỗ trợ khách hàng 24/7',
    ],
  },
]

function MilestoneCard({ milestone, delay }: { milestone: Milestone; delay: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const Icon = milestone.icon

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 100)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  const statusConfig = {
    completed: { label: 'Hoàn thành', color: 'bg-green-500', icon: CheckCircle2 },
    'in-progress': { label: 'Đang thực hiện', color: 'bg-yellow-500', icon: Flame },
    planned: { label: 'Lên kế hoạch', color: 'bg-blue-500', icon: Target },
  }

  const StatusIcon = statusConfig[milestone.status].icon

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="group relative h-full">
        {/* Animated gradient border */}
        <div
          className={`absolute inset-0 rounded-2xl p-0.5 ${milestone.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900"></div>
        </div>

        {/* Card content */}
        <div className="relative h-full rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 group-hover:border-slate-600/50 transition-all p-8 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  {milestone.phase}
                </span>
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
                    statusConfig[milestone.status].color
                  }`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[milestone.status].label}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 transition-all">
                {milestone.title}
              </h3>
              <p className="text-slate-400">{milestone.subtitle}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${milestone.color} p-2.5 flex items-center justify-center text-white group-hover:scale-110 transition-transform`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </div>

          {/* Date */}
          <div className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></span>
            Dự kiến: {milestone.date}
          </div>

          {/* Features */}
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Tính năng chính
            </p>
            <ul className="space-y-3">
              {milestone.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-slate-300 text-sm group/item"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:from-blue-400/60 group-hover/item:to-cyan-400/60 transition-colors">
                    <ArrowRight className="w-3 h-3 text-blue-300" />
                  </div>
                  <span className="group-hover/item:text-white transition-colors">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer button */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 font-medium text-sm hover:from-blue-500/40 hover:to-cyan-500/40 transition-all flex items-center justify-center gap-2 group/btn">
              <span>Tìm hiểu thêm</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineConnector({ isLast }: { isLast: boolean }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`absolute left-1/2 transform -translate-x-1/2 w-1 transition-all duration-1000 ${
        isVisible ? 'bg-gradient-to-b from-blue-500 to-cyan-500 opacity-100' : 'bg-slate-700 opacity-50'
      } ${isLast ? 'h-8' : 'h-32'}`}
    ></div>
  )
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: string; gradient: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 text-center hover:border-slate-600 transition-colors group cursor-pointer">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-sm mb-2">{label}</p>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
          {value}
        </p>
      </div>
    </div>
  )
}

export default function MilestonesPage() {
  const { theme } = useTheme()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(Math.min(scrollTop / docHeight, 1))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Scroll progress indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress * 100}%` }}
      ></div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Lộ trình phát triển Flaton</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400">
                Công nghệ AI
              </span>
              <br />
              <span className="text-white">Thế hệ tiếp theo</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Khám phá hành trình biến Flaton thành nền tảng AI hàng đầu toàn cầu. Từ nền tảng cơ bản đến hệ sinh thái doanh nghiệp hoàn chỉnh.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
              <StatCard
                icon={Target}
                label="Giai đoạn phát triển"
                value="5"
                gradient="from-blue-500 to-cyan-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Tính năng mới"
                value="25+"
                gradient="from-cyan-500 to-purple-500"
              />
              <StatCard
                icon={Rocket}
                label="Thời gian hoàn thành"
                value="1 năm"
                gradient="from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative">
              {/* Timeline connectors - hidden on mobile */}
              <div className="hidden lg:block absolute top-32 left-0 right-0 h-1">
                <div className="h-full bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-purple-500/30"></div>
              </div>

              {milestones.map((milestone, idx) => (
                <div key={milestone.id} className="relative">
                  {/* Timeline dot */}
                  <div className="hidden lg:flex absolute -top-20 left-1/2 transform -translate-x-1/2 items-center justify-center">
                    <div className={`w-4 h-4 rounded-full border-4 z-20 ${
                      milestone.status === 'completed'
                        ? 'bg-green-500 border-green-400'
                        : milestone.status === 'in-progress'
                        ? 'bg-yellow-500 border-yellow-400'
                        : 'bg-slate-700 border-slate-600'
                    }`}></div>
                  </div>

                  <MilestoneCard milestone={milestone} delay={idx * 0.1} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Future Vision Section */}
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-8 md:p-12 relative overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-900/50 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Tầm nhìn dài hạn</h2>
                </div>

                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  Flaton đang cam kết trở thành nền tảng AI toàn diện nhất trong khu vực. Chúng tôi không chỉ tạo công cụ AI mạnh mẽ, mà còn xây dựng một cộng đồng sáng tạo toàn cầu nơi mọi người, từ doanh nhân đến nhà giáo dục, có thể khai thác sức mạnh của trí tuệ nhân tạo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Dễ tiếp cận</h3>
                      <p className="text-slate-400 text-sm">AI cho mọi người, ở mọi nơi</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Đổi mới liên tục</h3>
                      <p className="text-slate-400 text-sm">Luôn cập nhật công nghệ mới nhất</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">An toàn & Bảo mật</h3>
                      <p className="text-slate-400 text-sm">Bảo vệ dữ liệu người dùng tối cao</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-white mb-1">Cộng đồng hỗ trợ</h3>
                      <p className="text-slate-400 text-sm">Được hỗ trợ bởi một cộng đồng vibrant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Sẵn sàng bắt đầu hành trình?</h2>
            <p className="text-lg text-slate-300 mb-8">
              Tham gia hàng nghìn người dùng đang khám phá sức mạnh của AI với Flaton
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105">
                Dùng thử ngay
              </button>
              <button className="px-8 py-3 rounded-lg bg-slate-800/50 text-slate-300 font-bold border border-slate-700 hover:border-slate-600 transition-all">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
