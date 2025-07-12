
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

  // Execute the ad code properly
  useEffect(() => {
    if (adCode && hasLoaded) {
      console.log('Processing popup ad code:', adCode);
      
      // Create a temporary container to parse the HTML
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = adCode;
      
      // Handle external script tags with src attribute
      const externalScripts = tempContainer.querySelectorAll('script[src]');
      externalScripts.forEach((script) => {
        const newScript = document.createElement('script');
        const src = script.getAttribute('src');
        
        if (src) {
          console.log('Loading external script:', src);
          newScript.src = src;
          
          // Copy other attributes
          Array.from(script.attributes).forEach(attr => {
            if (attr.name !== 'src') {
              newScript.setAttribute(attr.name, attr.value);
            }
          });
          
          // Add load and error handlers
          newScript.onload = () => {
            console.log('External script loaded successfully:', src);
          };
          
          newScript.onerror = () => {
            console.error('Failed to load external script:', src);
          };
          
          // Append to document head to execute
          document.head.appendChild(newScript);
        }
      });
      
      // Handle inline script tags
      const inlineScripts = tempContainer.querySelectorAll('script:not([src])');
      inlineScripts.forEach((script) => {
        if (script.innerHTML.trim()) {
          console.log('Executing inline script:', script.innerHTML);
          try {
            // Create new script element for inline scripts
            const newScript = document.createElement('script');
            newScript.textContent = script.innerHTML;
            
            // Copy attributes
            Array.from(script.attributes).forEach(attr => {
              newScript.setAttribute(attr.name, attr.value);
            });
            
            document.head.appendChild(newScript);
            
            // Clean up after a short delay
            setTimeout(() => {
              if (document.head.contains(newScript)) {
                document.head.removeChild(newScript);
              }
            }, 1000);
          } catch (error) {
            console.error('Error executing inline script:', error);
          }
        }
      });
      
      // Handle non-script HTML content (images, divs, etc.)
      const nonScriptElements = Array.from(tempContainer.children).filter(
        el => el.tagName.toLowerCase() !== 'script'
      );
      
      if (nonScriptElements.length > 0) {
        console.log('Processing HTML content elements:', nonScriptElements.length);
        
        // Create a visible container for HTML content if it exists
        const htmlContainer = document.createElement('div');
        htmlContainer.style.position = 'fixed';
        htmlContainer.style.top = '20px';
        htmlContainer.style.right = '20px';
        htmlContainer.style.zIndex = '9999';
        htmlContainer.style.backgroundColor = 'white';
        htmlContainer.style.padding = '10px';
        htmlContainer.style.border = '1px solid #ccc';
        htmlContainer.style.borderRadius = '8px';
        htmlContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        htmlContainer.style.maxWidth = '300px';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '18px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#666';
        
        closeButton.onclick = () => {
          if (document.body.contains(htmlContainer)) {
            document.body.removeChild(htmlContainer);
          }
        };
        
        // Add advertisement label
        const adLabel = document.createElement('div');
        adLabel.textContent = 'Advertisement';
        adLabel.style.fontSize = '10px';
        adLabel.style.color = '#666';
        adLabel.style.marginBottom = '8px';
        adLabel.style.textAlign = 'center';
        
        htmlContainer.appendChild(closeButton);
        htmlContainer.appendChild(adLabel);
        
        // Add the HTML content
        nonScriptElements.forEach(element => {
          htmlContainer.appendChild(element.cloneNode(true));
        });
        
        // Append to body
        document.body.appendChild(htmlContainer);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
          if (document.body.contains(htmlContainer)) {
            document.body.removeChild(htmlContainer);
          }
        }, 30000);
      }
    }
  }, [adCode, hasLoaded]);

  // This component doesn't render anything in the React tree
  return null;
};

export default PopupAd;
