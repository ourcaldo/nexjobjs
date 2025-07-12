
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { advertisementService } from '@/services/advertisementService';

const PopupAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [adCode, setAdCode] = useState<string>('');
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const loadPopupAd = async () => {
      try {
        const code = await advertisementService.getAdCode('popup_ad_code');
        if (code && !hasShown) {
          setAdCode(code);
          
          // Show popup after 3 seconds
          const timer = setTimeout(() => {
            setIsVisible(true);
            setHasShown(true);
          }, 3000);

          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error loading popup ad:', error);
      }
    };

    loadPopupAd();
  }, [hasShown]);

  // Execute scripts in ad code
  useEffect(() => {
    if (adCode && isVisible) {
      const scripts = adCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scripts) {
        scripts.forEach(scriptTag => {
          const scriptContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
          if (scriptContent.trim()) {
            try {
              eval(scriptContent);
            } catch (error) {
              console.error('Error executing popup ad script:', error);
            }
          }
        });
      }
    }
  }, [adCode, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !adCode) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <div className="text-xs text-gray-500 mb-4 text-center">Advertisement</div>
          <div dangerouslySetInnerHTML={{ __html: adCode }} />
        </div>
      </div>
    </div>
  );
};

export default PopupAd;
