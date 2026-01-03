import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTable: (name: string, maxPlayers: 5 | 6, smallBlind: number, bigBlind: number) => Promise<string | null>;
}

const blindOptions = [
  { small: 5, big: 10, label: '5/10' },
  { small: 10, big: 20, label: '10/20' },
  { small: 25, big: 50, label: '25/50' },
  { small: 50, big: 100, label: '50/100' },
  { small: 100, big: 200, label: '100/200' },
];

export function CreateTableModal({ open, onOpenChange, onCreateTable }: CreateTableModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [tableName, setTableName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<'5' | '6'>('6');
  const [selectedBlinds, setSelectedBlinds] = useState('10/20');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!tableName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a table name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    const blindOption = blindOptions.find(b => b.label === selectedBlinds) || blindOptions[1];
    const tableId = await onCreateTable(
      tableName,
      parseInt(maxPlayers) as 5 | 6,
      blindOption.small,
      blindOption.big
    );

    if (tableId) {
      toast({
        title: 'Table created!',
        description: `${tableName} is ready to play`,
      });
      onOpenChange(false);
      setTableName('');
      navigate(`/table/${tableId}`);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create table',
        variant: 'destructive',
      });
    }

    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t('lobby.createTable')}
          </DialogTitle>
          <DialogDescription>
            Set up parameters for a new poker table
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              placeholder="e.g. High Rollers"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="font-body"
            />
          </div>

          {/* Max Players */}
          <div className="space-y-3">
            <Label>Number of Players</Label>
            <RadioGroup
              value={maxPlayers}
              onValueChange={(value) => setMaxPlayers(value as '5' | '6')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5" id="players-5" />
                <Label htmlFor="players-5" className="cursor-pointer">
                  5 players
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6" id="players-6" />
                <Label htmlFor="players-6" className="cursor-pointer">
                  6 players
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Blinds */}
          <div className="space-y-3">
            <Label>{t('lobby.blinds')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {blindOptions.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant={selectedBlinds === option.label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBlinds(option.label)}
                  className="font-mono"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="glow-primary"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('lobby.createTable')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
