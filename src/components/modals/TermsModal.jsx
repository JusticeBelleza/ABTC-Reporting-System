import React from 'react';
import { Scroll, CheckCircle, Ban, ShieldAlert, AlertOctagon, XCircle, Gavel, ZapOff, Globe, Scale } from 'lucide-react';

export default function TermsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Scroll className="w-6 h-6 text-blue-600" />
              Terms of Use
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Effective Date: February 17, 2026</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-sm text-zinc-600 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-600" />
              1. Acceptable Use Policy
            </h3>
            <p className="mb-3">
              As an authorized representative of an <strong>Animal Bite Treatment Center (ABTC)</strong> (whether government-owned or private accredited), you are granted a limited right to access the System strictly for official reporting to the Abra Provincial Health Office.
            </p>
            <p className="mb-3">
              You agree to input only accurate and truthful statistical data and maintain the confidentiality of your <strong>ABTC's</strong> login credentials.
            </p>
            <p className="text-xs bg-zinc-50 p-3 rounded border border-zinc-100">
              <strong>Data Processing Consent:</strong> By using this System, you explicitly consent to the collection and processing of your professional personnel data (Name, Designation, and Contact Info) as described in the Privacy Policy for system security and account management.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <Ban size={18} className="text-rose-600" />
              2. Strict Prohibition on Patient Data
            </h3>
            <p className="mb-2">
              <strong>COMPLIANCE WITH RA 10173:</strong> Users are strictly prohibited from entering Sensitive Personal Information (Patient Names, Addresses, Medical IDs) into any free-text fields.
            </p>
            <p className="font-medium text-red-600 text-xs">
              The Developer and the Abra Provincial Health Office assume no liability for privacy violations resulting from your failure to adhere to this prohibition.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-violet-600" />
              3. Indemnification
            </h3>
            <p>
              To the maximum extent permitted by applicable law, the Animal Bite Treatment Center agrees to indemnify and hold harmless the Developer and the Abra Provincial Health Office from and against any claims, liabilities, or expenses arising from the <strong>ABTC's</strong> violation of the <strong>Zero-Patient Data Policy</strong>, specifically the unauthorized input of Sensitive Personal Information.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <AlertOctagon size={18} className="text-red-600" />
              4. Prohibited Acts
            </h3>
            <p className="mb-2">In addition to the Zero-Patient Data Policy, users are prohibited from:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Sharing account credentials with unauthorized personnel.</li>
              <li>Attempting to reverse engineer, scrape, or attack the System infrastructure.</li>
              <li>Using the System for any purpose other than official health reporting.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <XCircle size={18} className="text-orange-600" />
              5. Suspension & Termination
            </h3>
            <p className="mb-2">
              The Abra Provincial Health Office and the Developer reserve the right to immediately suspend or revoke your <strong>ABTC's</strong> access credentials without notice for:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Violation of the Zero-Patient Data Policy.</strong></li>
              <li><strong>Loss of Government Accreditation:</strong> If the facility ceases to be an accredited Animal Bite Treatment Center recognized by the Provincial Health Office.</li>
              <li>Breach of these Terms of Use.</li>
              <li>Security risks or unauthorized sharing of credentials.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <Gavel size={18} className="text-cyan-600" />
              6. Intellectual Property
            </h3>
            <p>
              The <strong>ABTC Reporting System</strong> is the independent intellectual property of <strong>Justice Belleza</strong>. Usage by an ABTC does not constitute a transfer of ownership rights.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <ZapOff size={18} className="text-yellow-600" />
              7. Force Majeure (Service Availability)
            </h3>
            <p>
              The Developer shall not be liable for any interruption of service, data loss, or failure to report caused by factors beyond reasonable control, including but not limited to internet service provider (ISP) failures in the Province, power outages, Supabase/Hostinger platform downtime, or acts of nature.
            </p>
          </section>

          {/* Section 8 & 9 (Stacked) */}
          <div className="space-y-6 pt-4 border-t border-zinc-100">
            <section>
              <h3 className="text-zinc-900 font-semibold mb-1 flex items-center gap-2">
                <Globe size={16} className="text-indigo-600" />
                8. Governing Law
              </h3>
              <p>
                These Terms shall be governed by the laws of the <strong>Republic of the Philippines</strong>. Any legal action shall be brought exclusively in the proper courts of the <strong>Province of Abra</strong>.
              </p>
            </section>
            <section>
              <h3 className="text-zinc-900 font-semibold mb-1 flex items-center gap-2">
                <Scale size={16} className="text-pink-600" />
                9. Severability
              </h3>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be limited or eliminated to the minimum extent necessary.
              </p>
            </section>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            I Agree
          </button>
        </div>

      </div>
    </div>
  );
}