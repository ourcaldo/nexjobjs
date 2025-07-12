
import React, { useEffect, useState } from 'react';
import { advertisementService } from '@/services/advertisementService';

interface AdDisplayProps {
  position: 'popup_ad_code' | 'sidebar_archive_ad_code' | 'sidebar_single_ad_code' | 'single_top_ad_code' | 'single_bottom_ad_code' | 'single_middle_ad_code' | 'popup' | 'sidebar_archive' | 'sidebar_single' | 'single_top' | 'single_bottom' | 'single_middle';
  className?: string;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ position, className = '' }) => {
  const [adCode, setAdCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAd = async () => {
      try {
        // Normalize position to include _ad_code suffix if not already present
        let adPosition = position;
        if (!position.endsWith('_ad_code')) {
          adPosition = `${position}_ad_code` as any;
        }
        
        const code = await advertisementService.getAdCode(adPosition as any);
        setAdCode(code);
      } catch (error) {
        console.error('Error loading advertisement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, [position]);

  // Execute any scripts in the ad code
  useEffect(() => {
    if (adCode) {
      const scripts = adCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scripts) {
        scripts.forEach(scriptTag => {
          const scriptContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
          if (scriptContent.trim()) {
            try {
              eval(scriptContent);
            } catch (error) {
              console.error('Error executing ad script:', error);
            }
          }
        });
      }
    }
  }, [adCode]);

  if (loading) {
    return (
      <div className={`advertisement-${position} ${className}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Advertisement</h3>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!adCode) {
    return (
      <div className={`advertisement-${position} ${className}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Advertisement</h3>
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-sm">No advertisement configured</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`advertisement-${position} ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Advertisement</h3>
      <div 
        className="ad-content-container max-w-full overflow-hidden"
        style={{
          maxWidth: '100%',
          width: '100%',
          display: 'block',
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: adCode }} 
      />
    </div>
  );
};

export default AdDisplay;
