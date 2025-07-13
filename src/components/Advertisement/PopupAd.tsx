
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

  // Generate a page-unique key for session tracking
  const getPageKey = (): string => {
    return router.asPath;
  };

  // Session storage management for tracking executions per page
  const getSessionKey = (): string => {
    return `nexjob_popup_${getPageKey()}`;
  };

  const getExecutionCount = (): number => {
    if (typeof window === 'undefined') return 0;
    const sessionKey = getSessionKey();
    const storedValue = sessionStorage.getItem(sessionKey);
    return storedValue ? parseInt(storedValue) || 0 : 0;
  };

  const incrementExecutionCount = (): void => {
    if (typeof window === 'undefined') return;
    const sessionKey = getSessionKey();
    const currentCount = getExecutionCount();
    const newCount = currentCount + 1;
    sessionStorage.setItem(sessionKey, newCount.toString());
  };

  // Clear session storage when component unmounts (user leaves page)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const sessionKey = getSessionKey();
        sessionStorage.removeItem(sessionKey);
        console.log('[DEBUG] PopupAd: Cleared session storage on page leave:', sessionKey);
      }
    };
  }, [router.asPath]);

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
      // Check execution limit using sessionStorage
      const currentExecutions = getExecutionCount();
      if (currentExecutions >= popupConfig.maxExecutions) {
        console.log('[DEBUG] PopupAd: Maximum executions reached for this page session:', currentExecutions);
        return;
      }

      console.log('[DEBUG] PopupAd: Click detected, opening popup:', {
        url: popupConfig.url,
        executions: currentExecutions + 1,
        maxExecutions: popupConfig.maxExecutions,
        device: currentDevice,
        page: getPageKey(),
        sessionKey: getSessionKey()
      });

      // Open new tab
      try {
        const newWindow = window.open(popupConfig.url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          console.log('[DEBUG] PopupAd: New tab opened successfully');
          incrementExecutionCount();
          console.log('[DEBUG] PopupAd: Session storage updated, execution count:', getExecutionCount());
        } else {
          console.log('[DEBUG] PopupAd: Failed to open new tab (popup blocker?)');
        }
      } catch (error) {
        console.error('[DEBUG] PopupAd: Error opening new tab:', error);
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick, { passive: true });

    // Cleanup function
    return () => {
      console.log('[DEBUG] PopupAd: Removing click listener');
      document.removeEventListener('click', handleClick);
    };
  }, [isConfigLoaded, popupConfig, router.asPath]);

  // Component renders nothing (invisible)
  return null;
};

export default PopupAd;
