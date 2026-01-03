import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const callAmount = currentBet;
  const canRaise = playerChips > currentBet;

  if (!isPlayerTurn) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-muted-foreground text-sm animate-pulse">
          {t('table.waitingForTurn')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-xl border border-border backdrop-blur-sm">
      {/* Main action buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          variant="destructive"
          size="lg"
          onClick={onFold}
          className="min-w-20 font-display uppercase tracking-wider"
        >
          {t('table.fold')}
        </Button>

        {canCheck ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={onCheck}
            className="min-w-20 font-display uppercase tracking-wider bg-chip-blue hover:bg-chip-blue/90"
          >
            {t('table.check')}
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            onClick={onCall}
            className="min-w-24 font-display uppercase tracking-wider"
          >
            {t('table.call')} {callAmount}
          </Button>
        )}

        {canRaise && (
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
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={onAllIn}
          className="min-w-20 font-display uppercase tracking-wider border-poker-red text-poker-red hover:bg-poker-red hover:text-primary-foreground"
        >
          {t('table.allIn')}
        </Button>
      </div>

      {/* Raise slider */}
      {showRaiseSlider && canRaise && (
        <div className="flex flex-col gap-2 animate-fade-in">
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
          <Button
            variant="default"
            onClick={() => {
              onRaise(raiseAmount);
              setShowRaiseSlider(false);
            }}
            className="w-full font-display bg-poker-gold text-accent-foreground hover:bg-poker-gold/90"
          >
            {t('table.raiseTo')} {raiseAmount}
          </Button>
        </div>
      )}
    </div>
  );
}
