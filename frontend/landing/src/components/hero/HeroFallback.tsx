import React from 'react';

interface HeroFallbackProps {
  progress: number; // 0 to 1
  className?: string;
}

export const HeroFallback: React.FC<HeroFallbackProps> = ({ progress, className = '' }) => {
  // Normalize progress into distinct transformation phases:
  // 0.00 - 0.20: Fully assembled tap
  // 0.20 - 0.55: Gradual component separation (exploded view)
  // 0.55 - 0.80: Hold inspection view
  // 0.80 - 1.00: Reassembly back into complete tap

  let explosionFactor = 0;
  if (progress >= 0.2 && progress <= 0.55) {
    explosionFactor = (progress - 0.2) / 0.35; // 0 -> 1
  } else if (progress > 0.55 && progress <= 0.8) {
    explosionFactor = 1;
  } else if (progress > 0.8) {
    explosionFactor = Math.max(0, 1 - (progress - 0.8) / 0.2); // 1 -> 0
  }

  // Component displacement offsets along optical axes (in SVG units)
  const handleLiftY = explosionFactor * -85;
  const bonnetLiftY = explosionFactor * -55;
  const cartridgeLiftY = explosionFactor * -30;
  const aeratorDropY = explosionFactor * 50;
  const annotationOpacity = explosionFactor;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center select-none ${className}`}>
      {/* Soft studio lighting ambient backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[90%] max-w-[520px] h-[75%] rounded-full bg-gradient-to-tr from-purple-pale/70 via-purple-pale/25 to-transparent blur-3xl opacity-80" />
        <div className="w-[60%] max-w-[340px] h-[50%] rounded-full bg-surface-white/60 blur-xl" />
      </div>

      {/* Architectural Tap Stage */}
      <svg
        viewBox="60 110 720 630"
        className="w-full h-full max-h-[540px] drop-shadow-elevated transition-transform duration-100 ease-out"
        aria-label="Flowtop Architectural Basin Mixer Interactive Representation"
      >
        <defs>
          {/* Subtle Metallic Chrome Gradients */}
          <linearGradient id="chromeBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C8C2D2" />
            <stop offset="20%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#B4ACC0" />
            <stop offset="70%" stopColor="#E4DFEC" />
            <stop offset="90%" stopColor="#988FA6" />
            <stop offset="100%" stopColor="#7E748C" />
          </linearGradient>

          <linearGradient id="chromeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#BDB6C8" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="cartridgeCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5B2A86" />
            <stop offset="35%" stopColor="#8C5BAE" />
            <stop offset="65%" stopColor="#6C359B" />
            <stop offset="100%" stopColor="#3F1663" />
          </linearGradient>

          <linearGradient id="brassStem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#F3E5AB" />
            <stop offset="100%" stopColor="#AA820A" />
          </linearGradient>

          <linearGradient id="aeratorMetal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#71717A" />
            <stop offset="50%" stopColor="#E4E4E7" />
            <stop offset="100%" stopColor="#52525B" />
          </linearGradient>

          <filter id="tapShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="14" stdDeviation="10" floodColor="#16121C" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Countertop Studio Shadow */}
        <ellipse cx="400" cy="710" rx="210" ry="22" fill="#16121C" fillOpacity="0.05" />
        <ellipse cx="400" cy="705" rx="130" ry="12" fill="#16121C" fillOpacity="0.08" />

        {/* Base Deck Escutcheon */}
        <g id="base-flange">
          <path
            d="M 320 670 C 320 660, 480 660, 480 670 L 485 695 C 485 704, 315 704, 315 695 Z"
            fill="url(#chromeBody)"
            stroke="#9E96AA"
            strokeWidth="1.2"
          />
          <ellipse cx="400" cy="670" rx="80" ry="9" fill="url(#chromeHighlight)" />
        </g>

        {/* Monobloc Cast Brass Body */}
        <g id="tap-monobloc-body" filter="url(#tapShadow)">
          {/* Main Cylindrical Column */}
          <path
            d="M 345 670 
               L 345 370 
               C 345 342, 360 322, 390 312
               L 410 312
               C 440 322, 455 342, 455 370
               L 455 670
               Z"
            fill="url(#chromeBody)"
            stroke="#8C8596"
            strokeWidth="1.2"
          />

          {/* Architectural Curved Spout */}
          <path
            d="M 425 410 
               C 485 410, 565 425, 595 470
               C 605 485, 610 515, 605 545
               L 575 545
               C 580 520, 575 498, 565 485
               C 545 455, 475 445, 425 445
               Z"
            fill="url(#chromeBody)"
            stroke="#8C8596"
            strokeWidth="1.2"
          />

          {/* Spout Collar Housing */}
          <rect
            x="575"
            y="543"
            width="30"
            height="14"
            rx="2"
            fill="url(#chromeHighlight)"
            stroke="#8C8596"
            strokeWidth="1"
          />
        </g>

        {/* Separating Aerator Collar (Drops Downward) */}
        <g id="spout-aerator" transform={`translate(0, ${aeratorDropY})`} className="transition-transform duration-75">
          {explosionFactor > 0.15 && (
            <line
              x1="590"
              y1="557"
              x2="590"
              y2={557 + aeratorDropY}
              stroke="#9B6FC4"
              strokeDasharray="3 3"
              strokeWidth="1.2"
              opacity={annotationOpacity}
            />
          )}
          <rect
            x="577"
            y="558"
            width="26"
            height="18"
            rx="2.5"
            fill="url(#aeratorMetal)"
            stroke="#52525B"
            strokeWidth="1"
          />
        </g>

        {/* Internal Ceramic Disc Cartridge (Slides Upward) */}
        <g id="cartridge-core" transform={`translate(0, ${cartridgeLiftY})`} className="transition-transform duration-75">
          {explosionFactor > 0.15 && (
            <line
              x1="400"
              y1="310"
              x2="400"
              y2={310 + cartridgeLiftY}
              stroke="#9B6FC4"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              opacity={annotationOpacity}
            />
          )}

          {/* Cartridge Cylinder */}
          <rect
            x="368"
            y="278"
            width="64"
            height="56"
            rx="4"
            fill="url(#cartridgeCore)"
            stroke="#5B2A86"
            strokeWidth="1.2"
            filter="url(#tapShadow)"
          />

          {/* Brass Spindle Stem */}
          <rect
            x="392"
            y="254"
            width="16"
            height="26"
            rx="2"
            fill="url(#brassStem)"
            stroke="#AA820A"
            strokeWidth="1"
          />
        </g>

        {/* Retaining Bonnet Collar (Lifts Upward) */}
        <g id="bonnet-collar" transform={`translate(0, ${bonnetLiftY})`} className="transition-transform duration-75">
          <path
            d="M 360 270 C 360 262, 440 262, 440 270 L 438 285 C 438 290, 362 290, 362 285 Z"
            fill="url(#chromeBody)"
            stroke="#8C8596"
            strokeWidth="1.2"
          />
          <ellipse cx="400" cy="270" rx="38" ry="6" fill="url(#chromeHighlight)" />
        </g>

        {/* Lever Handle (Lifts Highest) */}
        <g id="lever-handle" transform={`translate(0, ${handleLiftY})`} className="transition-transform duration-75">
          <path
            d="M 370 245 C 370 230, 430 230, 430 245 L 432 265 C 432 272, 368 272, 368 265 Z"
            fill="url(#chromeBody)"
            stroke="#8C8596"
            strokeWidth="1.2"
          />
          <path
            d="M 400 232 
               L 255 220 
               C 245 219, 245 228, 255 231 
               L 400 245 
               Z"
            fill="url(#chromeHighlight)"
            stroke="#8C8596"
            strokeWidth="1.2"
          />
          <ellipse cx="400" cy="235" rx="14" ry="4" fill="#9B6FC4" fillOpacity="0.3" />
        </g>

        {/* Elegant Architectural Component Callouts */}
        {explosionFactor > 0.25 && (
          <g opacity={annotationOpacity} className="transition-opacity duration-300">
            {/* Handle Callout */}
            <g transform={`translate(0, ${handleLiftY})`}>
              <line x1="250" y1="225" x2="160" y2="210" stroke="#5B2A86" strokeWidth="1" />
              <circle cx="160" cy="210" r="2.5" fill="#5B2A86" />
              <rect x="52" y="198" width="102" height="24" rx="3" fill="#FFFFFF" stroke="#EAE6F0" />
              <text x="103" y="214" fontSize="10" fontWeight="600" fill="#16121C" textAnchor="middle">
                Lever Handle
              </text>
            </g>

            {/* Cartridge Callout */}
            <g transform={`translate(0, ${cartridgeLiftY})`}>
              <line x1="432" y1="305" x2="540" y2="270" stroke="#5B2A86" strokeWidth="1" />
              <circle cx="540" cy="270" r="2.5" fill="#5B2A86" />
              <rect x="546" y="258" width="120" height="24" rx="3" fill="#FFFFFF" stroke="#EAE6F0" />
              <text x="606" y="274" fontSize="10" fontWeight="600" fill="#5B2A86" textAnchor="middle">
                Ceramic Core Cartridge
              </text>
            </g>

            {/* Aerator Callout */}
            <g transform={`translate(0, ${aeratorDropY})`}>
              <line x1="605" y1="568" x2="670" y2="585" stroke="#5B2A86" strokeWidth="1" />
              <circle cx="670" cy="585" r="2.5" fill="#5B2A86" />
              <rect x="676" y="573" width="98" height="24" rx="3" fill="#FFFFFF" stroke="#EAE6F0" />
              <text x="725" y="589" fontSize="10" fontWeight="600" fill="#16121C" textAnchor="middle">
                Spout Aerator
              </text>
            </g>

            {/* Monobloc Cast Body Callout */}
            <g>
              <line x1="345" y1="520" x2="235" y2="520" stroke="#5B2A86" strokeWidth="1" />
              <circle cx="235" cy="520" r="2.5" fill="#5B2A86" />
              <rect x="110" y="508" width="120" height="24" rx="3" fill="#FFFFFF" stroke="#EAE6F0" />
              <text x="170" y="524" fontSize="10" fontWeight="600" fill="#16121C" textAnchor="middle">
                Solid Monobloc Body
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
