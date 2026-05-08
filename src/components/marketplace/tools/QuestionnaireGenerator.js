"use client";
import { useState, useEffect } from 'react';
import { 
  ClipboardList, Sparkles, RefreshCw, Copy, 
  Check, Zap, Info, FileText, Download,
  Users, Target, BarChart, ListOrdered
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { toast } from 'sonner';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SCALES = [
  { id: 'likert-5', name: 'Likert 5-point' },
  { id: 'likert-7', name: 'Likert 7-point' },
  { id: 'yes-no', name: 'Yes/No' },
  { id: 'open-ended', name: 'Open Ended' },
  { id: 'mixed', name: 'Mixed Type' },
];

export default function QuestionnaireGenerator({ 
  isProcessing, 
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog
}) {
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [scaleType, setScaleType] = useState('likert-5');
  const [numQuestions, setNumQuestions] = useState(25);
  const [questionnaire, setQuestionnaire] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Auto-execute after payment
  useEffect(() => {
    if (hasPaid && topic.trim()) {
      handleGenerate(true);
    }
  }, [hasPaid]);

  const handleGenerate = async (skipPaymentCheck = false) => {
    if (!topic.trim()) return toast.error("Please enter your research topic.");
    
    if (!hasPaid && !skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/marketplace/tools/questionnaire-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          objectives,
          targetAudience,
          scaleType: SCALES.find(s => s.id === scaleType)?.name,
          numQuestions: Number(numQuestions)
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setQuestionnaire(data.questionnaire);
      toast.success('Questionnaire generated successfully!');
      setHasPaid(false);
    } catch (err) {
      toast.error(err.message || "System under maintenance. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(questionnaire);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Questionnaire copied to clipboard!');
  };

  const downloadDocx = async () => {
    if (!questionnaire) return;
    setIsDownloading(true);
    
    try {
      const lines = questionnaire.split('\n');
      const docChildren = [
        new Paragraph({
          children: [new TextRun({ text: "RESEARCH QUESTIONNAIRE", bold: true, size: 32, font: "Times New Roman" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `TOPIC: ${topic.toUpperCase()}`, bold: true, size: 24, font: "Times New Roman" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        })
      ];

      lines.forEach(line => {
        const trimmed = line.trim().replace(/[*#]/g, '');
        if (!trimmed) {
          docChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));
          return;
        }

        let isHeading = false;
        let headingText = trimmed;
        if (line.trim().startsWith('# ')) {
          isHeading = true;
          headingText = line.trim().replace('# ', '');
        } else if (trimmed.match(/^[A-Z\s]{5,}$/) || trimmed.includes('SECTION')) {
          isHeading = true;
        }

        docChildren.push(new Paragraph({
          children: [
            new TextRun({ 
              text: headingText, 
              bold: isHeading, 
              size: isHeading ? 26 : 22,
              font: "Times New Roman"
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: isHeading ? 240 : 120, after: 120 }
        }));
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Questionnaire_${topic.substring(0, 30).replace(/\s+/g, '_')}.docx`);
      toast.success('DOCX downloaded successfully!');
    } catch (err) {
      console.error("DOCX Error:", err);
      toast.error("Failed to generate DOCX. Please copy text instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Configuration Bar */}
      <div className="bg-white border border-[#e5e7eb] rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-sm flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 rounded-lg md:rounded-xl flex items-center justify-center text-indigo-600">
            <BarChart className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <select 
            value={scaleType}
            onChange={(e) => setScaleType(e.target.value)}
            className="bg-slate-50 border-slate-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 font-bold text-[10px] md:text-xs uppercase tracking-widest text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all appearance-none outline-none"
          >
            {SCALES.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-50 rounded-lg md:rounded-xl flex items-center justify-center text-indigo-600">
            <ListOrdered className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="flex items-center gap-3 md:gap-4 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-100">
             <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Questions:</span>
             <input 
                type="number"
                min="5"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.min(50, Math.max(5, Number(e.target.value))))}
                className="w-10 md:w-12 bg-transparent border-none font-black text-xs text-zinc-900 focus:ring-0 text-center p-0"
             />
          </div>
        </div>

        <div className="ml-auto w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
          <Badge className="w-full md:w-auto bg-zinc-900 text-white border-none px-6 py-2 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-widest flex justify-center h-9 md:h-10 items-center">
            ₦1,000 / Use
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
        {/* Input Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[650px]">
          <div className="flex items-center justify-between mb-6 md:mb-8 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Project Core</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Define your research</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2 md:space-y-3">
              <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Project Topic *
              </label>
              <Input 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Impact of Remote Work..."
                className="h-14 md:h-16 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-zinc-900 focus:border-black transition-all"
              />
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" /> Specific Objectives (Optional)
              </label>
              <Textarea 
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Mention specific areas..."
                className="min-h-[120px] md:min-h-[140px] bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl p-4 md:p-6 font-bold text-sm md:text-base text-zinc-900 focus:border-black transition-all resize-none"
              />
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3" /> Target Audience (Optional)
              </label>
              <Input 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. HR Managers"
                className="h-14 md:h-16 bg-slate-50 border-slate-100 rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-zinc-900 focus:border-black transition-all"
              />
            </div>
          </div>

          <Button 
            onClick={() => handleGenerate()}
            disabled={isProcessing || !topic.trim()}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-[20px] md:rounded-[24px] py-6 md:py-10 font-black uppercase text-[10px] md:text-sm tracking-[0.2em] shadow-xl mt-6 md:mt-8 flex items-center justify-center gap-3 md:gap-4 shrink-0 transition-all active:scale-95"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />}
            {isProcessing ? 'Drafting Instrument...' : `Generate Instrument (₦1,000)`}
          </Button>
        </div>

        {/* Output Pane */}
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[48px] p-6 md:p-10 shadow-sm flex flex-col h-[500px] md:h-[650px]">
          <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#111827] uppercase tracking-tighter">Drafted Instrument</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Ready for review</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 rounded-[24px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 relative group">
            {questionnaire ? (
              <div className="prose prose-slate max-w-none text-sm md:text-base
                prose-headings:text-zinc-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed
                prose-strong:text-zinc-900 prose-strong:font-black
                prose-ul:list-disc prose-ol:list-decimal
                font-bold text-zinc-800 leading-relaxed
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {questionnaire}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                <ClipboardList className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-10" />
                <p className="font-bold uppercase text-[8px] md:text-[10px] tracking-widest">Instrument will appear here</p>
              </div>
            )}
            
            {questionnaire && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    onClick={handleCopy} 
                    variant="outline" 
                    size="sm"
                    className="rounded-full bg-white border-[#e5e7eb] text-zinc-900 font-black uppercase text-[8px] md:text-[9px] tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                >
                    {copied ? <Check className="w-3 h-3 text-green-400 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                    {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button 
                    onClick={downloadDocx} 
                    variant="outline" 
                    size="sm"
                    disabled={isDownloading}
                    className="rounded-full bg-white border-[#e5e7eb] text-zinc-900 font-black uppercase text-[8px] md:text-[9px] tracking-widest hover:bg-black hover:text-white transition-all shadow-sm gap-1.5"
                >
                    {isDownloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3 text-indigo-600" />}
                    {isDownloading ? '...' : 'DOCX'}
                </Button>
              </div>
            )}
          </div>

          {questionnaire && (
             <div className="mt-6 md:mt-8 p-4 md:p-6 bg-indigo-50 rounded-[20px] md:rounded-[24px] border border-indigo-100 flex items-center gap-3 md:gap-4 shrink-0">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 shrink-0" />
                <p className="text-[8px] md:text-[10px] font-bold text-indigo-700 uppercase leading-relaxed tracking-tight">
                    This is an AI-generated draft. Please review and validate with your supervisor before distribution.
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
