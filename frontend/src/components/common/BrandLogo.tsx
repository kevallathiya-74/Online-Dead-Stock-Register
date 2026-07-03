import React from 'react';

type LogoVariant = 'default' | 'white' | 'mark' | 'mark-white';

interface BrandLogoProps {
  variant?: LogoVariant;
  className?: string;
  width?: number | string;
  height?: number | string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant = 'default', 
  className = '', 
  width, 
  height 
}) => {
  let src = '/logo.svg';
  let defaultWidth = 120;
  
  switch (variant) {
    case 'white':
      src = '/logo-white.svg';
      defaultWidth = 120;
      break;
    case 'mark':
      src = '/logo-mark.svg';
      defaultWidth = 40;
      break;
    case 'mark-white':
      src = '/logo-mark.svg'; // Usually just a symbol, we can use the same symbol or a white symbol if we had one
      defaultWidth = 40;
      break;
    default:
      src = '/logo.svg';
      defaultWidth = 120;
  }

  return (
    <img 
      src={src} 
      alt="DSR Logo" 
      className={`object-contain ${className}`}
      width={width || defaultWidth}
      height={height || 'auto'}
      style={{ minWidth: width || defaultWidth }}
    />
  );
};

export default BrandLogo;
