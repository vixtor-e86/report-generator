"use client";
import { useState, useEffect } from 'react';
import { Shield, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ManualPaymentModal({ isOpen, onClose, userId, userEmail, projectId = null, initialTier = null, initialAmount = null }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const prices = {
    standard: initialAmount || 5000,
    premium: initialAmount || 20000,
    unlock: initialAmount || 2000
  };

  const currentTier = projectId ? 'unlock' : initialTier;
  const currentAmount = projectId ? prices.unlock : prices[initialTier];

  useEffect(() => {
    async function startCheckout() {
      if (!isOpen || !userId || !currentTier) return;
      
      if (!userEmail) {
        setErrorMsg("User email is required. Please sign in again.");
        toast.error("User email is required for payment.");
        return;
      }

      setIsProcessing(true);
      setErrorMsg(null);

      try {
        const response = await fetch('/api/squad/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email: userEmail,
            tier: currentTier,
            amount: currentAmount,
            projectId
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to initialize payment");

        if (data.authorization_url) {
          // Redirect user to Squad payment screen
          window.location.href = data.authorization_url;
        } else {
          throw new Error("Checkout URL was not returned by payment server.");
        }
      } catch (error) {
        console.error('Squad initialization error:', error);
        setErrorMsg(error.message || "Failed to load secure payment gateway.");
        toast.error(error.message || "Failed to launch Squad gateway.");
        setIsProcessing(false);
      }
    }

    startCheckout();
  }, [isOpen, userId, userEmail, currentTier, currentAmount, projectId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100 p-8 sm:p-10 text-center">
        
        {/* Close button (only visible if there's an error so they can close and retry, otherwise we lock it to avoid multi-click) */}
        {(!isProcessing || errorMsg) && (
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-black transition-colors rounded-full hover:bg-slate-50"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="space-y-6 py-4">
          {/* Animated Secure Icon */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75" />
            <div className="relative w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner">
              <Shield className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {errorMsg ? "Checkout Failed" : "Launching Secure Checkout"}
            </h2>
            <p className="text-slate-500 text-sm font-semibold max-w-xs mx-auto">
              {errorMsg 
                ? errorMsg 
                : `Preparing automated billing for W3 WriteLab ${currentTier ? currentTier.toUpperCase() : ''} tier.`}
            </p>
          </div>

          {/* Pricing Info Badge */}
          {currentAmount && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Amount Due</span>
              <span className="text-2xl font-black text-slate-900">₦{currentAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Loader or Error Retry Button */}
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-3 py-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Redirecting to Squad Gateway...</span>
            </div>
          ) : errorMsg ? (
            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
            >
              Cancel and Close
            </button>
          ) : null}

          {/* Guarantee Banner */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-50">
            <Lock className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL squad payment gateway
          </div>
        </div>
      </div>
    </div>
  );
}
