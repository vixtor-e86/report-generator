"use client";
import Link from 'next/link';
import { PRICING, PRICING_FORMATTED } from '@/lib/pricing';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">W3 WriteLab</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition flex items-center gap-2"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
          Choose the Right Plan for You
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
          From basic reports to advanced AI-powered projects with full editing capabilities.
          See exactly what you get with each tier.
        </p>
      </div>

      {/* Pricing Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Mobile View - Cards */}
        <div className="lg:hidden space-y-6">
          {/* Free Tier Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 p-6 text-center border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Free</h3>
              <div className="text-3xl font-extrabold text-slate-900">{PRICING_FORMATTED.FREE}</div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "AI Model", value: "Basic Quality" },
                { label: "Projects", value: "1 only", valueColor: "text-red-600 font-bold" },
                { label: "Templates", value: "1 template" },
                { label: "Faculties", value: "✓ All 10 Faculties", valueColor: "text-green-600" },
                { label: "References", value: "✓ APA Style", valueColor: "text-green-600" },
                { label: "Edit Content", value: "✗ No", valueColor: "text-red-600" },
                { label: "Regenerate", value: "✗ No", valueColor: "text-red-600" },
                { label: "Images", value: "2 images" },
                { label: "Export", value: "PDF only" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className={`text-sm ${item.valueColor || 'text-slate-900'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Tier Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
            <div className="bg-indigo-50 p-6 text-center border-b border-indigo-100">
              <h3 className="text-xl font-bold text-indigo-900 mb-1">Standard</h3>
              <div className="text-3xl font-extrabold text-indigo-600">{PRICING_FORMATTED.STANDARD}</div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "AI Model", value: "Professional Quality", valueColor: "font-bold text-indigo-700" },
                { label: "Projects", value: "Unlimited", valueColor: "text-green-600 font-bold" },
                { label: "Templates", value: "3 templates" },
                { label: "Faculties", value: "✓ All 10 Faculties", valueColor: "text-green-600" },
                { label: "References", value: "✓ 3 Styles", valueColor: "text-green-600" },
                { label: "Edit Content", value: "✓ Yes", valueColor: "text-green-600" },
                { label: "Regenerate", value: "✓ ~12 times", valueColor: "text-green-600" },
                { label: "Images", value: "10 images" },
                { label: "Export", value: "DOCX + PDF" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className={`text-sm ${item.valueColor || 'text-slate-900'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Tier Card */}
          <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
            <div className="bg-purple-50 p-6 text-center border-b border-purple-100">
              <h3 className="text-xl font-bold text-purple-900 mb-1">Premium</h3>
              <div className="text-3xl font-extrabold text-purple-600">{PRICING_FORMATTED.PREMIUM}</div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "AI Model", value: "Premium Quality", valueColor: "font-bold text-purple-700" },
                { label: "Projects", value: "Unlimited", valueColor: "text-green-600 font-bold" },
                { label: "Templates", value: "Custom", valueColor: "text-purple-700" },
                { label: "Faculties", value: "✓ All 10 + Custom", valueColor: "text-green-600" },
                { label: "References", value: "✓ All + Custom", valueColor: "text-green-600" },
                { label: "Edit Content", value: "✓ Advanced", valueColor: "text-green-600" },
                { label: "Regenerate", value: "✓ Unlimited", valueColor: "text-green-600" },
                { label: "Images", value: "Unlimited", valueColor: "text-purple-700" },
                { label: "Export", value: "DOCX + LaTeX" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className={`text-sm ${item.valueColor || 'text-slate-900'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-6 py-6 text-left bg-slate-50 text-slate-900 font-bold text-lg border-b border-slate-200">Feature</th>
                  <th className="px-6 py-6 text-center bg-slate-50 border-b border-slate-200 border-l border-slate-200">
                    <div className="mb-2 text-slate-500 text-sm font-semibold uppercase tracking-wider">Free</div>
                    <div className="text-3xl font-extrabold text-slate-900">{PRICING_FORMATTED.FREE}</div>
                  </th>
                  <th className="px-6 py-6 text-center bg-indigo-50 border-b border-indigo-100 border-l border-slate-200">
                    <div className="mb-2 text-indigo-600 text-sm font-bold uppercase tracking-wider">Standard</div>
                    <div className="text-3xl font-extrabold text-indigo-700">{PRICING_FORMATTED.STANDARD}</div>
                  </th>
                  <th className="px-6 py-6 text-center bg-purple-50 border-b border-purple-100 border-l border-slate-200">
                    <div className="mb-2 text-purple-600 text-sm font-bold uppercase tracking-wider">Premium</div>
                    <div className="text-3xl font-extrabold text-purple-700">{PRICING_FORMATTED.PREMIUM}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  { name: "Content Quality", free: "Basic", std: "Professional", prem: "Premium", subFree: "Good for simple projects", subStd: "Advanced AI writing", subPrem: "Highest quality AI" },
                  { name: "Project Limit", free: "1 project", std: "Unlimited", prem: "Unlimited", freeClass: "text-red-600 font-bold", stdClass: "text-green-600 font-bold", premClass: "text-green-600 font-bold" },
                  { name: "Templates", free: "1 template", std: "3 templates", prem: "Custom templates" },
                  { name: "Faculty Support", free: "✓ All 10 Faculties", std: "✓ All 10 Faculties", prem: "✓ All 10 + Custom", rowClass: "bg-slate-50/50" },
                  { name: "Citations", free: "✓ APA Style", std: "✓ 3 Styles", prem: "✓ All Styles + Custom", rowClass: "bg-slate-50/50" },
                  { name: "Edit Content", free: "✗ No", std: "✓ Yes", prem: "✓ Advanced Editor", freeClass: "text-red-600", stdClass: "text-green-600", premClass: "text-green-600" },
                  { name: "Regenerate", free: "✗ No", std: "✓ Yes", prem: "✓ Unlimited", freeClass: "text-red-600", stdClass: "text-green-600", premClass: "text-green-600" },
                  { name: "Images", free: "2 images", std: "10 images", prem: "Unlimited" },
                  { name: "Export Formats", free: "PDF only", std: "DOCX + PDF", prem: "DOCX + LaTeX" },
                  { name: "Support", free: "Email", std: "Email (24h)", prem: "Priority (12h)" },
                ].map((row, i) => (
                  <tr key={i} className={`hover:bg-slate-50 transition ${row.rowClass || ''}`}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-6 py-4 text-center border-l border-slate-200">
                      <span className={row.freeClass || 'text-slate-600'}>{row.free}</span>
                      {row.subFree && <div className="text-xs text-slate-400 mt-1">{row.subFree}</div>}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-slate-200 bg-indigo-50/30">
                      <span className={row.stdClass || 'text-indigo-900 font-medium'}>{row.std}</span>
                      {row.subStd && <div className="text-xs text-indigo-700 mt-1">{row.subStd}</div>}
                    </td>
                    <td className="px-6 py-4 text-center border-l border-slate-200 bg-purple-50/30">
                      <span className={row.premClass || 'text-purple-900 font-medium'}>{row.prem}</span>
                      {row.subPrem && <div className="text-xs text-purple-700 mt-1">{row.subPrem}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Feature Deep Dive Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 text-center">
          Feature Highlights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: "10 Faculty-Specific Templates", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "blue", desc: "Get reports customized for your field of study. Each faculty has specialized terminology, structure, and requirements." },
            { title: "Multiple Citation Styles", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "green", desc: "Professional academic references automatically added throughout your report in your preferred format (APA, IEEE, Harvard)." },
            { title: "Professional Workspace", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "indigo", desc: "Includes sidebar navigation, token usage tracker, image gallery, and real-time preview." },
            { title: "Professional Export", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "green", desc: "Export to editable DOCX with Times New Roman, 12pt, 1.5 spacing, ready for submission." }
          ].map((feature, i) => (
            <div key={i} className={`bg-white rounded-xl p-8 shadow-sm border border-${feature.color}-100 hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 bg-${feature.color}-50 rounded-xl flex items-center justify-center mb-4 text-${feature.color}-600`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Choose your plan and create your first project in minutes
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-100 transition shadow-xl"
          >
            Go to Dashboard
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>© 2025 W3 WriteLab. Empowering Students and Professionals.</p>
          <p className="mt-2 text-xs">Developed by W3 Hub</p>
        </div>
      </footer>
    </div>
  );
}
