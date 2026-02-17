import React from 'react';
import { Scroll, AlertOctagon, Gavel, Globe, Ban, CheckCircle, ShieldAlert } from 'lucide-react';

export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Scroll className="text-blue-600" size={24} /> 
              Terms of Use
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">
              Effective Date: February 17, 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-8 pr-4 custom-scrollbar">
          
          {/* Section 1: Acceptable Use */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500"/> 1. Acceptable Use Policy
            </h3>
            <p className="mb-2">
              As an authorized representative of an <strong>Animal Bite Treatment Center (ABTC)</strong>, you are granted a limited right to access the System strictly for official reporting to the Abra Provincial Health Office.
            </p>
            <p className="mb-3">
              You agree to input only accurate and truthful statistical data and maintain the confidentiality of your center's login credentials.
            </p>
            <div className="bg-blue-50/50 border-l-2 border-blue-500 p-3 rounded-r-lg text-xs italic">
              <strong>Data Processing Consent:</strong> By using this System, you explicitly consent to the collection and processing of your professional personnel data (Name, Designation, and Contact Info) as described in the Privacy Policy for system security and account management.
            </div>
          </section>

          {/* Section 2: Strict Prohibition */}
          <div className="bg-rose-50 p-4 rounded-lg border border-rose-100 text-rose-900">
            <h4 className="font-bold flex items-center gap-2 mb-2 text-rose-700">
              <Ban size={16} /> 2. Strict Prohibition on Patient Data
            </h4>
            <p className="text-xs leading-5 mb-2">
              <strong>COMPLIANCE WITH RA 10173:</strong> Users are strictly prohibited from entering Sensitive Personal Information (Patient Names, Addresses, Medical IDs) into any free-text fields.
            </p>
            <p className="text-xs font-bold text-rose-800">
              The Developer and the Abra Provincial Health Office assume no liability for privacy violations resulting from your failure to adhere to this prohibition.
            </p>
          </div>

          {/* Section 3: Indemnification */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-indigo-600"/> 3. Indemnification
            </h3>
            <p className="text-xs italic">
              The Animal Bite Treatment Center agrees to indemnify and hold harmless the Developer and the Abra Provincial Health Office from and against any claims, liabilities, or expenses arising from the center's violation of the <strong>Zero-Patient Data Policy</strong>, specifically the unauthorized input of Sensitive Personal Information.
            </p>
          </section>

          {/* Section 4: Termination */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <AlertOctagon size={16} className="text-amber-500"/> 4. Suspension & Termination
            </h3>
            <p className="mb-2 text-xs">
                The Abra Provincial Health Office and the Developer reserve the right to immediately suspend or revoke your center's access credentials without notice for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Violation of the Zero-Patient Data Policy.</strong></li>
              <li>Breach of these Terms of Use.</li>
              <li>Security risks or unauthorized sharing of credentials.</li>
            </ul>
          </section>

          {/* Section 5: IP Rights */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Gavel size={16} className="text-gray-600"/> 5. Intellectual Property
            </h3>
            <p className="text-xs">
              The <strong>ABTC Reporting System</strong> is the independent intellectual property of <strong>Justice Belleza</strong>. Usage by a center does not constitute a transfer of ownership rights.
            </p>
          </section>

          {/* Section 6: Governing Law */}
          <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="font-bold text-zinc-900 text-base mb-2 flex items-center gap-2">
              <Globe size={16} className="text-indigo-600"/> 6. Governing Law
            </h3>
            <p className="text-xs">
              These Terms shall be governed by the laws of the <strong>Republic of the Philippines</strong>. Any legal action shall be brought exclusively in the proper courts of the <strong>Province of Abra</strong>.
            </p>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle size={16} />
            I Agree
          </button>
        </div>

      </div>
    </div>
  );
}