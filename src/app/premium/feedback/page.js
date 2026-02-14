'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useFileUpload } from '@/hooks/useFileUpload';
import Link from 'next/link';

const Icons = {
  ArrowLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Star: ({ filled }) => <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Paperclip: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
};

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { uploadFile, uploading } = useFileUpload(projectId);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setProfile(profile);
          setContactEmail(user.email);
        }
      }
    }
    loadUser();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const asset = await uploadFile(file, 'feedback_attachment');
      if (asset) {
        setAttachments([...attachments, asset]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a rating');
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/premium/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: profile.username,
          userEmail: user.email,
          contactEmail,
          rating,
          comment,
          attachments: attachments.map(a => ({ name: a.original_name, url: a.file_url })),
          projectId,
          url: window.location.href
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.Check />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Feedback Received!</h2>
          <p className="text-slate-600 mb-8">Thank you for helping us improve W3 WriteLab. We'll get back to you at {contactEmail} if needed.</p>
          <button 
            onClick={() => router.back()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Back to Workspace
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition mb-8 font-medium"
        >
          <Icons.ArrowLeft /> Back to Workspace
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white">
            <h1 className="text-2xl font-bold">Premium Support & Feedback</h1>
            <p className="text-indigo-100 mt-2">How can we help you today? Your feedback goes directly to our engineering team.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Rating */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Overall Rating</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transform transition hover:scale-110"
                  >
                    <Icons.Star filled={star <= rating} />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">What's on your mind?</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="5"
                placeholder="Describe your issue, suggestion, or experience..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Response Email */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Reply-to Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Where should we send our response?"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Attachments (Optional)</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm border border-indigo-100">
                    <Icons.Paperclip />
                    <span className="max-w-[150px] truncate">{file.original_name}</span>
                  </div>
                ))}
              </div>
              <label className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition ${uploading ? 'opacity-50' : ''}`}>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                <Icons.Paperclip />
                <span className="text-sm font-medium text-slate-600">{uploading ? 'Uploading...' : 'Attach Image or Document'}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-3 shadow-lg shadow-slate-200"
            >
              {isSubmitting ? 'Sending...' : (
                <>
                  <Icons.Send /> Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}
