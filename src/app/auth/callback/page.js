// src/app/auth/callback/page.js - FIXED VERSION
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for error in URL
        const errorParam = searchParams.get('error') || hashParams.get('error');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
        
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        // Get authorization code (PKCE flow)
        const code = searchParams.get('code');

        if (code) {
          // ✅ NEW: Exchange code for session (this is what was missing!)
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setError('Failed to complete sign in. Please try again.');
            setTimeout(() => router.push('/'), 3000);
            return;
          }

          if (data?.session) {
            console.log('✅ Session established successfully');
            // Redirect to dashboard (will handle onboarding check)
            router.push('/dashboard');
            return;
          }
        }

        // Fallback: Check if session already exists (for hash-based flow)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (session) {
          console.log('✅ Session found');
          router.push('/dashboard');
        } else {
          // No code, no session - something went wrong
          console.error('No authorization code or session found');
          setError('Authentication incomplete. Redirecting...');
          setTimeout(() => router.push('/'), 2000);
        }

      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Completing Sign In...</h2>
        <p className="text-gray-500 mt-2">Please wait a moment.</p>
      </div>
    </div>
  );
}