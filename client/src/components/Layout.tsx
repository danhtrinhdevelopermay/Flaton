import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Image, Video, Home, Music, History, LogIn, UserPlus, LogOut, User, Menu, X, Activity, Coins, Gift, Compass, BookOpen, Presentation, FileText, Sun, Moon, ChevronDown } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { PageTransition } from './animations'
import AIAssistantBot from './AIAssistantBot'
import AdUnit from './AdUnit'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNavModal, setShowNavModal] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [canCheckin, setCanCheckin] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [showServicesDropdown, setShowServicesDropdown] = useState(false)

  useEffect(() => {
    setShowNavModal(false)
  }, [location.pathname])

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/user/credits', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.credits !== undefined) {
            setCredits(data.credits)
            setCanCheckin(data.canCheckin)
          }
        })
        .catch(err => console.error('Failed to fetch credits:', err))
    } else {
      setCredits(null)
      setCanCheckin(false)
      setCheckinLoading(false)
    }
  }, [isAuthenticated])

  const handleCheckin = async () => {
    if (checkinLoading) return
    setCheckinLoading(true)
    try {
      const res = await fetch('/api/user/checkin', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setCredits(data.credits)
        setCanCheckin(false)
        alert(data.message)
      } else {
        alert(data.error || 'Điểm danh thất bại')
      }
    } catch (err) {
      alert('Lỗi kết nối server')
    } finally {
      setCheckinLoading(false)
    }
  }

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/explorer', label: 'Explorer', icon: Compass },
    { path: '/status', label: 'Trạng thái dịch vụ', icon: Activity },
  ]

  const serviceItems = [
    { path: '/image-generator', label: 'Tạo hình ảnh', icon: Image },
    { path: '/video-generator', label: 'Tạo video', icon: Video },
    { path: '/video-upscale', label: 'Nâng cấp Video (Topaz)', icon: Sparkles },
    { path: '/music-generator', label: 'Tạo nhạc', icon: Music },
    { path: '/pptx-generator', label: 'Tạo PowerPoint', icon: Presentation },
    { path: '/word-generator', label: 'Tạo Word', icon: FileText },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`fixed top-[7px] left-[7px] right-[7px] z-50 rounded-full shadow-2xl transition-colors duration-300 ${
        theme === 'dark'
          ? 'glass shadow-indigo-500/20'
          : 'bg-white/80 backdrop-blur-md border border-slate-200 shadow-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="Flaton" className="w-8 h-8" />
                <span className="text-xl font-bold gradient-text">Flaton</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && credits !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium">{credits.toFixed(1)}</span>
                  </div>
                  {canCheckin && (
                    <button
                      onClick={handleCheckin}
                      disabled={checkinLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all disabled:opacity-50"
                    >
                      <Gift className="w-4 h-4" />
                      <span className="hidden sm:block">{checkinLoading ? '...' : 'Điểm danh'}</span>
                    </button>
                  )}
                </div>
              )}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700/50 hover:bg-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <User className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-slate-600'}`} />
                    <span className={`hidden md:block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user?.email}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl transition-colors ${
                      theme === 'dark'
                        ? 'glass'
                        : 'bg-white border border-slate-200'
                    }`}>
                      <Link
                        to="/history"
                        onClick={() => setShowUserMenu(false)}
                        className={`flex items-center gap-2 px-4 py-3 transition-all ${
                          theme === 'dark'
                            ? 'hover:bg-slate-700/50 text-white'
                            : 'hover:bg-slate-100 text-slate-900'
                        }`}
                      >
                        <History className="w-4 h-4" />
                        Lịch sử tạo
                      </Link>
                      <Link
                        to="/explorer"
                        onClick={() => setShowUserMenu(false)}
                        className={`flex items-center gap-2 px-4 py-3 transition-all ${
                          theme === 'dark'
                            ? 'hover:bg-slate-700/50 text-white'
                            : 'hover:bg-slate-100 text-slate-900'
                        }`}
                      >
                        <Compass className="w-4 h-4" />
                        Explorer
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 transition-all ${
                          theme === 'dark'
                            ? 'hover:bg-slate-700/50 text-red-400'
                            : 'hover:bg-slate-100 text-red-600'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                      theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden md:block">Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden md:block">Đăng ký</span>
                  </Link>
                </div>
              )}
              
              <button
                onClick={() => setShowNavModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-all"
              >
                <Menu className="w-5 h-5" />
                <span className="hidden sm:block">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div 
        className={`fixed inset-0 z-[100] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          theme === 'dark' ? 'bg-[#1e202f]' : 'bg-white'
        } ${
          showNavModal 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex justify-end p-8">
          <button
            onClick={() => setShowNavModal(false)}
            className={`p-3 rounded-2xl border-b-4 transition-all active:translate-y-1 active:border-b-0 ${
              theme === 'dark'
                ? 'bg-[#2a2d3e] border-[#1e202f] text-white'
                : 'bg-slate-100 border-slate-200 text-slate-900'
            }`}
          >
            <X className="w-8 h-8" />
          </button>
        </div>
        
        <nav className="flex flex-col px-10 pt-10 space-y-4">
          <div className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-6">Main Menu</h2>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowNavModal(false)}
                  className={`group relative overflow-hidden px-6 py-4 md:px-8 md:py-6 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 font-black text-2xl md:text-4xl uppercase tracking-tighter transition-all active:translate-y-1 md:active:translate-y-2 active:border-b-0 ${
                    location.pathname === item.path
                      ? 'bg-[#4D96FF] border-[#3A7EE6] text-white'
                      : theme === 'dark'
                        ? 'bg-[#2a2d3e] border-[#1e202f] text-white hover:bg-[#32354a]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'
                  }`}
                  style={{
                    transitionDelay: showNavModal ? `${100 + index * 50}ms` : '0ms',
                    opacity: showNavModal ? 1 : 0,
                    transform: showNavModal ? 'translateX(0)' : 'translateX(-40px)'
                  }}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <item.icon className="w-8 h-8 md:w-10 md:h-10" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-4 md:mb-6">Dịch vụ AI</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {serviceItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowNavModal(false)}
                  className={`flex items-center gap-3 md:gap-4 px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-b-2 md:border-b-4 font-black text-lg md:text-xl uppercase transition-all active:translate-y-1 active:border-b-0 ${
                    location.pathname === item.path
                      ? 'bg-[#6BCB77] border-[#56B362] text-white'
                      : theme === 'dark'
                        ? 'bg-[#2a2d3e] border-[#1e202f] text-white hover:bg-[#32354a]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'
                  }`}
                  style={{
                    transitionDelay: showNavModal ? `${300 + index * 40}ms` : '0ms',
                    opacity: showNavModal ? 1 : 0,
                    transform: showNavModal ? 'translateY(0)' : 'translateY(20px)'
                  }}
                >
                  <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-6 md:py-10 border-t-4 border-dashed border-slate-200/20 mt-6 md:mt-10">
            <span className={`text-xl md:text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Theme Mode
            </span>
            <button
              onClick={toggleTheme}
              className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center border-b-4 md:border-b-8 transition-all active:translate-y-1 md:active:translate-y-2 active:border-b-0 ${
                theme === 'dark'
                  ? 'bg-[#FFD93D] border-[#FF9F29] text-[#6B4E00]'
                  : 'bg-[#4D96FF] border-[#3A7EE6] text-white'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-7 h-7 md:w-10 md:h-10" /> : <Moon className="w-7 h-7 md:w-10 md:h-10" />}
            </button>
          </div>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Top Advertisement */}
        <div className="mb-8">
          <AdUnit adSlot="1234567890" adFormat="auto" />
        </div>

        <PageTransition>
          <div className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {children}
          </div>
        </PageTransition>

        {/* Bottom Advertisement */}
        <div className="mt-12">
          <AdUnit adSlot="9876543210" adFormat="auto" />
        </div>
      </main>

      <footer className={`mt-auto py-6 transition-colors ${
        theme === 'dark'
          ? 'glass'
          : 'bg-slate-100 border-t border-slate-200'
      }`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <p>Powered by <a href="https://facebook.com/danhtrinh.official" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Danh Trình</a></p>
        </div>
      </footer>

      <AIAssistantBot />
    </div>
  )
}
