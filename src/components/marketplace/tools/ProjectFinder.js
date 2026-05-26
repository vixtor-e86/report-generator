"use client";
import { useState, useEffect } from 'react';
import { 
  Search, Sparkles, RefreshCw, GraduationCap, 
  Lightbulb, BookOpen, Layers, CheckCircle2, 
  ArrowRight, Info, Zap, Verified
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import ProposalDetailModal from './ProposalDetailModal';

export default function ProjectFinder({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog,
  setCustomPrice,
  walletBalance,
  onDeductFunds,
  setShowFundingModal
}) {
  // ... rest of logic ...

      <ProposalDetailModal 
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        topic={selectedTopic}
        hasPaid={hasPaid}
        setHasPaid={setHasPaid}
        setShowPaymentDialog={setShowPaymentDialog}
        setCustomPrice={setCustomPrice}
        walletBalance={walletBalance}
        onDeductFunds={onDeductFunds}
        setShowFundingModal={setShowFundingModal}
      />

      {/* Info Card */}
      <div className="bg-zinc-900 rounded-[32px] p-6 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700" />
        <div className="relative flex items-center gap-6">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md flex-shrink-0">
            <Info className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight mb-1">Pro Tip</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Verified topics come from our elite research repository. Click any topic to see full technical details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
