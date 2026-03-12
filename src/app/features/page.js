"use client";
import Link from 'next/link';
import { PRICING_FORMATTED } from '@/lib/pricing';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img src="/favicon.ico" alt="W3 WriteLab" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">W3 WriteLab</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-2 uppercase tracking-widest"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tight">
          Tier Comparison
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          From basic reports to elite academic research. Choose the level of AI intelligence and control required for your project.
        </p>
      </div>

      {/* Pricing Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Desktop View - High End Table */}
        <div className="hidden lg:block bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-8 py-10 text-left bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-200">Technical Capability</th>
                  <th className="px-8 py-10 text-center bg-slate-50 border-b border-slate-200 border-l border-slate-100">
                    <div className="mb-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Tier One</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{PRICING_FORMATTED.FREE}</div>
                  </th>
                  <th className="px-8 py-10 text-center bg-slate-50 border-b border-slate-200 border-l border-slate-100">
                    <div className="mb-2 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em]">Technical</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{PRICING_FORMATTED.STANDARD}</div>
                  </th>
                  <th className="px-8 py-10 text-center bg-slate-900 border-b border-slate-800 border-l border-slate-800">
                    <div className="mb-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Unlimited</div>
                    <div className="text-3xl font-black text-white tracking-tight">{PRICING_FORMATTED.PREMIUM}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: "Content Target", free: "1500 Words", std: "2,000+ Words", prem: "4,000+ Words", subPrem: "Elite Technical Depth" },
                  { name: "AI Architect", free: "Basic", std: "Advanced", prem: "System Architect", subPrem: "Deep Technical Logic" },
                  { name: "Academic Humanizer", free: "✗", std: "✗", prem: "✓ 10,000 Words", premClass: "text-emerald-500 font-black", subPrem: "Bypass AI Detectors" },
                  { name: "Modification Style", free: "None", std: "Whole Chapter", prem: "Surgical / Partial", subPrem: "Edit Specific Sections" },
                  { name: "Web Search (Real Refs)", free: "✗", std: "✓ (2022-2026)", prem: "✓ (Deep Scholar)", stdClass: "font-bold", premClass: "text-emerald-500 font-black" },
                  { name: "Research Data Analysis", free: "✗", std: "✗", prem: "✓ (Files Tab)", premClass: "text-emerald-500 font-black", subPrem: "Analyze DOCX/TXT Readings" },
                  { name: "Visual Tools", free: "✗", std: "✗", prem: "✓ (Flowcharts/Sys)", premClass: "text-emerald-500 font-black", subPrem: "Mermaid & Diagrams" },
                  { name: "Presentation Gen", free: "✗", std: "✗", prem: "✓ (AI Slides)", premClass: "text-emerald-500 font-black" },
                  { name: "Project Limit", free: "1 Free Project ", std: "Scale with Usage", prem: "Scale with Usage", stdClass: "font-bold", premClass: "text-emerald-500 font-black" },
                  { name: "Token Limit", free: "30,000", std: "120,000", prem: "300,000 (Soft)", subPrem: "Top-up available" },
                  { name: "Affiliate Commission", free: "✗", std: "10% Reward", prem: "15% (VIP)", premClass: "text-emerald-500 font-black" },
                  { name: "Export Standards", free: "PDF", std: "DOCX + PDF", prem: "DOCX (Premium Build)", subPrem: "Custom Order + Master Refs" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition">
                    <td className="px-8 py-5 font-bold text-slate-900 text-sm">{row.name}</td>
                    <td className="px-8 py-5 text-center border-l border-slate-100 text-sm text-slate-400 font-medium">{row.free}</td>
                    <td className="px-8 py-5 text-center border-l border-slate-100 text-sm text-slate-900 font-medium">
                      <span className={row.stdClass}>{row.std}</span>
                    </td>
                    <td className="px-8 py-5 text-center border-l border-slate-800 bg-slate-900 text-sm text-slate-300 font-medium">
                      <span className={row.premClass || 'font-bold'}>{row.prem}</span>
                      {row.subPrem && <div className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{row.subPrem}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden space-y-8">
          {[
            { title: "Standard", price: PRICING_FORMATTED.STANDARD, color: "slate-900", features: ["2,000+ Words per Chapter", "Web-Sourced Refs (2022+)", "Whole Chapter Regeneration", "Unlimited Projects", "DOCX & PDF Export"] },
            { title: "Premium", price: PRICING_FORMATTED.PREMIUM, color: "slate-900", premium: true, features: ["4,000+ Words (Elite Depth)", "Academic Humanizer (Bypass)", "Surgical Section Editing", "Research Data Analysis", "Flowcharts & Visual Tools", "15% VIP Commissions", "Master Reference Export"] }
          ].map((card, i) => (
            <div key={i} className={`bg-white rounded-[32px] border-2 ${card.premium ? 'border-slate-900 shadow-2xl' : 'border-slate-100 shadow-xl'} overflow-hidden`}>
              <div className={`p-8 ${card.premium ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} text-center`}>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-60">{card.title}</h3>
                <div className="text-4xl font-black tracking-tight">{card.price}</div>
              </div>
              <div className="p-8 space-y-4">
                {card.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${card.premium ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{f}</span>
                  </div>
                ))}
                <Link href="/dashboard" className={`block w-full py-4 rounded-2xl text-center font-black text-xs uppercase tracking-widest mt-6 transition-all active:scale-95 ${card.premium ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-900'}`}>
                  Select {card.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Feature Deep Dives */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">The Premium Advantage</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Exclusive Technical Capabilities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Surgical Modification", 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>, 
              desc: "Don't like a specific paragraph? Rewrite it without regenerating the entire chapter. Maintain your manual edits while fixing AI content." 
            },
            { 
              title: "Academic Humanizer", 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>, 
              desc: "Bypass AI detection tools. Our humanizer removes GPT patterns, improves flow, and ensures your report sounds naturally academic." 
            },
            { 
              title: "Research Data Analysis", 
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>, 
              desc: "Upload your experimental readings. The AI Architect performs real technical evaluations, data synthesis, and results analysis based on your files." 
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-xl hover:shadow-2xl transition-all group">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to Build?
          </h2>
          <p className="text-xl text-slate-400 mb-12 font-medium">
            Start your project today with the most advanced academic AI system in Nigeria.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-100 transition shadow-2xl active:scale-95"
          >
            Go to Workspace
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-500 rounded-full blur-[120px]"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">© 2026 W3 WriteLab • Technical Research Hub</p>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Architected by W3 Hub</p>
        </div>
      </footer>
    </div>
  );
}
