'use client';

import { useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';

export default function VerifyAuditReference({ tool, user, walletBalance, hasPaid, setHasPaid, setShowPaymentDialog }) {
  const [verifyText, setVerifyText] = useState('');
  const [citationStyle, setCitationStyle] = useState('APA 7th');
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditedResults, setAuditedResults] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const handleAuditReferences = async () => {
    if (!verifyText.trim()) return toast.error("Paste your references to verify");

    if (!hasPaid) {
        setShowPaymentDialog(true);
        return;
    }

    setIsProcessing(true);
    try {
        const response = await fetch('/api/marketplace/tools/reference-finder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: verifyText,
                mode: 'verify',
                style: citationStyle
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAuditedResults(data.data || []);
        toast.success('References Audited & Verified!');
        setHasPaid(false);
    } catch (err) {
        toast.error(err.message || 'Failed to verify references');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCopyCitation = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
      <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Audit & Standardize References</h2>
          <p className="text-sm font-medium text-slate-500 max-w-2xl">
            Paste your references below. Our AI will search global databases (CrossRef, Google Scholar) to verify their authenticity, correct the formatting, and flag hallucinations.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">Pasted References (1 to 20 References)</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Format Style:</span>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-xs text-slate-900 focus:border-indigo-600"
              >
                <option value="APA 7th">APA 7th Edition</option>
                <option value="IEEE">IEEE Style</option>
                <option value="Harvard">Harvard Reference Style</option>
                <option value="MLA 9th">MLA 9th Edition</option>
                <option value="Chicago">Chicago Manual of Style</option>
              </select>
            </div>
          </div>

          <Textarea
            value={verifyText}
            onChange={(e) => setVerifyText(e.target.value)}
            rows={6}
            placeholder={`Paste references here, e.g:\n\n1. Adeleke, V. (2023). Machine Learning Applications in Electrical Power Distribution. Journal of Nigerian Engineering, 14(2), 45-58.\n2. Smith, J. & Johnson, R. (2021). Autonomous Robotics in Industrial Automation. IEEE Transactions, 33(1), 102-118.`}
            className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 text-xs md:text-sm font-medium text-slate-900 focus:border-indigo-600 resize-none"
          />
        </div>

        <Button
          onClick={handleAuditReferences}
          disabled={isProcessing || !verifyText.trim()}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Auditing References & Checking DOI Databases...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Audit & Verify References
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {auditedResults.map((item, idx) => {
          const isVerified = item.status === 'verified';
          const isCorrected = item.status === 'corrected';
          
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authentic / Verified
                    </Badge>
                  ) : isCorrected ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Format Corrected
                    </Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-700 border-red-200 px-3 py-1 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-600" /> Unverified / Potential Hallucination
                    </Badge>
                  )}
                  
                  {item.confidenceScore && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.confidenceScore}% Confidence
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://scholar.google.com/scholar?q=${encodeURIComponent(item.title || item.originalText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Search className="w-3 h-3" /> Google Scholar
                  </a>
                  {item.doi && (
                    <a
                      href={`https://doi.org/${item.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" /> CrossRef DOI
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standardized Citation ({citationStyle})</span>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <p className="text-xs md:text-sm font-semibold text-slate-900 font-mono leading-relaxed select-all">
                    {item.standardizedCitation || item.originalText}
                  </p>
                  <Button
                    onClick={() => handleCopyCitation(item.standardizedCitation || item.originalText, idx)}
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-slate-600 hover:text-indigo-600"
                  >
                    {copiedId === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {item.notes && (
                <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-950 font-medium leading-relaxed">
                  <strong className="font-bold uppercase tracking-wider text-[10px] text-indigo-700 block mb-1">Audit Assessment:</strong>
                  {item.notes}
                </div>
              )}
            </div>
          );
        })}

        {!isProcessing && auditedResults.length === 0 && (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-[32px]">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Paste your gathered references above and click "Audit & Verify"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}