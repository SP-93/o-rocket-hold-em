import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { WalletButton } from './WalletButton';
import { useWalletContext } from '@/contexts/WalletContext';
import { Rocket, Shield } from 'lucide-react';

export function Header() {
  const { t } = useTranslation();
  const { isAdmin } = useWalletContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Rocket className="h-8 w-8 text-primary transition-transform group-hover:rotate-12 relative" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-poker-gold animate-pulse" />
          </div>
          <span className="font-display text-2xl font-bold tracking-wider drop-shadow-sm">
            <span className="text-poker-gold">O'Rocket</span>
            <span className="text-primary"> Hold'em</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/lobby" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors relative group"
          >
            {t('nav.lobby')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link 
            to="/chipshop" 
            className="text-sm font-medium text-foreground hover:text-poker-gold transition-colors relative group"
          >
            {t('chipShop.title')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-poker-gold transition-all group-hover:w-full" />
          </Link>
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors relative group flex items-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-destructive transition-all group-hover:w-full" />
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
