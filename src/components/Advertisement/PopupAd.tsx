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

  // Execute the ad code directly - like WordPress header.php injection
  useEffect(() => {
    if (adCode && hasLoaded) {
      console.log('[DEBUG] PopupAd: Starting script execution...');

      try {
        // Create a temporary container to parse the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = adCode;

        // Add debug event listeners first
        const events = ['click', 'mouseover', 'mouseout', 'mousemove', 'scroll', 'keydown', 'touchstart', 'resize'];
        events.forEach(evt => {
          const listener = (e: Event) => {
            console.log(`[DEBUG] PopupAd: User triggered event: ${evt} at ${new Date().toISOString()}`);
          };
          window.addEventListener(evt, listener, { passive: true });
        });

        // Handle external scripts (with src attribute)
        const externalScripts = tempContainer.querySelectorAll('script[src]');
        const inlineScripts = tempContainer.querySelectorAll('script:not([src])');

        let scriptsLoaded = 0;
        const totalScripts = externalScripts.length;

        const executeInlineScripts = () => {
          console.log('[DEBUG] PopupAd: Executing inline scripts...');
          inlineScripts.forEach((script, index) => {
            if (script.innerHTML.trim()) {
              console.log(`[DEBUG] PopupAd: Executing inline script ${index + 1}:`, script.innerHTML);
              try {
                // Execute inline script in global scope
                eval(script.innerHTML);
                console.log(`[DEBUG] PopupAd: Inline script ${index + 1} executed successfully`);
              } catch (error) {
                console.error(`[DEBUG] PopupAd: Error executing inline script ${index + 1}:`, error);
              }
            }
          });
        };

        if (totalScripts === 0) {
          // No external scripts, just execute inline scripts
          console.log('[DEBUG] PopupAd: No external scripts, executing inline scripts');
          executeInlineScripts();
        } else {
          // Load external scripts first
          externalScripts.forEach((script, index) => {
            const src = script.getAttribute('src');
            if (src) {
              console.log(`[DEBUG] PopupAd: Loading external script ${index + 1}:`, src);

              // Check if script already loaded
              const existingScript = document.head.querySelector(`script[src*="${src}"]`);
              if (existingScript) {
                console.log(`[DEBUG] PopupAd: Script already loaded:`, src);
                scriptsLoaded++;
                if (scriptsLoaded === totalScripts) {
                  setTimeout(executeInlineScripts, 100);
                }
                return;
              }

              // Create new script element
              const newScript = document.createElement('script');
              newScript.src = src;
              newScript.type = 'text/javascript';

              // Copy attributes from original script
              Array.from(script.attributes).forEach(attr => {
                if (attr.name !== 'src') {
                  newScript.setAttribute(attr.name, attr.value);
                }
              });

              newScript.onload = () => {
                console.log(`[DEBUG] PopupAd: External script ${index + 1} loaded and executed:`, src);
                console.log(`[DEBUG] PopupAd: Window functions after load:`, Object.keys(window).filter(key => 
                  typeof window[key] === 'function' && key.toLowerCase().includes('analytics')
                ));

                scriptsLoaded++;
                if (scriptsLoaded === totalScripts) {
                  // Wait a bit for the external script to initialize
                  setTimeout(executeInlineScripts, 200);
                }
              };

              newScript.onerror = (error) => {
                console.error(`[DEBUG] PopupAd: Failed to load external script ${index + 1}:`, src, error);
                scriptsLoaded++;
                if (scriptsLoaded === totalScripts) {
                  setTimeout(executeInlineScripts, 100);
                }
              };

              // Append to head to execute
              document.head.appendChild(newScript);
              console.log(`[DEBUG] PopupAd: External script ${index + 1} injected to head`);
            }
          });
        }

        // Set global variables for compatibility
        window.nexjobAd = {
          loaded: true,
          timestamp: Date.now(),
          debug: true
        };

        console.log('[DEBUG] PopupAd: Script setup completed');

      } catch (error) {
        console.error('[DEBUG] PopupAd: Error setting up scripts:', error);
      }
    }
  }, [adCode, hasLoaded]);

  // Component renders nothing (like WordPress header.php)
  return null;
};

export default PopupAd;