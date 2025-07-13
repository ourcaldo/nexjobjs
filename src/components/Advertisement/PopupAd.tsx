import React, { useEffect, useState } from 'react';
import { advertisementService } from '@/services/advertisementService';

const PopupAd: React.FC = () => {
  const [adCode, setAdCode] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const loadPopupAd = async () => {
      try {
        console.log('[DEBUG] PopupAd: Loading popup ad code...');
        const code = await advertisementService.getAdCode('popup_ad_code');
        if (code && !hasLoaded) {
          console.log('[DEBUG] PopupAd: Ad code received:', code);
          setAdCode(code);
          setHasLoaded(true);
        } else if (!code) {
          console.log('[DEBUG] PopupAd: No ad code found');
        }
      } catch (error) {
        console.error('[DEBUG] PopupAd: Error loading popup ad:', error);
      }
    };

    loadPopupAd();
  }, [hasLoaded]);

  // Execute the ad code in head (like WordPress header.php or WP Code)
  useEffect(() => {
    if (adCode && hasLoaded) {
      console.log('[DEBUG] PopupAd: Processing ad code for head injection...');

      try {
        // Create a temporary container to parse the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = adCode;

        // Handle external script tags with src attribute
        const externalScripts = tempContainer.querySelectorAll('script[src]');
        externalScripts.forEach((script, index) => {
          const src = script.getAttribute('src');

          if (src) {
            console.log(`[DEBUG] PopupAd: Loading external script ${index + 1}:`, src);

            // Check if script already exists to avoid duplicates
            const existingScript = document.head.querySelector(`script[src="${src}"]`);
            if (existingScript) {
              console.log(`[DEBUG] PopupAd: Script already exists, skipping:`, src);
              return;
            }

            const newScript = document.createElement('script');
            newScript.src = src;

            // Copy other attributes
            Array.from(script.attributes).forEach(attr => {
              if (attr.name !== 'src') {
                newScript.setAttribute(attr.name, attr.value);
              }
            });

            // Add load and error handlers
            newScript.onload = () => {
              console.log(`[DEBUG] PopupAd: External script loaded successfully:`, src);
            };

            newScript.onerror = () => {
              console.error(`[DEBUG] PopupAd: Failed to load external script:`, src);
            };

            // Append to document head to execute (like WordPress header.php)
            document.head.appendChild(newScript);
          }
        });

        // Handle inline script tags
        const inlineScripts = tempContainer.querySelectorAll('script:not([src])');
        inlineScripts.forEach((script, index) => {
          if (script.innerHTML.trim()) {
            console.log(`[DEBUG] PopupAd: Executing inline script ${index + 1}:`, script.innerHTML.substring(0, 100) + '...');

            try {
              // Create new script element for inline scripts
              const newScript = document.createElement('script');
              newScript.textContent = script.innerHTML;

              // Copy attributes
              Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
              });

              // Append to head to execute (like WP Code)
              document.head.appendChild(newScript);
              console.log(`[DEBUG] PopupAd: Inline script ${index + 1} executed successfully`);

            } catch (error) {
              console.error(`[DEBUG] PopupAd: Error executing inline script ${index + 1}:`, error);
            }
          }
        });

        // Handle any non-script HTML content (just log it, don't display)
        const nonScriptElements = Array.from(tempContainer.children).filter(
          el => el.tagName.toLowerCase() !== 'script'
        );

        if (nonScriptElements.length > 0) {
          console.log(`[DEBUG] PopupAd: Found ${nonScriptElements.length} non-script HTML elements (will be ignored for popup ads)`);
        }

        console.log('[DEBUG] PopupAd: Ad code processing completed');

        // Add example debug listeners for common events
        ['click', 'mousemove', 'scroll'].forEach(evt => {
          window.addEventListener(evt, () => {
            console.log(`[DEBUG] PopupAd: User triggered event: ${evt}`);
          }, { once: true }); // Only log once per event type to avoid spam
        });

      } catch (error) {
        console.error('[DEBUG] PopupAd: Error processing ad code:', error);
      }
    }
  }, [adCode, hasLoaded]);

  // This component doesn't render anything in the React tree (like WordPress header.php)
  return null;
};

export default PopupAd;