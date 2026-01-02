import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Table() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="gap-2 mb-4">
            <Link to="/lobby">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>

          <h1 className="font-display text-2xl font-bold">
            Poker Sto #{id}
          </h1>
        </div>

        {/* Placeholder for poker table - will be built in Phase 3 */}
        <div className="aspect-[16/10] max-w-4xl mx-auto rounded-[100px] poker-felt border-8 border-poker-felt-dark flex items-center justify-center">
          <div className="text-center">
            <p className="font-display text-2xl text-foreground/80 mb-2">
              Poker Sto
            </p>
            <p className="text-muted-foreground">
              Faza 3: UI za poker sto dolazi uskoro
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
