
import React, { useEffect, useState } from 'react';
import { advertisementService } from '@/services/advertisementService';

const PopupAd: React.FC = () => {
  const [adCode, setAdCode] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadPopupAd = async () => {
      try {
        const code = await advertisementService.getAdCode('popup_ad_code');
        if (code && !hasLoaded) {
          setAdCode(code);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error('Error loading popup ad:', error);
      }
    };

    loadPopupAd();
  }, [hasLoaded]);

  // Execute the ad code (like analytics scripts)
  useEffect(() => {
    if (adCode && hasLoaded) {
      // Create a container div to append the ad code
      const adContainer = document.createElement('div');
      adContainer.innerHTML = adCode;
      
      // Execute any script tags
      const scripts = adContainer.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(script.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content if it's an inline script
        if (script.innerHTML) {
          newScript.innerHTML = script.innerHTML;
        }
        
        // Append to document head to execute
        document.head.appendChild(newScript);
        
        // Clean up after execution
        setTimeout(() => {
          if (document.head.contains(newScript)) {
            document.head.removeChild(newScript);
          }
        }, 1000);
      });
      
      // Handle non-script content (like img tags, etc.)
      const nonScriptElements = adContainer.querySelectorAll('*:not(script)');
      if (nonScriptElements.length > 0) {
        // If there are non-script elements, append them to the body invisibly
        const invisibleContainer = document.createElement('div');
        invisibleContainer.style.display = 'none';
        invisibleContainer.innerHTML = adCode.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        document.body.appendChild(invisibleContainer);
        
        // Clean up after some time
        setTimeout(() => {
          if (document.body.contains(invisibleContainer)) {
            document.body.removeChild(invisibleContainer);
          }
        }, 5000);
      }
    }
  }, [adCode, hasLoaded]);

  // This component doesn't render anything visible
  return null;
};

export default PopupAd;
