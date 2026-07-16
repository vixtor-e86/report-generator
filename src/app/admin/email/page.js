"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Mail, Users, FileText, Send, Eye, Trash, Plus, 
  Search, Check, TrendingUp, Award, DollarSign, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmailPage() {
  const searchParams = useSearchParams();
  
  // State for composing
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [fromEmail, setFromEmail] = useState('support@support.w3writelab.com');
  const [customFrom, setCustomFrom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [category, setCategory] = useState('notice');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Customers/Analytics State
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const fileInputRef = useRef(null);

  const senderOptions = [
    "support@support.w3writelab.com",
    "noreply@support.w3writelab.com",
    "hello@support.w3writelab.com",
    "info@support.w3writelab.com",
    "custom"
  ];

  // Pre-configured templates based on category
  const templates = {
    notice: {
      subject: "[Notice] Important Service Update from W3 WriteLab",
      body: "Hello Customer,\n\nThis is an official notice regarding your account or services at W3 WriteLab.\n\nWe have scheduled a brief server maintenance window tonight at 12:00 AM UTC to install security patches. Our platform will experience a minor downtime of up to 10 minutes.\n\nNo actions are required from your side. Thank you for your continued support.\n\nBest regards,\nThe W3 WriteLab Support Team"
    },
    update: {
      subject: "[Launch] We just released major improvements!",
      body: "Hello Writer,\n\nWe are excited to share a brand new product update with you!\n\nWhat is new:\n1. Improved AI Document Restructuring: Abstract formatting now creates clean academic paragraphs.\n2. Upgraded Plagiarism Engine: We have fully integrated the Copyscape Premium API for faster and more precise checks.\n3. Topic Finder Tabs: Save and explore proposal ideas directly from your dashboard.\n\nHead over to your workspace to try out the new features!\n\nBest regards,\nProduct Engineering - W3 WriteLab"
    },
    promotion: {
      subject: "[Limited Offer] Upgrade to Premium & Save 30% Today",
      body: "Dear User,\n\nUnlock unlimited academic writing power with our Premium Research Suite.\n\nFor the next 48 hours, we are offering an exclusive 30% discount on all premium plan upgrades. Bypass AI detection systems with 10,000 words limit, export raw DOCX formats, and get priority support.\n\nUse code: PREMIUM30 during checkout.\n\nBest regards,\nGrowth Team - W3 WriteLab"
    },
    survey: {
      subject: "[Feedback Requested] Help us improve W3 WriteLab",
      body: "Hello Customer,\n\nWe are constantly working to improve our engineering report generator and academic tools.\n\nCould you spare 2 minutes of your time to share your feedback with us? We would love to hear what features you want to see next and how we can serve you better.\n\nYour inputs directly shape the future of our product development.\n\nBest regards,\nCustomer Experience - W3 WriteLab"
    },
    plain: {
      subject: "Update regarding your request",
      body: "Hello,\n\nThis is a standard email update regarding your support ticket or recent inquiry.\n\nIf you have any questions, please reply to this email directly.\n\nBest regards,\nW3 WriteLab Support"
    }
  };

  // Fetch customers on load
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const response = await fetch('/api/admin/email/customers');
      const data = await response.json();
      if (response.ok && data.customers) {
        setCustomers(data.customers);
      } else {
        toast.error(data.error || 'Failed to fetch customer analysis');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customer list');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle template selection
  const handleApplyTemplate = (cat) => {
    setCategory(cat);
    if (templates[cat]) {
      setSubject(templates[cat].subject);
      setBody(templates[cat].body);
      toast.success(`${cat.toUpperCase()} template applied!`);
    }
  };

  // Set recipient from search params
  useEffect(() => {
    const recipientParam = searchParams.get('recipient');
    if (recipientParam && recipientParam.includes('@')) {
      setRecipients((prev) => {
        if (prev.includes(recipientParam)) return prev;
        return [...prev, recipientParam];
      });
    }
  }, [searchParams]);

  const handleAddRecipient = () => {
    const email = newEmail.trim();
    if (email && email.includes('@') && email.includes('.')) {
      if (!recipients.includes(email)) {
        setRecipients([...recipients, email]);
        setNewEmail('');
        toast.success(`Recipient ${email} added`);
      } else {
        toast.error('Email already added');
      }
    } else {
      toast.error('Invalid email address');
    }
  };

  const handleRemoveRecipient = (email) => {
    setRecipients(recipients.filter(e => e !== email));
  };

  // Select standard segment criteria
  const handleApplySegment = (segment) => {
    setSelectedSegment(segment);
    let selectedEmails = [];

    switch (segment) {
      case 'all':
        selectedEmails = customers.map(c => c.email).filter(e => e && e !== 'Unknown');
        break;
      case 'paying':
        selectedEmails = customers.filter(c => c.purchaseCount > 0).map(c => c.email);
        break;
      case 'top_spenders':
        selectedEmails = customers.filter(c => c.totalSpent >= 20000).map(c => c.email);
        break;
      case 'frequent_buyers':
        selectedEmails = customers.filter(c => c.purchaseCount >= 3).map(c => c.email);
        break;
      case 'premium_tier':
        selectedEmails = customers.filter(c => c.premiumCount > 0).map(c => c.email);
        break;
      case 'non_paying':
        selectedEmails = customers.filter(c => c.purchaseCount === 0).map(c => c.email);
        break;
      default:
        selectedEmails = [];
    }

    setRecipients(selectedEmails);
    toast.success(`Segment "${segment.replace('_', ' ').toUpperCase()}" applied: ${selectedEmails.length} recipients selected.`);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];
    let currentSize = attachments.reduce((acc, f) => acc + (f.size || 0), 0);
    
    for (const file of files) {
      if (currentSize + file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds the 10MB total attachment limit.`);
        break;
      }
      currentSize += file.size;
      newAttachments.push(file);
    }
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (recipients.length === 0) return toast.error('Add at least one recipient');
    if (!subject) return toast.error('Subject is required');
    if (!body) return toast.error('Message body is required');

    setSending(true);
    setShowPreview(false);

    try {
      // Process attachments to base64 buffer format
      const processedAttachments = await Promise.all(attachments.map(async (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onload = () => {
            const buffer = Array.from(new Uint8Array(reader.result));
            resolve({
              filename: file.name,
              content: buffer 
            });
          };
          reader.onerror = error => reject(error);
        });
      }));

      const finalFrom = isCustom ? `${customFrom}@support.w3writelab.com` : fromEmail;

      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `W3 WriteLab Support <${finalFrom}>`,
          recipients,
          subject,
          body,
          category,
          attachments: processedAttachments
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to broadcast emails');

      toast.success(`AWS SES Broadcast complete: ${result.success} succeeded, ${result.failed} failed.`);
      if (result.success > 0) {
        setRecipients([]);
        setSubject('');
        setBody('');
        setAttachments([]);
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send emails via AWS SES: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // Filter customer list
  const filteredCustomers = customers.filter(c => {
    const text = searchTerm.toLowerCase();
    return (
      c.email.toLowerCase().includes(text) ||
      c.username.toLowerCase().includes(text) ||
      c.fullName.toLowerCase().includes(text) ||
      c.department.toLowerCase().includes(text)
    );
  });

  // Calculate summary metrics
  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalPurchases = customers.reduce((acc, c) => acc + c.purchaseCount, 0);
  const payingCustomersCount = customers.filter(c => c.purchaseCount > 0).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Mail className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
            AWS SES support broadcast
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">
            Branded transactional & newsletter distribution engine
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold uppercase">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          SES verified on support.w3writelab.com
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-xl text-slate-900"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{customers.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Award className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Paying Customers</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{payingCustomersCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Purchases</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">{totalPurchases}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><DollarSign className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-lg md:text-2xl font-black text-slate-950">₦{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Composition Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sender Details */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-md md:text-lg font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-slate-950 rounded-full" />
              Sender Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">From Address</label>
                <select 
                  value={isCustom ? 'custom' : fromEmail}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustom(true);
                    } else {
                      setIsCustom(false);
                      setFromEmail(e.target.value);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold focus:border-slate-950 focus:ring-0 text-sm"
                >
                  {senderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {isCustom && (
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Custom Prefix</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      placeholder="e.g. notifications"
                      className="flex-1 border border-slate-200 rounded-l-2xl p-3 text-slate-900 font-bold focus:border-slate-950 focus:ring-0 text-sm"
                    />
                    <span className="bg-slate-50 border border-l-0 border-slate-200 px-4 rounded-r-2xl text-slate-400 text-xs font-black flex items-center uppercase">
                      @support.w3writelab.com
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Intelligence / Segments */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-md md:text-lg font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-slate-950 rounded-full" />
                Customer Intelligence
              </h2>
              <button onClick={fetchCustomers} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-900" title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${loadingCustomers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Segment Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleApplySegment('all')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${selectedSegment === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                All ({customers.length})
              </button>
              <button onClick={() => handleApplySegment('paying')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${selectedSegment === 'paying' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                Paying ({payingCustomersCount})
              </button>
              <button onClick={() => handleApplySegment('top_spenders')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${selectedSegment === 'top_spenders' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                Top Spenders ₦20k+ ({customers.filter(c => c.totalSpent >= 20000).length})
              </button>
              <button onClick={() => handleApplySegment('frequent_buyers')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${selectedSegment === 'frequent_buyers' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                Frequent (3+) ({customers.filter(c => c.purchaseCount >= 3).length})
              </button>
              <button onClick={() => handleApplySegment('premium_tier')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${selectedSegment === 'premium_tier' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
                Premium Buyers ({customers.filter(c => c.premiumCount > 0).length})
              </button>
              <button onClick={() => handleApplySegment('non_paying')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${selectedSegment === 'non_paying' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                Non-paying ({customers.filter(c => c.purchaseCount === 0).length})
              </button>
            </div>

            {/* Recipients Add Manual Input */}
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                placeholder="Add manual email address..."
                className="flex-1 border border-slate-200 rounded-2xl p-3 text-slate-900 font-bold focus:border-slate-950 focus:ring-0 text-sm"
              />
              <button
                onClick={handleAddRecipient}
                className="bg-slate-950 text-white px-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition active:scale-95"
              >
                Add
              </button>
            </div>

            {/* Selected Recipients Badge Area */}
            {recipients.length > 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Recipients ({recipients.length})</p>
                  <button onClick={() => setRecipients([])} className="text-red-500 text-xs font-black uppercase hover:underline">Clear All</button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                  {recipients.map((email) => (
                    <span key={email} className="inline-flex items-center bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                      {email}
                      <button onClick={() => handleRemoveRecipient(email)} className="ml-2 text-slate-400 hover:text-slate-600 font-black">×</button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No recipients selected. Filter segments above or select from the database list below.</p>
            )}

            {/* Customer List Database Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50/50">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customers in database..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm font-medium"
                />
              </div>

              {loadingCustomers ? (
                <div className="py-12 flex justify-center items-center text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-wider">Analyzing customer database...</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="p-3 w-12 text-center">Select</th>
                          <th className="p-3">Customer Details</th>
                          <th className="p-3">Department</th>
                          <th className="p-3 text-right">Tier/Orders</th>
                          <th className="p-3 text-right">Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredCustomers.map(customer => {
                          const isSelected = recipients.includes(customer.email);
                          return (
                            <tr key={customer.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      handleRemoveRecipient(customer.email);
                                    } else {
                                      setRecipients([...recipients, customer.email]);
                                    }
                                  }}
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-slate-900 border-slate-900 text-white' 
                                      : 'border-slate-300 hover:border-slate-400 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-950">{customer.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{customer.email}</div>
                              </td>
                              <td className="p-3 text-slate-500 font-bold">{customer.department}</td>
                              <td className="p-3 text-right font-medium">
                                <div className="flex flex-col items-end">
                                  <div className="flex gap-1">
                                    {customer.premiumCount > 0 && <span className="bg-purple-100 text-purple-700 px-1 py-0.5 rounded text-[8px] font-black uppercase">Prem ({customer.premiumCount})</span>}
                                    {customer.standardCount > 0 && <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[8px] font-black uppercase">Std ({customer.standardCount})</span>}
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-0.5">{customer.purchaseCount} purchases</span>
                                </div>
                              </td>
                              <td className="p-3 text-right font-black text-slate-950">₦{(customer.totalSpent).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Content Configuration */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-md md:text-lg font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-slate-950 rounded-full" />
              Template & Message Content
            </h2>

            {/* Template Selector Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {Object.keys(templates).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleApplyTemplate(cat)}
                  className={`p-3.5 rounded-2xl border-2 transition text-left flex flex-col justify-between h-[85px] ${
                    category === cat 
                      ? 'border-slate-950 bg-slate-50 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    cat === 'notice' ? 'bg-amber-100 text-amber-700' :
                    cat === 'update' ? 'bg-blue-100 text-blue-700' :
                    cat === 'promotion' ? 'bg-emerald-100 text-emerald-700' :
                    cat === 'survey' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{cat}</span>
                  <span className="text-xs font-black text-slate-950 capitalize">{cat} Template</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Email Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-bold focus:border-slate-950 focus:ring-0 text-sm"
                  placeholder="Enter subject..."
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Message Body (Supports double newlines for paragraphs)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl p-4 h-64 text-slate-900 font-bold focus:border-slate-950 focus:ring-0 text-sm leading-relaxed"
                  placeholder="Write your message here..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Attachment / Summary & Live Preview Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Summary and Send */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-md font-black text-slate-950 uppercase tracking-tight">Summary</h2>
            <div className="space-y-3.5 text-sm font-bold border-b border-slate-100 pb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wide">Recipients</span>
                <span className="text-slate-950">{recipients.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wide">Attachments</span>
                <span className="text-slate-950">{attachments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs uppercase tracking-wide">Category</span>
                <span className="text-slate-950 uppercase text-xs px-2 py-0.5 rounded bg-slate-100">{category}</span>
              </div>
            </div>

            {/* File upload attachments */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Attachments</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:bg-slate-50 transition cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">Add Attachment Files (Max 10MB)</p>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-bold">
                      <span className="text-slate-700 truncate max-w-[150px]">{file.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                        <button onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-600"><Trash className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => setShowPreview(true)}
                disabled={sending}
                className="w-full py-3.5 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition active:scale-95"
              >
                <span className="flex items-center justify-center gap-2"><Eye className="w-4 h-4" /> Live preview</span>
              </button>
              <button
                onClick={handleSend}
                disabled={sending || recipients.length === 0}
                className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Broadcast SES Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-black text-slate-950 uppercase tracking-tight text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                Live Email Template Preview
              </h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-150">✕</button>
            </div>
            
            {/* Modal Body Scroll Container */}
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-100/50 p-4 md:p-6">
              
              {/* Header Info Banner */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-xs font-bold text-slate-500 space-y-2 mb-6">
                <div className="grid grid-cols-[80px_1fr] gap-1">
                  <span>From:</span>
                  <span className="text-slate-950">W3 WriteLab Support &lt;{isCustom ? `${customFrom}@support.w3writelab.com` : fromEmail}&gt;</span>
                  
                  <span>To:</span>
                  <span className="text-slate-950 truncate">{recipients.join(', ') || 'No recipients selected'}</span>
                  
                  <span>Subject:</span>
                  <span className="text-slate-950 font-black">{subject || 'No Subject'}</span>
                </div>
              </div>

              {/* The Actual HTML Mock Email Display */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md max-w-[550px] mx-auto bg-white">
                
                {/* Header Logo */}
                <div className="bg-[#0f172a] p-6 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-500/10 rounded-xl mb-1.5 border border-indigo-500/20">
                    <span className="text-white text-lg font-black">W3</span>
                  </div>
                  <div className="text-white text-xs font-black uppercase tracking-[0.2em]">W3 WriteLab</div>
                </div>

                {/* Branded Body */}
                <div className="p-8">
                  <span className={`inline-block text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full mb-4
                    ${category === 'notice' ? 'bg-amber-100 text-amber-700' : ''}
                    ${category === 'update' ? 'bg-blue-100 text-blue-700' : ''}
                    ${category === 'promotion' ? 'bg-emerald-100 text-emerald-700' : ''}
                    ${category === 'survey' ? 'bg-purple-100 text-purple-700' : ''}
                    ${category === 'plain' ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    {category}
                  </span>
                  
                  <h1 className="text-slate-950 font-black text-lg tracking-tight mb-4 leading-snug">{subject || 'Example Subject Line'}</h1>
                  
                  <div className="space-y-4 text-slate-600 text-xs md:text-sm leading-relaxed font-bold">
                    {(body || 'Type your message body to preview how it looks here...').split('\n\n').map((p, idx) => (
                      <p key={idx}>{p.split('\n').map((line, lIdx) => <span key={lIdx}>{line}<br/></span>)}</p>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 p-6 text-center text-[10px] text-slate-400 space-y-1.5 font-bold">
                  <p className="margin-0">This is an official administrative broadcast sent from W3 WriteLab.</p>
                  <p className="margin-0">&copy; {new Date().getFullYear()} W3 WriteLab. All rights reserved.</p>
                  <div className="flex justify-center gap-3 pt-2">
                    <span className="text-indigo-500 hover:underline cursor-pointer">Website</span>
                    <span className="text-indigo-500 hover:underline cursor-pointer">Terms</span>
                    <span className="text-indigo-500 hover:underline cursor-pointer">Support</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setShowPreview(false)} 
                className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-xl active:scale-95 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
