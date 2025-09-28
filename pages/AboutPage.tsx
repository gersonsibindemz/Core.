import React from 'react';
import ApiDropdown from '../components/ApiDropdown';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-slate-900 font-sans text-slate-200 min-h-screen">
      <header className="sticky top-0 z-20 w-full bg-slate-900 border-b border-slate-700/50">
        <div className="w-full max-w-5xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <div>
              <img src="https://i.postimg.cc/BbkGVxv2/Longani-Core.png" alt="LonganiCore Logo" className="h-16 md:h-20" />
              <p className="text-slate-400 mt-2">
                About Our Mission
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
            <h2 className="text-3xl font-bold text-teal-400 mb-6">About LonganiCore</h2>
            <div className="space-y-6 text-slate-300 leading-relaxed">
                <section>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">Our Mission</h3>
                    <p className="text-slate-400">
                        Empowering communication and preserving linguistic diversity in Mozambique through cutting-edge AI technology.
                    </p>
                </section>
                <section>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">What We Do</h3>
                    <p className="text-slate-400">
                        LonganiCore provides developers, researchers, and organizations with a powerful, context-aware translation platform for Mozambican Bantu languages. By leveraging the advanced capabilities of Google's Gemini API, we offer a robust service that goes beyond literal translation to capture cultural nuance and context.
                    </p>
                </section>
                 <section>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">For Our Partners</h3>
                    <p className="text-slate-400">
                        We are committed to building a collaborative ecosystem. Our API is designed for seamless integration, allowing our partners to build innovative applications and services that serve Mozambican communities. Whether you are developing educational tools, content platforms, or business solutions, LonganiCore provides the linguistic foundation you need.
                    </p>
                </section>
                <section>
                    <h3 className="text-xl font-semibold text-slate-200 mb-3 border-l-4 border-teal-500 pl-3">The Technology</h3>
                    <p className="text-slate-400">
                        Powered by Gemini, our platform utilizes real-time research grounding to ensure translations are accurate, relevant, and informed by a wide array of linguistic sources. This commitment to quality and innovation makes LonganiCore a trusted resource for high-fidelity language solutions.
                    </p>
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

export default AboutPage;