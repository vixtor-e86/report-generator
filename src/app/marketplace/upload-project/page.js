"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, X, File, 
  Image as ImageIcon, AlertCircle, ChevronDown, Check, CheckCircle2,
  Code2, BookOpen, Layers, DollarSign, Sparkles, FileText, Clock
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { useUser } from '@/contexts/marketplace/UserContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UploadProjectPage() {
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [hasPendingProject, setHasPendingProject] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    originalPrice: '',
    faculty: '',
    department: '',
    level: '400',
    projectType: 'both', 
    technologies: '',
    abstract: '',
    chapter1: '',
    codeSnippet: '',
    mainFile: null,
    images: [] 
  });

  const [imagePreviews, setImagePreviews] = useState([]);

  // 1. Seller Access Check
  useEffect(() => {
    if (user && !user.isSeller) {
      toast.error("Access Denied: You must be a verified seller.");
      router.push('/marketplace/dashboard');
    }
  }, [user, router]);

  // 2. ✅ NEW: Pending Project Guard
  useEffect(() => {
    async function checkPending() {
      if (!user) return;
      try {
        const { count, error } = await supabase
          .from('marketplace_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending');
        
        if (count > 0) setHasPendingProject(true);
      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    }
    checkPending();
  }, [user]);

  const handleFileUpload = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'main') {
        const file = files[0];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (formData.projectType === 'documentation') {
            if (!['pdf', 'docx', 'doc'].includes(extension)) {
                return toast.error("Only PDF or DOCX allowed for documentation.");
            }
            if (file.size > 20 * 1024 * 1024) {
                return toast.error("Max size 20MB for documents.");
            }
        } else {
            if (!['zip', 'rar', '7z'].includes(extension)) {
                return toast.error("Please upload a ZIP or RAR for code projects.");
            }
            if (file.size > 100 * 1024 * 1024) {
                return toast.error("Max size 100MB for archives.");
            }
        }

        setFormData(prev => ({ ...prev, mainFile: file }));
        toast.success(`Attached: ${file.name}`);
    } else {
        const newFiles = Array.from(files);
        const currentCount = formData.images.length;
        if (currentCount + newFiles.length > 3) {
            return toast.error("Max 3 images allowed.");
        }

        const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
        setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
        const urls = validFiles.map(f => URL.createObjectURL(f));
        setImagePreviews(prev => [...prev, ...urls]);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 3. ✅ STRICT VALIDATION LOGIC
  const validateStep = (s) => {
    if (s === 1) {
        if (!formData.title || !formData.price || !formData.faculty || !formData.department) {
            toast.error("All Stage 01 fields are mandatory");
            return false;
        }
    } else if (s === 2) {
        if (formData.abstract.length < 100) {
            toast.error("Abstract must be at least 100 characters");
            return false;
        }
        if (formData.chapter1.length < 500) {
            toast.error("Chapter 1 content must be at least 500 characters");
            return false;
        }
    } else if (s === 3) {
        if (!formData.mainFile) {
            toast.error("The project archive file is required");
            return false;
        }
        if (formData.images.length === 0) {
            toast.error("A thumbnail image is required");
            return false;
        }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
        setStep(step + 1);
    }
  };
  
  const prevStep = () => setStep(step - 1);

  // Loading Screen
  if (pageLoading) return <div className="py-40 text-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto" /></div>;

  // ✅ QUEUE GUARD UI
  if (hasPendingProject) {
    return (
        <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
            <div className="text-center p-12 bg-white border border-[#e5e7eb] rounded-[48px] shadow-sm max-w-lg animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[30px] flex items-center justify-center mb-8 mx-auto">
                    <Clock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-[#111827] mb-2 tracking-tight uppercase">Queue Restricted</h2>
                <p className="text-[#6b7280] font-medium mb-10 leading-relaxed">
                    You already have a technical blueprint awaiting approval. To maintain marketplace quality, you can only list one project at a time in the review queue.
                </p>
                <Link href="/marketplace/dashboard">
                    <Button className="bg-black text-white rounded-full px-10 py-7 font-black shadow-xl uppercase text-xs tracking-widest">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    setUploadStatus('Securing Connection...');

    try {
      const { data: seller } = await supabase.from('marketplace_sellers').select('id').eq('user_id', user.id).single();
      if (!seller) throw new Error("Seller profile not found");

      // 1. Upload Main File
      setUploadStatus('Uploading Project Archive...');
      const mainFileRes = await fetch('/api/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: formData.mainFile.name, contentType: formData.mainFile.type, userId: user.id, folder: 'projects' })
      });
      const { uploadUrl: mainUrl, publicUrl: mainFileUrl } = await mainFileRes.json();
      await fetch(mainUrl, { method: 'PUT', headers: { 'Content-Type': formData.mainFile.type }, body: formData.mainFile });

      // 2. Parallel Image Uploads
      setUploadStatus('Syncing Visual Assets...');
      const imageUploadPromises = formData.images.map(async (img) => {
        const res = await fetch('/api/marketplace/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: img.name, contentType: img.type, userId: user.id, folder: 'previews' })
        });
        const { uploadUrl, publicUrl } = await res.json();
        await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': img.type }, body: img });
        return publicUrl;
      });

      const imageUrls = await Promise.all(imageUploadPromises);

      // 3. Save to DB
      setUploadStatus('Registering Technical Blueprint...');
      const { error } = await supabase.from('marketplace_projects').insert({
        seller_id: seller.id,
        user_id: user.id,
        title: formData.title,
        price: parseInt(formData.price),
        original_price: formData.originalPrice ? parseInt(formData.originalPrice) : null,
        faculty: formData.faculty,
        department: formData.department,
        level: formData.level,
        project_type: formData.projectType,
        technologies: formData.technologies,
        abstract: formData.abstract,
        chapter_1_preview: formData.chapter1,
        code_snippet: formData.codeSnippet,
        file_url: mainFileUrl,
        preview_images: imageUrls,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Project submitted for approval!");
      router.push('/marketplace/dashboard');

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-6 sm:pt-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Nav */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-900 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 stroke-[3]" /> <span className="hidden xs:inline">Abort Listing</span>
            </button>
            <div className="flex gap-1.5 sm:gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 sm:h-2 w-10 sm:w-16 rounded-full transition-all duration-500 ${step >= i ? 'bg-black' : 'bg-zinc-200'}`} />
                ))}
            </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[32px] sm:rounded-[48px] p-6 sm:p-16 shadow-sm relative overflow-hidden">
            {step === 1 && (
                <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-50 text-black rounded-2xl sm:rounded-[24px] flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-zinc-100 shadow-sm">
                            <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Project Identity</h1>
                        <p className="text-[#6b7280] font-medium mt-1 sm:mt-2 uppercase text-[9px] sm:text-[10px] tracking-widest">Stage 01 • Core Definition</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                        <div className="md:col-span-2 space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Archive Classification</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { id: 'source_code', label: 'Source Code', icon: Code2 },
                                    { id: 'documentation', label: 'Manuscript Only', icon: BookOpen },
                                    { id: 'both', label: 'Full Package', icon: CheckCircle2 },
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({...formData, projectType: type.id})}
                                        className={`flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-2xl sm:rounded-[28px] border-2 transition-all ${
                                            formData.projectType === type.id 
                                            ? 'border-black bg-zinc-900 text-white shadow-xl' 
                                            : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                                        }`}
                                    >
                                        <type.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6 md:col-span-2">
                            <div className="space-y-2 sm:space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Official Title <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="DESIGN AND IMPLEMENTATION OF..."
                                    className="bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-3xl h-14 sm:h-16 font-black text-[#111827] focus:border-black text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Faculty <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.faculty} 
                                onChange={e => setFormData({...formData, faculty: e.target.value})}
                                placeholder="E.G. ENGINEERING"
                                className="bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-3xl h-14 sm:h-16 font-black text-[#111827] focus:border-black text-sm sm:text-base"
                            />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Department <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.department} 
                                onChange={e => setFormData({...formData, department: e.target.value})}
                                placeholder="E.G. COMPUTER SCIENCE"
                                className="bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-3xl h-14 sm:h-16 font-black text-[#111827] focus:border-black text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Listing Price (₦) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-900">₦</span>
                                <Input 
                                    type="number"
                                    value={formData.price} 
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                    placeholder="5000"
                                    className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-3xl h-14 sm:h-16 font-black text-[#111827] focus:border-black text-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Original Price (₦)</Label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300">₦</span>
                                <Input 
                                    type="number"
                                    value={formData.originalPrice} 
                                    onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                                    placeholder="OPTIONAL"
                                    className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-3xl h-14 sm:h-16 font-bold text-zinc-400 focus:border-black text-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <Button onClick={nextStep} className="w-full bg-black text-white rounded-full py-7 sm:py-9 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all active:scale-95">Continue to Technical Details</Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-50 text-black rounded-2xl sm:rounded-[24px] flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-zinc-100 shadow-sm">
                            <Code2 className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Technical Depth</h1>
                        <p className="text-[#6b7280] font-medium mt-1 sm:mt-2 uppercase text-[9px] sm:text-[10px] tracking-widest">Stage 02 • Content Previews</p>
                    </div>

                    <div className="space-y-6 sm:space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Technologies Used</Label>
                            <Input 
                                value={formData.technologies} 
                                onChange={e => setFormData({...formData, technologies: e.target.value})}
                                placeholder="E.G. REACT, ARDUINO, MATLAB, PYTHON..."
                                className="bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-3xl h-14 sm:h-16 font-black text-[#111827] focus:border-black text-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Abstract Preview <span className="text-red-500">*</span></Label>
                            <Textarea 
                                value={formData.abstract} 
                                onChange={e => setFormData({...formData, abstract: e.target.value})}
                                placeholder="COPY AND PASTE THE COMPLETE PROJECT ABSTRACT HERE..."
                                className="bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-[32px] p-6 sm:p-8 font-medium text-zinc-700 min-h-[150px] focus:border-black leading-relaxed text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Chapter 1 Full Content <span className="text-red-500">*</span></Label>
                            <Textarea 
                                value={formData.chapter1} 
                                onChange={e => setFormData({...formData, chapter1: e.target.value})}
                                placeholder="PASTE THE ENTIRE INTRODUCTION / CHAPTER 1..."
                                className="bg-zinc-50 border-[#e5e7eb] rounded-2xl sm:rounded-[32px] p-6 sm:p-8 font-medium text-zinc-700 min-h-[300px] focus:border-black leading-relaxed text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Source Code Snippet (Optional)</Label>
                            <Textarea 
                                value={formData.codeSnippet} 
                                onChange={e => setFormData({...formData, codeSnippet: e.target.value})}
                                placeholder="PASTE A SAMPLE OF THE CORE PROGRAM / SCRIPT..."
                                className="bg-zinc-900 border-zinc-800 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 font-mono text-emerald-400 min-h-[150px] focus:border-emerald-500 leading-relaxed text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-7 sm:py-9 font-black text-xs uppercase tracking-widest hover:bg-zinc-50 text-zinc-900 border border-zinc-200">Back</Button>
                        <Button onClick={nextStep} className="flex-[2] bg-black text-white rounded-full py-7 sm:py-9 font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95">Continue to Assets</Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-50 text-black rounded-2xl sm:rounded-[24px] flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-zinc-100 shadow-sm">
                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Asset Hub</h1>
                        <p className="text-[#6b7280] font-medium mt-1 sm:mt-2 uppercase text-[9px] sm:text-[10px] tracking-widest">Stage 03 • Secure Submission</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                        {/* Main Archive */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">
                                {formData.projectType === 'documentation' ? 'Document (PDF/DOCX)' : 'Project Archive (ZIP)'}
                            </Label>
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                className="aspect-square rounded-[32px] sm:rounded-[40px] border-4 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black hover:bg-zinc-50/50 transition-all group"
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {formData.projectType === 'documentation' ? <FileText className="w-8 h-8 text-zinc-400 group-hover:text-black" /> : <Upload className="w-8 h-8 text-zinc-400 group-hover:text-black" />}
                                </div>
                                <div className="text-center px-4">
                                    <p className="font-black text-[11px] sm:text-xs uppercase tracking-widest">Upload Package</p>
                                    <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold mt-1 uppercase">
                                        {formData.projectType === 'documentation' ? 'MAX 20MB • PDF/DOCX' : 'MAX 100MB • ZIP FILE'}
                                    </p>
                                </div>
                                {formData.mainFile && (
                                    <div className="mt-2 flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black">
                                        <Check className="w-3 h-3" /> {formData.mainFile.name.slice(0, 10)}...
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'main')} className="hidden" />
                        </div>

                        {/* Images */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Visual showcase (Max 3)</Label>
                            <div 
                                onClick={() => imageInputRef.current.click()}
                                className="aspect-square rounded-[32px] sm:rounded-[40px] border-4 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black hover:bg-zinc-50/50 transition-all group"
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-black" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-[11px] sm:text-xs uppercase tracking-widest">Add Gallery</p>
                                    <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold mt-1 uppercase">{formData.images.length} / 3 UPLOADED</p>
                                </div>
                            </div>
                            <input type="file" ref={imageInputRef} onChange={e => handleFileUpload(e, 'gallery')} multiple accept="image/*" className="hidden" />
                            
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 justify-center">
                                {imagePreviews.map((url, i) => (
                                    <div key={i} className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-zinc-200 group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeImage(i)} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                        {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] font-black text-center py-0.5">COVER</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={prevStep} className="flex-1 rounded-full py-7 sm:py-9 font-black text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-all">Back</button>
                        <Button 
                            disabled={isSubmitting}
                            onClick={handleSubmit} 
                            className="flex-[2] bg-black text-white rounded-full py-7 sm:py-9 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all active:scale-95"
                        >
                            {isSubmitting ? uploadStatus || 'Verifying Payload...' : 'Submit for Approval'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
