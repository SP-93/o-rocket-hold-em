import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useChipBalance } from '@/hooks/useChipBalance';
import { Loader2, Coins } from 'lucide-react';

interface BuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  minBuyIn: number;
  maxBuyIn: number;
  bigBlind: number;
  isLoading?: boolean;
}

export function BuyInModal({
  isOpen,
  onClose,
  onConfirm,
  minBuyIn,
  maxBuyIn,
  bigBlind,
  isLoading = false,
}: BuyInModalProps) {
  const { t } = useTranslation();
  const { balance, isLoading: balanceLoading } = useChipBalance();
  const availableChips = balance?.availableChips || 0;
  
  // Clamp max to available chips
  const effectiveMax = Math.min(maxBuyIn, availableChips);
  const effectiveMin = Math.min(minBuyIn, effectiveMax);
  
  const [amount, setAmount] = useState(Math.max(effectiveMin, bigBlind * 100));

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setAmount(Math.min(Math.max(val, effectiveMin), effectiveMax));
  };

  const handleConfirm = () => {
    if (amount >= effectiveMin && amount <= effectiveMax) {
      onConfirm(amount);
    }
  };

  const insufficientChips = availableChips < minBuyIn;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {t('buyIn.title', 'Buy-In')}
          </DialogTitle>
          <DialogDescription>
            {t('buyIn.description', 'Choose how many chips to bring to the table')}
          </DialogDescription>
        </DialogHeader>

        {balanceLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : insufficientChips ? (
          <div className="py-4 text-center">
            <p className="text-destructive mb-2">
              {t('buyIn.insufficientChips', 'Insufficient chips')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('buyIn.needMinimum', 'You need at least {{min}} chips. You have {{available}}.', {
                min: minBuyIn,
                available: availableChips,
              })}
            </p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              {t('buyIn.goToChipShop', 'Go to Chip Shop')}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-6 py-4">
              {/* Available balance */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('buyIn.availableBalance', 'Available Balance')}
                </span>
                <span className="font-medium text-primary">
                  {availableChips.toLocaleString()} chips
                </span>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <Label>{t('buyIn.amount', 'Buy-In Amount')}</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={handleInputChange}
                  min={effectiveMin}
                  max={effectiveMax}
                  className="text-center text-lg font-bold"
                />
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Slider
                  value={[amount]}
                  onValueChange={handleSliderChange}
                  min={effectiveMin}
                  max={effectiveMax}
                  step={bigBlind}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{effectiveMin.toLocaleString()}</span>
                  <span>{effectiveMax.toLocaleString()}</span>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.min(bigBlind * 50, effectiveMax))}
                  disabled={bigBlind * 50 < effectiveMin}
                >
                  50 BB
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.min(bigBlind * 100, effectiveMax))}
                  disabled={bigBlind * 100 < effectiveMin}
                >
                  100 BB
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(effectiveMax)}
                >
                  Max
                </Button>
              </div>

              {/* BB equivalent */}
              <p className="text-center text-sm text-muted-foreground">
                = {Math.floor(amount / bigBlind)} Big Blinds
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || amount < effectiveMin || amount > effectiveMax}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t('buyIn.sitDown', 'Sit Down')} ({amount.toLocaleString()} chips)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
