"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PRICING = {
  STANDARD: Number(process.env.NEXT_PUBLIC_PRICE_STANDARD) || 10000,
  PREMIUM: Number(process.env.NEXT_PUBLIC_PRICE_PREMIUM) || 20000,
};

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6">
          Choose the Right Plan for You
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          From basic reports to advanced AI-powered projects with full editing capabilities.
          See exactly what you get with each tier.
        </p>
      </div>

      {/* Pricing Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        {/* Mobile View - Cards */}
        <div className="lg:hidden space-y-6">
          {/* Free Tier Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center">
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <div className="text-3xl font-extrabold">₦0</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">AI Model</span>
                <span className="text-sm text-gray-900">Basic Quaaality</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Projects</span>
                <span className="text-sm font-bold text-red-600">1 only</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Templates</span>
                <span className="text-sm text-gray-900">1 template</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Faculties</span>
                <span className="text-sm text-red-600">Engineering only</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">References</span>
                <span className="text-sm text-red-600">✗ No</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Edit Content</span>
                <span className="text-sm text-red-600">✗ No</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Regenerate</span>
                <span className="text-sm text-red-600">✗ No</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Images</span>
                <span className="text-sm text-gray-900">2 images</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Export</span>
                <span className="text-sm text-gray-900">PDF only</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Access</span>
                <span className="text-sm font-bold text-green-600">Forever</span>
              </div>
            </div>
          </div>

          {/* Standard Tier Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-500 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 text-center relative">
              <div className="absolute top-2 right-2 bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">POPULAR</div>
              <h3 className="text-xl font-bold mb-1">Standard</h3>
              <div className="text-3xl font-extrabold">₦{PRICING.STANDARD.toLocaleString()}</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">AI Model</span>
                <span className="text-sm font-bold text-indigo-900">Professional Quality</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Projects</span>
                <span className="text-sm font-bold text-green-600">Unlimited</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Templates</span>
                <span className="text-sm text-indigo-900">3 templates</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Faculties</span>
                <span className="text-sm font-bold text-green-600">✓ All 10 Faculties</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">References</span>
                <span className="text-sm text-green-600">✓ 3 Styles (APA/IEEE/Harvard)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Edit Content</span>
                <span className="text-sm text-green-600">✓ Yes</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Regenerate</span>
                <span className="text-sm text-green-600">✓ ~12 times</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Images</span>
                <span className="text-sm text-indigo-900">10 images</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Export</span>
                <span className="text-sm text-indigo-900">DOCX</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Access</span>
                <span className="text-sm text-indigo-900">30 days</span>
              </div>
            </div>
          </div>

          {/* Premium Tier Card */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 text-center">
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <div className="text-3xl font-extrabold">₦{PRICING.PREMIUM.toLocaleString()}</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">AI Model</span>
                <span className="text-sm font-bold text-purple-900">Premium Quality</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Projects</span>
                <span className="text-sm font-bold text-green-600">Unlimited</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Templates</span>
                <span className="text-sm text-purple-900">Custom</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Faculties</span>
                <span className="text-sm font-bold text-green-600">✓ All 10 + Custom</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">References</span>
                <span className="text-sm text-green-600">✓ All Styles + Custom</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Edit Content</span>
                <span className="text-sm text-green-600">✓ Advanced</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Regenerate</span>
                <span className="text-sm font-bold text-green-600">✓ Unlimited</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Images</span>
                <span className="text-sm font-bold text-purple-900">Unlimited</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Export</span>
                <span className="text-sm text-purple-900">DOCX + LaTeX</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-700">Access</span>
                <span className="text-sm text-purple-900">90 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-bold text-lg">Feature</th>
                  <th className="px-6 py-4 text-center text-white font-bold text-lg border-l border-indigo-400">
                    <div className="mb-2">Free</div>
                    <div className="text-2xl font-extrabold">₦0</div>
                  </th>
                  <th className="px-6 py-4 text-center text-white font-bold text-lg border-l border-indigo-400 bg-indigo-700">
                    <div className="mb-2">Standard</div>
                    <div className="text-2xl font-extrabold">₦{PRICING.STANDARD.toLocaleString()}</div>
                    <div className="text-xs font-normal mt-1 opacity-90">MOST POPULAR</div>
                  </th>
                  <th className="px-6 py-4 text-center text-white font-bold text-lg border-l border-indigo-400">
                    <div className="mb-2">Premium</div>
                    <div className="text-2xl font-extrabold">₦{PRICING.PREMIUM.toLocaleString()}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* AI Quality */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Content Quality</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-gray-600">Basic</span>
                    <div className="text-xs text-gray-500 mt-1">Good for simple projects</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-indigo-900 font-semibold">Professional</span>
                    <div className="text-xs text-indigo-700 mt-1">Advanced AI writing</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-purple-900 font-semibold">Premium</span>
                    <div className="text-xs text-purple-700 mt-1">Highest quality AI</div>
                  </td>
                </tr>

                {/* Projects Limit */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Project Limit</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600 font-bold">1 project</span>
                    <div className="text-xs text-gray-500 mt-1">Lifetime limit</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600 font-bold">Unlimited</span>
                    <div className="text-xs text-indigo-700 mt-1">₦{Math.round(PRICING.STANDARD / 1000)}k per project</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600 font-bold">Unlimited</span>
                    <div className="text-xs text-purple-700 mt-1">₦{Math.round(PRICING.PREMIUM / 1000)}k per project</div>
                  </td>
                </tr>

                {/* Templates */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Template Options</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-gray-600">1 template</span>
                    <div className="text-xs text-gray-500 mt-1">Standard 5-chapter</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-indigo-900 font-semibold">3 templates</span>
                    <div className="text-xs text-indigo-700 mt-1">5-Chapter, 6-Chapter Thesis, SIWES</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-purple-900 font-semibold">Custom templates</span>
                    <div className="text-xs text-purple-700 mt-1">Your own structure</div>
                  </td>
                </tr>

                {/* Faculty-Specific Templates */}
                <tr className="hover:bg-gray-50 transition bg-blue-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    Faculty-Specific Templates
                    <div className="text-xs text-gray-500 font-normal mt-1">Customized for your field</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ Engineering only</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ All 10 Faculties</span>
                    <div className="text-xs text-indigo-700 mt-1">Engineering, Sciences, Law, Medicine, etc.</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ All 10 + Custom</span>
                    <div className="text-xs text-purple-700 mt-1">Create your own faculty template</div>
                  </td>
                </tr>

                {/* Academic References */}
                <tr className="hover:bg-gray-50 transition bg-green-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    Academic References
                    <div className="text-xs text-gray-500 font-normal mt-1">APA, IEEE, Harvard citation styles</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ No</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ 3 Citation Styles</span>
                    <div className="text-xs text-indigo-700 mt-1">APA, IEEE, Harvard + No References option</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ All Styles + Custom</span>
                    <div className="text-xs text-purple-700 mt-1">Define your own citation format</div>
                  </td>
                </tr>

                {/* Editing */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Edit Content</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ No</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-indigo-700 mt-1">Full text editor</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-purple-700 mt-1">Advanced editor with AI assist</div>
                  </td>
                </tr>

                {/* Regeneration */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Regenerate Chapters</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ No</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-indigo-700 mt-1">120k tokens (~12 full regenerations)</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ Unlimited</span>
                    <div className="text-xs text-purple-700 mt-1">No token limits</div>
                  </td>
                </tr>

                {/* Token Optimization */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    Token Optimization
                    <div className="text-xs text-gray-500 font-normal mt-1">Preview & Suggestions</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ No</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-indigo-700 mt-1">Preview outline (500 tokens)</div>
                    <div className="text-xs text-indigo-700">AI suggestions (1k tokens)</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-purple-700 mt-1">All optimization features</div>
                  </td>
                </tr>

                {/* Custom Prompts */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Custom Instructions</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ No</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-indigo-700 mt-1">"Make it more technical"</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-purple-700 mt-1">Advanced prompting + saved templates</div>
                  </td>
                </tr>

                {/* Images */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Images</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-gray-600">2 images</span>
                    <div className="text-xs text-gray-500 mt-1">End of report only</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-indigo-900 font-semibold">10 images</span>
                    <div className="text-xs text-indigo-700 mt-1">Placed contextually in chapters</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-purple-900 font-semibold">Unlimited</span>
                    <div className="text-xs text-purple-700 mt-1">Anywhere in report</div>
                  </td>
                </tr>

                {/* Image Placement */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    Smart Image Placement
                    <div className="text-xs text-gray-500 font-normal mt-1">AI places images contextually</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-red-600">✗ No</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-indigo-700 mt-1">Automatic placement with captions</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600">✓ Yes</span>
                    <div className="text-xs text-purple-700 mt-1">Advanced placement + manual control</div>
                  </td>
                </tr>

                {/* Export Formats */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Export Formats</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-gray-600">PDF only</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-indigo-900 font-semibold">DOCX</span>
                    <div className="text-xs text-indigo-700 mt-1">Times New Roman, 12pt, 1.5 spacing</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-purple-900 font-semibold">DOCX + LaTeX</span>
                    <div className="text-xs text-purple-700 mt-1">Full formatting control</div>
                  </td>
                </tr>

                {/* Access Duration */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Access Duration</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-green-600 font-bold">Forever</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-indigo-900 font-semibold">30 days</span>
                    <div className="text-xs text-indigo-700 mt-1">Per project</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-purple-900 font-semibold">90 days</span>
                    <div className="text-xs text-purple-700 mt-1">Extended access</div>
                  </td>
                </tr>

                {/* Support */}
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">Support</td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-gray-600">Email support</span>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200 bg-indigo-50">
                    <span className="text-indigo-900 font-semibold">Email support</span>
                    <div className="text-xs text-indigo-700 mt-1">24-48 hour response</div>
                  </td>
                  <td className="px-6 py-4 text-center border-l border-gray-200">
                    <span className="text-purple-900 font-semibold">Priority support</span>
                    <div className="text-xs text-purple-700 mt-1">12-24 hour response</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Feature Deep Dive Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">
          Feature Highlights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Faculty-Specific Templates */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 sm:p-8 shadow-lg border-2 border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">10 Faculty-Specific Templates</h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4">
              Get reports customized for your field of study. Each faculty has specialized terminology, structure, and requirements.
            </p>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Engineering:</strong> Hardware specs, circuit diagrams, technical methodology</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Sciences:</strong> Lab procedures, experimental design, data analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Law:</strong> Case studies, legal frameworks, statutory analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Medicine:</strong> Clinical protocols, patient care, medical terminology</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Plus: Business, Social Sciences, Arts, Agriculture, Environmental Studies</span>
              </li>
            </ul>
          </div>

          {/* Academic References */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 sm:p-8 shadow-lg border-2 border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Multiple Citation Styles</h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4">
              Professional academic references automatically added throughout your report in your preferred format.
            </p>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>APA Style:</strong> Psychology, Education, Social Sciences</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>IEEE Style:</strong> Engineering, Computer Science, Technology</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Harvard Style:</strong> Business, Humanities, Sciences</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>No References:</strong> For projects that don't require citations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Premium:</strong> Custom citation formats for unique requirements</span>
              </li>
            </ul>
          </div>

          {/* Workspace Features */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Professional Workspace</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Sidebar Navigation:</strong> Easy chapter navigation, token usage tracker, image gallery</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Action Bar:</strong> Generate, Edit, Regenerate, Modify, Print, Export buttons</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Version History:</strong> Track all changes, restore previous versions</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Real-time Preview:</strong> See formatted content as you work</span>
              </li>
            </ul>
          </div>

          {/* Export Quality */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Professional Export</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>DOCX Export:</strong> Times New Roman, 12pt, 1.5 spacing, editable in Word</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Embedded Images:</strong> All images included with proper captions</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Academic Standard:</strong> Cover page, TOC, proper formatting</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span><strong>Print-Ready:</strong> Submit directly to supervisors or print shops</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Can I try before I pay?
            </h3>
            <p className="text-sm sm:text-base text-gray-700">
              Yes! The Free tier gives you 1 complete project to test the platform. You'll get a full 5-chapter report to see the quality before upgrading.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              What faculties are supported?
            </h3>
            <p className="text-sm sm:text-base text-gray-700">
              Standard and Premium tiers support all 10 major faculties: Engineering, Sciences, Law, Medicine, Business, Social Sciences, Arts, Agriculture, Environmental Studies, and Education. Each has customized templates with field-specific terminology.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              How do citation styles work?
            </h3>
            <p className="text-sm sm:text-base text-gray-700">
              Choose from APA, IEEE, or Harvard citation styles. The AI automatically adds in-text citations and a complete reference list at the end of your report, properly formatted according to your chosen style.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              What happens after 30 days?
            </h3>
            <p className="text-sm sm:text-base text-gray-700">
              You keep your exported files forever! The 30-day limit only applies to editing and regenerating within the workspace. Always export your final version.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Can I edit manually?
            </h3>
            <p className="text-sm sm:text-base text-gray-700">
              Yes! Standard and Premium tiers have a full text editor. Manual edits use 0 tokens, so you can perfect your report without limits.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-sm sm:text-base text-gray-700">
              We accept all major payment methods via Paystack: Cards, Bank Transfer, USSD. Payments are secure and instant.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 sm:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-indigo-100 mb-6 sm:mb-8">
            Choose your plan and create your first project in minutes
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-100 transition shadow-xl"
          >
            Go to Dashboard
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-xs sm:text-sm">
          <p>© 2025 W3 WriteLab. Empowering Students and Professionals.</p>
        </div>
      </footer>
    </div>
  );
}