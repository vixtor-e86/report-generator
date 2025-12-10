"use client";

import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

export default function GoogleAuthButton() {
  const handleLogin = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 1. Redirect to our callback route
        redirectTo: `${window.location.origin}/auth/callback`,
        // 2. FORCE the PKCE flow (This fixes the #access_token issue)
        flowType: 'pkce', 
      },
    });

    if (error) {
      console.error('Login failed:', error.message);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center w-full px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
    >
      <Image
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google logo"
        width={20}
        height={20}
        className="mr-3"
      />
      Sign in with Google
    </button>
  );
}