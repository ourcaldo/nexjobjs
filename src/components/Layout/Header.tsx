import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bookmark, User, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { userBookmarkService } from '@/services/userBookmarkService';
import BookmarkLoginModal from '@/components/ui/BookmarkLoginModal';

const Header: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadBookmarkCount = useCallback(async (userId: string) => {
    try {
      const count = await userBookmarkService.getBookmarkCount(userId);
      setBookmarkCount(count);
    } catch (error) {
      console.error('Error loading bookmark count:', error);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      // First try to get session (includes token validation)
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await loadBookmarkCount(session.user.id);
      } else {
        // Fallback to getUser if no session
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          await loadBookmarkCount(user.id);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    }
  }, [loadBookmarkCount]);

  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Listen for auth changes (login/logout events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadBookmarkCount(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setBookmarkCount(0);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Handle token refresh
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, loadBookmarkCount]);

  // Re-check auth state on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      // Small delay to allow navigation to complete
      setTimeout(initializeAuth, 100);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, initializeAuth]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowUserMenu(false);
      setShowMobileMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBookmarkClick = () => {
    if (user) {
      router.push('/profile/');
    } else {
      setShowBookmarkModal(true);
    }
    setShowMobileMenu(false);
  };

  const handleBookmarkModalLogin = () => {
    setShowBookmarkModal(false);
    router.push('/login/');
  };

  const handleBookmarkModalSignup = () => {
    setShowBookmarkModal(false);
    router.push('/signup/');
  };

  const handleMobileNavClick = () => {
    setShowMobileMenu(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === '/' && router.asPath === '/';
    }

    if (path === '/lowongan-kerja/') {
      return router.pathname === '/lowongan-kerja' || 
             router.pathname === '/lowongan-kerja/index' ||
             router.asPath === '/lowongan-kerja/' ||
             router.asPath === '/lowongan-kerja' ||
             router.pathname.startsWith('/lowongan-kerja');
    }

    if (path === '/artikel/') {
      return router.pathname === '/artikel' || 
             router.pathname === '/artikel/index' ||
             router.asPath === '/artikel/' ||
             router.asPath === '/artikel' ||
             router.pathname.startsWith('/artikel');
    }

    if (path === '/profile/') {
      return router.pathname === '/profile' || 
             router.pathname === '/profile/index' ||
             router.asPath === '/profile/' ||
             router.asPath === '/profile' ||
             router.pathname.startsWith('/profile');
    }

    return router.pathname === path || router.asPath === path;
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Nex<span className="text-primary-600">job</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Beranda
              </Link>
              <Link 
                href="/lowongan-kerja/" 
                className={`font-medium transition-colors ${
                  isActive('/lowongan-kerja/')
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Cari Lowongan
              </Link>
              <Link 
                href="/artikel/" 
                className={`font-medium transition-colors ${
                  isActive('/artikel/')
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Tips Karir
              </Link>
            </nav>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Bookmarks - Always visible */}
              <button
                onClick={handleBookmarkClick}
                className={`relative p-2 rounded-lg transition-colors ${
                  user && isActive('/profile/')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
                title="Lowongan Tersimpan"
              >
                <Bookmark className="h-5 w-5" />
                {bookmarkCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {bookmarkCount > 99 ? '99+' : bookmarkCount}
                  </span>
                )}
              </button>

              {user ? (
                /* Desktop User Menu */
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        href="/profile/"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 inline mr-2" />
                        Profil Saya
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4 inline mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Login/Signup buttons */
                <>
                  <Link
                    href="/login/"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/signup/"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Right Side */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Mobile Bookmarks */}
              <button
                onClick={handleBookmarkClick}
                className={`relative p-2 rounded-lg transition-colors ${
                  user && isActive('/profile/')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
                title="Lowongan Tersimpan"
              >
                <Bookmark className="h-5 w-5" />
                {bookmarkCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {bookmarkCount > 99 ? '99+' : bookmarkCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Click outside to close desktop user menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </header>

      {/* Mobile Off-Canvas Menu */}
      <div className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${showMobileMenu ? 'opacity-50' : 'opacity-0'}`}
          onClick={() => setShowMobileMenu(false)}
        />

        {/* Menu Panel */}
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center space-x-2" onClick={handleMobileNavClick}>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Nex<span className="text-primary-600">job</span>
                </span>
              </Link>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                <Link
                  href="/"
                  onClick={handleMobileNavClick}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Beranda
                </Link>
                <Link
                  href="/lowongan-kerja/"
                  onClick={handleMobileNavClick}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/lowongan-kerja/')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Cari Lowongan
                </Link>
                <Link
                  href="/artikel/"
                  onClick={handleMobileNavClick}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive('/artikel/')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Tips Karir
                </Link>
              </div>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-200">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile/"
                    onClick={handleMobileNavClick}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profil Saya
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login/"
                    onClick={handleMobileNavClick}
                    className="block w-full text-center px-4 py-3 text-gray-700 hover:text-primary-600 font-medium border border-gray-300 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/signup/"
                    onClick={handleMobileNavClick}
                    className="block w-full text-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookmark Login Modal */}
      <BookmarkLoginModal
        isOpen={showBookmarkModal}
        onClose={() => setShowBookmarkModal(false)}
        onLogin={handleBookmarkModalLogin}
        onSignup={handleBookmarkModalSignup}
      />
    </>
  );
};

export default Header;