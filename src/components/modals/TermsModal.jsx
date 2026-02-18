import React from 'react';
import { Scroll, AlertOctagon, Gavel, Globe, Ban, CheckCircle, ShieldAlert, ZapOff, Scale } from 'lucide-react';

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
              As an authorized representative of an <strong>Animal Bite Treatment Center (ABTC)</strong> (whether government-owned or private accredited), you are granted a limited right to access the System strictly for official reporting to the Abra Provincial Health Office.
            </p>
            <p className="mb-3">
              You agree to input only accurate and truthful statistical data and maintain the confidentiality of your <strong>ABTC's</strong> login credentials.
            </p>
            <div className="bg-blue-50/50 border-l-2 border-blue-500 p-3 rounded-r-lg text-xs italic">
              <strong>Data Processing Consent:</strong> By using this System, you explicitly consent to the collection and processing of your professional personnel data (Name, Designation, and Contact Info) as described in the Privacy Policy.
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
            <p className="text-xs italic bg-gray-50 p-3 rounded-lg border border-gray-100">
              The Animal Bite Treatment Center agrees to indemnify and hold harmless the Developer and the Abra Provincial Health Office from and against any claims, liabilities, or expenses arising from the <strong>ABTC's</strong> violation of the <strong>Zero-Patient Data Policy</strong>.
            </p>
          </section>

          {/* Section 4: Prohibited Acts */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2 text-red-600">
              <AlertOctagon size={16} /> 4. Prohibited Acts
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Sharing account credentials with unauthorized personnel.</li>
              <li>Attempting to reverse engineer, scrape, or attack the System infrastructure.</li>
              <li>Using the System for any purpose other than official health reporting.</li>
            </ul>
          </section>

          {/* Section 5: Termination */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Ban size={16} className="text-amber-500"/> 5. Suspension & Termination
            </h3>
            <p className="mb-2 text-xs">
                The Office and the Developer reserve the right to immediately suspend or revoke your <strong>ABTC's</strong> access for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-gray-500">
              <li><strong>Violation of the Zero-Patient Data Policy.</strong></li>
              <li><strong>Loss of Government Accreditation:</strong> Ceasing to be an accredited ABTC recognized by the Provincial Health Office.</li>
              <li>Breach of these Terms of Use or security risks.</li>
            </ul>
          </section>

          {/* Section 6: IP Rights */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <Gavel size={16} className="text-gray-600"/> 6. Intellectual Property
            </h3>
            <p className="text-xs">
              The <strong>ABTC Reporting System</strong> is the independent intellectual property of <strong>Justice Belleza</strong>. Usage by an ABTC does not constitute a transfer of ownership rights.
            </p>
          </section>

          {/* Section 7: Force Majeure */}
          <section>
            <h3 className="font-bold text-zinc-900 text-base mb-3 flex items-center gap-2">
              <ZapOff size={16} className="text-orange-500"/> 7. Force Majeure
            </h3>
            <p className="text-xs text-gray-500 leading-5">
              The Developer shall not be liable for service interruptions caused by factors beyond reasonable control, including ISP failures in the Province, power outages, Supabase platform downtime, or acts of nature.
            </p>
          </section>

          {/* Section 8 & 9: Legal & Severability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <section>
              <h3 className="font-bold text-zinc-900 text-xs mb-2 flex items-center gap-2">
                <Globe size={14} className="text-indigo-600"/> 8. Governing Law
              </h3>
              <p className="text-[11px]">
                Governed by the laws of the <strong>Republic of the Philippines</strong>. Venue: <strong>Province of Abra</strong>.
              </p>
            </section>
            <section>
              <h3 className="font-bold text-zinc-900 text-xs mb-2 flex items-center gap-2">
                <Scale size={14} className="text-gray-400"/> 9. Severability
              </h3>
              <p className="text-[11px]">
                If any provision is found unenforceable, it shall be limited to the minimum extent necessary to keep other terms in effect.
              </p>
            </section>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 active:scale-95 transition-all shadow-sm flex items-center gap-2"
          >
            <CheckCircle size={16} />
            I Agree
          </button>
        </div>

      </div>
    </div>
  );
}