import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsernameModalProps {
  open: boolean;
  onSubmit: (username: string) => Promise<{ success: boolean; error?: string }>;
  checkAvailability: (username: string) => Promise<boolean>;
}

export function UsernameModal({ open, onSubmit, checkAvailability }: UsernameModalProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setIsAvailable(false);
      setError('Only letters, numbers, and underscores');
      return;
    }

    if (username.length > 20) {
      setIsAvailable(false);
      setError('Max 20 characters');
      return;
    }

    setError(null);
    setIsChecking(true);

    const timer = setTimeout(async () => {
      const available = await checkAvailability(username);
      setIsAvailable(available);
      setIsChecking(false);
      if (!available) {
        setError('Username is taken');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await onSubmit(username);

    if (!result.success) {
      setError(result.error || 'Failed to create profile');
    }

    setIsSubmitting(false);
  };

  const getStatusIcon = () => {
    if (username.length < 3) return null;
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (isAvailable) return <Check className="h-4 w-4 text-primary" />;
    return <X className="h-4 w-4 text-destructive" />;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-display">
            Choose Your Username
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            This will be your display name at the poker tables. Choose wisely - it cannot be changed!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="Enter username..."
                className={cn(
                  "pr-10 bg-background/50 border-border/50",
                  isAvailable === true && "border-primary/50 focus-visible:ring-primary/30",
                  isAvailable === false && "border-destructive/50 focus-visible:ring-destructive/30"
                )}
                maxLength={20}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "transition-colors",
                username.length >= 3 && username.length <= 20 ? "text-primary" : "text-muted-foreground"
              )}>
                {username.length}/20 characters
              </span>
              {error && (
                <span className="text-destructive">{error}</span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">Requirements:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li className={cn(username.length >= 3 && "text-primary")}>
                3-20 characters
              </li>
              <li className={cn(/^[a-zA-Z0-9_]+$/.test(username) && username.length > 0 && "text-primary")}>
                Letters, numbers, and underscores only
              </li>
              <li className={cn(isAvailable && "text-primary")}>
                Must be unique
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={!isAvailable || isSubmitting || username.length < 3}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Profile...
              </>
            ) : (
              'Confirm Username'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
