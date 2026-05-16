"use client";
import { useState, useEffect } from 'react';
import { 
  Zap, AlertCircle, X, Wallet, Landmark, Landmark as Bank, User, Hash, ArrowUpRight, Clock
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/marketplace/ui/dialog';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export function PaymentMethodModal({ open, onOpenChange, userId, currentAccount, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });

  useEffect(() => {
    if (currentAccount) {
      setFormData({
        bank_name: currentAccount.bank_name || '',
        account_number: currentAccount.account_number || '',
        account_name: currentAccount.account_name || ''
      });
    }
  }, [currentAccount, open]);

  const handleSave = async () => {
    if (!formData.bank_name || !formData.account_number || !formData.account_name) {
      return toast.error("Please fill all fields");
    }
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/seller/payout-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId })
      });
      if (!res.ok) throw new Error("Failed to save account details");
      toast.success("Payment account updated successfully");
      if (onSaved) onSaved(formData);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none text-[#111827] max-w-lg rounded-[40px] p-10 shadow-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black tracking-tight uppercase tracking-tighter">Settlement Account</DialogTitle>
          <DialogDescription className="text-[#6b7280] font-medium text-base">Where should we send your earnings?</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Bank Name</Label>
            <div className="relative">
              <Bank className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                value={formData.bank_name}
                onChange={e => setFormData({...formData, bank_name: e.target.value})}
                placeholder="e.g. Zenith Bank" 
                className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-bold focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Account Number</Label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                value={formData.account_number}
                onChange={e => setFormData({...formData, account_number: e.target.value})}
                placeholder="0000000000" 
                maxLength={10}
                className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-bold focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Account Name</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                value={formData.account_name}
                onChange={e => setFormData({...formData, account_name: e.target.value})}
                placeholder="e.g. John Doe" 
                className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-bold focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" className="flex-1 rounded-full py-7 font-bold" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-full py-7 font-black shadow-xl"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Details'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PayoutRequestModal({ open, onOpenChange, userId, balance, onRequested }) {
  const [amount, setAmount] = useState(balance);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmount(balance);
  }, [balance, open]);

  const handleRequest = async () => {
    if (amount < 5000) return toast.error("Minimum payout is ₦5,000");
    if (amount > balance) return toast.error("Insufficient balance");
    
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/seller/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Payout request submitted successfully");
      if (onRequested) onRequested();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none text-[#111827] max-w-lg rounded-[40px] p-10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black tracking-tight uppercase tracking-tighter">Request Payout</DialogTitle>
          <DialogDescription className="text-[#6b7280] font-medium text-base">
            Funds will be sent to your saved account within 3 working days.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
            <div className="bg-zinc-50 border border-zinc-100 rounded-[32px] p-8 text-center mb-8">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Available for Withdrawal</p>
                <p className="text-4xl font-black text-slate-900">{formatCurrency(balance)}</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Payout Amount (₦)</Label>
                    <Input 
                        type="number"
                        value={amount}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 text-2xl font-black focus:border-blue-600 text-center"
                    />
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <Clock className="w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-tight leading-tight">
                        Minimum Withdrawal: ₦5,000 • Processing: 3 Working Days
                    </p>
                </div>
            </div>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" className="flex-1 rounded-full py-7 font-bold" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="flex-[2] bg-zinc-900 hover:bg-black text-white rounded-full py-7 font-black shadow-xl flex items-center justify-center gap-2"
            onClick={handleRequest}
            disabled={loading || balance < 5000 || amount < 5000}
          >
            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <>
                    <ArrowUpRight className="w-5 h-5" />
                    Request Withdrawal
                </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
