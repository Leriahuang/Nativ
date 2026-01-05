
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 200 }) => {
  return (
    <div 
      className={`flex items-center justify-center transition-all duration-500 ${className}`} 
      style={{ width: size, height: 'auto' }}
    >
      <img 
        src="logo.png" 
        alt="Speak Like Native Logo" 
        className="w-full h-auto object-contain"
        loading="eager"
        style={{ maxWidth: '100%' }}
        onError={(e) => {
          // Robust fallback if logo.png is missing: renders a stylized text logo
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = '<div class="font-black text-3xl tracking-tighter text-[#1C1C1E] py-4 border-y-4 border-[#FFD60A]">NATIVE</div>';
          }
        }}
      />
    </div>
  );
};

export default Logo;
