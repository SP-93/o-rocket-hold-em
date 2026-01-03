import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | '5' | '6';

interface TableFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  tableCount: number;
}

export function TableFilters({ activeFilter, onFilterChange, tableCount }: TableFiltersProps) {
  const { t } = useTranslation();

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: t('lobby.filters.all') },
    { value: '5', label: t('lobby.filters.fivePlayer') },
    { value: '6', label: t('lobby.filters.sixPlayer') },
  ];

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'transition-all',
              activeFilter === filter.value && 'glow-primary'
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <span className="text-sm text-muted-foreground">
        {t('lobby.tableCount', { count: tableCount })}
      </span>
    </div>
  );
}
