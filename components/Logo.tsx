
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 200, showText = true }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size * 1.2 }}>
      <svg viewBox="0 0 400 500" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Small floating elements */}
        <circle cx="80" cy="140" r="12" stroke="black" strokeWidth="6" />
        <circle cx="320" cy="140" r="12" stroke="black" strokeWidth="6" />
        
        {/* Flower/Sun Icon at top */}
        <g transform="translate(200, 80)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="0" y1="15" x2="0" y2="30"
              stroke="black" strokeWidth="6" strokeLinecap="round"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="4" fill="black" />
        </g>

        {/* Floating small bubbles */}
        <path d="M120 60 Q 140 40 160 60 L 145 80 Z" fill="black" transform="rotate(-15 140 60)" />
        <path d="M280 60 Q 260 40 240 60 L 255 80 Z" fill="black" transform="rotate(15 260 60)" />

        {/* Main Speech Bubble */}
        <path 
          d="M60 180 C 60 130, 340 130, 340 230 C 340 330, 200 330, 160 380 C 150 330, 60 330, 60 230 Z" 
          fill="black" 
        />
        
        {showText && (
          <g className="font-black">
            <text x="200" y="210" textAnchor="middle" fill="white" style={{ fontSize: '42px', fontFamily: 'Inter, sans-serif' }}>SPEAK</text>
            <text x="200" y="245" textAnchor="middle" fill="white" style={{ fontSize: '24px', fontFamily: 'Inter, sans-serif' }}>LIKE</text>
            <text x="200" y="290" textAnchor="middle" fill="white" style={{ fontSize: '48px', fontFamily: 'Inter, sans-serif' }}>NATIVE</text>
          </g>
        )}

        {/* Mascot Character */}
        <g transform="translate(140, 370)">
          {/* Arms */}
          <path d="M10 40 Q -30 10 -40 -10" stroke="black" strokeWidth="12" strokeLinecap="round" />
          <path d="M110 40 Q 150 10 160 -10" stroke="black" strokeWidth="12" strokeLinecap="round" />
          
          {/* Body */}
          <path d="M20 120 C 20 50, 100 50, 100 120 L 110 230 L 10 230 Z" fill="black" />
          
          {/* Striped pattern on pants area */}
          <g stroke="white" strokeWidth="2" strokeLinecap="round">
            {[30, 45, 60, 75, 90].map(x => (
              <line key={x} x1={x} y1="180" x2={x} y2="220" />
            ))}
          </g>

          {/* Eyes (4 dots) */}
          <circle cx="45" cy="95" r="4" fill="white" />
          <circle cx="75" cy="95" r="4" fill="white" />
          <circle cx="60" cy="105" r="4" fill="white" />
          <circle cx="60" cy="88" r="4" fill="white" />

          {/* Feet */}
          <path d="M10 230 L -10 240 L 40 240 L 40 230 Z" fill="black" />
          <path d="M110 230 L 130 240 L 80 240 L 80 230 Z" fill="black" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
