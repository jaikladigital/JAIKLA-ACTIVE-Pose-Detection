import React from 'react';
import jaiklaPoseLogoImg from '../assets/images/jaikla_pose_logo_1792112419314.jpg';
import jaiklaThumbMarkImg from '../assets/images/jaikla_thumb_mark_1792112438107.jpg';

interface JaiklaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  variant?: 'full' | 'mark-only' | 'stacked' | 'hero';
  thumbnailSrc?: string;
  fullImageSrc?: string;
  onSpecsClick?: () => void;
}

/**
 * High-tech Body Motion Detection Target Reticle (เป้าตรวจจับการเคลื่อนไหวร่างกาย)
 * Communicates real-time AI optical pose tracking, joint keypoints, and kinetic motion.
 */
export const PoseDetectionTargetIcon: React.FC<{
  sizePx?: number;
  className?: string;
  useImage?: boolean;
  imageSrc?: string;
}> = ({
  sizePx = 46,
  className = '',
  useImage = true,
  imageSrc = jaiklaThumbMarkImg,
}) => {
  if (useImage && imageSrc) {
    return (
      <div
        style={{ width: sizePx, height: sizePx }}
        className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-[#06080f] border border-violet-500/60 shadow-[0_0_18px_rgba(139,92,246,0.45),inset_0_0_12px_rgba(139,92,246,0.2)] group transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_24px_rgba(6,182,212,0.65)] ${className}`}
        title="JAIKLA ACTIVE — เป้าตรวจจับการเคลื่อนไหวของร่างกาย"
      >
        <img
          src={imageSrc}
          alt="JAIKLA ACTIVE Target Reticle"
          className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* High-tech targeting HUD corner brackets */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm pointer-events-none" />

        <div className="absolute inset-0 ring-1 ring-inset ring-violet-400/30 rounded-xl pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-[#06080f] border border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.45),inset_0_0_12px_rgba(6,182,212,0.15)] group transition-all duration-300 hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(6,182,212,0.65)] ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <defs>
          {/* Cyan laser gradient */}
          <linearGradient id="targetCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Ultraviolet core gradient */}
          <linearGradient id="targetVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          {/* Keypoint Glow Filter */}
          <filter id="keypointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- 1. HUD TARGETING BRACKETS (4 มุมเป้าตรวจจับ) --- */}
        {/* Top-Left Bracket */}
        <path d="M 10 24 L 10 10 L 24 10" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Top-Right Bracket */}
        <path d="M 90 24 L 90 10 L 76 10" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom-Left Bracket */}
        <path d="M 10 76 L 10 90 L 24 90" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom-Right Bracket */}
        <path d="M 90 76 L 90 90 L 76 90" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* --- 2. CONCENTRIC TARGETING RINGS (วงแหวนเรดาร์เป้าเล็ง) --- */}
        {/* Outer Circular Reticle with dashed sensor calibration */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#00f0ff"
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="4 3"
        />

        {/* Inner Tracking Reticle */}
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="#a855f7"
          strokeWidth="1.2"
          strokeOpacity="0.45"
          strokeDasharray="3 3"
        />

        {/* --- 3. OPTICAL CROSSHAIR AXES (เส้นเล็งเป้าแนวดิ่ง-แนวนอน) --- */}
        {/* Top axis */}
        <line x1="50" y1="5" x2="50" y2="18" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
        {/* Bottom axis */}
        <line x1="50" y1="82" x2="50" y2="95" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
        {/* Left axis */}
        <line x1="5" y1="50" x2="18" y2="50" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />
        {/* Right axis */}
        <line x1="82" y1="50" x2="95" y2="50" stroke="#00f0ff" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Sensor angle quadrant ticks */}
        <line x1="23" y1="23" x2="27" y2="27" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="77" y1="23" x2="73" y2="27" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="23" y1="77" x2="27" y2="73" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="77" y1="77" x2="73" y2="73" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.5" />

        {/* --- 4. HUMAN BODY MOTION POSE & SKELETON (หุ่นจำลองการเคลื่อนไหวสรีระ) --- */}
        {/* Kinetic motion trails (เส้นบอกทิศทางการเคลื่อนไหว) */}
        <path
          d="M 24 38 C 22 42, 24 50, 28 54"
          stroke="#00f0ff"
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="2 2"
        />
        <path
          d="M 76 42 C 78 46, 76 54, 72 58"
          stroke="#a855f7"
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="2 2"
        />

        {/* Spine / Core line */}
        <line x1="50" y1="31" x2="50" y2="54" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />

        {/* Shoulder line */}
        <line x1="37" y1="37" x2="63" y2="37" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" />

        {/* Left Arm (Active dynamic motion) */}
        <polyline points="37,37 29,45 25,39" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Right Arm (Forward velocity motion) */}
        <polyline points="63,37 71,46 76,41" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hip Pelvic line */}
        <line x1="42" y1="54" x2="58" y2="54" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" />

        {/* Left Leg (Flexed athletic stride) */}
        <polyline points="42,54 36,68 33,83" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Right Leg (Ground thrust propulsion) */}
        <polyline points="58,54 64,68 68,83" stroke="#00f0ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* --- 5. REAL-TIME TRACKING KEYPOINTS (จุดข้อต่อตรวจจับแสงนีออน) --- */}
        {/* Head Node */}
        <circle cx="50" cy="25" r="4.5" fill="#ffffff" stroke="#00f0ff" strokeWidth="1.8" filter="url(#keypointGlow)" />

        {/* Shoulders */}
        <circle cx="37" cy="37" r="2.2" fill="#ffffff" filter="url(#keypointGlow)" />
        <circle cx="63" cy="37" r="2.2" fill="#ffffff" filter="url(#keypointGlow)" />

        {/* Elbows */}
        <circle cx="29" cy="45" r="1.8" fill="#00f0ff" />
        <circle cx="71" cy="46" r="1.8" fill="#00f0ff" />

        {/* Wrists */}
        <circle cx="25" cy="39" r="1.8" fill="#ffffff" filter="url(#keypointGlow)" />
        <circle cx="76" cy="41" r="1.8" fill="#ffffff" filter="url(#keypointGlow)" />

        {/* Core Lock Focus (Center Reticle Target) */}
        <circle cx="50" cy="50" r="10" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.8" />
        <circle cx="50" cy="50" r="1.8" fill="#00f0ff" filter="url(#keypointGlow)" />

        {/* Knees */}
        <circle cx="36" cy="68" r="2" fill="#00f0ff" />
        <circle cx="64" cy="68" r="2" fill="#00f0ff" />

        {/* Ankles */}
        <circle cx="33" cy="83" r="2" fill="#ffffff" filter="url(#keypointGlow)" />
        <circle cx="68" cy="83" r="2" fill="#ffffff" filter="url(#keypointGlow)" />
      </svg>

      {/* Glass specular ambient shine */}
      <div className="absolute inset-0 ring-1 ring-inset ring-cyan-400/30 rounded-xl pointer-events-none" />
    </div>
  );
};

export const JaiklaLogo: React.FC<JaiklaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'full',
  thumbnailSrc = jaiklaThumbMarkImg,
  fullImageSrc,
  onSpecsClick,
}) => {
  // Dimension configurations
  const dimensions = {
    xs: {
      iconPx: 32,
      textTop: 'text-sm',
      textActive: 'text-xs',
      textMid: 'text-[9px]',
      textBot: 'text-[7.5px]',
    },
    sm: {
      iconPx: 38,
      textTop: 'text-base',
      textActive: 'text-sm',
      textMid: 'text-[10px]',
      textBot: 'text-[8px]',
    },
    md: {
      iconPx: 46,
      textTop: 'text-base sm:text-lg',
      textActive: 'text-sm sm:text-base',
      textMid: 'text-[10px] sm:text-[11px]',
      textBot: 'text-[8px] sm:text-[9px]',
    },
    lg: {
      iconPx: 60,
      textTop: 'text-xl sm:text-2xl',
      textActive: 'text-lg sm:text-xl',
      textMid: 'text-xs sm:text-sm',
      textBot: 'text-[10px]',
    },
    xl: {
      iconPx: 80,
      textTop: 'text-2xl sm:text-3xl',
      textActive: 'text-xl sm:text-2xl',
      textMid: 'text-sm sm:text-base',
      textBot: 'text-xs',
    },
    '2xl': {
      iconPx: 110,
      textTop: 'text-3xl sm:text-4xl',
      textActive: 'text-2xl sm:text-3xl',
      textMid: 'text-base sm:text-lg',
      textBot: 'text-xs sm:text-sm',
    },
  }[size];

  // Optional custom pre-rendered full image only when explicitly supplied
  if (fullImageSrc) {
    if (variant === 'mark-only' || !showText) {
      return (
        <div
          style={{ width: dimensions.iconPx, height: dimensions.iconPx }}
          className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-[#06080f] border border-violet-500/50 shadow-[0_0_14px_rgba(139,92,246,0.3)] ${className}`}
        >
          <img
            src={thumbnailSrc}
            alt="JAIKLA ACTIVE"
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src={fullImageSrc}
          alt="JAIKLA ACTIVE POSE DETECTION"
          style={{ height: dimensions.iconPx }}
          className="w-auto max-h-full object-contain rounded-lg drop-shadow-[0_0_15px_rgba(139,92,246,0.35)] hover:brightness-110 transition-all cursor-pointer"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // The Motion Detection Target Reticle Thumbnail (Item 4: นำไฟล์ภาพไปทดแทน ทรัมเนลตำแหน่งมุมซ้ายบนของแถบเมนูนำทาง)
  const ThumbnailElement = (
    <PoseDetectionTargetIcon
      sizePx={dimensions.iconPx}
      useImage={true}
      imageSrc={thumbnailSrc}
    />
  );

  if (variant === 'mark-only' || !showText) {
    return <div className={`inline-flex items-center ${className}`}>{ThumbnailElement}</div>;
  }

  // Hero Display (Large format for modals and splash screens)
  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center gap-3.5 ${className}`}>
        <PoseDetectionTargetIcon sizePx={dimensions.iconPx * 1.5} />
        <div className="flex flex-col items-center">
          {/* Line 1: JAIKLA ACTIVE (Top line, largest size) */}
          <div className="flex items-center gap-2.5">
            <span className="tracking-[0.18em] font-black font-hud text-3xl sm:text-4xl text-white drop-shadow-[0_0_15px_rgba(139,92,246,0.65)]">
              JAIKLA
            </span>
            <span className="tracking-[0.2em] font-black font-hud text-2xl sm:text-3xl text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.85)]">
              ACTIVE
            </span>
          </div>

          {/* Line 2: POSE DETECTION (Middle line, smaller size) */}
          <div className="mt-1">
            <span className="text-sm sm:text-base tracking-[0.28em] uppercase font-bold text-violet-300 font-mono">
              POSE DETECTION
            </span>
          </div>

          {/* Line 3: MOVE BETTER · LIVE BETTER (Bottom line, smallest size) */}
          <div className="mt-1">
            <span className="text-[10px] sm:text-xs tracking-[0.28em] uppercase font-medium text-slate-400 font-mono">
              MOVE BETTER · LIVE BETTER
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Stacked Layout (e.g. Centered Cards)
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {ThumbnailElement}
        <div className="flex flex-col items-center">
          {/* Line 1: JAIKLA ACTIVE (Top line, largest size) */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="tracking-[0.16em] font-black font-hud text-base sm:text-lg text-white drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]">
              JAIKLA
            </span>
            <span className="tracking-[0.18em] font-black font-hud text-sm sm:text-base text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.7)]">
              ACTIVE
            </span>
          </div>

          {/* Line 2: POSE DETECTION (Middle line, smaller size) */}
          <div className="leading-tight mt-1">
            <span className="text-[10px] sm:text-[11px] tracking-[0.22em] uppercase font-bold text-violet-300 font-mono">
              POSE DETECTION
            </span>
          </div>

          {/* Line 3: MOVE BETTER · LIVE BETTER (Bottom line, smallest size) */}
          <div className="leading-none mt-1">
            <span className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase font-medium text-slate-400 font-mono">
              MOVE BETTER · LIVE BETTER
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full Horizontal Lockup (Navbar & Headers)
  // Strictly adhering to:
  // Line 1: JAIKLA ACTIVE (Top line, largest font)
  // Line 2: POSE DETECTION (Middle line, smaller font)
  // Line 3: MOVE BETTER · LIVE BETTER (Bottom line, smallest font)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {ThumbnailElement}

      <div className="flex flex-col justify-center">
        {/* Line 1: JAIKLA ACTIVE (Top line, largest font size) */}
        <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
          <span className={`tracking-[0.16em] font-black font-hud ${dimensions.textTop} text-white drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]`}>
            JAIKLA
          </span>
          <span className={`tracking-[0.18em] font-black font-hud ${dimensions.textActive} text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.75)]`}>
            ACTIVE
          </span>
        </div>

        {/* Line 2: POSE DETECTION (Middle line, smaller font size) */}
        <div className="leading-tight mt-1">
          <span className={`${dimensions.textMid} tracking-[0.22em] uppercase font-bold text-violet-300/95 font-mono block`}>
            POSE DETECTION
          </span>
        </div>

        {/* Line 3: MOVE BETTER · LIVE BETTER (Bottom line, smallest font size) */}
        <div className="leading-none mt-1">
          <span className={`${dimensions.textBot} tracking-[0.2em] uppercase font-medium text-slate-400 font-mono block`}>
            MOVE BETTER · LIVE BETTER
          </span>
        </div>
      </div>
    </div>
  );
};
