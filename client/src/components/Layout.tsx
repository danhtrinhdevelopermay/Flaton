import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Image, Video, Home, Music, History, LogIn, UserPlus, LogOut, User, Menu, X, Activity, Coins, Gift, Compass, BookOpen, Presentation, Sun, Moon } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { PageTransition } from './animations'

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
    { path: '/image-generator', label: 'Tạo hình ảnh', icon: Image },
    { path: '/video-generator', label: 'Tạo video', icon: Video },
    { path: '/music-generator', label: 'Tạo nhạc', icon: Music },
    { path: '/pptx-generator', label: 'Tạo PowerPoint', icon: Presentation },
    { path: '/explorer', label: 'Explorer', icon: Compass },
    { path: '/status', label: 'Trạng thái dịch vụ', icon: Activity },
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`glass fixed top-[7px] left-[7px] right-[7px] z-50 rounded-full shadow-2xl ${theme === 'dark' ? 'shadow-indigo-500/20' : 'shadow-slate-200'}`}>
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
                className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-all text-slate-300 hover:text-white"
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
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-all"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden md:block">{user?.email}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 glass rounded-xl overflow-hidden shadow-xl">
                      <Link
                        to="/history"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-slate-700/50 transition-all"
                      >
                        <History className="w-4 h-4" />
                        Lịch sử tạo
                      </Link>
                      <Link
                        to="/explorer"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-slate-700/50 transition-all"
                      >
                        <Compass className="w-4 h-4" />
                        Explorer
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-700/50 transition-all text-red-400"
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
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
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
        className={`fixed inset-0 z-[60] bg-black flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          showNavModal 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={() => setShowNavModal(false)}
            className="p-2 text-gray-400 hover:text-white transition-all duration-300"
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
                  : 'text-white hover:text-indigo-400'
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
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <PageTransition>
          <div className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {children}
          </div>
        </PageTransition>
      </main>

      <footer className="glass mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>Powered by <a href="https://facebook.com/danhtrinh.official" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Danh Trình</a></p>
        </div>
      </footer>
    </div>
  )
}
