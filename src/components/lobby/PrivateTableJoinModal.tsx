import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivateTableJoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableName: string;
  walletAddress: string;
  onSuccess: () => void;
}

export function PrivateTableJoinModal({
  open,
  onOpenChange,
  tableId,
  tableName,
  walletAddress,
  onSuccess,
}: PrivateTableJoinModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!password.trim()) {
      setError(t('lobby.passwordRequired'));
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Server-side password verification via edge function
      const { data, error: verifyError } = await supabase.functions.invoke('table-manager', {
        body: {
          action: 'verify_table_password',
          tableId,
          password: password.trim(),
        },
      });

      if (verifyError) {
        console.error('Verify error:', verifyError);
        setError(t('errors.verificationFailed'));
        return;
      }

      if (data?.authorized) {
        toast.success(t('lobby.accessGranted'));
        onSuccess();
        onOpenChange(false);
        setPassword('');
      } else {
        setError(t('lobby.invalidPassword'));
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError(t('errors.verificationFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-poker-gold" />
            {t('lobby.privateTable')}
          </DialogTitle>
          <DialogDescription>
            {t('lobby.enterPassword', { table: tableName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('lobby.tablePassword')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
              className="bg-background/50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPassword('');
                setError('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.verifying')}
                </>
              ) : (
                t('lobby.join')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
