"use client";
import { UserProvider, useUser } from '@/contexts/marketplace/UserContext';
import { WalletProvider } from '@/contexts/marketplace/WalletContext';
import Navigation from '@/components/marketplace/Navigation';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function MarketplaceProtection({ children }) {
  const { user, loading } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      if (loading) return;

      if (!user) {
        setIsChecking(false);
        return;
      }

      // 1. Check if Admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role === 'admin') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // 2. Check Session Authorization
      const sessionAuth = sessionStorage.getItem('marketplace_authorized');
      if (sessionAuth === 'true') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // 3. Show Passcode Modal if not authorized
      setIsChecking(false);
      setShowPasscodeModal(true);
    }

    checkAccess();
  }, [user, loading, router]);

  const handleSubmitPasscode = (e) => {
    if (e) e.preventDefault();
    if (passcode === "Icui4cu") {
      sessionStorage.setItem('marketplace_authorized', 'true');
      setIsAuthorized(true);
      setShowPasscodeModal(false);
      setError('');
    } else {
      setError("Invalid access code. Please try again.");
    }
  };

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Passcode Modal UI
  if (showPasscodeModal) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Marketplace Access</h2>
            <p className="text-slate-500 font-medium mb-8 text-sm">Please enter the authorization code to proceed to the Academic Marketplace.</p>

            <form onSubmit={handleSubmitPasscode} className="space-y-6">
                <div className="space-y-2">
                    <input 
                        type="password"
                        value={passcode}
                        onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                        placeholder="Enter access code"
                        autoFocus
                        className={`w-full px-6 py-4 bg-slate-100 border ${error ? 'border-red-200' : 'border-slate-200'} rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-black text-center text-slate-900 text-xl tracking-[0.3em] placeholder:text-slate-400 placeholder:tracking-normal`}
                    />
                    {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                </div>

                <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase text-xs tracking-widest"
                >
                    Authorize Access
                </button>

                <button 
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                    Return to Dashboard
                </button>
            </form>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return children;
}

export default function MarketplaceLayout({ children }) {
  return (
    <UserProvider>
      <WalletProvider>
        <MarketplaceProtection>
          <div className="min-h-screen bg-[#f8f9fc]">
            <Navigation />
            <main className="pt-[70px]">
              {children}
            </main>
            <Toaster richColors closeButton position="top-right" />
          </div>
        </MarketplaceProtection>
      </WalletProvider>
    </UserProvider>
  );
}
