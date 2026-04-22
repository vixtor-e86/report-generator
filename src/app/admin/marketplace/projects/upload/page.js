"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, X, File, 
  Image as ImageIcon, AlertCircle, Check, CheckCircle2,
  Code2, BookOpen, Layers, DollarSign, Sparkles, FileText, Clock,
  Plus, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminUploadProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [user, setUser] = useState(null);
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

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(user);
    }
    checkAdmin();
  }, [router]);

  const handleFileUpload = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'main') {
        const file = files[0];
        setFormData(prev => ({ ...prev, mainFile: file }));
        toast.success(`Attached: ${file.name}`);
    } else {
        const newFiles = Array.from(files);
        const currentCount = formData.images.length;
        if (currentCount + newFiles.length > 5) {
            return toast.error("Max 5 images allowed for admins.");
        }
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newFiles] }));
        const urls = newFiles.map(f => URL.createObjectURL(f));
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

  const calculateDiscount = () => {
    if (!formData.price || !formData.originalPrice) return null;
    const p = parseInt(formData.price);
    const o = parseInt(formData.originalPrice);
    if (o <= p) return null;
    return Math.round(((o - p) / o) * 100);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.faculty || !formData.department || !formData.abstract || !formData.chapter1 || !formData.mainFile || formData.images.length === 0) {
        return toast.error("Please fill all required fields and upload assets.");
    }

    setIsSubmitting(true);

    // AI Processing Step
    setAiProcessing(true);
    setAiStep('Analyzing abstract...');
    
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
      
      setAiStep('Restructuring Chapter 1...');
      processedAbstract = aiData.abstract;
      processedChapter1 = aiData.chapter1;
      
    } catch (err) {
      console.error("AI Error:", err);
      toast.error(err.message || "Something went wrong during AI analysis. Please try again later.");
      setAiProcessing(false);
      setIsSubmitting(false);
      return;
    }

    setAiProcessing(false);
    setUploadStatus('Initializing Admin Secure Upload...');

    try {
      // 1. Upload Main File
      setUploadStatus('Uploading Project Archive...');
      const mainFileRes = await fetch('/api/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: formData.mainFile.name, contentType: formData.mainFile.type, userId: user.id, folder: 'admin_projects' })
      });
      const { uploadUrl: mainUrl, publicUrl: mainFileUrl } = await mainFileRes.json();
      await fetch(mainUrl, { method: 'PUT', headers: { 'Content-Type': formData.mainFile.type }, body: formData.mainFile });

      // 2. Image Uploads
      setUploadStatus('Syncing Visual Assets...');
      const imageUploadPromises = formData.images.map(async (img) => {
        const res = await fetch('/api/marketplace/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: img.name, contentType: img.type, userId: user.id, folder: 'admin_previews' })
        });
        const { uploadUrl, publicUrl } = await res.json();
        await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': img.type }, body: img });
        return publicUrl;
      });

      const imageUrls = await Promise.all(imageUploadPromises);

      // 3. Save to DB (seller_id is null for W3 Hub admin projects)
      setUploadStatus('Pushing directly to Live Market...');
      const { error } = await supabase.from('marketplace_projects').insert({
        seller_id: null, 
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
        status: 'active' 
      });

      if (error) throw error;

      toast.success("Project pushed to market successfully!");
      router.push('/admin/marketplace/projects');

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Admin upload failed");
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* AI Processing Modal */}
      {aiProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-12 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 relative">
                    <Sparkles className="w-10 h-10 animate-pulse" />
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-[32px] animate-spin" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-2">AI Restructuring</h3>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">{aiStep}</p>
                <div className="mt-8 flex gap-1 justify-center">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                </div>
            </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to blueprints
                </button>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Marketplace Injector</h1>
                <p className="text-slate-500 font-medium">Create and push official W3 Hub technical blueprints directly to the live market.</p>
            </div>
            <div className="flex gap-4">
                <Button 
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-95"
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : <Zap className="w-4 h-4" />}
                    {isSubmitting ? 'Injecting Project...' : 'Push to Live Market'}
                </Button>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-8">
                {/* Stage 01: Core */}
                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Core Identity</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Title</Label>
                            <Input 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="DESIGN AND IMPLEMENTATION OF..."
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 font-black text-slate-900 focus:border-blue-600 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty</Label>
                            <Input 
                                value={formData.faculty} 
                                onChange={e => setFormData({...formData, faculty: e.target.value})}
                                placeholder="e.g. Engineering"
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 font-bold text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</Label>
                            <Input 
                                value={formData.department} 
                                onChange={e => setFormData({...formData, department: e.target.value})}
                                placeholder="e.g. Computer Science"
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 font-bold text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listing Price (₦)</Label>
                            <Input 
                                type="number"
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                placeholder="5000"
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 font-black text-slate-900 text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Price (₦)</Label>
                            <Input 
                                type="number"
                                value={formData.originalPrice} 
                                onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                                placeholder="Optional"
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 font-bold text-slate-400 text-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Stage 02: Technical */}
                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Technical Depth</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technologies Used</Label>
                            <Input 
                                value={formData.technologies} 
                                onChange={e => setFormData({...formData, technologies: e.target.value})}
                                placeholder="e.g. React, Node.js, Arduino, Python..."
                                className="bg-slate-50 border-slate-100 rounded-2xl h-14 font-bold text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abstract Preview</Label>
                            <Textarea 
                                value={formData.abstract} 
                                onChange={e => setFormData({...formData, abstract: e.target.value})}
                                placeholder="Paste project abstract..."
                                className="bg-slate-50 border-slate-100 rounded-3xl p-6 min-h-[150px] font-medium text-slate-600 leading-relaxed"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chapter 1 Content</Label>
                            <Textarea 
                                value={formData.chapter1} 
                                onChange={e => setFormData({...formData, chapter1: e.target.value})}
                                placeholder="Paste full Chapter 1..."
                                className="bg-slate-50 border-slate-100 rounded-3xl p-6 min-h-[300px] font-medium text-slate-600 leading-relaxed"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Code Snippet (Optional)</Label>
                            <Textarea 
                                value={formData.codeSnippet} 
                                onChange={e => setFormData({...formData, codeSnippet: e.target.value})}
                                placeholder="Paste core code snippet..."
                                className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 min-h-[150px] font-mono text-emerald-400 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Assets & Preview */}
            <div className="space-y-8">
                {/* Asset Uploads */}
                <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm space-y-6">
                    <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-4">Master Assets</h2>
                    
                    {/* Main File */}
                    <div 
                        onClick={() => fileInputRef.current.click()}
                        className="group border-2 border-dashed border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-600 hover:bg-blue-50/30 transition-all"
                    >
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest">Main Blueprint (ZIP)</p>
                            {formData.mainFile && <p className="text-[10px] text-blue-600 font-bold mt-1 truncate max-w-[150px]">{formData.mainFile.name}</p>}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'main')} className="hidden" />

                    {/* Gallery */}
                    <div 
                        onClick={() => imageInputRef.current.click()}
                        className="group border-2 border-dashed border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-600 hover:bg-emerald-50/30 transition-all"
                    >
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest">Visual Previews</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{formData.images.length} / 5 UPLOADED</p>
                        </div>
                    </div>
                    <input type="file" ref={imageInputRef} onChange={e => handleFileUpload(e, 'gallery')} multiple accept="image/*" className="hidden" />

                    <div className="flex flex-wrap gap-2 justify-center">
                        {imagePreviews.map((url, i) => (
                            <div key={i} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 group">
                                <img src={url} className="w-full h-full object-cover" />
                                <button onClick={() => removeImage(i)} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Preview */}
                <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-xl space-y-6">
                    <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Pricing Preview</h2>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-black">₦{parseInt(formData.price || 0).toLocaleString()}</span>
                        {formData.originalPrice && parseInt(formData.originalPrice) > parseInt(formData.price) && (
                            <span className="text-slate-500 line-through font-bold text-lg mb-0.5">₦{parseInt(formData.originalPrice).toLocaleString()}</span>
                        )}
                    </div>
                    {calculateDiscount() && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{calculateDiscount()}% DISCOUNT APPLIED</span>
                        </div>
                    )}
                    
                    <div className="pt-6 border-t border-zinc-800 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <img src="/favicon.ico" className="w-4 h-4" alt="W3" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Official W3 Hub Project</p>
                                <p className="text-[9px] text-zinc-500 font-bold">Contact: w3writelab@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-50 border border-blue-100 rounded-[32px] p-6 space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Admin Protocol</span>
                    </div>
                    <p className="text-[11px] text-blue-900 font-bold leading-relaxed">
                        Projects uploaded via this terminal bypass the review queue and are marked as <b>Official W3 Hub Blueprints</b>. Ensure technical accuracy and file integrity before pushing.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
