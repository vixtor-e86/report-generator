// src/app/standard/new/page.js
// In the NewProjectContent function, add this state with your existing ones:
const [pendingPayment, setPendingPayment] = useState(null);

// Update the loadData useEffect to check for pending payment:
useEffect(() => {
  async function loadData() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      router.push('/onboarding');
      return;
    }

    if (!templateId) {
      router.push('/template-select');
      return;
    }

    const { data: templateData, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !templateData) {
      alert('Template not found');
      router.push('/template-select');
      return;
    }

    // ✅ NEW: Check for unused payment
    const { data: unusedPayments } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .is('project_id', null)
      .order('paid_at', { ascending: false })
      .limit(1);

    if (!unusedPayments || unusedPayments.length === 0) {
      alert('No valid payment found. Please make a payment first.');
      router.push('/dashboard');
      return;
    }

    setPendingPayment(unusedPayments[0]);

    // ... rest of existing code (departments loading, etc.)
    const res = await fetch('/api/departments');
    const data = await res.json();

    setUniversityData(data);
    setFacultiesList(Object.keys(data));

    if (profile.faculty) {
      setFaculty(profile.faculty);
      if (Array.isArray(data[profile.faculty])) {
        setDepartmentsList(data[profile.faculty]);
      }
    }

    if (profile.department) {
      setDepartment(profile.department);
    }

    setUser(user);
    setProfile(profile);
    setTemplate(templateData);
    setLoading(false);
  }

  loadData();
}, [router, templateId]);

// Update handleCreateProject to link the payment:
const handleCreateProject = async () => {
  if (isSIWES) {
    if (!companyName || !department || !duration || !description) {
      alert('Please fill in all required fields');
      return;
    }
  } else {
    if (!projectTitle || !department || !description) {
      alert('Please fill in all required fields');
      return;
    }
  }

  if (!pendingPayment) {
    alert('No valid payment found. Please go back and make a payment.');
    router.push('/dashboard');
    return;
  }

  setCreating(true);

  try {
    const projectData = {
      user_id: user.id,
      template_id: templateId,
      tier: 'standard',
      payment_status: 'paid',
      payment_verified_at: pendingPayment.verified_at,
      amount_paid: pendingPayment.amount,
      tokens_used: 0,
      tokens_limit: 120000,
      status: 'in_progress',
      current_chapter: 1,
      reference_style: isSIWES ? 'none' : referenceStyle,
      access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (isSIWES) {
      projectData.title = `${companyName} - Industrial Training Report`;
      projectData.department = department;
      projectData.components = [companyName];
      projectData.description = `Duration: ${duration}\n\n${description}`;
    } else {
      projectData.title = projectTitle;
      projectData.department = department;
      projectData.components = components;
      projectData.description = description;
    }

    const { data: project, error: projectError } = await supabase
      .from('standard_projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) throw projectError;

    // ✅ NEW: Link payment to project
    const { error: paymentLinkError } = await supabase
      .from('payment_transactions')
      .update({ project_id: project.id, updated_at: new Date().toISOString() })
      .eq('id', pendingPayment.id);

    if (paymentLinkError) {
      console.error('Payment link error:', paymentLinkError);
      // Don't fail the whole flow, just log it
    }

    const structure = template.structure || { chapters: [] };
    const chaptersToCreate = structure.chapters.map((ch, i) => ({
      project_id: project.id,
      chapter_number: i + 1,
      title: ch.title,
      status: 'not_generated',
    }));

    const { error: chaptersError } = await supabase
      .from('standard_chapters')
      .insert(chaptersToCreate);

    if (chaptersError) throw chaptersError;

    if (images.length > 0) {
      const imageRecords = images.map((img, i) => ({
        project_id: project.id,
        cloudinary_url: img.url,
        cloudinary_public_id: img.publicId,
        caption: img.caption,
        order_number: i + 1,
        chapter_number: img.chapterNumber || null
      }));

      const { error: imagesError } = await supabase
        .from('standard_images')
        .insert(imageRecords);

      if (imagesError) throw imagesError;
    }

    router.push(`/standard/${project.id}`);
  } catch (error) {
    console.error('Error creating project:', error);
    alert(`Failed to create project: ${error.message}`);
  } finally {
    setCreating(false);
  }
};

// Add payment info banner at the top of the form (after the header):
{pendingPayment && (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="text-sm">
        <p className="font-semibold text-green-900">Payment Verified</p>
        <p className="text-green-700">₦{pendingPayment.amount.toLocaleString()} • Paid on {new Date(pendingPayment.paid_at).toLocaleDateString()}</p>
      </div>
    </div>
  </div>
)}