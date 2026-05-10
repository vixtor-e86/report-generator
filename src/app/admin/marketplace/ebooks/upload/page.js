"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, File, 
  Image as ImageIcon, Book, Sparkles, 
  FileText, Check, Clock
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminUploadEbookPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

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

  const handleFileUpload = (e, type) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'main') {
        const file = files[0];
        setFormData(prev => ({ ...prev, mainFile: file }));
        toast.success(`Attached: ${file.name}`);
    } else {
        const file = files[0];
        setFormData(prev => ({ ...prev, coverImage: file }));
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAiProcess = async () => {
    if (!formData.previewContent || formData.previewContent.length < 100) {
      return toast.error("Please enter some content to process");
    }
    setAiProcessing(true);
    try {
      const res = await fetch('/api/marketplace/process-ebook-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: formData.previewContent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, previewContent: data.processedContent }));
      toast.success("Content restructured by AI");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.mainFile || !formData.coverImage || !formData.previewContent) {
      return toast.error("All fields are mandatory for Admin upload");
    }
    
    setIsSubmitting(true);
    setUploadStatus('Uploading assets...');

    try {
      // 1. Upload Ebook File
      const mainFileRes = await fetch('/api/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: formData.mainFile.name, contentType: formData.mainFile.type, folder: 'ebooks' })
      });
      const { uploadUrl: mainUrl, publicUrl: mainFileUrl } = await mainFileRes.json();
      await fetch(mainUrl, { method: 'PUT', headers: { 'Content-Type': formData.mainFile.type }, body: formData.mainFile });

      // 2. Upload Cover Image
      const imgRes = await fetch('/api/marketplace/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: formData.coverImage.name, contentType: formData.coverImage.type, folder: 'ebook-covers' })
      });
      const { uploadUrl: imgUrl, publicUrl: coverImageUrl } = await imgRes.json();
      await fetch(imgUrl, { method: 'PUT', headers: { 'Content-Type': formData.coverImage.type }, body: formData.coverImage });

      // 3. Save to DB as ACTIVE (since it's admin)
      const { error } = await supabase.from('marketplace_ebooks').insert({
        title: formData.title,
        price: parseInt(formData.price),
        original_price: formData.originalPrice ? parseInt(formData.originalPrice) : null,
        category: formData.category,
        preview_content: formData.previewContent,
        file_url: mainFileUrl,
        cover_image: coverImageUrl,
        status: 'active'
      });

      if (error) throw error;

      toast.success("Ebook published successfully!");
      router.push('/admin/marketplace/ebooks');

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-900 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 stroke-[3]" /> Return to Registry
            </button>
            <Badge className="bg-zinc-900 text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Admin Injection Mode</Badge>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[48px] p-16 shadow-sm space-y-12">
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-sm">
                    <Book className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black text-[#111827] tracking-tight uppercase tracking-tighter">Direct Ebook Entry</h1>
                <p className="text-slate-500 font-medium">Bypass approval queue and inject directly into market</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Title</Label>
                    <Input 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="Ebook Title..."
                        className="bg-zinc-50 border-[#e5e7eb] rounded-3xl h-16 font-black text-[#111827] focus:border-black"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Price (₦)</Label>
                    <Input 
                        type="number"
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="2000"
                        className="bg-zinc-50 border-[#e5e7eb] rounded-3xl h-16 font-black text-[#111827] focus:border-black"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Original Price (₦)</Label>
                    <Input 
                        type="number"
                        value={formData.originalPrice} 
                        onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                        placeholder="Optional"
                        className="bg-zinc-50 border-[#e5e7eb] rounded-3xl h-16 font-bold text-zinc-400 focus:border-black"
                    />
                </div>

                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center ml-1">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Preview Content</Label>
                        <Button 
                            disabled={aiProcessing}
                            onClick={handleAiProcess}
                            variant="ghost" 
                            className="h-auto py-1 px-3 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                        >
                            {aiProcessing ? 'Processing...' : 'Auto-Structure with AI'}
                        </Button>
                    </div>
                    <Textarea 
                        value={formData.previewContent} 
                        onChange={e => setFormData({...formData, previewContent: e.target.value})}
                        placeholder="Paste preview content here..."
                        className="bg-zinc-50 border-[#e5e7eb] rounded-[32px] p-8 font-medium text-zinc-700 min-h-[300px] focus:border-black"
                    />
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Ebook File</Label>
                    <div onClick={() => fileInputRef.current.click()} className="h-40 rounded-3xl border-4 border-dashed border-zinc-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 transition-all group">
                        <File className="w-6 h-6 text-zinc-300 group-hover:text-black transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{formData.mainFile ? formData.mainFile.name.slice(0,20) : 'Choose File'}</span>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'main')} className="hidden" />
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Cover Image</Label>
                    <div onClick={() => imageInputRef.current.click()} className="h-40 rounded-3xl border-4 border-dashed border-zinc-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 transition-all group relative overflow-hidden">
                        {imagePreview ? (
                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon className="w-6 h-6 text-zinc-300 group-hover:text-black transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Add Cover</span>
                            </>
                        )}
                    </div>
                    <input type="file" ref={imageInputRef} onChange={e => handleFileUpload(e, 'image')} className="hidden" accept="image/*" />
                </div>
            </div>

            <Button 
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full py-9 font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
                {isSubmitting ? uploadStatus : 'Inject into Market'}
            </Button>
        </div>
      </div>
    </div>
  );
}
