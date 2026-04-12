"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Building2, GraduationCap, 
  Hash, FileText, Check, AlertCircle, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Input } from '@/components/marketplace/ui/input';
import { Label } from '@/components/marketplace/ui/label';
import { Textarea } from '@/components/marketplace/ui/textarea';
import { useUser } from '@/contexts/marketplace/UserContext';
import { faculties, departments, levels } from '@/data/marketplace/projects';
import { toast } from 'sonner';

export default function SellerSetupPage() {
  const navigate = useRouter();
  const { user, becomeSeller } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    displayName: user?.name || '',
    bio: '',
    faculty: '',
    department: '',
    level: '',
    matricNumber: '',
  });

  const [errors, setErrors] = useState({});

  const handleNext = () => setStep(step + 1);
  const handleBack = () => step > 1 ? setStep(step - 1) : navigate.back();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await becomeSeller(formData);
      toast.success('Seller profile created!');
      navigate.push('/marketplace/upload-project');
    } catch (error) {
      toast.error('Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={handleBack} className="flex items-center gap-2 text-[#6b7280] hover:text-black mb-10 text-xs font-black uppercase tracking-widest"><ArrowLeft className="w-4 h-4" />Back</button>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#111827] mb-3 tracking-tight">Seller Accreditation</h1>
          <p className="text-[#6b7280] font-medium">Create your professional seller identity</p>
        </div>

        <div className="bg-white border border-[#e5e7eb] rounded-[40px] p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
          
          <div className="space-y-8">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-black text-[#111827] tracking-tight">Public Profile</h2>
                <div className="space-y-6">
                  <div>
                    <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-2 block">Display Name</Label>
                    <Input value={formData.displayName} onChange={(e) => updateField('displayName', e.target.value)} className="bg-[#f8f9fc] border-[#e5e7eb] rounded-xl h-12 focus:border-black font-medium" />
                  </div>
                  <div>
                    <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-2 block">Professional Bio</Label>
                    <Textarea value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} className="bg-[#f8f9fc] border-[#e5e7eb] rounded-2xl p-4 focus:border-black font-medium min-h-[150px]" />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-black text-[#111827] tracking-tight">Institutional Info</h2>
                <div className="space-y-6">
                  <div>
                    <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-2 block">Faculty</Label>
                    <select value={formData.faculty} onChange={(e) => updateField('faculty', e.target.value)} className="w-full px-4 py-3 bg-[#f8f9fc] border border-[#e5e7eb] rounded-xl text-[#111827] focus:border-black font-medium appearance-none">
                      <option value="">Select Faculty</option>
                      {faculties.filter(f => f !== 'All').map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[#111827] font-black uppercase text-[10px] tracking-widest mb-2 block">Matric Number</Label>
                    <Input value={formData.matricNumber} onChange={(e) => updateField('matricNumber', e.target.value)} className="bg-[#f8f9fc] border-[#e5e7eb] rounded-xl h-12 focus:border-black font-medium" />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4 mt-12">
              {step > 1 && <Button variant="ghost" className="flex-1 font-bold rounded-full py-7" onClick={handleBack}>Go Back</Button>}
              {step < 2 ? (
                <Button className="flex-[2] bg-black text-white rounded-full py-7 font-black shadow-xl" onClick={handleNext}>Next Stage</Button>
              ) : (
                <Button className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-full py-7 font-black shadow-xl" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Complete Registration'}</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
