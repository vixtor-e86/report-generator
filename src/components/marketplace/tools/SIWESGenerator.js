"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, Sparkles, RefreshCw, Copy, Check, Download, 
  Building2, GraduationCap, ShieldCheck, Wrench, BookOpen, 
  FileText, CheckCircle2, AlertCircle, ArrowLeft, Layers, Edit3, Eye
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Input } from '@/components/marketplace/ui/input';
import { Badge } from '@/components/marketplace/ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveAs } from 'file-saver';

export default function SIWESGenerator({
  isProcessing,
  setIsProcessing,
  hasPaid,
  setHasPaid,
  setShowPaymentDialog
}) {
  // Form State
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [duration, setDuration] = useState('6 Months (24 Weeks)');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [studentName, setStudentName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  
  const [objectives, setObjectives] = useState([
    'To gain practical experience in technical and industrial operations.',
    'To understand company safety protocols and workplace rules.',
    'To apply theoretical classroom knowledge to real-world engineering problems.',
    'To learn the operation, calibration, and maintenance of industrial equipment.',
    'To develop professional work ethics, teamwork, and communication skills.'
  ]);

  const [workDescription, setWorkDescription] = useState('');
  const [equipment, setEquipment] = useState('');

  // Generated Report State
  const [report, setReport] = useState(null); // { abstract, part1, part2, part3, part4 }
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'abstract' | 'part1' | 'part2' | 'part3' | 'part4' | 'full'
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Restore saved state from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('w3_siwes_generator_saved_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.companyAddress) setCompanyAddress(parsed.companyAddress);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.institution) setInstitution(parsed.institution);
        if (parsed.course) setCourse(parsed.course);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.matricNumber) setMatricNumber(parsed.matricNumber);
        if (parsed.objectives && Array.isArray(parsed.objectives)) setObjectives(parsed.objectives);
        if (parsed.workDescription) setWorkDescription(parsed.workDescription);
        if (parsed.equipment) setEquipment(parsed.equipment);
        if (parsed.report) {
          setReport(parsed.report);
          setActiveTab('full');
        }
      }
    } catch (e) {
      console.error('Failed to restore SIWES state:', e);
    }
  }, []);

  // Save state on update
  useEffect(() => {
    try {
      const payload = {
        companyName,
        companyAddress,
        department,
        duration,
        institution,
        course,
        studentName,
        matricNumber,
        objectives,
        workDescription,
        equipment,
        report
      };
      localStorage.setItem('w3_siwes_generator_saved_data', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save SIWES state:', e);
    }
  }, [companyName, companyAddress, department, duration, institution, course, studentName, matricNumber, objectives, workDescription, equipment, report]);

  const handleObjectiveChange = (index, value) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };

  const handleGenerate = useCallback(async (skipPaymentCheck = false) => {
    if (!companyName.trim()) {
      toast.error('Please specify your Placement Company/Organization Name');
      return;
    }
    if (!department.trim()) {
      toast.error('Please specify your Department or Unit in the company');
      return;
    }
    if (!workDescription.trim() || workDescription.trim().length < 20) {
      toast.error('Please provide a brief description of your work experience & duties (at least 20 characters)');
      return;
    }

    if (!skipPaymentCheck) {
      setShowPaymentDialog(true);
      return;
    } else {
      setHasPaid(false);
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/marketplace/tools/siwes-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyAddress,
          department,
          duration,
          institution,
          course,
          studentName,
          matricNumber,
          objectives,
          workDescription,
          equipment
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate SIWES report');

      if (data.report) {
        setReport(data.report);
        setActiveTab('full');
        toast.success('SIWES Technical Report Generated Successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'System error while generating SIWES report');
    } finally {
      setIsProcessing(false);
      setHasPaid(false);
    }
  }, [companyName, companyAddress, department, duration, institution, course, studentName, matricNumber, objectives, workDescription, equipment, setIsProcessing, setShowPaymentDialog, setHasPaid]);

  // Handle Payment Trigger Effect
  useEffect(() => {
    if (hasPaid && companyName.trim() && workDescription.trim()) {
      setHasPaid(false);
      handleGenerate(true);
    }
  }, [hasPaid, companyName, workDescription, handleGenerate, setHasPaid]);

  // Handle Refine Single Section
  const handleRefinePart = async (partKey) => {
    setIsRefining(true);
    try {
      const response = await fetch('/api/marketplace/tools/siwes-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyAddress,
          department,
          duration,
          institution,
          course,
          studentName,
          matricNumber,
          objectives,
          workDescription,
          equipment,
          refinePart: partKey
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to refine section');

      if (data.content && report) {
        const updatedReport = { ...report, [partKey]: data.content };
        setReport(updatedReport);
        toast.success(`Section ${partKey.toUpperCase()} Refined!`);
      }
    } catch (err) {
      toast.error(err.message || 'Refining section failed');
    } finally {
      setIsRefining(false);
    }
  };

  // Download DOCX Report
  const handleDownloadDocx = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      const response = await fetch('/api/marketplace/tools/siwes-generator/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyAddress,
          department,
          duration,
          institution,
          course,
          studentName,
          matricNumber,
          report
        })
      });

      if (!response.ok) throw new Error('Failed to generate DOCX file');
      const blob = await response.blob();
      const cleanFileName = `${(companyName || 'SIWES').replace(/[^a-z0-9]/gi, '_')}_Technical_Report.docx`;
      saveAs(blob, cleanFileName);
      toast.success('Downloaded DOCX Report!');
    } catch (err) {
      toast.error(err.message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to get active text content
  const getActiveContent = () => {
    if (!report) return '';
    if (activeTab === 'abstract') return report.abstract || '';
    if (activeTab === 'part1') return report.part1 || '';
    if (activeTab === 'part2') return report.part2 || '';
    if (activeTab === 'part3') return report.part3 || '';
    if (activeTab === 'part4') return report.part4 || '';
    if (activeTab === 'full') {
      return `${report.abstract || ''}\n\n---\n\n${report.part1 || ''}\n\n---\n\n${report.part2 || ''}\n\n---\n\n${report.part3 || ''}\n\n---\n\n${report.part4 || ''}`;
    }
    return '';
  };

  const handleCopy = () => {
    const text = getActiveContent();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied section to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Total word count calculation
  const totalWords = report ? (
    (report.abstract || '').split(/\s+/).filter(Boolean).length +
    (report.part1 || '').split(/\s+/).filter(Boolean).length +
    (report.part2 || '').split(/\s+/).filter(Boolean).length +
    (report.part3 || '').split(/\s+/).filter(Boolean).length +
    (report.part4 || '').split(/\s+/).filter(Boolean).length
  ) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-black rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 shrink-0">
              <Briefcase className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-400/30 text-indigo-300 bg-indigo-500/10 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                  Dedicated Workspace
                </Badge>
                {report && (
                  <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 bg-emerald-500/10 font-bold text-[10px] uppercase tracking-widest px-3 py-1">
                    {totalWords.toLocaleString()} Words Generated
                  </Badge>
                )}
              </div>
              <h1 className="text-xl md:text-3xl font-black tracking-tight uppercase mt-1">SIWES Script & Technical Report Generator</h1>
              <p className="text-zinc-400 text-xs md:text-sm font-medium mt-1">
                Institutional-grade Industrial Training (SIWES) reports, logbooks & executive summaries tailored for Nigerian Universities & Polytechnics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {report && (
              <Button
                onClick={() => setActiveTab('form')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest px-6 py-6"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Modify Setup
              </Button>
            )}
            <div className="bg-indigo-600/90 text-white font-black text-xs md:text-sm px-6 py-4 rounded-2xl border border-indigo-400/30 shadow-xl uppercase tracking-wider shrink-0 text-center">
              ₦3,500 per report
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {(!report || activeTab === 'form') ? (
        /* SETUP FORM VIEW */
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Placement & Technical Details</h2>
              <p className="text-xs text-slate-500 font-medium">Fill in your industrial attachment information to generate a comprehensive 4-Part SIWES report.</p>
            </div>
            {report && (
              <Button onClick={() => setActiveTab('full')} variant="ghost" className="text-indigo-600 font-black text-xs uppercase tracking-widest">
                Return to Workspace →
              </Button>
            )}
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Company Profile */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <Building2 className="w-4 h-4" /> Placement Organization
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Company / Organization Name *</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Chevron Nigeria Limited, Julius Berger PLC"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Company Location / Address</label>
                <Input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="e.g. Lekki Peninsula, Lagos State"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Department / Unit *</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Electrical & Instrumentation Maintenance Unit"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Duration of Training</label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 6 Months (24 Weeks) or 3 Months"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>
            </div>

            {/* Section 2: Student Academic Context */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <GraduationCap className="w-4 h-4" /> Academic Context (Optional for Cover)
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Institution / University Name</label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Lagos / Yaba College of Tech"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Course / Department</label>
                <Input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Electrical & Electronics Engineering"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Student Name</label>
                  <Input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Victor Adeleke"
                    className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Matric Number</label>
                  <Input
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. ENG/2021/0492"
                    className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Training Objectives */}
          <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Training Objectives (5 Core Goals)
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customizable</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-zinc-900 text-white text-[10px] font-black rounded-lg flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    value={obj}
                    onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                    placeholder={`Objective ${idx + 1}`}
                    className="bg-white border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-black"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Practical Activities & Equipment */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                Work Experience Description & Daily Tasks *
              </label>
              <Textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows={4}
                placeholder="Describe your daily duties, project participation, maintenance routines, or technical operations carried out during your attachment..."
                className="bg-slate-50 border-slate-200 rounded-2xl p-4 font-medium text-sm text-slate-900 focus:border-black focus:ring-0 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide">
                Specialized Tools, Equipment, Software & Machinery Used
              </label>
              <Input
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g. Multimeter, Oscilloscope, AutoCAD, MATLAB, Heavy Lathe Machine, Safety Harness, PLC Module"
                className="bg-slate-50 border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
              />
            </div>
          </div>

          {/* Submit Action */}
          <Button
            onClick={() => handleGenerate()}
            disabled={isProcessing || !companyName.trim() || !workDescription.trim()}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-2xl py-8 font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-98"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                Architecting SIWES Technical Report (Generating 4 Parts)...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Generate Full SIWES Report & Workspace (₦3,500)
              </>
            )}
          </Button>
        </div>
      ) : (
        /* WORKSPACE & REPORT VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-5 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Report Sections</p>
              
              <button
                onClick={() => { setActiveTab('full'); setIsEditingSection(false); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                  activeTab === 'full' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Complete Report
                </span>
                <Badge variant="secondary" className="text-[9px] bg-white/20 text-current px-2">FULL</Badge>
              </button>

              <button
                onClick={() => { setActiveTab('abstract'); setIsEditingSection(false); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                  activeTab === 'abstract' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> Executive Summary
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('part1'); setIsEditingSection(false); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                  activeTab === 'part1' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" /> Part 1: Company Profile
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('part2'); setIsEditingSection(false); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                  activeTab === 'part2' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" /> Part 2: Safety & Tools
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('part3'); setIsEditingSection(false); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                  activeTab === 'part3' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Wrench className="w-4 h-4 text-indigo-400 shrink-0" /> Part 3: Work Experience
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('part4'); setIsEditingSection(false); }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                  activeTab === 'part4' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Part 4: Challenges & Recs
                </span>
              </button>
            </div>

            {/* AI Refine Card */}
            {activeTab !== 'full' && (
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">AI Refinement</p>
                <p className="text-xs text-zinc-300 font-medium">Want to expand or re-generate this specific section?</p>
                <Button
                  onClick={() => handleRefinePart(activeTab)}
                  disabled={isRefining}
                  size="sm"
                  className="w-full bg-white text-black hover:bg-zinc-100 rounded-xl font-black text-[10px] uppercase tracking-widest py-4"
                >
                  {isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />}
                  {isRefining ? 'Refining...' : `Refine ${activeTab.toUpperCase()}`}
                </Button>
              </div>
            )}
          </div>

          {/* Right Workspace Main Panel */}
          <div className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col min-h-[650px]">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {activeTab === 'full' ? 'Complete Consolidated SIWES Report' : `Section: ${activeTab.toUpperCase()}`}
                </h2>
                <p className="text-xs text-slate-500 font-medium">{companyName} — Industrial Training Attachment</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-100"
                >
                  {copied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>

                <Button
                  onClick={handleDownloadDocx}
                  disabled={isDownloading}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider px-5"
                >
                  {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
                  {isDownloading ? 'Exporting...' : 'Download DOCX'}
                </Button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border border-slate-100 rounded-3xl p-6 md:p-8 text-slate-900 leading-relaxed text-sm">
              <div className="prose prose-slate max-w-none 
                prose-headings:text-slate-900 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                prose-p:text-slate-700 prose-p:font-medium prose-p:leading-relaxed
                prose-strong:text-slate-900 prose-strong:font-black
                prose-li:text-slate-700 prose-li:font-medium
                prose-hr:border-slate-200 prose-hr:my-8
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getActiveContent()}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
