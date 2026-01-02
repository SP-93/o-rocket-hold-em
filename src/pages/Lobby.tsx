import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { TableCard } from '@/components/lobby/TableCard';
import { TableFilters } from '@/components/lobby/TableFilters';
import { CreateTableModal } from '@/components/lobby/CreateTableModal';
import { Button } from '@/components/ui/button';
import { mockTables } from '@/data/mockTables';
import { Plus, RefreshCw } from 'lucide-react';

type FilterType = 'all' | '5' | '6';

export default function Lobby() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredTables = useMemo(() => {
    if (filter === 'all') return mockTables;
    return mockTables.filter((table) => table.maxPlayers === parseInt(filter));
  }, [filter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Refresh from Supabase
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {t('lobby.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('lobby.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 glow-primary"
            >
              <Plus className="h-4 w-4" />
              {t('lobby.createTable')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TableFilters
            activeFilter={filter}
            onFilterChange={setFilter}
            tableCount={filteredTables.length}
          />
        </div>

        {/* Table Grid */}
        {filteredTables.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {t('lobby.noTables')}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('lobby.createTable')}
            </Button>
          </div>
        )}
      </main>

      {/* Create Table Modal */}
      <CreateTableModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
