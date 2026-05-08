import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, User, LogIn, ShieldAlert, Search, Download, Share, Smartphone, PlusSquare, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error("Install prompt failed", error);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  if (userData?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin' });
  }

  return (
    <nav className="bg-[#1A0338] text-white sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                {/* Glowing aura */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 rounded-xl opacity-30 blur-lg group-hover:opacity-70 transition-opacity duration-500 animate-pulse"></div>
                
                {/* 3D Box Layers */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-700 rounded-xl transform rotate-3 group-hover:rotate-6 transition-transform duration-500 shadow-lg"></div>
                <div className="absolute inset-0 bg-gradient-to-bl from-blue-400 to-indigo-600 rounded-xl transform -rotate-3 group-hover:-rotate-6 opacity-70 transition-transform duration-500"></div>
                
                {/* Orbit ring (circle animation) */}
                <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] animate-[spin_8s_linear_infinite] z-0 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-500/20" />
                  <circle cx="50" cy="50" r="48" fill="none" stroke="url(#gradient-orbit-navbar)" strokeWidth="3" strokeDasharray="40 200" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient-orbit-navbar" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" /> {/* cyan-400 */}
                      <stop offset="100%" stopColor="#a855f7" /> {/* purple-500 */}
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Counter-rotating dashed ring */}
                <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] animate-[spin_12s_linear_infinite_reverse] z-0 opacity-50 group-hover:opacity-80 transition-opacity" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" className="text-purple-400/40" />
                </svg>
                
                {/* Inner Core */}
                <div className="absolute inset-[2px] bg-[#0A0118] rounded-[10px] z-10 flex items-center justify-center overflow-hidden border border-white/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
                   {/* Animated Background Line */}
                   <div className="absolute w-[200%] h-8 bg-gradient-to-r from-transparent via-white/30 to-transparent -rotate-45 translate-y-12 group-hover:-translate-y-12 transition-transform duration-700 blur-[2px]"></div>
                   
                   {/* Book Icon */}
                   <svg className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20 group-hover:text-cyan-200 transition-colors duration-300" 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                   </svg>
                   
                   {/* Floating digital particles */}
                   <div className="absolute top-1 right-2 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
                   <div className="absolute bottom-2 left-1 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center translate-y-[2px]">
                <span className="text-xl md:text-2xl font-black tracking-tighter leading-none text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] flex items-center gap-1.5">
                  SARDAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.4)]">LEARNING</span>
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-[2px] w-6 bg-gradient-to-r from-cyan-500 to-transparent rounded-full group-hover:w-10 transition-all duration-500"></div>
                  <span className="text-[10px] font-black text-gray-400 tracking-[0.5em] uppercase leading-none group-hover:text-cyan-200 transition-colors duration-300 drop-shadow-sm">Circle</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-8 text-sm font-medium uppercase tracking-widest text-gray-400">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`transition-colors pb-1 ${
                  location.pathname === link.path
                    ? 'text-white border-b-2 border-blue-500'
                    : 'hover:text-white border-b-2 border-transparent'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-sm font-bold text-white shadow-lg shadow-green-500/20 hover:from-green-400 hover:to-emerald-500 transition-colors"
              title="Install App"
            >
              <Download size={16} />
              <span>INSTALL APP</span>
            </button>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            {userData ? (
              <Link to="/dashboard" className="flex items-center gap-3 group relative bg-white/5 rounded-full pl-2 pr-4 py-1 hover:bg-white/10 transition-colors border border-white/10">
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-blue-500/30" />
                ) : (
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <User size={16} className="text-blue-400" />
                  </div>
                )}
                <span className="text-sm font-bold text-white max-w-[100px] truncate">{userData.name || 'Dashboard'}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 text-sm font-bold text-gray-300 hover:text-white">
                  LOGIN
                </Link>
                <Link
                  to="/courses"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-purple-500 transition-colors"
                >
                  JOIN FOR FREE
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex items-center md:hidden gap-2">
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsMobileMenuOpen(false);
              }}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
            >
              <Search size={22} />
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
              }}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-20 left-0 w-full bg-[#1A0338] border-b border-white/10 p-4 animate-in slide-in-from-top-2 shadow-2xl z-40">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-2">
            <input 
              type="text" 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="flex-1 bg-[#0F0121] border border-white/10 rounded-full px-6 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full px-6 py-3 font-bold text-sm tracking-widest text-white shadow-lg shadow-blue-500/20">
              SEARCH
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1A0338] border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 uppercase tracking-widest text-sm font-medium ${
                  location.pathname === link.path
                    ? 'text-white border-l-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {userData ? (
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
               >
                 {userData.photoURL ? (
                   <img src={userData.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                 ) : (
                   <User size={18} /> 
                 )}
                 Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 uppercase tracking-widest hover:from-blue-500 hover:to-purple-500 transition-colors"
                >
                LOGIN / JOIN FOR FREE
              </Link>
            )}

            <button
              onClick={() => {
                handleInstallClick();
                setIsMobileMenuOpen(false);
              }}
              className="mt-2 flex items-center justify-center gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-full text-sm font-bold shadow-lg shadow-green-500/20 uppercase tracking-widest hover:from-green-400 hover:to-emerald-500 transition-colors"
            >
              <Download size={18} />
              INSTALL APP
            </button>
          </div>
        </div>
      )}

      {/* Manual Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 relative">
          <div className="bg-[#1A0338] border border-blue-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative shadow-blue-900/50">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Smartphone size={32} className="text-white" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">Install App Directly</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Depending on your device, follow these quick steps to install the app:
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#0F0121] p-4 rounded-xl border border-white/5">
                <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2 text-sm">
                  <span className="bg-blue-500/20 p-1 rounded">iOS/iPhone</span>
                </h4>
                <ol className="text-sm text-gray-300 space-y-2">
                  <li className="flex gap-2"><Share size={16} className="shrink-0 text-gray-400" /> Tap the <strong>Share</strong> button at bottom.</li>
                  <li className="flex gap-2"><PlusSquare size={16} className="shrink-0 text-gray-400" /> Select <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
              
              <div className="bg-[#0F0121] p-4 rounded-xl border border-white/5">
                <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2 text-sm">
                  <span className="bg-emerald-500/20 p-1 rounded">Android/Chrome</span>
                </h4>
                <ol className="text-sm text-gray-300 space-y-2">
                  <li className="flex gap-2"><MoreVertical size={16} className="shrink-0 text-gray-400" /> Tap the <strong>Menu (3 dots)</strong>.</li>
                  <li className="flex gap-2"><Download size={16} className="shrink-0 text-gray-400" /> Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ol>
              </div>
            </div>
            
            <button 
              onClick={() => setShowInstallModal(false)}
              className="mt-6 w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors text-sm"
            >
              Okay, I understand
            </button>
          </div>
        </div>
      )}

    </nav>
  );
}
