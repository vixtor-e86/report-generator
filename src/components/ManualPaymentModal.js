"use client";
import { useState } from 'react';
import { 
  Shield, Loader2, Lock, Globe, CreditCard, 
  ArrowRight, X 
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
  initialAmount = null 
}) {
  const [currencyMode, setCurrencyMode] = useState('NGN'); // 'NGN' or 'USD'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const currentTier = projectId ? 'unlock' : (initialTier || 'standard');

  // NGN Prices
  const ngnPrices = {
    standard: initialAmount || PRICING.STANDARD,
    premium: initialAmount || PRICING.PREMIUM,
    unlock: initialAmount || 2000
  };

  // USD Prices ($5 for standard, $20 for premium, $2 for unlock)
  const usdPrices = {
    standard: INTERNATIONAL_PRICING.STANDARD,
    premium: INTERNATIONAL_PRICING.PREMIUM,
    unlock: 2
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
          projectId
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
              {currentTier.toUpperCase()} Project Access
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your preferred currency and payment gateway.
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

          {/* ======================= MODE 1: NAIRA (NGN) ======================= */}
          {currencyMode === 'NGN' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Amount Due (NGN)
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  ₦{currentNgnAmount.toLocaleString()}
                </span>
                <p className="text-xs text-slate-500 font-medium mt-2">
                  Debit Cards (Mastercard, Visa, Verve), Bank Transfer & USSD
                </p>
              </div>

              <button
                onClick={() => handleStartSquadCheckout('NGN')}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting to Squad...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₦{currentNgnAmount.toLocaleString()} via Squad</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ======================= MODE 2: INTERNATIONAL (USD) ======================= */}
          {currencyMode === 'USD' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  International Price (USD)
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  ${currentUsdAmount}.00 USD
                </span>
                <p className="text-xs text-slate-500 font-medium mt-2">
                  Foreign Visa, Mastercard & American Express Cards
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Pay securely in USD using your foreign debit or credit card via our verified Squad gateway. Your project access will be granted automatically upon confirmation.
                </p>
              </div>

              <button
                onClick={() => handleStartSquadCheckout('USD')}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-slate-300 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting to USD Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ${currentUsdAmount} with Card</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit SSL Encrypted Payment Protection</span>
        </div>
      </div>
    </div>
  );
}
