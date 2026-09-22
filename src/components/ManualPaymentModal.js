"use client";
import { useState } from 'react';
import { 
  Shield, Loader2, Lock, Globe, CreditCard, 
  Copy, Check, ArrowRight, X, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { PRICING, INTERNATIONAL_PRICING } from '@/lib/pricing';

const DEFAULT_USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_WALLET_ADDRESS || "TYdJm2x8jK9YqL3bW17z5fGvN8sKpR4u7E";

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
  const [intlMethod, setIntlMethod] = useState('card'); // 'card' or 'usdt'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

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

  const handleCopyUsdt = () => {
    navigator.clipboard.writeText(DEFAULT_USDT_ADDRESS);
    setCopiedAddress(true);
    toast.success("USDT Wallet address copied!");
    setTimeout(() => setCopiedAddress(false), 2500);
  };

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

  const getUsdtWhatsAppUrl = () => {
    const text = `Hello W3 WriteLab, I have transferred $${currentUsdAmount} USDT for ${currentTier.toUpperCase()} blueprint access. My account email is ${userEmail}. Please verify and activate my project.`;
    return `https://wa.me/2348031797655?text=${encodeURIComponent(text)}`;
  };

  const getUsdtEmailUrl = () => {
    const subject = `USDT Payment Confirmation: ${currentTier.toUpperCase()} Blueprint`;
    const body = `Hello W3 WriteLab Support,\n\nI have transferred $${currentUsdAmount} USDT for ${currentTier.toUpperCase()} blueprint.\nAccount Email: ${userEmail}\nUser ID: ${userId}\n\nPlease verify and activate my project access.\n\nThank you.`;
    return `mailto:w33writelab@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
              <span>International ($ / USDT)</span>
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

          {/* ======================= MODE 2: INTERNATIONAL (USD / USDT) ======================= */}
          {currencyMode === 'USD' && (
            <div className="space-y-4">
              {/* International Sub-tabs: Card vs USDT */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIntlMethod('card')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    intlMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-xs text-slate-900">Card (USD)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Foreign Visa / Mastercard</p>
                </button>

                <button
                  onClick={() => setIntlMethod('usdt')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    intlMethod === 'usdt'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">₮</span>
                    <span className="font-extrabold text-xs text-slate-900">USDT (Crypto)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">TRC20 / BEP20 Transfer</p>
                </button>
              </div>

              {/* Amount Display */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                  International Price
                </span>
                <span className="text-3xl font-black text-slate-900">
                  ${currentUsdAmount}.00 USD
                </span>
              </div>

              {/* Sub-method A: International Card Checkout via Squad USD */}
              {intlMethod === 'card' && (
                <div className="space-y-4 pt-1">
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    Pay securely in USD using any foreign-issued Visa, Mastercard, or American Express card via our verified Squad gateway.
                  </p>

                  <button
                    onClick={() => handleStartSquadCheckout('USD')}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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

              {/* Sub-method B: USDT Crypto Transfer */}
              {intlMethod === 'usdt' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">Network:</span>
                      <span className="font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
                        USDT (TRC20 / BEP20)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">Exact Amount:</span>
                      <span className="font-black text-sm text-emerald-900">${currentUsdAmount} USDT</span>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        Deposit Wallet Address
                      </span>
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-emerald-200">
                        <code className="text-[11px] font-mono font-bold text-slate-800 break-all flex-1 select-all">
                          {DEFAULT_USDT_ADDRESS}
                        </code>
                        <button
                          onClick={handleCopyUsdt}
                          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition-colors"
                          title="Copy Address"
                        >
                          {copiedAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Instructions */}
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 font-medium text-center">
                      Once sent, click below to confirm your transfer on WhatsApp or Email for immediate access:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href={getUsdtWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black text-center shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z"/>
                        </svg>
                        <span>Confirm on WhatsApp</span>
                      </a>

                      <a
                        href={getUsdtEmailUrl()}
                        className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Confirm via Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
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
