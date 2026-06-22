"use client";
import { useState } from 'react';
import { X, Copy, Check, ShieldAlert, Smartphone, Mail, Wallet, CreditCard, ArrowRight, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ManualPaymentModal({ isOpen, onClose, userId, userEmail, projectId = null, initialTier = null, initialAmount = null }) {
  const [step, setStep] = useState(1); // Step 1: Selection (Auto vs Manual), Step 2: Manual Bank details, Step 3: Package Selection (for non-project flows), Step 4: Success manual
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'auto' or 'manual'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingAuto, setIsProcessingAuto] = useState(false);

  if (!isOpen) return null;

  const adminBankDetails = {
    accountNumber: "1030287968",
    bank: "UBA",
    name: "W3 Hub"
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

  const handleAutomatedPayment = async (tierToPay) => {
    const tierToSubmit = projectId ? 'unlock' : (tierToPay || selectedTier);
    const amountToSubmit = projectId ? prices.unlock : prices[tierToSubmit];

    if (!tierToSubmit) {
      toast.error("Please select a package");
      return;
    }

    if (!userEmail) {
      toast.error("User email is required for payment. Please make sure you are logged in.");
      return;
    }

    setIsProcessingAuto(true);
    try {
      const response = await fetch('/api/squad/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          tier: tierToSubmit,
          amount: amountToSubmit,
          projectId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to initialize payment");

      if (data.authorization_url) {
        // Redirect to Squad hosted payment checkout
        window.location.href = data.authorization_url;
      } else {
        throw new Error("Failed to retrieve checkout URL");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessingAuto(false);
    }
  };

  const handleSubmitManualTransaction = async () => {
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
      setStep(4); // Success step
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartManualFlow = () => {
    if (projectId) {
      setStep(2); // Go straight to manual bank details
    } else {
      setStep(3); // Go to Package Selection first
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-black transition-colors rounded-full hover:bg-slate-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10">
          
          {/* STEP 1: PAYMENT ROUTE SELECTOR */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                  {projectId ? "Unlock Your Project" : "Choose Payment Method"}
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                  {projectId 
                    ? "Automate your activation to gain instant, lifetime access to edit and print your document."
                    : "Upgrade your account to generate higher tier engineering templates."}
                </p>
              </div>

              {/* Price Banner */}
              <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-100 p-5 rounded-3xl text-center shadow-sm">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">
                  {projectId ? "Unlock Fee" : "Packages Available From"}
                </p>
                <p className="text-3xl font-black text-slate-900">
                  ₦{projectId ? prices.unlock.toLocaleString() : prices.standard.toLocaleString()}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1">
                  {projectId ? "Instant download, formatting and printing" : "Standard & Premium Options"}
                </p>
              </div>

              {/* Payment Methods Options */}
              <div className="space-y-3">
                <button
                  onClick={() => projectId ? handleAutomatedPayment('unlock') : setStep(5)}
                  disabled={isProcessingAuto}
                  className="w-full flex items-center justify-between p-5 rounded-3xl border-2 border-indigo-600 hover:border-indigo-700 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="font-black uppercase text-xs tracking-wider">Automated Payment</p>
                      <p className="text-[10px] text-indigo-100 font-medium">Pay via Card, USSD or Bank Transfer (Instant)</p>
                    </div>
                  </div>
                  {isProcessingAuto ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                <button
                  onClick={handleStartManualFlow}
                  className="w-full flex items-center justify-between p-5 rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-95 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black uppercase text-xs tracking-wider text-slate-800">Manual Bank Transfer</p>
                      <p className="text-[10px] text-slate-400 font-medium">Transfer manually & submit proof (Takes 1-6 hours)</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL squad payment gateway
              </div>
            </div>
          )}

          {/* STEP 2: MANUAL BANK DETAILS */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Manual Bank Transfer</h2>
                <p className="text-slate-500 text-sm font-medium">
                  Transfer the exact amount to the account details below, then click the confirmation button.
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

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-left">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Please keep a copy of your bank transaction receipt. The admin will verify the transfer in the system before activating.
                </p>
              </div>

              <button 
                onClick={handleSubmitManualTransaction}
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "I have made payment"}
              </button>

              <button 
                onClick={() => setStep(1)}
                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-1"
              >
                Back
              </button>
            </div>
          )}

          {/* STEP 3: PACKAGE SELECTION (FOR MANUAL FLOW) */}
          {step === 3 && !projectId && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Select Your Package</h2>
                <p className="text-slate-500 font-medium text-sm">Which package did you pay for via manual transfer?</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setSelectedTier('standard')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedTier === 'standard' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm">Standard Package</p>
                    <p className="text-xs text-slate-500">₦{prices.standard.toLocaleString()}</p>
                  </div>
                  {selectedTier === 'standard' && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                </button>

                <button 
                  onClick={() => setSelectedTier('premium')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedTier === 'premium' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm">Premium Package</p>
                    <p className="text-xs text-slate-500">₦{prices.premium.toLocaleString()}</p>
                  </div>
                  {selectedTier === 'premium' && <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                </button>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!selectedTier}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                Proceed to Transfer Details
              </button>
              
              <button 
                onClick={() => setStep(1)}
                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-1"
              >
                Back
              </button>
            </div>
          )}

          {/* STEP 4: SUCCESS MANUAL */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Request Submitted!</h2>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                We have received your payment request. To speed up the verification, please contact our support team with your proof of payment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                <a 
                  href="https://wa.me/2348081471730" 
                  target="_blank" 
                  rel="noopener noreferrer"
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

          {/* STEP 5: AUTOMATED PACKAGE SELECTION (FOR NON-PROJECT SUBSCRIPTION FLOWS) */}
          {step === 5 && !projectId && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Select Your Package</h2>
                <p className="text-slate-500 font-medium text-sm">Which blueprint package would you like to purchase?</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setSelectedTier('standard')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedTier === 'standard' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm">Standard Package</p>
                    <p className="text-xs text-slate-500">₦{prices.standard.toLocaleString()}</p>
                  </div>
                  {selectedTier === 'standard' && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                </button>

                <button 
                  onClick={() => setSelectedTier('premium')}
                  className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${selectedTier === 'premium' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="text-left">
                    <p className="font-black text-slate-900 uppercase text-sm">Premium Package</p>
                    <p className="text-xs text-slate-500">₦{prices.premium.toLocaleString()}</p>
                  </div>
                  {selectedTier === 'premium' && <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></div>}
                </button>
              </div>

              <button 
                onClick={() => handleAutomatedPayment(selectedTier)}
                disabled={!selectedTier || isProcessingAuto}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessingAuto ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Proceed to Payment (₦{selectedTier ? prices[selectedTier].toLocaleString() : '0'})</>
                )}
              </button>
              
              <button 
                onClick={() => setStep(1)}
                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-1"
              >
                Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
