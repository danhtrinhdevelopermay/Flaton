import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

export default function AdUnit({ adSlot, adFormat = 'auto', className = '', style = {} }: AdUnitProps) {
  const { theme } = useTheme();

  useEffect(() => {
    try {
      if (window.adsbygoogle && window.adsbygoogle.length > 0) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [adSlot]);

  return (
    <div 
      className={`ad-unit-wrapper ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        ...style
      }}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          minHeight: '20px',
          opacity: theme === 'dark' ? 0.9 : 1,
          filter: theme === 'dark' ? 'brightness(0.95)' : 'none'
        }}
        data-ad-client="ca-pub-8424336333856698"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}

// Declare global window interface
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
