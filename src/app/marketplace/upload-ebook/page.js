"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, X, File, 
  Image as ImageIcon, Book, DollarSign, 
  Sparkles, FileText, Clock, Check, ChevronDown, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { Badge } from '@/components/marketplace/ui/badge';
import { useUser } from '@/contexts/marketplace/UserContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UploadEbookPage() {
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    originalPrice: '',
    category: 'Ebook',
    previewContent: '',
    mainFile: null,
    coverImage: null 
  });

  const [imagePreview, setImagePreview] = useState(null);

  // 1. Seller Access Check
  useEffect(() => {
    if (user && !user.isSeller) {
      toast.error("Access Denied: You must be a verified seller.");
      router.push('/marketplace/dashboard');
    }
  }, [user, router]);

  const handleFileUpload = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'main') {
        const file = files[0];
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (!['pdf', 'docx', 'doc'].includes(extension)) {
            return toast.error("Only PDF or DOCX allowed for Ebooks.");
        }
        if (file.size > 50 * 1024 * 1024) {
            return toast.error("Max size 50MB for ebooks.");
        }

        setFormData(prev => ({ ...prev, mainFile: file }));
        toast.success(`Attached: ${file.name}`);
    } else {
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) {
            return toast.error("Max size 5MB for cover image.");
        }
        setFormData(prev => ({ ...prev, coverImage: file }));
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateStep = (s) => {
    if (s === 1) {
        if (!formData.title || !formData.price) {
            toast.error("Title and Price are mandatory");
            return false;
        }
    } else if (s === 2) {
        const wordCount = formData.previewContent.trim().split(/\s+/).length;
        if (wordCount < 100) {
            toast.error(`Preview content must be at least 100 words. Current: ${wordCount}`);
            return;
        }

    } else if (s === 3) {
        if (!formData.mainFile) {
            toast.error("The Ebook file is required");
            return false;
        }
        if (!formData.coverImage) {
            toast.error("A cover image is required");
            return false;
        }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };
  
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);
    
    // AI Processing
    setAiProcessing(true);
    let processedContent = formData.previewContent;

    try {
      const aiRes = await fetch('/api/marketplace/process-ebook-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formData.previewContent })
      });
      
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "AI Processing failed");
      
      processedContent = aiData.processedContent;
    } catch (err) {
      console.error("AI Error:", err);
      toast.error(err.message || "Something went wrong during AI analysis.");
      setAiProcessing(false);
      setIsSubmitting(false);
      return;
    }

    setAiProcessing(false);
    setUploadStatus('Uploading assets...');

    try {
      const { data: seller } = await supabase.from('marketplace_sellers').select('id').eq('user_id', user.id).single();
      if (!seller) throw new Error("Seller profile not found");

      // 1. Upload Ebook File
      const mainFileRes = await fetch('/api/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: formData.mainFile.name, contentType: formData.mainFile.type, userId: user.id, folder: 'ebooks' })
      });
      const { uploadUrl: mainUrl, publicUrl: mainFileUrl } = await mainFileRes.json();
      await fetch(mainUrl, { method: 'PUT', headers: { 'Content-Type': formData.mainFile.type }, body: formData.mainFile });

      // 2. Upload Cover Image
      const imgRes = await fetch('/api/marketplace/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: formData.coverImage.name, contentType: formData.coverImage.type, userId: user.id, folder: 'ebook-covers' })
      });
      const { uploadUrl: imgUrl, publicUrl: coverImageUrl } = await imgRes.json();
      await fetch(imgUrl, { method: 'PUT', headers: { 'Content-Type': formData.coverImage.type }, body: formData.coverImage });

      // 3. Save to DB
      const { error } = await supabase.from('marketplace_ebooks').insert({
        seller_id: seller.id,
        user_id: user.id,
        title: formData.title,
        price: parseInt(formData.price),
        original_price: formData.originalPrice ? parseInt(formData.originalPrice) : null,
        category: formData.category,
        preview_content: processedContent,
        file_url: mainFileUrl,
        cover_image: coverImageUrl,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Ebook submitted for approval!");
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
      {aiProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-12 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 relative">
                    <Sparkles className="w-10 h-10 animate-pulse" />
                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-[32px] animate-spin" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-2">AI Processing</h3>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">Structuring Ebook Preview...</p>
            </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-900 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 stroke-[3]" /> Abort Listing
            </button>
            <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 w-16 rounded-full transition-all duration-500 ${step >= i ? 'bg-black' : 'bg-zinc-200'}`} />
                ))}
            </div>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-6 sm:p-16 shadow-sm relative overflow-hidden">
            {step === 1 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-zinc-50 text-black rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-sm">
                            <Book className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Ebook Identity</h1>
                        <p className="text-[#6b7280] font-medium mt-2 uppercase text-[10px] tracking-widest">Stage 01 • Basics</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="md:col-span-2 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Ebook Title <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="Enter full ebook title..."
                                    className="bg-zinc-50 border-[#e5e7eb] rounded-3xl h-16 font-black text-[#111827] focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Price (₦) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-900">₦</span>
                                <Input 
                                    type="number"
                                    value={formData.price} 
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                    placeholder="2000"
                                    className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-3xl h-16 font-black text-[#111827] focus:border-black text-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Original Price (₦)</Label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300">₦</span>
                                <Input 
                                    type="number"
                                    value={formData.originalPrice} 
                                    onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                                    placeholder="Optional"
                                    className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-3xl h-16 font-bold text-zinc-400 focus:border-black text-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <Button onClick={nextStep} className="w-full bg-black text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all">Continue to Content</Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-zinc-50 text-black rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-sm">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Ebook Preview</h1>
                        <p className="text-[#6b7280] font-medium mt-2 uppercase text-[10px] tracking-widest">Stage 02 • AI Restructuring</p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Exerpt / Preview Content (Min 100 words) <span className="text-red-500">*</span></Label>
                        <Textarea 
                            value={formData.previewContent} 
                            onChange={e => setFormData({...formData, previewContent: e.target.value})}
                            placeholder="Paste a significant excerpt from your ebook here. This will be shown to potential buyers after AI restructuring..."
                            className="bg-zinc-50 border-[#e5e7eb] rounded-[32px] p-8 font-medium text-zinc-700 min-h-[400px] focus:border-black leading-relaxed"
                        />
                        <div className="flex justify-end text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            Words: {formData.previewContent.trim() ? formData.previewContent.trim().split(/\s+/).length : 0} / 100
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-9 font-black text-xs uppercase tracking-widest border border-zinc-200">Back</Button>
                        <Button onClick={nextStep} className="flex-[2] bg-black text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-2xl">Continue to Files</Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-zinc-50 text-black rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-zinc-100 shadow-sm">
                            <Upload className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Assets</h1>
                        <p className="text-[#6b7280] font-medium mt-2 uppercase text-[10px] tracking-widest">Stage 03 • Secure Submission</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Main Ebook File (PDF/DOCX)</Label>
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                className="aspect-square rounded-[40px] border-4 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black hover:bg-zinc-50/50 transition-all group"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <File className="w-8 h-8 text-zinc-400 group-hover:text-black" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="font-black text-xs uppercase tracking-widest">Upload File</p>
                                    <p className="text-[10px] text-zinc-400 font-bold mt-1">MAX 50MB</p>
                                </div>
                                {formData.mainFile && <Badge className="bg-emerald-500 text-white border-none">{formData.mainFile.name.slice(0, 15)}...</Badge>}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'main')} className="hidden" accept=".pdf,.doc,.docx" />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Cover Image</Label>
                            <div 
                                onClick={() => imageInputRef.current.click()}
                                className="aspect-square rounded-[40px] border-4 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-black hover:bg-zinc-50/50 transition-all group relative overflow-hidden"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-black" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-xs uppercase tracking-widest">Add Cover</p>
                                            <p className="text-[10px] text-zinc-400 font-bold mt-1">MAX 5MB</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <input type="file" ref={imageInputRef} onChange={e => handleFileUpload(e, 'image')} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={prevStep} className="flex-1 rounded-full py-9 font-black text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 border border-zinc-200">Back</button>
                        <Button 
                            disabled={isSubmitting}
                            onClick={handleSubmit} 
                            className="flex-[2] bg-black text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-zinc-800 transition-all"
                        >
                            {isSubmitting ? uploadStatus || 'Verifying...' : 'Submit Ebook'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
