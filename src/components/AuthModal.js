"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthModal({ isOpen, onClose }) {
  const [view, setView] = useState('sign_in'); // 'sign_in', 'sign_up', 'forgot_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        flowType: 'pkce',
      },
    });

    if (error) {
      console.error('Login failed:', error.message);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (view === 'sign_up') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage('Please check your email to verify your account.');
          setView('verify_message');
        } else if (data.session) {
          router.push('/dashboard');
          onClose();
        }
      } else if (view === 'sign_in') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push('/dashboard');
          onClose();
        }
      } else if (view === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        });
        if (error) throw error;
        setMessage('Check your email for the password reset link.');
        setView('verify_message');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {view === 'sign_in' && 'Welcome Back'}
            {view === 'sign_up' && 'Create Account'}
            {view === 'forgot_password' && 'Reset Password'}
            {view === 'verify_message' && 'Check Email'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {view === 'sign_in' && 'Enter your details to access your reports.'}
            {view === 'sign_up' && 'Get started with your first project today.'}
            {view === 'forgot_password' && 'Enter your email to receive a reset link.'}
          </p>
        </div>

        <div className="px-8 pb-8">
          {view === 'verify_message' ? (
             <div className="text-center">
               <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               </div>
               <p className="text-slate-700 mb-6">{message}</p>
               <button
                 onClick={() => {
                   setView('sign_in');
                   setMessage(null);
                 }}
                 className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
               >
                 Back to Sign In
               </button>
             </div>
          ) : (
            <>
              {/* Google Button */}
              {view !== 'forgot_password' && (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
                  >
                    <Image
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      width={20}
                      height={20}
                    />
                    {loading ? 'Connecting...' : 'Continue with Google'}
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">Or continue with email</span>
                    </div>
                  </div>
                </>
              )}

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="name@example.com"
                  />
                </div>

                {view !== 'forgot_password' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : (
                    view === 'sign_in' ? 'Sign In' :
                    view === 'sign_up' ? 'Create Account' :
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 text-center text-sm space-y-2">
                {view === 'sign_in' && (
                  <>
                    <p className="text-slate-600">
                      Don't have an account?{' '}
                      <button onClick={() => setView('sign_up')} className="font-semibold text-indigo-600 hover:text-indigo-700">
                        Sign up
                      </button>
                    </p>
                    <button onClick={() => setView('forgot_password')} className="text-slate-500 hover:text-slate-700">
                      Forgot your password?
                    </button>
                  </>
                )}

                {view === 'sign_up' && (
                  <p className="text-slate-600">
                    Already have an account?{' '}
                    <button onClick={() => setView('sign_in')} className="font-semibold text-indigo-600 hover:text-indigo-700">
                      Sign in
                    </button>
                  </p>
                )}

                {view === 'forgot_password' && (
                  <button onClick={() => setView('sign_in')} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Back to Sign In
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
