import React from 'react';
import { FileCheck, X, AlertTriangle, ShieldCheck, Server, Copyright } from 'lucide-react';

export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <FileCheck className="text-zinc-700" size={24} /> 
              Terms of Use
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">
              Effective Date: February 12, 2026
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-zinc-900 hover:bg-gray-200 p-2 rounded-full transition-all"
            aria-label="Close modal"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-8 pr-4 custom-scrollbar">
          
          {/* Preamble */}
          <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 text-zinc-800 text-xs leading-5">
            <strong>Agreement to Terms:</strong> By accessing, browsing, or using the ABTC Reporting System ("System"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree to these terms, you must strictly stop using the System immediately.
          </div>

          {/* Section 1 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-gray-400"/> 1. Acceptable Use Policy
            </h3>
            <p className="mb-3">
              You are granted a limited, non-exclusive, non-transferable license to use the System strictly for official animal bite reporting and administrative purposes.
            </p>
            <div className="grid gap-4">
               <div>
                  <h4 className="font-semibold text-zinc-900 text-xs uppercase mb-1">A. User Responsibilities</h4>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-gray-600">
                    <li>You must maintain the confidentiality of your login credentials.</li>
                    <li>You are fully responsible for all activities that occur under your account.</li>
                    <li>You agree to input only accurate and truthful statistical data.</li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-semibold text-zinc-900 text-xs uppercase mb-1">B. Prohibited Conduct</h4>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-gray-600">
                    <li>Attempting to gain unauthorized access to the System or its related servers.</li>
                    <li>Using the System for any illegal purpose or in violation of local laws.</li>
                    <li>Reverse engineering, decompiling, or disassembling the System software.</li>
                  </ul>
               </div>
            </div>
          </section>

          {/* Section 2 - The Critical Warning */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500"/> 2. Strict Prohibition on Patient Data
            </h3>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <p className="text-amber-900 font-medium mb-1">Compliance with RA 10173 (Data Privacy Act)</p>
              <p className="text-amber-800/80 text-xs leading-relaxed">
                Users are strictly prohibited from entering <strong>Sensitive Personal Information</strong> (such as Patient Names, Addresses, or Medical IDs) into any free-text fields or remarks sections of this System. The System is designed for <strong>aggregate statistical reporting only</strong>.
              </p>
              <p className="text-amber-800/80 text-xs mt-2">
                <strong>Liability:</strong> The Developer assumes no liability for any data privacy violations resulting from a user's failure to adhere to this prohibition.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Copyright size={16} className="text-gray-400"/> 3. Intellectual Property Rights
            </h3>
            <p>
              The ABTC Reporting System, including its source code, design layout, and underlying logic, is the independent intellectual property of <strong>Justice Belleza</strong>.
            </p>
            <p className="mt-2">
              Usage of this system by a facility or institution does not constitute a transfer of ownership rights. The facility retains ownership of the raw statistical data it inputs into the system.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Server size={16} className="text-gray-400"/> 4. Disclaimer of Warranties
            </h3>
            <p className="uppercase text-xs font-bold text-gray-500 mb-1">Provided "AS IS"</p>
            <p>
              The System is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. The Developer does not warrant that the System will be uninterrupted, error-free, or completely secure. The Developer shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the System.
            </p>
          </section>

           {/* Section 5 */}
           <section className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-zinc-900 text-base mb-2">5. Contact & Inquiries</h3>
            <p className="mb-2">
              For legal inquiries regarding these Terms of Use, please contact:
            </p>
            <div className="text-sm">
              <a href="mailto:justice.belleza@icloud.com" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium">
                justice.belleza@icloud.com
              </a>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
          >
            I Agree & Close
          </button>
        </div>

      </div>
    </div>
  );
}