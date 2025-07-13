
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

  // Cookie management for tracking executions per page
  const getCookieName = (): string => {
    const currentPath = router.asPath;
    return `nexjob_popup_${btoa(currentPath).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
  };

  const getExecutionCount = (): number => {
    if (typeof document === 'undefined') return 0;
    const cookieName = getCookieName();
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(cookieName + '='));
    return cookieValue ? parseInt(cookieValue.split('=')[1]) || 0 : 0;
  };

  const incrementExecutionCount = (): void => {
    if (typeof document === 'undefined') return;
    const cookieName = getCookieName();
    const currentCount = getExecutionCount();
    const newCount = currentCount + 1;
    // Set cookie to expire in 24 hours
    const expires = new Date();
    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
    document.cookie = `${cookieName}=${newCount}; expires=${expires.toUTCString()}; path=/`;
  };

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

    console.log('[DEBUG] PopupAd: Setting up click listener...');

    const handleClick = (event: MouseEvent) => {
      // Check execution limit
      const currentExecutions = getExecutionCount();
      if (currentExecutions >= popupConfig.maxExecutions) {
        console.log('[DEBUG] PopupAd: Maximum executions reached for this page:', currentExecutions);
        return;
      }

      console.log('[DEBUG] PopupAd: Click detected, opening popup:', {
        url: popupConfig.url,
        executions: currentExecutions + 1,
        maxExecutions: popupConfig.maxExecutions,
        device: currentDevice,
        page: router.asPath
      });

      // Open new tab
      try {
        const newWindow = window.open(popupConfig.url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          console.log('[DEBUG] PopupAd: New tab opened successfully');
          incrementExecutionCount();
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
