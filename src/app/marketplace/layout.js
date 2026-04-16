"use client";
import { UserProvider } from '@/contexts/marketplace/UserContext';
import { WalletProvider } from '@/contexts/marketplace/WalletContext';
import Navigation from '@/components/marketplace/Navigation';
import { Toaster } from '@/components/marketplace/ui/sonner';

export default function MarketplaceLayout({ children }) {
  return (
    <UserProvider>
      <WalletProvider>
        <div className="min-h-screen bg-[#f8f9fc]">
          <Navigation />
          <main className="pt-[70px]">
            {children}
          </main>          <Toaster position="top-right" />
        </div>
      </WalletProvider>
    </UserProvider>
  );
}
