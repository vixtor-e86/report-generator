"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Upload, X, File, 
  Image as ImageIcon, AlertCircle, ChevronDown, Check, CheckCircle2
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

  const [errors, setErrors] = useState({});

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

    if (type === 'file') {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } else {
      setUploadedImages((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (id, type) => {
    if (type === 'file') {
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      setUploadedImages((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 100) {
      newErrors.description = 'Description must be at least 100 characters';
    }
    if (!formData.faculty) newErrors.faculty = 'Faculty is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.level) newErrors.level = 'Level is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (uploadedFiles.length === 0) {
      newErrors.files = 'At least one project file is required';
    }
    if (uploadedImages.length === 0) {
      newErrors.images = 'At least one preview image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    // Simulate upload
    setTimeout(() => {
      toast.success('Project uploaded successfully!');
      navigate.push('/marketplace/projects');
      setIsSubmitting(false);
    }, 2000);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!user?.isSeller) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
        <div className="text-center p-12 bg-white border border-[#e5e7eb] rounded-[40px] shadow-sm max-w-lg">
          <div className="w-20 h-20 bg-zinc-100 rounded-[30px] flex items-center justify-center mb-8 mx-auto">
            <AlertCircle className="w-10 h-10 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-black text-[#111827] mb-2 tracking-tight">Accreditation Required</h2>
          <p className="text-[#6b7280] font-medium mb-10">You need a verified seller profile to publish projects to the marketplace.</p>
          <Link href="/marketplace/seller-setup">
            <Button className="bg-black hover:bg-zinc-800 text-white rounded-full px-10 py-7 font-black shadow-xl transition-all active:scale-[0.98] uppercase text-xs tracking-widest">
              Begin Accreditation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <button
          onClick={() => navigate.back()}
          className="flex items-center gap-2 text-[#6b7280] hover:text-black transition-colors mb-10 text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Abort Upload
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#111827] mb-3 tracking-tight">
            Publish Project
          </h1>
          <p className="text-[#6b7280] font-medium">
            List your professional academic work for students worldwide
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Basic Information */}
          <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-black" />
            <h2 className="text-xl font-black text-[#111827] mb-8 uppercase tracking-tighter flex items-center gap-3">
              <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-xs">01</span>
              Project Metadata
            </h2>

            <div className="space-y-8">
              <div>
                <Label htmlFor="title" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                  Official Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Design of a Modular IoT Gateway"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={`bg-[#f8f9fc] border-[#e5e7eb] text-[#111827] rounded-xl h-12 focus:border-black font-bold placeholder:text-[#9ca3af] ${
                    errors.title ? 'border-red-400' : ''
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs font-bold mt-2 uppercase tracking-wide">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                  Project Abstract & Scope
                </Label>
                <Textarea
                  id="description"
                  placeholder="Detailed technical description, problem statement, and key findings..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={`min-h-[180px] bg-[#f8f9fc] border-[#e5e7eb] text-[#111827] rounded-2xl p-6 focus:border-black font-medium leading-relaxed ${
                    errors.description ? 'border-red-400' : ''
                  }`}
                />
                <div className="flex justify-between mt-3">
                  <p className="text-[#9ca3af] text-[10px] font-black uppercase">
                    {formData.description.length} Characters (Min 100)
                  </p>
                  {errors.description && (
                    <p className="text-red-500 text-xs font-bold uppercase tracking-wide">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="faculty" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                    Field of Study
                  </Label>
                  <div className="relative">
                    <select
                      id="faculty"
                      value={formData.faculty}
                      onChange={(e) => {
                        updateField('faculty', e.target.value);
                        updateField('department', '');
                      }}
                      className={`w-full px-4 py-3 bg-[#f8f9fc] border border-[#e5e7eb] rounded-xl text-[#111827] focus:border-black focus:outline-none font-bold appearance-none ${
                        errors.faculty ? 'border-red-400' : ''
                      }`}
                    >
                      <option value="">Select Faculty</option>
                      {faculties.filter(f => f !== 'All').map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="department" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                    Department
                  </Label>
                  <div className="relative">
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      disabled={!formData.faculty}
                      className="w-full px-4 py-3 bg-[#f8f9fc] border border-[#e5e7eb] rounded-xl text-[#111827] focus:border-black focus:outline-none disabled:opacity-50 font-bold appearance-none"
                    >
                      <option value="">Select Department</option>
                      {formData.faculty && departments[formData.faculty]?.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="level" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                    Academic Level
                  </Label>
                  <div className="relative">
                    <select
                      id="level"
                      value={formData.level}
                      onChange={(e) => updateField('level', e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8f9fc] border border-[#e5e7eb] rounded-xl text-[#111827] focus:border-black focus:outline-none font-bold appearance-none"
                    >
                      <option value="">Select Level</option>
                      {levels.map((l) => (
                        <option key={l} value={l}>{l} Level</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
            <h2 className="text-xl font-black text-[#111827] mb-8 uppercase tracking-tighter flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs">02</span>
              Valuation
            </h2>

            <div className="grid md:grid-cols-2 gap-10 mb-10">
              <div>
                <Label htmlFor="price" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                  Listing Price (₦)
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g. 5000"
                  value={formData.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className={`bg-[#f8f9fc] border-[#e5e7eb] text-[#111827] rounded-xl h-14 focus:border-black font-black text-xl placeholder:text-[#9ca3af] ${
                    errors.price ? 'border-red-400' : ''
                  }`}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs font-bold mt-2 uppercase tracking-wide">{errors.price}</p>
                )}
              </div>

              <div>
                <Label htmlFor="originalPrice" className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                  MSRP / Original (₦) <span className="text-[#9ca3af] ml-1">(Optional)</span>
                </Label>
                <Input
                  id="originalPrice"
                  type="number"
                  placeholder="e.g. 8000"
                  value={formData.originalPrice}
                  onChange={(e) => updateField('originalPrice', e.target.value)}
                  className="bg-[#f8f9fc] border-[#e5e7eb] text-[#6b7280] rounded-xl h-14 focus:border-black font-bold text-xl placeholder:text-[#9ca3af]"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-4 block">Archive Classification</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { value: 'source_code', label: 'Technical Code' },
                  { value: 'documentation', label: 'Manuscript Only' },
                  { value: 'both', label: 'Full Package' },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex flex-col gap-1 p-5 rounded-[20px] border-2 cursor-pointer transition-all ${
                      formData.projectType === type.value
                        ? 'border-black bg-zinc-900 text-white shadow-xl'
                        : 'border-[#e5e7eb] bg-[#f8f9fc] text-[#6b7280] hover:border-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="projectType"
                      value={type.value}
                      checked={formData.projectType === type.value}
                      onChange={(e) => updateField('projectType', e.target.value)}
                      className="hidden"
                    />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.projectType === type.value ? 'text-blue-400' : 'text-[#9ca3af]'}`}>Classification</span>
                    <span className="font-black text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Files Upload */}
          <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
            <h2 className="text-xl font-black text-[#111827] mb-8 uppercase tracking-tighter flex items-center gap-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center text-xs">03</span>
              Digital Assets
            </h2>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Project Files */}
              <div>
                <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                  Project Archive (ZIP/PDF)
                </Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'file')}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-[#e5e7eb] rounded-[24px] hover:border-black hover:bg-[#f8f9fc] transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 bg-[#f8f9fc] rounded-2xl flex items-center justify-center group-hover:bg-white transition-colors">
                    <Upload className="w-6 h-6 text-[#9ca3af] group-hover:text-black" />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-black font-bold text-sm">Upload Package</p>
                    <p className="text-[#9ca3af] text-[10px] font-black uppercase tracking-tighter mt-1">MAX 100MB • ZIP, PDF, DOC</p>
                  </div>
                </button>

                <div className="mt-6 space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-4 bg-[#f8f9fc] rounded-2xl border border-zinc-50 shadow-sm">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
                        <File className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-black font-bold text-xs truncate">{file.name}</p>
                        <p className="text-[#9ca3af] text-[9px] font-black uppercase tracking-wider">{formatFileSize(file.size)}</p>
                      </div>
                      <button type="button" onClick={() => removeFile(file.id, 'file')} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Images */}
              <div>
                <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-3 block">
                  Showcase Gallery (PNG/JPG)
                </Label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-[#e5e7eb] rounded-[24px] hover:border-black hover:bg-[#f8f9fc] transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 bg-[#f8f9fc] rounded-2xl flex items-center justify-center group-hover:bg-white transition-colors">
                    <ImageIcon className="w-6 h-6 text-[#9ca3af] group-hover:text-black" />
                  </div>
                  <div className="text-center px-6">
                    <p className="text-black font-bold text-sm">Upload Visuals</p>
                    <p className="text-[#9ca3af] text-[10px] font-black uppercase tracking-tighter mt-1">MAX 5 IMAGES • 16:9 RATIO</p>
                  </div>
                </button>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-xl overflow-hidden border border-[#e5e7eb] shadow-sm p-1 bg-white">
                      <img
                        src={URL.createObjectURL(image.file)}
                        alt={image.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(image.id, 'image')}
                        className="absolute top-2 right-2 p-1.5 bg-black/80 backdrop-blur-md rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="flex flex-col items-center gap-8 pb-20">
            <div className="max-w-xl w-full p-6 bg-zinc-900 rounded-[28px] shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
              <div className="flex items-center justify-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <span className="text-white font-black text-xs uppercase tracking-[0.2em]">Final Authorization</span>
              </div>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8">
                Your project will be indexed by our quality control board. Once verified, it will be visible to 15,000+ students. <strong>You earn 85% commission per sale.</strong>
              </p>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-zinc-500 font-bold hover:text-white rounded-full py-7 uppercase text-[10px] tracking-widest"
                  onClick={() => navigate.back()}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-full py-7 font-black shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] uppercase text-[10px] tracking-widest"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-3" />
                      Publish to Marketplace
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
