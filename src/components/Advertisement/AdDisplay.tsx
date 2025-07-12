
import React, { useEffect, useState } from 'react';
import { advertisementService } from '@/services/advertisementService';

interface AdDisplayProps {
  position: 'popup' | 'sidebar_archive' | 'sidebar_single' | 'single_top' | 'single_bottom' | 'single_middle';
  className?: string;
}

const AdDisplay: React.FC<AdDisplayProps> = ({ position, className = '' }) => {
  const [adCode, setAdCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAd = async () => {
      try {
        const code = await advertisementService.getAdCode(`${position}_ad_code` as any);
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

  if (loading || !adCode) {
    return null;
  }

  return (
    <div className={`advertisement-${position} ${className}`}>
      <div className="text-xs text-gray-500 mb-2 text-center">Advertisement</div>
      <div dangerouslySetInnerHTML={{ __html: adCode }} />
    </div>
  );
};

export default AdDisplay;
