
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 200 }) => {
  return (
    <div 
      className={`flex items-center justify-center ${className}`} 
      style={{ width: size, height: 'auto' }}
    >
      <img 
        src="logo.png" 
        alt="Native Logo" 
        className="w-full h-auto object-contain transition-opacity duration-300"
        loading="eager"
        onError={(e) => {
          // Fallback UI if the image file is missing
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = '<div class="font-black text-2xl tracking-tighter">NATIVE</div>';
        }}
      />
    </div>
  );
};

export default Logo;
