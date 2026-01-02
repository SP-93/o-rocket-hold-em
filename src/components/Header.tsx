import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WalletButton } from './WalletButton';
import { Rocket } from 'lucide-react';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Rocket className="h-8 w-8 text-primary transition-transform group-hover:rotate-12" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-poker-gold animate-pulse" />
          </div>
          <span className="font-display text-xl font-bold tracking-wider">
            O'Rocket
            <span className="text-primary"> Hold'em</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/lobby" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('nav.lobby')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
