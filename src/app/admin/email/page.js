"use client";
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function EmailPage() {
  const searchParams = useSearchParams();
  const [recipients, setRecipients] = useState([]);
  
  // ... (existing state)

  useEffect(() => {
    const recipientParam = searchParams.get('recipient');
    if (recipientParam && recipientParam.includes('@')) {
      if (!recipients.includes(recipientParam)) {
        setRecipients((prev) => {
            // Check again to avoid strict mode double-mount duplicates
            if (prev.includes(recipientParam)) return prev;
            return [...prev, recipientParam];
        });
      }
    }
  }, [searchParams]);

  const [newEmail, setNewEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [fromEmail, setFromEmail] = useState('hello@w3writelab.com');
  const [customFrom, setCustomFrom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const senderOptions = [
    "hello@w3writelab.com",
    "noreply@w3writelab.com",
    "support@w3writelab.com",
    "info@w3writelab.com",
    "custom"
  ];

  const handleAddRecipient = () => {
    if (newEmail && newEmail.includes('@') && newEmail.includes('.')) {
      if (!recipients.includes(newEmail)) {
        setRecipients([...recipients, newEmail]);
        setNewEmail('');
      } else {
        alert('Email already added');
      }
    } else {
      alert('Invalid email address');
    }
  };

  const handleRemoveRecipient = (email) => {
    setRecipients(recipients.filter(e => e !== email));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];

    // Check size limit (10MB)
    let currentSize = attachments.reduce((acc, f) => acc + (f.size || 0), 0);
    
    for (const file of files) {
      if (currentSize + file.size > 10 * 1024 * 1024) {
        alert('Total file size exceeds 10MB limit');
        break;
      }
      currentSize += file.size;

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        // Resend expects content as buffer or base64 string? 
        // Resend node SDK expects buffer usually, but passing JSON over API needs base64?
        // Actually, let's keep it simple. We pass buffer array from FileReader result.
        // reader.result is "data:image/png;base64,..."
        // We probably just need the base64 part for the API to handle?
        // Let's pass the whole file object but read content on send.
      };
      // actually, let's just store the file object for now and convert on send
      newAttachments.push(file);
    }
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (recipients.length === 0) return alert('Add at least one recipient');
    if (!subject) return alert('Subject is required');
    if (!body) return alert('Message body is required');

    setSending(true);
    setShowPreview(false);

    try {
      // Process attachments to base64/buffer format
      const processedAttachments = await Promise.all(attachments.map(async (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onload = () => {
            // Convert ArrayBuffer to Array for JSON serialization
            const buffer = Array.from(new Uint8Array(reader.result));
            resolve({
              filename: file.name,
              content: buffer 
            });
          };
          reader.onerror = error => reject(error);
        });
      }));

      const finalFrom = isCustom ? `${customFrom}@w3writelab.com` : fromEmail;

      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `W3 WriteLab <${finalFrom}>`,
          recipients,
          subject,
          body,
          attachments: processedAttachments
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      alert(`Emails Sent: ${result.success} Success, ${result.failed} Failed`);
      if (result.success > 0) {
        // Reset form
        setRecipients([]);
        setSubject('');
        setBody('');
        setAttachments([]);
      }

    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Email System</h1>
        <p className="text-slate-500 mt-1">Compose and send emails to users directly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composition Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sender */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Sender Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Address</label>
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
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {senderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              {isCustom && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Custom Name</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      placeholder="marketing"
                      className="flex-1 border border-slate-300 rounded-l-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2.5 rounded-r-lg text-slate-500 text-sm">
                      @w3writelab.com
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recipients</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                placeholder="Enter email address..."
                className="flex-1 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddRecipient}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
              >
                Add
              </button>
            </div>
            
            {recipients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <span key={email} className="inline-flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
                    {email}
                    <button onClick={() => handleRemoveRecipient(email)} className="ml-2 text-indigo-400 hover:text-indigo-600">×</button>
                  </span>
                ))}
                <button onClick={() => setRecipients([])} className="text-red-500 text-sm hover:underline ml-2">Clear All</button>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No recipients added yet.</p>
            )}
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Email Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-4 h-64 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-sans"
                  placeholder="Write your message here..."
                />
              </div>
              
              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                  />
                  <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <p className="text-sm text-slate-500">Click to upload files (Max 10MB total)</p>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recipients</span>
                <span className="font-bold text-slate-900">{recipients.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Attachments</span>
                <span className="font-bold text-slate-900">{attachments.length}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-slate-500">Estimated API Calls</span>
                <span className="font-bold text-slate-900">{recipients.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowPreview(true)}
                disabled={sending}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
              >
                Preview Email
              </button>
              <button
                onClick={handleSend}
                disabled={sending || recipients.length === 0}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Emails
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-[60px_1fr] gap-4 text-sm">
                <span className="font-bold text-slate-500 text-right">From:</span>
                <span className="text-slate-900">{isCustom ? `${customFrom}@w3writelab.com` : fromEmail}</span>
                
                <span className="font-bold text-slate-500 text-right">To:</span>
                <span className="text-slate-900 line-clamp-2">{recipients.join(', ')}</span>
                
                <span className="font-bold text-slate-500 text-right">Subject:</span>
                <span className="text-slate-900">{subject}</span>
              </div>
              
              <div className="border-t border-slate-100 pt-4 mt-4">
                <div className="prose prose-slate max-w-none text-sm whitespace-pre-wrap">
                  {body}
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <p className="text-xs font-bold text-slate-500 mb-2">Attachments:</p>
                  <ul className="text-xs text-slate-600 list-disc list-inside">
                    {attachments.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
