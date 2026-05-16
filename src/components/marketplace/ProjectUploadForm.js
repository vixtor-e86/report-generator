"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Upload, X, File, 
  Image as ImageIcon, AlertCircle, ChevronDown, Check, CheckCircle2,
  Code2, BookOpen, Layers, DollarSign, Sparkles, FileText, Clock
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ProjectUploadForm({ user, onComplete, onCancel }) {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiStep, setAiStep] = useState('');
  
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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    
    setAiProcessing(true);
    setAiStep('Analyzing content...');
    
    let processedAbstract = formData.abstract;
    let processedChapter1 = formData.chapter1;

    try {
      const aiRes = await fetch('/api/marketplace/process-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstract: formData.abstract, chapter1: formData.chapter1 })
      });
      
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "AI Processing failed");
      
      processedAbstract = aiData.abstract;
      processedChapter1 = aiData.chapter1;
    } catch (err) {
      console.error(err);
      toast.error("AI restructuring failed, but we'll try to proceed with raw content.");
    }

    setAiProcessing(false);
    setUploadStatus('Syncing assets...');

    try {
      const { data: seller } = await supabase.from('marketplace_sellers').select('id').eq('user_id', user.id).single();
      if (!seller) throw new Error("Accredited profile not found");

      // 1. Upload Main File
      const mainFileRes = await fetch('/api/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: formData.mainFile.name, contentType: formData.mainFile.type, userId: user.id, folder: 'projects' })
      });
      const { uploadUrl: mainUrl, publicUrl: mainFileUrl } = await mainFileRes.json();
      await fetch(mainUrl, { method: 'PUT', headers: { 'Content-Type': formData.mainFile.type }, body: formData.mainFile });

      // 2. Images
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

      // 3. Save
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
        abstract: processedAbstract,
        chapter_1_preview: processedChapter1,
        code_snippet: formData.codeSnippet,
        file_url: mainFileUrl,
        preview_images: imageUrls,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Blueprint submitted for approval!");
      if (onComplete) onComplete();

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      {aiProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-12 max-w-sm w-full text-center shadow-2xl">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 relative">
                    <Sparkles className="w-10 h-10 animate-pulse" />
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-[32px] animate-spin" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-2">Architect AI</h3>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">{aiStep}</p>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
          <button onClick={onCancel} className="flex items-center gap-2 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-red-600 transition-all">
              <ArrowLeft className="w-4 h-4 stroke-[3]" /> Abort Listing
          </button>
          <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 w-16 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              ))}
          </div>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-8 sm:p-16 shadow-2xl relative overflow-hidden">
          {step === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase tracking-tighter leading-none">Blueprint Identity</h1>
                      <p className="text-slate-400 font-black mt-2 uppercase text-[9px] tracking-widest">Stage 01 • Classification</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="md:col-span-2 space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Package Contents</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {[
                                  { id: 'source_code', label: 'Source Code', icon: Code2 },
                                  { id: 'documentation', label: 'Manuscript', icon: BookOpen },
                                  { id: 'both', label: 'Full Package', icon: CheckCircle2 },
                              ].map((type) => (
                                  <button
                                      key={type.id}
                                      type="button"
                                      onClick={() => setFormData({...formData, projectType: type.id})}
                                      className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all ${
                                          formData.projectType === type.id 
                                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl' 
                                          : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                                      }`}
                                  >
                                      <type.icon className="w-6 h-6" />
                                      <span className="font-black text-[10px] uppercase tracking-widest">{type.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-6 md:col-span-2">
                          <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Official Project Title <span className="text-red-500">*</span></Label>
                              <Input 
                                  value={formData.title} 
                                  onChange={e => setFormData({...formData, title: e.target.value})}
                                  placeholder="DESIGN AND IMPLEMENTATION OF..."
                                  className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 font-black text-slate-900 focus:border-indigo-600"
                              />
                          </div>
                      </div>

                      <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Faculty</Label>
                          <Input 
                              value={formData.faculty} 
                              onChange={e => setFormData({...formData, faculty: e.target.value})}
                              placeholder="E.G. ENGINEERING"
                              className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 font-black text-slate-900 focus:border-indigo-600 uppercase"
                          />
                      </div>
                      <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Department</Label>
                          <Input 
                              value={formData.department} 
                              onChange={e => setFormData({...formData, department: e.target.value})}
                              placeholder="E.G. COMPUTER SCIENCE"
                              className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 font-black text-slate-900 focus:border-indigo-600 uppercase"
                          />
                      </div>

                      <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Listing Price (₦)</Label>
                          <div className="relative">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-slate-900">₦</span>
                              <Input 
                                  type="number"
                                  value={formData.price} 
                                  onChange={e => setFormData({...formData, price: e.target.value})}
                                  className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 font-black text-slate-900 focus:border-indigo-600 text-xl"
                              />
                          </div>
                      </div>

                      <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Original Value (Optional)</Label>
                          <div className="relative">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300">₦</span>
                              <Input 
                                  type="number"
                                  value={formData.originalPrice} 
                                  onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                                  className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 font-bold text-zinc-400 focus:border-indigo-600 text-xl"
                              />
                          </div>
                      </div>
                  </div>

                  <Button onClick={nextStep} className="w-full bg-black text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-zinc-900 transition-all active:scale-95">Continue to Stage 02</Button>
              </div>
          )}

          {step === 2 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase tracking-tighter leading-none">Content Depth</h1>
                      <p className="text-slate-400 font-black mt-2 uppercase text-[9px] tracking-widest">Stage 02 • Content Previews</p>
                  </div>

                  <div className="space-y-8">
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Abstract Content <span className="text-red-500">*</span></Label>
                          <Textarea 
                              value={formData.abstract} 
                              onChange={e => setFormData({...formData, abstract: e.target.value})}
                              placeholder="PASTE THE COMPLETE PROJECT ABSTRACT..."
                              className="bg-zinc-50 border-[#e5e7eb] rounded-[32px] p-8 font-medium text-slate-700 min-h-[150px] focus:border-indigo-600 leading-relaxed"
                          />
                      </div>

                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Chapter 1 Preview <span className="text-red-500">*</span></Label>
                          <Textarea 
                              value={formData.chapter1} 
                              onChange={e => setFormData({...formData, chapter1: e.target.value})}
                              placeholder="PASTE THE ENTIRE INTRODUCTION / CHAPTER 1..."
                              className="bg-zinc-50 border-[#e5e7eb] rounded-[32px] p-8 font-medium text-slate-700 min-h-[300px] focus:border-indigo-600 leading-relaxed"
                          />
                      </div>

                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Core Tech Stack</Label>
                          <Input 
                              value={formData.technologies} 
                              onChange={e => setFormData({...formData, technologies: e.target.value})}
                              placeholder="E.G. PYTHON, MATLAB, ARDUINO..."
                              className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-16 font-black text-slate-900 focus:border-indigo-600 uppercase"
                          />
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-9 font-black text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 border border-zinc-200">Back</Button>
                      <Button onClick={nextStep} className="flex-[2] bg-black text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">Continue to Assets</Button>
                  </div>
              </div>
          )}

          {step === 3 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase tracking-tighter leading-none">Resource Hub</h1>
                      <p className="text-slate-400 font-black mt-2 uppercase text-[9px] tracking-widest">Stage 03 • File Uploads</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                              {formData.projectType === 'documentation' ? 'Technical Manuscript (PDF)' : 'Project Archive (ZIP)'}
                          </Label>
                          <div 
                              onClick={() => fileInputRef.current.click()}
                              className="aspect-square rounded-[40px] border-4 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50/20 transition-all group"
                          >
                              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload className="w-8 h-8 text-zinc-400 group-hover:text-indigo-600" />
                              </div>
                              <div className="text-center px-4">
                                  <p className="font-black text-xs uppercase tracking-widest">Upload Package</p>
                                  <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">MAX 100MB</p>
                              </div>
                              {formData.mainFile && <Badge className="bg-emerald-500 text-white border-none">{formData.mainFile.name.slice(0, 15)}...</Badge>}
                          </div>
                          <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'main')} className="hidden" />
                      </div>

                      <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Preview Showcase (Max 3)</Label>
                          <div 
                              onClick={() => imageInputRef.current.click()}
                              className="aspect-square rounded-[40px] border-4 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50/20 transition-all group"
                          >
                              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-indigo-600" />
                              </div>
                              <div className="text-center">
                                  <p className="font-black text-xs uppercase tracking-widest">Add Gallery</p>
                                  <p className="text-[10px] text-zinc-400 font-bold mt-1">{formData.images.length} / 3 UPLOADED</p>
                              </div>
                          </div>
                          <input type="file" ref={imageInputRef} onChange={e => handleFileUpload(e, 'gallery')} multiple accept="image/*" className="hidden" />
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-9 font-black text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 border border-zinc-200">Back</Button>
                      <Button 
                          disabled={isSubmitting}
                          onClick={handleSubmit} 
                          className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-900/20 transition-all"
                      >
                          {isSubmitting ? uploadStatus || 'Verifying...' : 'Finalize Submission'}
                      </Button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
