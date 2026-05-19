"use client";
import { useState } from 'react';
import { X, Copy, Check, ShieldAlert, Smartphone, Mail, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function ManualPaymentModal({ isOpen, onClose, userId, userEmail, projectId = null, initialTier = null, initialAmount = null }) {
  const [step, setStep] = useState(projectId ? 1 : 1); // If projectId is provided, we might still want to show info first
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const adminBankDetails = {
    accountNumber: "1030287928",
    bank: "UBA",
    name: "Adewale Shedrack Komolafe"
  };

  const prices = {
    standard: initialAmount || 5000,
    premium: initialAmount || 20000,
    unlock: initialAmount || 2000
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSubmitTransaction = async () => {
    const tierToSubmit = projectId ? 'unlock' : selectedTier;
    const amountToSubmit = projectId ? prices.unlock : prices[selectedTier];

    if (!tierToSubmit) {
      toast.error("Please select a package");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tier: tierToSubmit,
          amount: amountToSubmit,
          projectId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit");

      toast.success("Transaction submitted for verification!");
      setStep(3); // Success step
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 sm:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Payment Gateway Down</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Our automated payment system is currently undergoing maintenance. However, you can still gain access via <b>Manual Bank Transfer</b>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-2">Admin Account Details</p>
                
                <div className="flex justify-between items-center group">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Bank</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{adminBankDetails.bank}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center group">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Account Number</p>
                    <p className="text-lg font-black text-slate-900 font-mono tracking-wider">{adminBankDetails.accountNumber}</p>
                  </div>
                  <button onClick={() => handleCopy(adminBankDetails.accountNumber, "Account Number")} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center group">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Account Name</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{adminBankDetails.name}</p>
                  </div>
                </div>
              </div>

              {projectId ? (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Unlock Fee</p>
                  <p className="text-3xl font-black text-slate-900">₦{prices.unlock.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 italic">Full access to current project</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Standard</p>
                    <p className="text-xl font-black text-slate-900">₦{prices.standard.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Premium</p>
                    <p className="text-xl font-black text-slate-900">₦{prices.premium.toLocaleString()}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={() => projectId ? handleSubmitTransaction() : setStep(2)}
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
              >
                {projectId ? "I have made payment" : "I have made payment"}
              </button>
            </div>
          )}

          {step === 2 && !projectId && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Select Your Package</h2>
                <p className="text-slate-500 font-medium">Which package did you pay for?</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setSelectedTier('standard')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedTier === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm">Standard Package</p>
                    <p className="text-xs text-slate-500">₦{prices.standard.toLocaleString()}</p>
                  </div>
                  {selectedTier === 'standard' && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                </button>

                <button 
                  onClick={() => setSelectedTier('premium')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedTier === 'premium' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm">Premium Package</p>
                    <p className="text-xs text-slate-500">₦{prices.premium.toLocaleString()}</p>
                  </div>
                  {selectedTier === 'premium' && <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                </button>
              </div>

              <button 
                onClick={handleSubmitTransaction}
                disabled={!selectedTier || isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit for Verification"}
              </button>
              
              <button 
                onClick={() => setStep(1)}
                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-2"
              >
                Back to Details
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Request Submitted!</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                We have received your payment request. To speed up the verification, please contact our support team with your proof of payment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                <a 
                  href="https://wa.me/2348081471730" 
                  target="_blank" 
                  className="flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Smartphone className="w-4 h-4" /> WhatsApp
                </a>
                <a 
                  href="mailto:w3writelab@gmail.com" 
                  className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95"
                >
                  <Mail className="w-4 h-4" /> Email Support
                </a>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest mt-4"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
