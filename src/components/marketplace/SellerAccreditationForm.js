"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, User, Building2, GraduationCap, 
  Phone, Mail, Check, AlertCircle, ChevronDown, Camera,
  X, Search, Landmark
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SellerAccreditationForm({ user, onComplete, onCancel }) {
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
    gender: '',
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
      if (!formData.gender) newErrors.gender = "Gender required";
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
      const uploadRes = await fetch('/api/marketplace/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: formData.passportFile.name,
          contentType: formData.passportFile.type,
          userId: user.id,
          folder: 'passports'
        })
      });

      const { uploadUrl, publicUrl } = await uploadRes.json();
      if (!uploadUrl) throw new Error("Failed to get upload authorization");

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': formData.passportFile.type },
        body: formData.passportFile
      });

      if (!putRes.ok) throw new Error("Passport upload failed");

      const { error } = await supabase
        .from('marketplace_sellers')
        .upsert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email_updates: formData.emailUpdates,
          phone_number: formData.phone,
          gender: formData.gender,
          institution_id: isManualSchool ? null : formData.institutionId,
          custom_institution: isManualSchool ? formData.customInstitution : null,
          faculty: formData.faculty,
          department: formData.department,
          passport_url: publicUrl,
          status: 'pending',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;

      await supabase.from('marketplace_notifications').insert({
        user_id: user.id,
        title: 'Application Submitted',
        message: 'Your seller accreditation request has been received and is under review.',
        type: 'success'
      });

      toast.success("Application submitted successfully!");
      if (onComplete) onComplete();
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
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-20">
        <button 
          onClick={onCancel} 
          className="flex items-center gap-2 text-zinc-500 hover:text-black mb-10 text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          Abort Accreditation
        </button>

        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter leading-none">Personal Check</h1>
                <p className="text-slate-400 font-black mt-2 uppercase text-[9px] tracking-widest">Stage 01 • Legal Identity</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">First Name</Label>
                  <Input 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    placeholder="ENTER NAME"
                    className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Surname</Label>
                  <Input 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    placeholder="ENTER SURNAME"
                    className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Contact Email (Required)</Label>
                <Input 
                  value={formData.emailUpdates} 
                  onChange={e => setFormData({...formData, emailUpdates: e.target.value})}
                  placeholder="name@university.com"
                  className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">WhatsApp Number</Label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+234 ... (WhatsApp required)"
                  className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Gender (For Marketplace Avatar)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`py-4 rounded-2xl border-2 font-black uppercase text-xs tracking-widest transition-all ${
                        formData.gender === g 
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' 
                        : 'border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={nextStep} className="w-full bg-black text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-zinc-900 transition-all">Continue to Education</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter leading-none">Academic</h1>
                <p className="text-slate-400 font-black mt-2 uppercase text-[9px] tracking-widest">Stage 02 • Institutional Info</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block ml-1">Institution / School</Label>
                  {!isManualSchool ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input 
                          value={schoolSearch}
                          onChange={e => { setSchoolSearch(e.target.value); setShowSchoolDropdown(true); }}
                          onFocus={() => setShowSchoolDropdown(true)}
                          placeholder="SEARCH SCHOOLS..."
                          className="pl-12 bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
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
                        className="bg-zinc-50 border-indigo-200 border-2 rounded-2xl h-14 font-black text-[#111827] focus:border-indigo-600 text-base"
                      />
                      <Button variant="outline" onClick={() => setIsManualSchool(false)} className="rounded-2xl h-14 bg-white border-[#e5e7eb]"><X className="w-4 h-4 text-black stroke-[3]" /></Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Faculty</Label>
                    <Input 
                      value={formData.faculty} 
                      onChange={e => setFormData({...formData, faculty: e.target.value})}
                      placeholder="e.g. Engineering"
                      className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Department</Label>
                    <Input 
                      value={formData.department} 
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. Computer Science"
                      className="bg-zinc-50 border-[#e5e7eb] rounded-2xl h-14 font-black text-[#111827] placeholder:text-zinc-300 focus:border-indigo-600 text-base"
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
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter leading-none">Facial ID</h1>
                <p className="text-slate-400 font-black mt-2 uppercase text-[9px] tracking-widest">Stage 03 • Biometric Check</p>
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
                    <Camera className="w-5 h-5 text-black" />
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
                <Button variant="ghost" onClick={prevStep} className="flex-1 rounded-full py-8 font-black text-xs uppercase tracking-widest text-zinc-900 hover:bg-zinc-100 border border-zinc-200">Back</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-8 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20"
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
  );
}
