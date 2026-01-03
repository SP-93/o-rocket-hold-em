import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/components/Web3Provider";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Lobby from "./pages/Lobby";
import Table from "./pages/Table";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Import i18n configuration
import "./i18n";

const App = () => (
  <Web3Provider>
    <WalletProvider>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/table/:id" element={<Table />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </WalletProvider>
  </Web3Provider>
);

export default App;
