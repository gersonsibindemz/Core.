import React from 'react';
import ApiDropdown from '../components/ApiDropdown';

const ContactPage: React.FC = () => {
  return (
    <div className="bg-slate-900 font-sans text-slate-200 min-h-screen">
      <header className="sticky top-0 z-20 w-full bg-slate-900 border-b border-slate-700/50">
        <div className="w-full max-w-5xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <div>
              <img src="https://i.postimg.cc/BbkGVxv2/Longani-Core.png" alt="LonganiCore Logo" className="h-16 md:h-20" />
              <p className="text-slate-400 mt-2">
                Get In Touch
              </p>
            </div>
            <nav className="flex items-center gap-4 md:gap-6 text-sm font-semibold">
                <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = '#'; }} className="text-slate-300 hover:text-teal-400 transition-colors">
                    Translator
                </a>
                 <a href="#about" onClick={(e) => { e.preventDefault(); window.location.hash = '#about'; }} className="text-slate-300 hover:text-teal-400 transition-colors">
                    About Us
                </a>
                <a href="#contact" onClick={(e) => { e.preventDefault(); window.location.hash = '#contact'; }} className="text-slate-300 hover:text-teal-400 transition-colors">
                    Contact
                </a>
                <ApiDropdown />
            </nav>
          </div>
        </div>
      </header>
      <div className="w-full max-w-5xl mx-auto p-4">
        <main className="bg-slate-800 shadow-2xl shadow-slate-950/50 rounded-2xl p-6 md:p-8">
            <h2 className="text-3xl font-bold text-teal-400 mb-4">Contact Us</h2>
             <p className="text-slate-400 mb-8 leading-relaxed">
                We are always open to collaboration and welcome inquiries from potential partners, developers, and researchers. Please use the appropriate channel below to get in touch with our team.
            </p>
            <div className="space-y-8 text-slate-300">
                <section className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">General Inquiries & Partnerships</h3>
                    <p className="text-slate-400 mb-3">
                       For partnership opportunities, API integration support, or general questions, please reach out to our team via email.
                    </p>
                    <p className="font-mono bg-slate-700 inline-block px-4 py-2 rounded-md text-teal-300">
                        partnerships@longani.core
                    </p>
                </section>
                <section className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Technical Support</h3>
                     <p className="text-slate-400 mb-3">
                        If you are a developer using our API and require technical assistance, please contact our dedicated support team.
                    </p>
                     <p className="font-mono bg-slate-700 inline-block px-4 py-2 rounded-md text-teal-300">
                        devsupport@longani.core
                    </p>
                </section>
                 <section className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Connect with Ban2Lab</h3>
                     <p className="text-slate-400 mb-3">
                        Follow our research and development initiatives on our professional networks.
                    </p>
                    <a href="#" className="text-teal-400 font-semibold hover:underline" onClick={(e) => e.preventDefault()}>
                        Find Ban2Lab on LinkedIn &rarr;
                    </a>
                </section>
            </div>
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Developed by Ban2Lab | Powered by Google Gemini API</p>
        </footer>
      </div>
    </div>
  );
};

export default ContactPage;