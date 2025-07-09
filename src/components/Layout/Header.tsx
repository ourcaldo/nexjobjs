import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bookmark, User, LogOut } from 'lucide-react';
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

  const loadBookmarkCount = useCallback(async (userId: string) => {
    try {
      const count = await userBookmarkService.getBookmarkCount(userId);
      setBookmarkCount(count);
    } catch (error) {
      console.error('Error loading bookmark count:', error);
    }
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadBookmarkCount(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }, [loadBookmarkCount]);

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user);
        if (session?.user) {
          loadBookmarkCount(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setBookmarkCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser, loadBookmarkCount]);

  useEffect(() => {
    if (user) {
      loadBookmarkCount(user.id);
    }
  }, [user, loadBookmarkCount]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowUserMenu(false);
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
  };

  const handleBookmarkModalLogin = () => {
    setShowBookmarkModal(false);
    router.push('/login/');
  };

  const handleBookmarkModalSignup = () => {
    setShowBookmarkModal(false);
    router.push('/signup/');
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

            {/* Navigation */}
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

            {/* Right Side */}
            <div className="flex items-center space-x-4">
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
                /* User Menu */
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="hidden md:block text-gray-700 font-medium">
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
                /* Login/Signup buttons */
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
          </div>
        </div>

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </header>

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