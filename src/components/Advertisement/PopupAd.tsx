
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { advertisementService } from '@/services/advertisementService';

const PopupAd: React.FC = () => {
  const router = useRouter();
  const [popupConfig, setPopupConfig] = useState({
    url: '',
    enabled: false,
    loadSettings: ['all_pages'],
    maxExecutions: 1,
    device: 'all'
  });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Device detection
  const getDeviceType = (): 'mobile' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= 768 ? 'mobile' : 'desktop';
  };

  // Check if current page should trigger popup
  const shouldTriggerOnPage = (loadSettings: string[]): boolean => {
    const currentPath = router.asPath;
    
    if (loadSettings.includes('all_pages')) {
      return true;
    }
    
    if (loadSettings.includes('single_articles')) {
      // Check if current page is a single article page
      return currentPath.startsWith('/artikel/') && !currentPath.endsWith('/artikel/');
    }
    
    return false;
  };

  /**
   * Generate a random alphanumeric string.
   */
  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  /**
   * Generate a session ID with timestamp and random string.
   */
  const generateSessionId = (): string => {
    return 'session_' + Date.now() + '_' + generateRandomString(8);
  };

  /**
   * Generate a page-unique key for session tracking.
   */
  const getPageKey = (): string => {
    return router.pathname; // Just the pathname, no query params
  };

  /**
   * Initialize session ID, once per page session.
   */
  const initSession = (): void => {
    if (typeof window === 'undefined') return;
    
    const sessionKey = 'sessionID_' + getPageKey();
    if (!sessionStorage.getItem(sessionKey)) {
      const sessionId = generateSessionId();
      sessionStorage.setItem(sessionKey, sessionId);
      console.log('[DEBUG] PopupAd: Initialized session:', { sessionKey, sessionId });
    }
  };

  /**
   * Check if tab has already been opened for this page session.
   */
  const hasTabBeenOpened = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const tabKey = 'tabOpened_' + getPageKey();
    const sessionKey = 'sessionID_' + getPageKey();
    
    const hasOpened = sessionStorage.getItem(tabKey) === 'true';
    const sessionExists = sessionStorage.getItem(sessionKey) !== null;
    
    console.log('[DEBUG] PopupAd: Checking tab status:', { 
      tabKey, 
      sessionKey,
      hasOpened, 
      sessionExists,
      tabValue: sessionStorage.getItem(tabKey),
      sessionValue: sessionStorage.getItem(sessionKey)
    });
    
    return hasOpened && sessionExists;
  };

  /**
   * Mark tab as opened for this page session.
   */
  const markTabAsOpened = (): void => {
    if (typeof window === 'undefined') return;
    
    const tabKey = 'tabOpened_' + getPageKey();
    sessionStorage.setItem(tabKey, 'true');
    console.log('[DEBUG] PopupAd: Marked tab as opened:', tabKey);
  };

  /**
   * Open the target URL in a new tab, only once per page session.
   */
  const openTabOnce = (): void => {
    console.log('[DEBUG] PopupAd: openTabOnce called');
    
    if (hasTabBeenOpened()) {
      console.log('[DEBUG] PopupAd: Tab already opened for this page session - BLOCKING');
      return;
    }

    console.log('[DEBUG] PopupAd: No previous tab found - OPENING NEW TAB');
    
    try {
      const newWindow = window.open(popupConfig.url, '_blank', 'noopener,noreferrer');
      if (newWindow) {
        markTabAsOpened();
        console.log('[DEBUG] PopupAd: New tab opened successfully');
        console.log('[DEBUG] PopupAd: Current sessionStorage state:', {
          sessionKey: 'sessionID_' + getPageKey(),
          sessionValue: sessionStorage.getItem('sessionID_' + getPageKey()),
          tabKey: 'tabOpened_' + getPageKey(),
          tabValue: sessionStorage.getItem('tabOpened_' + getPageKey())
        });
      } else {
        console.log('[DEBUG] PopupAd: Failed to open new tab (popup blocker?)');
      }
    } catch (error) {
      console.error('[DEBUG] PopupAd: Error opening new tab:', error);
    }
  };

  /**
   * Main handler to be triggered by user interaction.
   */
  const handleUserEventTrigger = (): void => {
    console.log('[DEBUG] PopupAd: User event triggered');
    
    // Check if tab already opened for this page
    if (hasTabBeenOpened()) {
      console.log('[DEBUG] PopupAd: Tab already opened in this session - IGNORING CLICK');
      return;
    }
    
    // Attempt to open tab
    openTabOnce();
  };

  // Initialize session when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initSession();
    }
  }, [router.pathname]);

  // Load popup configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('[DEBUG] PopupAd: Loading popup configuration...');
        const config = await advertisementService.getPopupAdConfig();
        setPopupConfig(config);
        setIsConfigLoaded(true);
        console.log('[DEBUG] PopupAd: Configuration loaded:', config);
      } catch (error) {
        console.error('[DEBUG] PopupAd: Error loading popup config:', error);
        setIsConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  // Set up click event listener
  useEffect(() => {
    if (!isConfigLoaded || !popupConfig.enabled || !popupConfig.url) {
      console.log('[DEBUG] PopupAd: Popup disabled or no URL configured');
      return;
    }

    // Check if should trigger on this page
    if (!shouldTriggerOnPage(popupConfig.loadSettings)) {
      console.log('[DEBUG] PopupAd: Page not eligible for popup based on load settings');
      return;
    }

    // Check device compatibility
    const currentDevice = getDeviceType();
    if (popupConfig.device !== 'all' && popupConfig.device !== currentDevice) {
      console.log('[DEBUG] PopupAd: Device not compatible:', { current: currentDevice, required: popupConfig.device });
      return;
    }

    console.log('[DEBUG] PopupAd: Setting up click listener for page:', getPageKey());

    const handleClick = (event: MouseEvent) => {
      console.log('[DEBUG] PopupAd: Click detected');
      handleUserEventTrigger();
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, { passive: true });

    // Cleanup function
    return () => {
      console.log('[DEBUG] PopupAd: Removing click listener');
      document.removeEventListener('click', handleClick);
    };
  }, [isConfigLoaded, popupConfig, router.pathname]);

  // Component renders nothing (invisible)
  return null;
};

export default PopupAd;
