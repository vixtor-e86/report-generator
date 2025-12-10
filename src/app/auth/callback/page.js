"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const handleAuth = async () => {
      // 1. Let Supabase handle the URL (Hash or Code) automatically
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth error:', error.message);
        router.push('/auth/auth-code-error');
      } else if (session) {
        // 2. Login successful!
        // We redirect to /dashboard. The dashboard will handle the 
        // "New User vs Existing User" check logic we wrote earlier.
        router.push('/dashboard'); 
      } else {
        // No session found, but no error? Might be a direct visit.
        // Wait a moment in case of race conditions, then error.
        setTimeout(() => {
             router.push('/auth/auth-code-error');
        }, 2000);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Finalizing Login...</h2>
        <p className="text-gray-500">Please wait a moment.</p>
      </div>
    </div>
  );
}