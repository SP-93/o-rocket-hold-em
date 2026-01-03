import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerSounds } from '@/hooks/usePokerSounds';

interface ActionButtonsProps {
  isPlayerTurn: boolean;
  currentBet: number;
  playerChips: number;
  minRaise: number;
  maxRaise: number;
  canCheck: boolean;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
}

const buttonVariants = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.9 },
  tap: { scale: 0.95 },
  hover: { scale: 1.05, y: -2 },
};

export function ActionButtons({
  isPlayerTurn,
  currentBet,
  playerChips,
  minRaise,
  maxRaise,
  canCheck,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  const { playSound } = usePokerSounds();
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const callAmount = currentBet;
  const canRaise = playerChips > currentBet;

  const handleFold = () => {
    playSound('fold');
    onFold();
  };

  const handleCheck = () => {
    playSound('check');
    onCheck();
  };

  const handleCall = () => {
    playSound('call');
    onCall();
  };

  const handleRaise = (amount: number) => {
    playSound('raise');
    onRaise(amount);
  };

  const handleAllIn = () => {
    playSound('allIn');
    onAllIn();
  };

  if (!isPlayerTurn) {
    return (
      <motion.div 
        className="flex items-center justify-center py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span 
          className="text-muted-foreground text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {t('table.waitingForTurn')}
        </motion.span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-xl border border-border backdrop-blur-sm"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Main action buttons */}
      <div className="flex gap-2 justify-center">
        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0 }}
        >
          <Button
            variant="destructive"
            size="lg"
            onClick={handleFold}
            className="min-w-20 font-display uppercase tracking-wider"
          >
            {t('table.fold')}
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0.05 }}
        >
          {canCheck ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleCheck}
              className="min-w-20 font-display uppercase tracking-wider bg-chip-blue hover:bg-chip-blue/90"
            >
              {t('table.check')}
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={handleCall}
              className="min-w-24 font-display uppercase tracking-wider"
            >
              {t('table.call')} {callAmount}
            </Button>
          )}
        </motion.div>

        {canRaise && (
          <motion.div
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowRaiseSlider(!showRaiseSlider)}
              className={cn(
                'min-w-20 font-display uppercase tracking-wider border-poker-gold text-poker-gold hover:bg-poker-gold hover:text-accent-foreground',
                showRaiseSlider && 'bg-poker-gold text-accent-foreground'
              )}
            >
              {t('table.raise')}
            </Button>
          </motion.div>
        )}

        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          transition={{ delay: 0.15 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleAllIn}
            className="min-w-20 font-display uppercase tracking-wider border-poker-red text-poker-red hover:bg-poker-red hover:text-primary-foreground"
          >
            {t('table.allIn')}
          </Button>
        </motion.div>
      </div>

      {/* Raise slider */}
      <AnimatePresence>
        {showRaiseSlider && canRaise && (
          <motion.div 
            className="flex flex-col gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12">{minRaise}</span>
              <Slider
                value={[raiseAmount]}
                onValueChange={([value]) => setRaiseAmount(value)}
                min={minRaise}
                max={maxRaise}
                step={10}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">{maxRaise}</span>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="default"
                onClick={() => {
                  handleRaise(raiseAmount);
                  setShowRaiseSlider(false);
                }}
                className="w-full font-display bg-poker-gold text-accent-foreground hover:bg-poker-gold/90"
              >
                {t('table.raiseTo')} {raiseAmount}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
