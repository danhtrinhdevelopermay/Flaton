import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Image, Video, Home, Music, History, LogIn, UserPlus, LogOut, User, Menu, X, Activity } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageTransition } from './animations'

interface LayoutProps {
  children: ReactNode
}

function LiquidGlassSVG() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="liquid-glass-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNavModal, setShowNavModal] = useState(false)

  useEffect(() => {
    setShowNavModal(false)
  }, [location.pathname])

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/image-generator', label: 'Tạo hình ảnh', icon: Image },
    { path: '/video-generator', label: 'Tạo video', icon: Video },
    { path: '/music-generator', label: 'Tạo nhạc', icon: Music },
    { path: '/status', label: 'Trạng thái dịch vụ', icon: Activity },
  ]

  return (
    <div className="min-h-screen">
      <LiquidGlassSVG />
      <header className="liquid-glass-nav fixed top-[7px] left-[7px] right-[7px] z-50 rounded-full">
        <div className="liquid-glass-glow rounded-full" />
        <div className="liquid-glass-inner rounded-full">
          <div className="liquid-glass-highlight" />
          <div className="liquid-glass-edge rounded-full" />
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-indigo-500" />
                <span className="text-xl font-bold gradient-text">Flaton</span>
              </Link>
            </div>

            <button
              onClick={() => setShowNavModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:block">Menu</span>
            </button>

            <div className="flex items-center gap-3">
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
            </div>
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
          {children}
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
