"use client";
import { CldUploadWidget } from 'next-cloudinary';
import { useState } from 'react';
import Image from 'next/image'; // <--- Import this

export default function TestCloudinary() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
      <h1 className="text-2xl font-bold">Cloudinary Connection Test</h1>
      
      {/* The Upload Widget */}
      <CldUploadWidget 
        uploadPreset="reportgen_uploads" 
        onSuccess={(result) => {
          console.log("Upload success:", result);
          setResult(result.info);
        }}
      >
        {({ open }) => {
          return (
            <button 
              onClick={() => open()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Upload an Image
            </button>
          );
        }}
      </CldUploadWidget>

      {/* Show Result */}
      {result && (
        <div className="text-center p-4 bg-white rounded-lg shadow border border-green-200 flex flex-col items-center">
          <p className="text-green-600 font-bold mb-2">✅ Upload Successful!</p>
          
          {/* Replaced <img> with <Image> */}
          <Image 
            src={result.secure_url} 
            alt="Uploaded image" 
            width={400}     // Required by Next.js
            height={300}    // Required by Next.js
            className="rounded-lg border border-gray-200 object-cover"
          />
          
          <p className="text-xs text-gray-500 mt-2 break-all max-w-xs">{result.secure_url}</p>
        </div>
      )}
    </div>
  );
}