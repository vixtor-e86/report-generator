"use client";
import { useState } from 'react';
import { 
  Shield, Loader2, Globe, CreditCard, 
  ArrowRight, X, Layers, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { PRICING, INTERNATIONAL_PRICING } from '@/lib/pricing';

export default function ManualPaymentModal({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail, 
  projectId = null, 
  initialTier = null, 
  initialAmount = null,
  customDetails = null
}) {
  const [currencyMode, setCurrencyMode] = useState('NGN'); // 'NGN' or 'USD'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const currentTier = projectId ? 'unlock' : (initialTier || 'standard');

  // NGN Prices
  const ngnPrices = {
    standard: initialAmount || PRICING.STANDARD,
    premium: initialAmount || PRICING.PREMIUM,
    unlock: initialAmount || 2000,
    custom: initialAmount || customDetails?.ngnAmount || 1500
  };

  // USD Prices ($5 for standard, $20 for premium, $2 for unlock, dynamic for custom)
  const usdPrices = {
    standard: INTERNATIONAL_PRICING.STANDARD,
    premium: INTERNATIONAL_PRICING.PREMIUM,
    unlock: 2,
    custom: customDetails?.usdAmount || (initialAmount ? initialAmount / 1000 : 1.5)
  };

  const currentNgnAmount = ngnPrices[currentTier] || 5000;
  const currentUsdAmount = usdPrices[currentTier] || 5;

  const handleStartSquadCheckout = async (selectedCurrency = 'NGN') => {
    if (!userId || !currentTier) return;

    if (!userEmail) {
      setErrorMsg("User email is required. Please sign in again.");
      toast.error("User email is required for payment.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const amountToPay = selectedCurrency === 'USD' ? currentUsdAmount : currentNgnAmount;

    try {
      const response = await fetch('/api/squad/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          tier: currentTier,
          amount: amountToPay,
          currency: selectedCurrency,
          projectId,
          customDetails
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to initialize payment");

      if (data.authorization_url) {
        // Redirect user to Squad payment checkout screen
        window.location.href = data.authorization_url;
      } else {
        throw new Error("Checkout URL was not returned by payment server.");
      }
    } catch (error) {
      console.error('Squad initialization error:', error);
      setErrorMsg(error.message || "Failed to load secure payment gateway.");
      toast.error(error.message || "Failed to launch payment gateway.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white rounded-[36px] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex items-start justify-between relative">
          <div className="pr-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2 border border-indigo-100">
              <Shield className="w-3.5 h-3.5" />
              Secure Checkout
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {currentTier === 'custom' 
                ? `Custom ${customDetails?.workspaceType === 'premium' ? 'Premium' : 'Standard'} Access` 
                : `${currentTier.toUpperCase()} Project Access`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentTier === 'custom' && customDetails?.selectedChapters
                ? `Generating ${customDetails.selectedChapters.length} chapter(s): Chapters ${customDetails.selectedChapters.join(', ')}`
                : 'Select your preferred currency and payment gateway.'}
            </p>
          </div>

          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Switcher Tabs */}
        <div className="px-6 pt-5 bg-white">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-black">
            <button
              onClick={() => { setCurrencyMode('NGN'); setErrorMsg(null); }}
              className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                currencyMode === 'NGN' 
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>🇳🇬 Naira (₦)</span>
            </button>
            <button
              onClick={() => { setCurrencyMode('USD'); setErrorMsg(null); }}
              className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                currencyMode === 'USD' 
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>International ($ USD)</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Amount Overview Card */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                {currentTier === 'custom' ? 'Custom Package Total' : 'Order Total'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight">
                  {currencyMode === 'USD' ? `$${currentUsdAmount.toFixed(2)}` : `₦${currentNgnAmount.toLocaleString()}`}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">{currencyMode}</span>
              </div>
            </div>

            <span className="px-3 py-1.5 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Instant Activation
            </span>
          </div>

          {/* Payment Gateway: Squad */}
          <div className="space-y-3">
            <button
              onClick={() => handleStartSquadCheckout(currencyMode)}
              disabled={isProcessing}
              className="w-full p-5 rounded-3xl border-2 border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 hover:shadow-lg transition-all flex items-center justify-between group active:scale-95 disabled:opacity-60 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-200">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-900">
                      {currencyMode === 'USD' ? 'Pay with International Card (Squad)' : 'Pay with Debit Card / Bank Transfer (Squad)'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {currencyMode === 'USD'
                      ? 'Secure international card checkout via HabariPay / GTCO.'
                      : 'Cards, USSD, Bank Transfer, Apple Pay, & Virtual Accounts.'}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </div>
            </button>
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-slate-500">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] leading-relaxed font-medium">
              Transactions are protected with 256-bit bank-grade encryption. Access to your project workspace is granted automatically upon payment confirmation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
