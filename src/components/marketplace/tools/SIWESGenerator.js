import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Briefcase, Sparkles, RefreshCw, Copy, Check, Download, 
  Building2, GraduationCap, ShieldCheck, Wrench, BookOpen, 
  FileText, CheckCircle2, AlertCircle, ArrowLeft, Layers, Edit3, Eye,
  Upload, Camera, X, Plus, Trash2, Clock
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

  // Technical Visuals & Figures state (Max 10)
  const [uploadedVisuals, setUploadedVisuals] = useState([]);
  const visualInputRef = useRef(null);

  // Generated Report State
  const [report, setReport] = useState(null); // { abstract, part1, part2, part3, part4 }
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'abstract' | 'part1' | 'part2' | 'part3' | 'part4' | 'full'
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Saved Reports History State
  const [savedSIWESReports, setSavedSIWESReports] = useState([]);
  const [siwesTab, setSiwesTab] = useState('current'); // 'current' | 'saved'
  const [pendingNewProject, setPendingNewProject] = useState(false);

  // Refinement limit state per section (Max 2 per section)
  const [refineCounts, setRefineCounts] = useState({
    abstract: 0,
    part1: 0,
    part2: 0,
    part3: 0,
    part4: 0
  });

  // Restore saved current state & history from local storage on mount
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
        if (parsed.uploadedVisuals && Array.isArray(parsed.uploadedVisuals)) setUploadedVisuals(parsed.uploadedVisuals);
        if (parsed.refineCounts) setRefineCounts(parsed.refineCounts);
        if (parsed.report) {
          setReport(parsed.report);
          setActiveTab('full');
        }
      }

      const historySaved = localStorage.getItem('w3_saved_siwes_history');
      if (historySaved) {
        setSavedSIWESReports(JSON.parse(historySaved));
      }
    } catch (e) {
      console.error('Failed to restore SIWES state:', e);
    }
  }, []);

  // Save current report to history list
  const saveReportToHistory = useCallback((currentReportData, company, dept, inst) => {
    if (!currentReportData) return;
    const historyItem = {
      id: Date.now().toString(),
      title: `${company || 'SIWES'} Technical Report`,
      companyName: company,
      department: dept,
      institution: inst,
      createdAt: new Date().toISOString(),
      formData: {
        companyName: company,
        companyAddress,
        department: dept,
        duration,
        institution: inst,
        course,
        studentName,
        matricNumber,
        objectives,
        workDescription,
        equipment,
        uploadedVisuals
      },
      report: currentReportData
    };

    setSavedSIWESReports((prev) => {
      const updated = [historyItem, ...prev.filter(item => item.companyName !== company)];
      try {
        localStorage.setItem('w3_saved_siwes_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to SIWES history:', e);
      }
      return updated;
    });
  }, [companyAddress, duration, course, studentName, matricNumber, objectives, workDescription, equipment, uploadedVisuals]);

  // Save active state on update
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
        uploadedVisuals,
        refineCounts,
        report
      };
      localStorage.setItem('w3_siwes_generator_saved_data', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save SIWES state:', e);
    }
  }, [companyName, companyAddress, department, duration, institution, course, studentName, matricNumber, objectives, workDescription, equipment, uploadedVisuals, refineCounts, report]);

  const handleVisualUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    if (uploadedVisuals.length + files.length > 10) {
      toast.error('Maximum 10 technical visuals allowed per report.');
      return;
    }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedVisuals((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            data: reader.result,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            targetSection: 'part3'
          }
        ]);
        toast.info('Visual added. Select target section & caption.');
      };
      reader.readAsDataURL(file);
    });
  };

  const updateVisualField = (id, field, value) => {
    setUploadedVisuals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const removeVisual = (id) => {
    setUploadedVisuals((prev) => prev.filter((v) => v.id !== id));
  };

  const handleObjectiveChange = (index, value) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };

  const handleStartNewProject = () => {
    if (report) {
      saveReportToHistory(report, companyName, department, institution);
      toast.info('Current report saved to history!');
    }
    setPendingNewProject(true);
    setShowPaymentDialog(true);
  };

  const handleResetForNewProject = () => {
    setReport(null);
    setCompanyName('');
    setCompanyAddress('');
    setDepartment('');
    setWorkDescription('');
    setEquipment('');
    setUploadedVisuals([]);
    setRefineCounts({ abstract: 0, part1: 0, part2: 0, part3: 0, part4: 0 });
    setActiveTab('form');
    setSiwesTab('current');
    toast.success('Ready to setup your new SIWES report!');
  };

  const handleLoadReportFromHistory = (item) => {
    if (item.formData) {
      setCompanyName(item.formData.companyName || '');
      setCompanyAddress(item.formData.companyAddress || '');
      setDepartment(item.formData.department || '');
      setDuration(item.formData.duration || '6 Months (24 Weeks)');
      setInstitution(item.formData.institution || '');
      setCourse(item.formData.course || '');
      setStudentName(item.formData.studentName || '');
      setMatricNumber(item.formData.matricNumber || '');
      if (item.formData.objectives) setObjectives(item.formData.objectives);
      setWorkDescription(item.formData.workDescription || '');
      setEquipment(item.formData.equipment || '');
      if (item.formData.uploadedVisuals) setUploadedVisuals(item.formData.uploadedVisuals);
    }
    setReport(item.report);
    setActiveTab('full');
    setSiwesTab('current');
    toast.success(`Loaded "${item.title}" into workspace.`);
  };

  const handleDeleteReportFromHistory = (id) => {
    setSavedSIWESReports((prev) => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('w3_saved_siwes_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update SIWES history:', e);
      }
      return updated;
    });
    toast.info('Report deleted from history.');
  };

  const handleSaveSetupUpdate = () => {
    if (!companyName.trim()) {
      toast.error('Please specify your Placement Company Name');
      return;
    }
    if (report) {
      saveReportToHistory(report, companyName, department, institution);
      setActiveTab('full');
      setSiwesTab('current');
      toast.success('Setup details & technical visuals updated successfully!');
    } else {
      handleGenerate();
    }
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
        saveReportToHistory(data.report, companyName, department, institution);
        toast.success('SIWES Technical Report Generated & Saved to History!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'System error while generating SIWES report');
    } finally {
      setIsProcessing(false);
      setHasPaid(false);
    }
  }, [companyName, companyAddress, department, duration, institution, course, studentName, matricNumber, objectives, workDescription, equipment, saveReportToHistory, setIsProcessing, setShowPaymentDialog, setHasPaid]);

  // Handle Payment Trigger Effect
  useEffect(() => {
    if (hasPaid) {
      if (pendingNewProject) {
        setPendingNewProject(false);
        setHasPaid(false);
        handleResetForNewProject();
      } else if (companyName.trim() && workDescription.trim()) {
        setHasPaid(false);
        handleGenerate(true);
      }
    }
  }, [hasPaid, pendingNewProject, companyName, workDescription, handleGenerate, setHasPaid]);

  // Handle Refine Single Section (Max 2 Refinements per Section)
  const handleRefinePart = async (partKey) => {
    const currentCount = refineCounts[partKey] || 0;
    if (currentCount >= 2) {
      const sectionLabel = partKey === 'abstract' ? 'Abstract' : partKey.toUpperCase();
      toast.error(`Maximum 2 AI refinement limit reached for ${sectionLabel}. You can edit the text directly.`);
      return;
    }

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

      if (data.content) {
        const wasEmpty = !report?.[partKey] || report[partKey].trim().length < 10;
        const updatedReport = report ? { ...report, [partKey]: data.content } : { [partKey]: data.content };
        setReport(updatedReport);
        saveReportToHistory(updatedReport, companyName, department, institution);

        const newCount = currentCount + 1;
        setRefineCounts((prev) => ({
          ...prev,
          [partKey]: newCount
        }));

        const sectionLabel = partKey === 'abstract' ? 'Abstract' : partKey.toUpperCase();
        toast.success(wasEmpty ? `Section ${sectionLabel} Generated! (${newCount}/2 used)` : `Section ${sectionLabel} Refined! (${newCount}/2 used)`);
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

  const getSectionVisualsMarkdown = (sectionKey) => {
    const visuals = uploadedVisuals.filter((v) => v.targetSection === sectionKey);
    if (visuals.length === 0) return '';
    return (
      '\n\n### Technical Figures & Visuals\n\n' +
      visuals
        .map(
          (v) =>
            `![${v.caption || 'Technical Figure'}](${v.data})\n\n*${v.caption || 'Technical Figure'}*`
        )
        .join('\n\n')
    );
  };

  const getActiveContent = () => {
    if (!report) return '';
    if (activeTab === 'abstract') return report.abstract || '';
    if (activeTab === 'part1') return (report.part1 || '') + getSectionVisualsMarkdown('part1');
    if (activeTab === 'part2') return (report.part2 || '') + getSectionVisualsMarkdown('part2');
    if (activeTab === 'part3') return (report.part3 || '') + getSectionVisualsMarkdown('part3');
    if (activeTab === 'part4') return (report.part4 || '') + getSectionVisualsMarkdown('part4');
    if (activeTab === 'full') {
      return `${report.abstract || ''}\n\n---\n\n${(report.part1 || '') + getSectionVisualsMarkdown('part1')}\n\n---\n\n${(report.part2 || '') + getSectionVisualsMarkdown('part2')}\n\n---\n\n${(report.part3 || '') + getSectionVisualsMarkdown('part3')}\n\n---\n\n${(report.part4 || '') + getSectionVisualsMarkdown('part4')}`;
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

  const totalWords = report ? (
    (report.abstract || '').split(/\s+/).filter(Boolean).length +
    (report.part1 || '').split(/\s+/).filter(Boolean).length +
    (report.part2 || '').split(/\s+/).filter(Boolean).length +
    (report.part3 || '').split(/\s+/).filter(Boolean).length +
    (report.part4 || '').split(/\s+/).filter(Boolean).length
  ) : 0;

  const currentSectionContent = report?.[activeTab] || '';
  const hasSectionContent = Boolean(currentSectionContent && currentSectionContent.trim().length > 10);
  const activeSectionLabel = activeTab === 'abstract' ? 'Abstract' : activeTab.toUpperCase();

  // Main UI Render
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

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {report && (
              <Button
                onClick={() => { setActiveTab('form'); setSiwesTab('current'); }}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest px-5 py-3 shrink-0"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Modify Setup
              </Button>
            )}
            <Button
              onClick={handleStartNewProject}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-5 py-3 shadow-lg flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Start New Project (₦3,500)
            </Button>
          </div>
        </div>
      </div>

      {/* Top Workspace & History Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSiwesTab('current')}
            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              siwesTab === 'current' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" /> Active Workspace
          </button>
          <button
            onClick={() => setSiwesTab('saved')}
            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              siwesTab === 'saved' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" /> Saved Reports
            {savedSIWESReports.length > 0 && (
              <Badge variant="secondary" className="bg-white/20 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                {savedSIWESReports.length}
              </Badge>
            )}
          </button>
        </div>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {report ? `Working on: ${companyName || 'SIWES Technical Report'}` : 'No active report generated'}
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      {siwesTab === 'saved' ? (
        /* SAVED REPORTS HISTORY VIEW */
        <div className="bg-white border border-[#e5e7eb] rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Saved SIWES Projects History</h2>
              <p className="text-xs text-slate-500 font-medium">Access and redownload your previously generated SIWES technical reports.</p>
            </div>
            <Badge variant="outline" className="font-black text-xs uppercase px-3 py-1">
              {savedSIWESReports.length} Saved Projects
            </Badge>
          </div>

          {savedSIWESReports.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No saved SIWES reports yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedSIWESReports.map((item) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-indigo-500 transition-all group relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-widest mb-2">
                        {item.department || 'Technical Attachment'}
                      </Badge>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {item.institution || 'University Attachment'} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReportFromHistory(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Delete saved report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleLoadReportFromHistory(item)}
                      variant="outline"
                      className="flex-1 bg-white border-slate-200 hover:bg-slate-100 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl py-3"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Load into Workspace
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (!report || activeTab === 'form') ? (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Department / Unit *</label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Electrical Engineering Dept"
                    className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Attachment Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 focus:border-black focus:outline-none"
                  >
                    <option>3 Months (12 Weeks)</option>
                    <option>6 Months (24 Weeks)</option>
                    <option>9 Months (36 Weeks)</option>
                    <option>1 Year (52 Weeks)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Student Metadata */}
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <GraduationCap className="w-4 h-4" /> Academic Affiliation
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Institution Name</label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Lagos (UNILAG)"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Course of Study</label>
                <Input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Mechanical / Civil / Computer Engineering"
                  className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Student Full Name</label>
                  <Input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Victor Okafor"
                    className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">Matric / Reg Number</label>
                  <Input
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. 190407022"
                    className="bg-white border-slate-200 rounded-xl font-medium text-sm text-slate-900 focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Primary Work Duties & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <Wrench className="w-4 h-4" /> Industrial Experience & Operations *
              </div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                Describe the key technical activities, equipment used, and operations performed *
              </label>
              <Textarea
                rows={5}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="e.g. I participated in routine preventive maintenance on 500kVA diesel generators, calibrated industrial pressure transmitters using HART communicators, performed troubleshooting on PLC control panels, and assisted in wiring distribution boxes..."
                className="bg-white border-slate-200 rounded-2xl font-medium text-sm text-slate-900 focus:border-black"
              />
            </div>

            <div className="space-y-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Tools & Equipment Handled
              </div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                List specific tools, software, or machinery utilized
              </label>
              <Textarea
                rows={5}
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g. Digital Multimeters, Oscilloscopes, HART Communicator 475, AutoCAD 2024, MATLAB, Vernier Calipers, Hydraulic Press, Personal Protective Equipment (PPE)..."
                className="bg-white border-slate-200 rounded-2xl font-medium text-sm text-slate-900 focus:border-black"
              />
            </div>
          </div>

          {/* Section 4: Training Objectives */}
          <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <FileText className="w-4 h-4" /> SIWES Attachment Objectives (5 Points)
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50">
                Institutional Standard
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-black shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-xs font-medium text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Technical Visuals, Diagrams & Figures Upload (Max 10) */}
          <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                <Camera className="w-4 h-4" /> Technical Visuals, Diagrams & Figures (Optional)
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1">
                {uploadedVisuals.length} / 10 Visuals Added
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Upload photos, schematics, flowcharts, or machinery diagrams and select which chapter/part of the report they should be placed in.
            </p>

            <div 
              onClick={() => visualInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
              <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Click to upload figures (PNG, JPG — Max 10)
              </p>
              <input 
                type="file" 
                ref={visualInputRef} 
                onChange={handleVisualUpload} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {uploadedVisuals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {uploadedVisuals.map((visual) => (
                  <div key={visual.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative space-y-3">
                    <button 
                      onClick={() => removeVisual(visual.id)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove visual"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={visual.data} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Chapter</label>
                        <select
                          value={visual.targetSection}
                          onChange={(e) => updateVisualField(visual.id, 'targetSection', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 p-2 focus:border-black"
                        >
                          <option value="part1">Part 1: Company Profile</option>
                          <option value="part2">Part 2: Safety & Tools</option>
                          <option value="part3">Part 3: Work Experience</option>
                          <option value="part4">Part 4: Challenges & Recs</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Figure Caption</label>
                      <Input
                        value={visual.caption}
                        onChange={(e) => updateVisualField(visual.id, 'caption', e.target.value)}
                        placeholder="e.g. Figure 3.1: Circuit Diagram of Motor Control Unit"
                        className="bg-slate-50 border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit / Save Setup Action */}
          <Button
            onClick={() => {
              if (report) {
                handleSaveSetupUpdate();
              } else {
                handleGenerate();
              }
            }}
            disabled={isProcessing || !companyName.trim() || !workDescription.trim()}
            className={`w-full text-white rounded-2xl py-8 font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-98 ${
              report ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-zinc-800'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                Architecting SIWES Technical Report (Generating 4 Parts)...
              </>
            ) : report ? (
              <>
                <Check className="w-5 h-5 text-emerald-400" />
                Save Setup Details & Update Technical Visuals
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
          {/* Left Navigation Sidebar / Mobile Horizontal Scrollbar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-[#e5e7eb] rounded-3xl p-4 md:p-5 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Report Sections</p>
              
              <div className="flex overflow-x-auto lg:flex-col lg:overflow-visible gap-2 pb-2 lg:pb-0 custom-scrollbar">
                <button
                  onClick={() => { setActiveTab('full'); setIsEditingSection(false); }}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                    activeTab === 'full' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <FileText className="w-4 h-4 text-indigo-400" /> Complete Report
                  </span>
                  <Badge variant="secondary" className="text-[9px] bg-white/20 text-current px-2 ml-2 hidden sm:inline-block">FULL</Badge>
                </button>

                <button
                  onClick={() => { setActiveTab('abstract'); setIsEditingSection(false); }}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                    activeTab === 'abstract' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Abstract
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('part1'); setIsEditingSection(false); }}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                    activeTab === 'part1' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" /> Part 1: Company Profile
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('part2'); setIsEditingSection(false); }}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                    activeTab === 'part2' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" /> Part 2: Safety & Tools
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('part3'); setIsEditingSection(false); }}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                    activeTab === 'part3' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Wrench className="w-4 h-4 text-indigo-400 shrink-0" /> Part 3: Work Experience
                  </span>
                </button>

                <button
                  onClick={() => { setActiveTab('part4'); setIsEditingSection(false); }}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all ${
                    activeTab === 'part4' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Part 4: Challenges & Recs
                  </span>
                </button>
              </div>
            </div>

            {/* AI Refine / Generate Card with 2-Refinement Limit */}
            {activeTab !== 'full' && (
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {hasSectionContent ? 'AI Section Refinement' : 'AI Section Generation'}
                  </p>
                  <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                    (refineCounts[activeTab] || 0) >= 2 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {refineCounts[activeTab] || 0}/2 Used
                  </Badge>
                </div>
                <p className="text-xs text-zinc-300 font-medium">
                  {(refineCounts[activeTab] || 0) >= 2
                    ? `Refinement limit reached for ${activeSectionLabel} (2/2). Use editor to customize text.`
                    : hasSectionContent 
                      ? 'Want to expand or re-generate this specific section?' 
                      : `No content for ${activeSectionLabel} yet. Click below to generate it.`}
                </p>
                <Button
                  onClick={() => handleRefinePart(activeTab)}
                  disabled={isRefining || (refineCounts[activeTab] || 0) >= 2}
                  size="sm"
                  className="w-full bg-white text-black hover:bg-zinc-100 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-400 rounded-xl font-black text-[10px] uppercase tracking-widest py-4"
                >
                  {isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />}
                  {(refineCounts[activeTab] || 0) >= 2
                    ? `Limit Reached (2/2)`
                    : isRefining 
                      ? (hasSectionContent ? `Refining ${activeSectionLabel}...` : `Generating ${activeSectionLabel}...`)
                      : (hasSectionContent ? `Refine ${activeSectionLabel}` : `Generate ${activeSectionLabel}`)}
                </Button>
              </div>
            )}
          </div>

          {/* Right Workspace Main Panel */}
          <div className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {activeTab === 'full' ? 'Complete Consolidated SIWES Report' : `Section: ${activeTab === 'abstract' ? 'ABSTRACT' : activeTab.toUpperCase()}`}
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

            {/* Document Content View - Scrollable Constrained Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 border border-slate-100 rounded-3xl p-6 md:p-8 text-slate-900 leading-relaxed text-sm">
              {/* Clean Centered Section Title Header */}
              <div className="mb-6 pb-4 border-b border-slate-200 text-center">
                <h1 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {activeTab === 'abstract' && 'ABSTRACT'}
                  {activeTab === 'part1' && 'PART 1: COMPANY PROFILE & OVERVIEW'}
                  {activeTab === 'part2' && 'PART 2: SAFETY PROCEDURES & TECHNICAL TOOLS'}
                  {activeTab === 'part3' && 'PART 3: WORK EXPERIENCE & TECHNICAL ACTIVITIES'}
                  {activeTab === 'part4' && 'PART 4: CHALLENGES, RECOMMENDATIONS & CONCLUSION'}
                  {activeTab === 'full' && 'INDUSTRIAL TRAINING (SIWES) TECHNICAL REPORT'}
                </h1>
              </div>

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
