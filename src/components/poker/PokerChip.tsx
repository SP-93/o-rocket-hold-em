import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PokerChipProps {
  value: 1 | 5 | 25 | 100 | 500;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const chipColors = {
  1: {
    primary: 'from-slate-100 to-slate-200',
    secondary: 'bg-slate-300',
    accent: 'border-slate-400',
    text: 'text-slate-700',
    glow: 'shadow-slate-300/50',
  },
  5: {
    primary: 'from-red-500 to-red-600',
    secondary: 'bg-red-400',
    accent: 'border-red-300',
    text: 'text-white',
    glow: 'shadow-red-500/50',
  },
  25: {
    primary: 'from-emerald-500 to-emerald-600',
    secondary: 'bg-emerald-400',
    accent: 'border-emerald-300',
    text: 'text-white',
    glow: 'shadow-emerald-500/50',
  },
  100: {
    primary: 'from-slate-800 to-slate-900',
    secondary: 'bg-slate-700',
    accent: 'border-slate-600',
    text: 'text-white',
    glow: 'shadow-slate-800/50',
  },
  500: {
    primary: 'from-purple-500 to-purple-600',
    secondary: 'bg-purple-400',
    accent: 'border-purple-300',
    text: 'text-white',
    glow: 'shadow-purple-500/50',
  },
};

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const textSizes = {
  sm: 'text-[8px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export function PokerChip({ value, size = 'md', className, animate = false }: PokerChipProps) {
  const colors = chipColors[value];
  const sizeClass = sizes[size];
  const textSize = textSizes[size];

  const ChipContent = (
    <div className={cn(
      "relative rounded-full",
      sizeClass,
      className
    )}>
      {/* Outer ring with gradient */}
      <div className={cn(
        "absolute inset-0 rounded-full bg-gradient-to-b",
        colors.primary,
        "shadow-lg",
        colors.glow
      )} />
      
      {/* Edge dashes (poker chip pattern) */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-[4px] rounded-full",
              value === 1 ? 'bg-slate-500' : 'bg-white/80'
            )}
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: 'center',
              transform: `rotate(${i * 30}deg) translateX(-50%) translateY(-200%)`,
            }}
          />
        ))}
      </div>
      
      {/* Inner circle */}
      <div className={cn(
        "absolute inset-[15%] rounded-full border-2",
        colors.accent,
        "bg-gradient-to-b",
        colors.primary
      )}>
        {/* Inner decorative ring */}
        <div className={cn(
          "absolute inset-[10%] rounded-full border",
          colors.accent,
          "opacity-50"
        )} />
      </div>
      
      {/* Center value */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        colors.text,
        textSize,
        "font-bold font-display"
      )}>
        ${value}
      </div>
      
      {/* Top shine */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent" />
      
      {/* 3D edge shadow */}
      <div className="absolute inset-0 rounded-full shadow-inner" style={{
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
      }} />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{
          y: [0, -5, 0],
          rotateY: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {ChipContent}
      </motion.div>
    );
  }

  return ChipContent;
}

// Stack of chips for decorative use
interface PokerChipStackProps {
  chips: Array<{ value: 1 | 5 | 25 | 100 | 500; count: number }>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PokerChipStack({ chips, size = 'md', className }: PokerChipStackProps) {
  const stackOffset = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
  
  return (
    <div className={cn("relative", className)}>
      {chips.flatMap((chip, chipIndex) =>
        [...Array(Math.min(chip.count, 5))].map((_, i) => (
          <div
            key={`${chip.value}-${i}`}
            className="absolute"
            style={{
              bottom: `${(chipIndex * chip.count + i) * stackOffset}px`,
              zIndex: chipIndex * chip.count + i,
            }}
          >
            <PokerChip value={chip.value} size={size} />
          </div>
        ))
      )}
    </div>
  );
}
