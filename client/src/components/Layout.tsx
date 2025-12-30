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
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

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
        className={`fixed inset-0 z-[60] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          theme === 'dark' ? 'bg-black' : 'bg-white'
        } ${
          showNavModal 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={() => setShowNavModal(false)}
            className={`p-2 transition-all duration-300 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex flex-col px-6 pt-4">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setShowNavModal(false)}
              className={`py-3 text-2xl font-medium transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                location.pathname === item.path
                  ? 'text-indigo-400'
                  : theme === 'dark'
                    ? 'text-white hover:text-indigo-400'
                    : 'text-slate-900 hover:text-indigo-500'
              }`}
              style={{
                transitionDelay: showNavModal ? `${150 + index * 80}ms` : '0ms',
                opacity: showNavModal ? 1 : 0,
                transform: showNavModal ? 'translateY(0)' : 'translateY(-20px)'
              }}
            >
              {item.label}
            </Link>
          ))}

          {/* Services Dropdown */}
          <button
            onClick={() => setShowServicesDropdown(!showServicesDropdown)}
            className={`py-3 text-2xl font-medium transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center gap-2 ${
              theme === 'dark'
                ? 'text-white hover:text-indigo-400'
                : 'text-slate-900 hover:text-indigo-500'
            }`}
            style={{
              transitionDelay: showNavModal ? `${150 + navItems.length * 80}ms` : '0ms',
              opacity: showNavModal ? 1 : 0,
              transform: showNavModal ? 'translateY(0)' : 'translateY(-20px)'
            }}
          >
            Dịch vụ
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${showServicesDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Services Items */}
          {showServicesDropdown && (
            <div className="flex flex-col pl-4">
              {serviceItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setShowNavModal(false)
                    setShowServicesDropdown(false)
                  }}
                  className={`py-2 text-lg font-medium transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center gap-2 ${
                    location.pathname === item.path
                      ? 'text-indigo-400'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:text-indigo-400'
                        : 'text-slate-700 hover:text-indigo-500'
                  }`}
                  style={{
                    transitionDelay: showServicesDropdown ? `${100 + index * 60}ms` : '0ms',
                    opacity: showServicesDropdown ? 1 : 0,
                    transform: showServicesDropdown ? 'translateY(0)' : 'translateY(-10px)'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
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
