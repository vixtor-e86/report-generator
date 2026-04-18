"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Building2, GraduationCap, 
  Phone, Mail, Check, AlertCircle, ChevronDown, Camera,
  X, Search, Landmark
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { useUser } from '@/contexts/marketplace/UserContext';
import { faculties, departments } from '@/data/marketplace/projects';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SellerSetupPage() {
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // School selection states
  const [universities, setUniversities] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isManualSchool, setIsManualSchool] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailUpdates: user?.email || '',
    phone: '',
    institutionId: '',
    institutionName: '',
    customInstitution: '',
    faculty: '',
    department: '',
    passportUrl: '',
    passportFile: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchSchools() {
      const { data } = await supabase.from('universities').select('*').order('name');
      setUniversities(data || []);
    }
    fetchSchools();
  }, []);

  const handleSchoolSelect = (school) => {
    setFormData(prev => ({ 
      ...prev, 
      institutionId: school.id, 
      institutionName: school.name,
      customInstitution: '' 
    }));
    setSchoolSearch(school.name);
    setShowSchoolDropdown(false);
    setIsManualSchool(false);
  };

  const handlePassportUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size too large. Max 5MB.");
        return;
      }
      setFormData(prev => ({ ...prev, passportFile: file, passportUrl: URL.createObjectURL(file) }));
    }
  };

  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      if (!formData.firstName) newErrors.firstName = "Required";
      if (!formData.lastName) newErrors.lastName = "Required";
      if (!formData.phone) newErrors.phone = "Required";
      if (!formData.emailUpdates) {
        newErrors.emailUpdates = "Required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailUpdates)) {
        newErrors.emailUpdates = "Invalid email format";
        toast.error("Please enter a valid email address");
        return false;
      }
    } else if (s === 2) {
      if (!isManualSchool && !formData.institutionId) newErrors.institution = "Please select your school";
      if (isManualSchool && !formData.customInstitution) newErrors.institution = "Please enter your school name";
      if (!formData.faculty) newErrors.faculty = "Required";
      if (!formData.department) newErrors.department = "Required";
    } else if (s === 3) {
      if (!formData.passportFile) newErrors.passport = "Passport photo is required";
    }

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(`Missing Info: ${firstError}`);
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const nextStep = () => validateStep(step) && setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);

    try {
      // 1. Upload to Cloudflare R2 (Simulated for now, would use your R2 utility)
      // For now we'll store a placeholder URL to test the flow
      const passportUrl = `https://r2.w3writelab.com/passports/${user.id}_${Date.now()}.jpg`;

      // 2. Insert into marketplace_sellers
      const { error } = await supabase
        .from('marketplace_sellers')
        .insert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email_updates: formData.emailUpdates,
          phone_number: formData.phone,
          institution_id: isManualSchool ? null : formData.institutionId,
          custom_institution: isManualSchool ? formData.customInstitution : null,
          faculty: formData.faculty,
          department: formData.department,
          passport_url: passportUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Application submitted successfully!");
      router.push('/marketplace/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSchools = universities.filter(u => 
    u.name.toLowerCase().includes(schoolSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-12 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* BACK BUTTON - FIXED VISIBILITY */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-zinc-900 hover:text-black mb-10 text-xs font-black uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          Abort Accreditation
        </button>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-black' : 'bg-zinc-200'}`} />
          ))}
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-8 sm:p-12 shadow-sm relative overflow-hidden">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tight uppercase">Personal Check</h1>
                <p className="text-[#6b7280] font-medium mt-1 uppercase text-[10px] tracking-widest">Stage 01 • Legal Identity</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">First Name</Label>
                  <Input 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    placeholder="ENTER NAME"
                    className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Surname</Label>
                  <Input 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    placeholder="ENTER SURNAME"
                    className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact Email (Required)</Label>
                <Input 
                  value={formData.emailUpdates} 
                  onChange={e => setFormData({...formData, emailUpdates: e.target.value})}
                  placeholder="name@university.com"
                  className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone Number</Label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+234 ..."
                  className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                />
              </div>

              <Button onClick={nextStep} className="w-full bg-black text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-zinc-800 transition-all">Continue to Education</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-3xl font-black text-[#111827] tracking-tight uppercase">Academic</h1>
                <p className="text-[#6b7280] font-medium mt-1 uppercase text-[10px] tracking-widest">Stage 02 • Institutional Info</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">Institution / School</Label>
                  {!isManualSchool ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input 
                          value={schoolSearch}
                          onChange={e => { setSchoolSearch(e.target.value); setShowSchoolDropdown(true); }}
                          onFocus={() => setShowSchoolDropdown(true)}
                          placeholder="SEARCH SCHOOLS..."
                          className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                        />
                      </div>
                      {showSchoolDropdown && schoolSearch && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden py-2">
                          {filteredSchools.map(school => (
                            <button key={school.id} onClick={() => handleSchoolSelect(school)} className="w-full text-left px-6 py-3 hover:bg-zinc-50 flex items-center gap-3 transition-colors">
                              <Landmark className="w-4 h-4 text-zinc-400" />
                              <span className="font-bold text-sm text-zinc-900">{school.name}</span>
                            </button>
                          ))}
                          <button onClick={() => { setIsManualSchool(true); setShowSchoolDropdown(false); }} className="w-full text-left px-6 py-4 bg-zinc-900 text-white flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-blue-400" />
                            <span className="font-black text-xs uppercase tracking-widest">My school is not listed</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                       <Input 
                        value={formData.customInstitution}
                        onChange={e => setFormData({...formData, customInstitution: e.target.value})}
                        placeholder="ENTER FULL SCHOOL NAME"
                        className="bg-zinc-50 border-blue-200 border-2 rounded-2xl h-14 font-black text-[#111827] focus:border-black text-base"
                      />
                      <Button variant="outline" onClick={() => setIsManualSchool(false)} className="rounded-2xl h-14 bg-white border-[#e5e7eb]"><X className="w-4 h-4 text-black stroke-[3]" /></Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Faculty</Label>
                    <Input 
                      value={formData.faculty} 
                      onChange={e => setFormData({...formData, faculty: e.target.value})}
                      placeholder="e.g. Engineering"
                      className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Department</Label>
                    <Input 
                      value={formData.department} 
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. Computer Science"
                      className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-black text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-8 font-black text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 border border-zinc-200">Back</Button>
                <Button onClick={nextStep} className="flex-[2] bg-black text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl">Verify Identity</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h1 className="text-3xl font-black text-[#111827] tracking-tight">Facial Identification</h1>
                <p className="text-[#6b7280] font-medium mt-1">Upload a clear passport photo of your face</p>
              </div>

              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-52 h-52 rounded-[40px] bg-[#f8f9fc] border-2 border-dashed border-[#e5e7eb] flex items-center justify-center overflow-hidden transition-all group-hover:border-black">
                    {formData.passportUrl ? (
                      <img src={formData.passportUrl} className="w-full h-full object-cover" alt="Passport" />
                    ) : (
                      <Camera className="w-12 h-12 text-zinc-300" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  >
                    <Landmark className="w-5 h-5 text-black" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handlePassportUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[11px] text-blue-900 font-bold leading-relaxed">
                    By applying, you agree to our Marketplace Terms of Service. Your data will be strictly used for seller accreditation and verification by the admin panel.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-8 font-black text-xs uppercase tracking-widest">Back</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Complete Accreditation"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
