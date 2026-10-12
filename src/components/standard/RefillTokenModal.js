"use client";
import { useState } from 'react';

export default function RefillTokenModal({
  isOpen,
  onClose,
  projectId,
  userId,
  userEmail,
  tier = 'standard',
  currentTokensUsed = 0,
  tokensLimit = 100000
}) {
  const [selectedTokens, setSelectedTokens] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const tokenOptions = [
    { tokens: 10000, price: 1000, label: '10k Tokens' },
    { tokens: 20000, price: 2000, label: '20k Tokens' },
    { tokens: 30000, price: 3000, label: '30k Tokens' },
    { tokens: 40000, price: 4000, label: '40k Tokens' },
    { tokens: 50000, price: 5000, label: '50k Tokens' },
    { tokens: 60000, price: 6000, label: '60k Tokens' },
    { tokens: 80000, price: 8000, label: '80k Tokens' },
    { tokens: 100000, price: 10000, label: '100k Tokens' }
  ];

  const selectedOption = tokenOptions.find(o => o.tokens === selectedTokens) || tokenOptions[0];

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/token-refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail || 'support@w3writelab.com',
          projectId,
          tokensAmount: selectedTokens,
          tier
        })
      });

      const data = await response.json();

      if (!response.ok || !data.authorization_url) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Squad checkout
      window.location.href = data.authorization_url;

    } catch (err) {
      console.error('Refill error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Top Up AI Tokens</h3>
              <p className="text-[11px] font-medium text-slate-400">₦1,000 per 10,000 tokens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
            Select a package to refill your token quota. Once payment is confirmed, the purchased tokens will be immediately deducted from your used balance.
          </p>

          {/* Token Options Grid */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {tokenOptions.map((opt) => {
              const isSelected = selectedTokens === opt.tokens;
              return (
                <button
                  key={opt.tokens}
                  type="button"
                  onClick={() => setSelectedTokens(opt.tokens)}
                  disabled={loading}
                  className={`p-2.5 rounded-2xl border-2 text-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-2 ring-indigo-600/20'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-black tracking-tight">{opt.tokens / 1000}k</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                    ₦{(opt.price / 1000).toFixed(0)}k
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Refill Package</div>
              <div className="text-sm font-black text-slate-900">{selectedOption.tokens.toLocaleString()} AI Tokens</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Price</div>
              <div className="text-lg font-black text-indigo-600">₦{selectedOption.price.toLocaleString()}</div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Pay ₦{selectedOption.price.toLocaleString()}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
