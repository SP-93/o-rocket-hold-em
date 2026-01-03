import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PotDisplayProps {
  pot: number;
  sidePots?: number[];
}

// Chip stack animation component
function ChipStack({ amount, delay = 0 }: { amount: number; delay?: number }) {
  const chipCount = Math.min(Math.ceil(amount / 100), 5);
  const chipColors = ['bg-chip-red', 'bg-chip-blue', 'bg-chip-green', 'bg-poker-gold', 'bg-chip-black'];

  return (
    <div className="relative h-6 w-6">
      {Array.from({ length: chipCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-6 h-1.5 rounded-full ${chipColors[i % chipColors.length]} border border-white/20`}
          style={{ bottom: i * 3 }}
          initial={{ y: -30, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 15,
            delay: delay + i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

export function PotDisplay({ pot, sidePots = [] }: PotDisplayProps) {
  const { t } = useTranslation();
  const [displayPot, setDisplayPot] = useState(pot);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate pot value changes
  useEffect(() => {
    if (pot !== displayPot) {
      setIsAnimating(true);
      const diff = pot - displayPot;
      const steps = 20;
      const stepValue = diff / steps;
      let current = displayPot;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current += stepValue;
        setDisplayPot(Math.round(current));

        if (step >= steps) {
          setDisplayPot(pot);
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [pot]);

  return (
    <motion.div 
      className="flex flex-col items-center gap-1"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div 
        className="flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/80 border border-poker-gold/30 backdrop-blur-sm"
        animate={isAnimating ? { 
          scale: [1, 1.05, 1],
          boxShadow: ['0 0 0 0 rgba(212, 175, 55, 0)', '0 0 20px 5px rgba(212, 175, 55, 0.3)', '0 0 0 0 rgba(212, 175, 55, 0)']
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {pot > 0 && <ChipStack amount={pot} />}
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-poker-gold" />
          <motion.span 
            className="font-display text-lg font-bold text-poker-gold"
            key={displayPot}
          >
            {displayPot.toLocaleString()}
          </motion.span>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {sidePots.length > 0 && (
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {sidePots.map((sidePot, i) => (
              <motion.span 
                key={i} 
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {t('table.sidePot')} {i + 1}: {sidePot.toLocaleString()}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
