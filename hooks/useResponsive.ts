import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function useResponsive() {
  const { setIsMobile } = useStore();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);
}

