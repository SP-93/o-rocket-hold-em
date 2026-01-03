import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';

interface PotDisplayProps {
  pot: number;
  sidePots?: number[];
}

export function PotDisplay({ pot, sidePots = [] }: PotDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-poker-gold/30 backdrop-blur-sm">
        <Coins className="w-5 h-5 text-poker-gold" />
        <span className="font-display text-lg font-bold text-poker-gold">
          {pot.toLocaleString()}
        </span>
      </div>
      {sidePots.length > 0 && (
        <div className="flex gap-2">
          {sidePots.map((sidePot, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              {t('table.sidePot')} {i + 1}: {sidePot.toLocaleString()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
