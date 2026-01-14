import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Gift, Loader2, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TipButtonProps {
  tableId: string;
  toSeatNumber: number;
  toPlayerName?: string;
  disabled?: boolean;
}

const QUICK_TIP_AMOUNTS = [1, 5, 10, 25, 50];

export function TipButton({ tableId, toSeatNumber, toPlayerName, disabled }: TipButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendTip = async (amount: number) => {
    if (amount < 0.1 || amount > 100) {
      toast({
        title: t('common.error'),
        description: t('table.tipAmountRange'),
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: t('common.error'),
          description: t('errors.notAuthenticated'),
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('poker-game', {
        body: {
          action: 'send_tip',
          tableId,
          toSeatNumber,
          amount,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: t('table.tipSent'),
        description: t('table.tipSentDesc', { amount, player: toPlayerName || `Seat ${toSeatNumber}` }),
      });

      setIsOpen(false);
      setCustomAmount('');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.message || t('table.tipFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount)) {
      toast({
        title: t('common.error'),
        description: t('table.invalidTipAmount'),
        variant: 'destructive',
      });
      return;
    }
    sendTip(amount);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-poker-gold/20 hover:text-poker-gold"
          disabled={disabled || isSending}
        >
          {isSending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Gift className="h-3 w-3" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="center">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Coins className="h-4 w-4 text-poker-gold" />
            <span>{t('table.sendTip')}</span>
          </div>
          
          {/* Quick amounts */}
          <div className="grid grid-cols-5 gap-1">
            {QUICK_TIP_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                size="sm"
                variant="outline"
                className="h-8 text-xs font-mono hover:bg-poker-gold/20 hover:border-poker-gold"
                onClick={() => sendTip(amount)}
                disabled={isSending}
              >
                {amount}
              </Button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.1 - 100"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="h-8 text-xs"
              min={0.1}
              max={100}
              step={0.1}
            />
            <Button
              size="sm"
              className="h-8 px-3"
              onClick={handleCustomTip}
              disabled={isSending || !customAmount}
            >
              {t('common.send')}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            {t('table.tipRange')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
