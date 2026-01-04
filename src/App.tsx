import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/components/Web3Provider";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lobby from "./pages/Lobby";
import Table from "./pages/Table";
import Admin from "./pages/Admin";
import ChipShop from "./pages/ChipShop";
import Tournament from "./pages/Tournament";
import Tournaments from "./pages/Tournaments";
import WalletSettings from "./pages/settings/Wallets";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Import i18n configuration
import "./i18n";

const App = () => (
  <AuthProvider>
    <Web3Provider>
      <WalletProvider>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                
                {/* Protected routes */}
                <Route path="/lobby" element={
                  <ProtectedRoute>
                    <Lobby />
                  </ProtectedRoute>
                } />
                <Route path="/table/:id" element={
                  <ProtectedRoute>
                    <Table />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/chipshop" element={
                  <ProtectedRoute>
                    <ChipShop />
                  </ProtectedRoute>
                } />
                <Route path="/tournament/:id" element={
                  <ProtectedRoute>
                    <Tournament />
                  </ProtectedRoute>
                } />
                <Route path="/tournaments" element={
                  <ProtectedRoute>
                    <Tournaments />
                  </ProtectedRoute>
                } />
                <Route path="/settings/wallets" element={
                  <ProtectedRoute>
                    <WalletSettings />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </WalletProvider>
    </Web3Provider>
  </AuthProvider>
);

export default App;
