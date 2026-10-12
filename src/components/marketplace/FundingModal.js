"use client";
import { useState } from 'react';
import { Zap, Wallet, Lock } from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/marketplace/ui/dialog';
import { toast } from 'sonner';
import { useUser } from '@/contexts/marketplace/UserContext';
import { formatCurrency } from '@/lib/utils';

export default function FundingModal({ open, onOpenChange }) {
  const { user } = useUser();
  const [fundingAmount, setFundingAmount] = useState(2000);
  const [isFunding, setIsFunding] = useState(false);

  const fundingOptions = [
    { label: 'Lite', amount: 2000, description: 'Basic credits for small tasks' },
    { label: 'Starter', amount: 5000, description: 'Perfect for small tools' },
    { label: 'Essential', amount: 10000, description: 'Best for standard projects' },
    { label: 'Professional', amount: 20000, description: 'Bulk research & high-tier tools' },
    { label: 'Institutional', amount: 50000, description: 'Complete library access' },
  ];

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
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      toast.error('Network error. Failed to initiate payment.');
    } finally {
      setIsFunding(false);
    }
  };

  const resetModal = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetModal();
      else onOpenChange(val);
    }}>
      <DialogContent className="bg-white border-none text-[#111827] max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
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
                Proceed to Secure Checkout (₦{fundingAmount.toLocaleString()})
              </>
            )}
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-[#6b7280] font-bold rounded-full py-4" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-[#f3f4f6] text-center">
           <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL squad payment gateway
           </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
