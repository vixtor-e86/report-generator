"use client";
import Link from 'next/link';

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Issue</h2>
        <p className="text-gray-600 mb-6">
          We could not log you in. This usually happens if the connection was interrupted or if the browser sent the wrong type of credential (Hash instead of Code).
        </p>
        <Link 
          href="/"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Return Home & Try Again
        </Link>
      </div>
    </div>
  );
}