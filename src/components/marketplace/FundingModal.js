"use client";
import { useState } from 'react';
import { 
  Zap, AlertCircle, X, Wallet, Copy, Check, ShieldAlert, Smartphone, Mail
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/marketplace/ui/dialog';
import { toast } from 'sonner';
import { useUser } from '@/contexts/marketplace/UserContext';
import { formatCurrency } from '@/lib/utils';

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useUser();
  const [fundingAmount, setFundingAmount] = useState(2000);
  const [isFunding, setIsFunding] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualSubmitted, setManualSubmitted] = useState(false);

  const fundingOptions = [
    { label: 'Lite', amount: 2000, description: 'Basic credits for small tasks' },
    { label: 'Starter', amount: 5000, description: 'Perfect for small tools' },
    { label: 'Essential', amount: 10000, description: 'Best for standard projects' },
    { label: 'Professional', amount: 20000, description: 'Bulk research & high-tier tools' },
    { label: 'Institutional', amount: 50000, description: 'Complete library access' },
  ];

  const adminBankDetails = {
    accountNumber: "1030287968",
    bank: "UBA",
    name: "W3 Hub"
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleFundWallet = async () => {
    if (!user) return toast.error("Please login to fund your wallet");
    setIsFunding(true);
    try {
      const response = await fetch('/api/marketplace/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, amount: fundingAmount })
      });
      const data = await response.json();
      if (data.authorization_url) window.location.href = data.authorization_url;
      else toast.error(data.error || 'Failed to initialize');
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsFunding(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!user) return toast.error("Please login to fund your wallet");
    setIsSubmittingManual(true);
    try {
      const response = await fetch('/api/marketplace/wallet/manual-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: fundingAmount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit");

      toast.success("Transaction submitted for verification!");
      setManualSubmitted(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const resetModal = () => {
    setShowManual(false);
    setManualSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetModal();
      else onOpenChange(val);
    }}>
        <DialogContent className="bg-white border-none text-[#111827] max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {!showManual ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight uppercase tracking-tighter">Fund Your Wallet</DialogTitle>
                <DialogDescription className="text-[#6b7280] font-medium text-base">Select a funding package to continue</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8">
                {fundingOptions.map((option) => (
                  <button
                    key={option.amount}
                    onClick={() => setFundingAmount(option.amount)}
                    className={`flex flex-col text-left p-6 rounded-[24px] border-2 transition-all ${
                      fundingAmount === option.amount 
                        ? 'border-black bg-zinc-900 text-white shadow-xl scale-[1.02]' 
                        : 'border-[#e5e7eb] bg-[#f8f9fc] text-black hover:border-zinc-300'
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${fundingAmount === option.amount ? 'text-blue-400' : 'text-[#9ca3af]'}`}>
                      {option.label}
                    </span>
                    <span className="text-xl font-black mb-2">{formatCurrency(option.amount)}</span>
                    <span className={`text-[11px] font-medium leading-tight ${fundingAmount === option.amount ? 'text-zinc-400' : 'text-[#6b7280]'}`}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-7 font-black shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98]"
                  onClick={handleFundWallet}
                  disabled={isFunding}
                >
                  {isFunding ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Pay ₦{fundingAmount.toLocaleString()} (Auto)
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  className="w-full border-2 border-[#e5e7eb] text-black rounded-full py-7 font-black hover:bg-[#f8f9fc] transition-all"
                  onClick={() => setShowManual(true)}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Manual Bank Transfer
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full text-[#6b7280] font-bold rounded-full py-4" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : !manualSubmitted ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Manual Transfer</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Transfer <b>₦{fundingAmount.toLocaleString()}</b> to the account below and submit for verification.
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-2">Admin Account Details</p>
                
                <div className="flex justify-between items-center">
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
                  <button onClick={() => handleCopy(adminBankDetails.accountNumber, "Account Number")} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Account Name</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{adminBankDetails.name}</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleManualSubmit}
                disabled={isSubmittingManual}
                className="w-full bg-slate-900 hover:bg-black text-white py-7 rounded-full font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmittingManual ? "Submitting..." : "I have made payment"}
              </Button>
              
              <button 
                onClick={() => setShowManual(false)}
                className="w-full text-slate-400 font-black uppercase text-[10px] tracking-widest py-2"
              >
                Back to Options
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Request Submitted!</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                We have received your payment request. The admin will verify and fund your wallet shortly.
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
                onClick={resetModal}
                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest mt-4"
              >
                Done
              </button>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-[#f3f4f6] text-center">
             <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest flex items-center justify-center gap-2">
                <Wallet className="w-3 h-3" /> Secure Technical Exchange Protocol
             </p>
          </div>
        </DialogContent>
      </Dialog>
  );
}
