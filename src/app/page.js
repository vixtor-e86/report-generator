"use client";
import { useState } from 'react';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-2xl font-bold text-indigo-600">📄 W3 WriteLab</span>
            <div className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition">Pricing</a>
              <div className="w-full max-w-sm"><GoogleAuthButton /></div>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-indigo-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}</svg></button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#pricing" className="block text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <div className="w-full max-w-sm mt-2"><GoogleAuthButton /></div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">🎓 Built for Students & Professionals</div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">Generate Professional<br /><span className="text-indigo-600">Project Reports in Minutes</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">Stop spending 40+ hours writing documentation manually. Our AI generates complete 5-chapter reports with accurate citations in just minutes.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <div className="w-full max-w-sm"><GoogleAuthButton /></div>
            <a href="#pricing" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 shadow-lg transition border-2 border-indigo-600">View Pricing</a>
          </div>
          <p className="text-sm text-gray-500">✓ No credit card required • ✓ 1 free report • ✓ Takes less than 10 minutes</p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl shadow-md border border-indigo-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">95%</div>
              <div className="text-gray-700 font-semibold text-lg">Time Saved</div>
              <div className="text-gray-500 text-sm mt-1">From 40 hours to 30 minutes</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl shadow-md border border-indigo-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">5 Chapters</div>
              <div className="text-gray-700 font-semibold text-lg">Auto-Generated</div>
              <div className="text-gray-500 text-sm mt-1">Complete report structure</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl shadow-md border border-indigo-100">
              <div className="text-4xl font-bold text-indigo-600 mb-2">IEEE</div>
              <div className="text-gray-700 font-semibold text-lg">Academic Citations</div>
              <div className="text-gray-500 text-sm mt-1">Properly formatted references</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Generate your complete report in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><span className="text-3xl font-bold text-white">1</span></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enter Project Details</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Provide your project title, department, components used, and a brief description of what your project does.</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><span className="text-3xl font-bold text-white">2</span></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Generates Chapters</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Our AI writes each chapter professionally—Introduction, Literature Review, Methodology, Results, and Conclusion.</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><span className="text-3xl font-bold text-white">3</span></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Download & Submit</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Export your complete report as PDF or editable Word document, ready for submission with proper formatting.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Tier</h2>
            <p className="text-xl text-gray-600">Select the plan that fits your project needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* FREE */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-indigo-300 transition">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-5xl font-extrabold text-gray-900 mb-2">₦0</div>
                <p className="text-gray-500">Try it out - 1 report</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">1 complete report (lifetime)</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Basic AI quality</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Upload 2 images (end of report only)</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Standard 5-chapter template</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">PDF export</span></li>
                <li className="flex items-start gap-3 opacity-50"><svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg><span className="text-gray-500">No chapter regeneration</span></li>
                <li className="flex items-start gap-3 opacity-50"><svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg><span className="text-gray-500">No editing or Word export</span></li>
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">Get Started Free</button>
            </div>

            {/* STANDARD */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-500 rounded-2xl p-8 relative transform hover:scale-105 transition shadow-xl">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-bold">POPULAR</div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Standard</h3>
                <div className="text-5xl font-extrabold text-indigo-600 mb-2">₦10,000</div>
                <p className="text-gray-500">Per report</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700 font-semibold">Everything in Free, plus:</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Good AI quality</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Upload up to 10 images (place anywhere in document)</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Edit text before printing</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Unlimited chapter regeneration</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">All 3 templates available</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Word document (DOCX) + PDF export</span></li>
              </ul>
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg">Get Standard</button>
            </div>

            {/* PREMIUM */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-indigo-300 transition">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-5xl font-extrabold text-gray-900 mb-2">₦20,000</div>
                <p className="text-gray-500">Per report</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700 font-semibold">Everything in Standard, plus:</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Best AI model for professional documentation</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Unlimited images</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Create custom templates</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">AI template extraction from existing documents</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Priority generation (no queue)</span></li>
                <li className="flex items-start gap-3"><svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg><span className="text-gray-700">Priority email support</span></li>
              </ul>
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition">Get Premium</button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 text-lg">💡 <span className="font-semibold">Compare this:</span> Hiring someone costs ₦50,000-70,000. Our Premium tier saves you ₦30,000+ and 40 hours of work!</p>
          </div>
        </div>
      </div>

      {/* IEEE Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-10 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">What are IEEE Citations?</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed mb-4"><span className="font-bold text-indigo-600">IEEE (Institute of Electrical and Electronics Engineers)</span> is the standard citation format used in engineering, technology, and computer science fields worldwide.</p>
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 my-6 rounded">
                <p className="text-gray-800 font-semibold mb-2">Example of IEEE Citation in Your Report:</p>
                <p className="text-gray-700 mb-2">&quot;The Arduino Uno operates at 5V and features an ATmega328P microcontroller <span className="font-bold text-indigo-600">[1]</span>. Temperature sensors like the DHT11 provide accurate readings for IoT applications <span className="font-bold text-indigo-600">[2]</span>.&quot;</p>
                <p className="text-gray-600 text-sm mt-4 italic">Then at the end of your report, you&apos;ll have:</p>
                <p className="text-gray-700 text-sm mt-2"><span className="font-bold">[1]</span> Arduino, &quot;Arduino Uno Rev3,&quot; Arduino Documentation, 2023.<br /><span className="font-bold">[2]</span> D-Robotics, &quot;DHT11 Humidity & Temperature Sensor Datasheet,&quot; 2020.</p>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed mb-4"><span className="font-bold">Why it matters:</span> Academic institutions require proper citations in project reports. Our AI automatically adds these citations as it generates your report, ensuring your work meets standards and avoids plagiarism.</p>
              <p className="text-gray-700 text-lg leading-relaxed"><span className="font-bold">No manual work needed!</span> You don&apos;t need to format citations yourself—W3 WriteLab handles everything automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Save 40+ Hours of Writing?</h2>
          <p className="text-indigo-100 text-xl mb-10 leading-relaxed">Join hundreds of students and professionals who&apos;ve generated professional reports in minutes. Start with 1 free report—no credit card required.</p>
          <div className="w-full max-w-sm mx-auto"><GoogleAuthButton /></div>
          <p className="text-indigo-200 text-sm mt-6">✓ No signup required to try • ✓ Works with standard academic formats</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">📄 W3 WriteLab</h3>
              <p className="text-sm">AI-powered project report generator. Save time, maintain quality.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">&copy; 2025 W3 WriteLab. All rights reserved.</p>
            <p className="mt-2 text-sm">Developed by <span className="font-semibold text-indigo-400">WhaleHub</span></p>

          </div>
        </div>
      </footer>
    </div>
  );
}