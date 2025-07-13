
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

  // Execute the ad code directly in head (like WordPress header.php)
  useEffect(() => {
    if (adCode && hasLoaded) {
      console.log('[DEBUG] PopupAd: Starting script execution process...');

      try {
        // Create global environment that scripts might expect
        window.adCode = adCode;
        window.nexjobAd = {
          code: adCode,
          loaded: true,
          debug: true,
          timestamp: Date.now()
        };

        // Add comprehensive event listeners for debugging
        const events = ['click', 'mouseover', 'mouseout', 'mousemove', 'scroll', 'keydown', 'touchstart', 'resize', 'load', 'DOMContentLoaded'];
        events.forEach(evt => {
          const listener = (e: Event) => {
            console.log(`[DEBUG] PopupAd: User triggered event: ${evt} at ${new Date().toISOString()}`);
            // Make event available globally for external scripts
            window.lastTriggeredEvent = { type: evt, timestamp: Date.now(), target: e.target };
          };
          window.addEventListener(evt, listener, { passive: true });
        });

        // Parse and execute the ad code
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = adCode;

        // Handle external scripts first
        const externalScripts = tempContainer.querySelectorAll('script[src]');
        let externalScriptsLoaded = 0;
        const totalExternalScripts = externalScripts.length;

        const executeInlineScripts = () => {
          console.log('[DEBUG] PopupAd: All external scripts loaded, executing inline scripts...');
          
          // Handle inline scripts
          const inlineScripts = tempContainer.querySelectorAll('script:not([src])');
          inlineScripts.forEach((script, index) => {
            if (script.innerHTML.trim()) {
              console.log(`[DEBUG] PopupAd: Executing inline script ${index + 1}:`, script.innerHTML);
              
              try {
                // Execute in global scope with proper context
                const scriptContent = script.innerHTML;
                const scriptElement = document.createElement('script');
                scriptElement.textContent = `
                  console.log('[DEBUG] PopupAd: Inline script ${index + 1} execution started');
                  try {
                    ${scriptContent}
                    console.log('[DEBUG] PopupAd: Inline script ${index + 1} executed successfully');
                  } catch (error) {
                    console.error('[DEBUG] PopupAd: Error in inline script ${index + 1}:', error);
                  }
                `;
                
                // Copy attributes
                Array.from(script.attributes).forEach(attr => {
                  scriptElement.setAttribute(attr.name, attr.value);
                });
                
                // Append to head for execution
                document.head.appendChild(scriptElement);
                console.log(`[DEBUG] PopupAd: Inline script ${index + 1} injected to head`);
                
              } catch (error) {
                console.error(`[DEBUG] PopupAd: Failed to execute inline script ${index + 1}:`, error);
              }
            }
          });

          // Trigger custom events to notify external scripts
          console.log('[DEBUG] PopupAd: Triggering nexjobAdReady event');
          window.dispatchEvent(new CustomEvent('nexjobAdReady', { 
            detail: { 
              adCode: adCode,
              timestamp: Date.now(),
              allScriptsLoaded: true
            }
          }));

          // Also trigger DOMContentLoaded if needed
          setTimeout(() => {
            console.log('[DEBUG] PopupAd: Triggering secondary events for script compatibility');
            window.dispatchEvent(new Event('load'));
            document.dispatchEvent(new Event('DOMContentLoaded'));
          }, 100);
        };

        if (totalExternalScripts === 0) {
          console.log('[DEBUG] PopupAd: No external scripts found, executing inline scripts immediately');
          executeInlineScripts();
        } else {
          // Load external scripts
          externalScripts.forEach((script, index) => {
            const src = script.getAttribute('src');
            if (src) {
              console.log(`[DEBUG] PopupAd: Loading external script ${index + 1}:`, src);

              // Check if script already exists
              const existingScript = document.head.querySelector(`script[src="${src}"]`);
              if (existingScript) {
                console.log(`[DEBUG] PopupAd: Script already exists, considering it loaded:`, src);
                externalScriptsLoaded++;
                if (externalScriptsLoaded === totalExternalScripts) {
                  executeInlineScripts();
                }
                return;
              }

              const newScript = document.createElement('script');
              newScript.src = src;
              
              // Copy attributes
              Array.from(script.attributes).forEach(attr => {
                if (attr.name !== 'src') {
                  newScript.setAttribute(attr.name, attr.value);
                }
              });

              newScript.onload = () => {
                console.log(`[DEBUG] PopupAd: External script ${index + 1} loaded successfully:`, src);
                console.log(`[DEBUG] PopupAd: Available window functions:`, Object.keys(window).filter(key => 
                  typeof window[key] === 'function' && (key.includes('ad') || key.includes('Ad') || key.includes('popup') || key.includes('analytics'))
                ));
                
                externalScriptsLoaded++;
                if (externalScriptsLoaded === totalExternalScripts) {
                  // Wait a bit for script to initialize
                  setTimeout(executeInlineScripts, 200);
                }
              };

              newScript.onerror = () => {
                console.error(`[DEBUG] PopupAd: Failed to load external script ${index + 1}:`, src);
                externalScriptsLoaded++;
                if (externalScriptsLoaded === totalExternalScripts) {
                  executeInlineScripts();
                }
              };

              // Append to head
              document.head.appendChild(newScript);
            }
          });
        }

        // Force execution after a timeout as fallback
        setTimeout(() => {
          console.log('[DEBUG] PopupAd: Fallback execution after 5 seconds');
          if (window.nexjobAd && !window.nexjobAd.executed) {
            console.log('[DEBUG] PopupAd: Scripts may not have executed properly, trying direct execution');
            window.nexjobAd.executed = true;
            
            // Try to execute any remaining inline scripts directly
            const remainingScripts = tempContainer.querySelectorAll('script:not([src])');
            remainingScripts.forEach((script, index) => {
              if (script.innerHTML.trim()) {
                try {
                  console.log(`[DEBUG] PopupAd: Fallback execution of script ${index + 1}`);
                  // Direct evaluation
                  eval(script.innerHTML);
                } catch (error) {
                  console.error(`[DEBUG] PopupAd: Fallback execution failed for script ${index + 1}:`, error);
                }
              }
            });
          }
        }, 5000);

        console.log('[DEBUG] PopupAd: Script setup completed, waiting for execution...');

      } catch (error) {
        console.error('[DEBUG] PopupAd: Error setting up ad scripts:', error);
      }
    }
  }, [adCode, hasLoaded]);

  // Component doesn't render anything (like WordPress header.php injection)
  return null;
};

export default PopupAd;
