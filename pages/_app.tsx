import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import GoogleTagManager, { GoogleTagManagerNoScript } from '@/components/Analytics/GoogleTagManager';
import { ToastProvider } from '@/components/ui/ToastProvider';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Validate environment variables after React has initialized
    const validateAndInitialize = async () => {
      try {
        // Import and validate environment only after component mount
        const { validateEnv } = await import('@/lib/env');
        validateEnv();
        
        // Initialize settings only for non-admin pages with better error handling
        const initializeSettings = async () => {
          try {
            // Skip initialization for admin pages to avoid unnecessary DB calls
            if (typeof window !== 'undefined' && (
              window.location.pathname.startsWith('/backend/admin') ||
              window.location.pathname.startsWith('/admin')
            )) {
              return;
            }

            const { supabaseAdminService } = await import('@/services/supabaseAdminService');
            
            // Use cached settings for frontend to avoid repeated DB calls
            const settings = await supabaseAdminService.getSettings(false);
            
            // Check if settings is defined before accessing its properties
            if (!settings) {
              console.warn('Settings not available, continuing with default configuration');
              return;
            }
            
            // Apply settings to wpService
            const { wpService } = await import('@/services/wpService');
            wpService.setBaseUrl(settings.api_url);
            wpService.setFiltersApiUrl(settings.filters_api_url);
            wpService.setAuthToken(settings.auth_token || '');
          } catch (error) {
            console.error('Error initializing settings:', error);
            // Continue with default settings if initialization fails
          }
        };

        await initializeSettings();
      } catch (error) {
        console.error('Environment validation failed:', error);
        // In development, we can continue with warnings
        // In production, this would prevent the app from starting with invalid config
        if (process.env.NODE_ENV === 'production') {
          // Don't throw in production to prevent app crash
          console.error('Critical: Environment validation failed in production');
        }
      }
    };

    validateAndInitialize();
  }, []);

  return (
    <ToastProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      {/* Google Tag Manager */}
      <GoogleTagManager />
      
      {/* Google Tag Manager (noscript) */}
      <GoogleTagManagerNoScript />
      
      {/* Google Analytics */}
      <GoogleAnalytics />
      
      <div className="min-h-screen bg-gray-50 font-inter">
        <Component {...pageProps} />
      </div>
    </ToastProvider>
  );
}