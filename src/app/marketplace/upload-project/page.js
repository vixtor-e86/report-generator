"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Upload, X, FileCode, FileText, File, 
  Image as ImageIcon, AlertCircle, ChevronDown, Check
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { faculties, departments, levels } from '@/data/marketplace/projects';
import { useUser } from '@/contexts/marketplace/UserContext';
import { formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

export default function UploadProjectPage() {
  const navigate = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    faculty: '',
    department: '',
    level: '',
    projectType: 'both',
    price: '',
    originalPrice: '',
    tags: '',
  });

  const handleFileUpload = (e, type) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    }));
    if (type === 'file') setUploadedFiles((prev) => [...prev, ...newFiles]);
    else setUploadedImages((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (id, type) => {
    if (type === 'file') setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    else setUploadedImages((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Project uploaded!');
      navigate.push('/marketplace/projects');
      setIsSubmitting(false);
    }, 2000);
  };

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  if (!user?.isSeller) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => navigate.back()} className="flex items-center gap-2 text-[#6b7280] hover:text-black mb-10 text-xs font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4" />Back</button>
        <h1 className="text-4xl font-black text-[#111827] text-center mb-12 tracking-tight">Publish Project</h1>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-black" />
            <h2 className="text-xl font-black text-[#111827] mb-8 uppercase tracking-tighter">01 Project Metadata</h2>
            <div className="space-y-8">
              <div>
                <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">Official Title</Label>
                <Input value={formData.title} onChange={(e) => updateField('title', e.target.value)} className="bg-[#f8f9fc] border-[#e5e7eb] rounded-xl h-12 focus:border-black font-bold" />
              </div>
              <div>
                <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">Project Abstract</Label>
                <Textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} className="bg-[#f8f9fc] border-[#e5e7eb] rounded-2xl p-6 min-h-[180px] focus:border-black font-medium leading-relaxed" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
            <h2 className="text-xl font-black text-[#111827] mb-8 uppercase tracking-tighter">02 Valuation</h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">Listing Price (₦)</Label>
                <Input type="number" value={formData.price} onChange={(e) => updateField('price', e.target.value)} className="bg-[#f8f9fc] border-[#e5e7eb] rounded-xl h-14 focus:border-black font-black text-xl" />
              </div>
            </div>
          </div>

          <div className="text-center pb-20">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-12 py-8 font-black text-lg shadow-xl" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading...' : 'Publish to Marketplace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
