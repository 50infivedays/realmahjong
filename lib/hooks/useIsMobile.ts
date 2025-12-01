import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
      
      // 1. Check for mobile User Agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(userAgent);

      // 2. Check for touch points (indicates touch device, usually mobile/tablet)
      const hasTouch = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || 
                       (typeof window !== 'undefined' && 'ontouchstart' in window);

      // 3. Screen width fallback (standard mobile breakpoint)
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

      // Combine checks: UA is strongest signal, but fallback to touch+width
      // We prioritize UA because some desktop laptops have touch screens.
      // If it's a small screen AND touch, it's definitely mobile.
      // If it has a mobile UA, it's mobile.
      
      if (isMobileUA) {
          return true;
      }
      
      if (hasTouch && isSmallScreen) {
          return true;
      }

      return false;
    };

    setIsMobile(checkMobile());

    // Optional: Re-check on resize if we rely on width
    const handleResize = () => {
        setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

