import React from 'react';
import { Shield, AlertTriangle, FileText, Eye, Lock, UserCheck, History } from 'lucide-react';

export default function PrivacyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-600" />
              Privacy Policy
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Effective Date: February 17, 2026</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-sm text-zinc-600 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-600" />
              1. Zero-Patient Data Policy
            </h3>
            <p>
              To ensure the highest standard of data privacy, this System operates on a <strong>Strict Non-Collection Policy</strong>. We do <strong>NOT</strong> collect, store, or process Patient Names, Addresses, Medical Histories, or any Personally Identifiable Information (PII).
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              2. Information We Collect
            </h3>
            <p className="mb-3">We adhere to the principle of proportionality under RA 10173. Data collection is strictly limited to:</p>
            
            <div className="grid md:grid-cols-2 gap-6 pl-1">
              <div>
                <strong className="block text-zinc-800 text-xs uppercase tracking-wider mb-2">A. Personnel Info (System Users)</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Full Name & Designation</li>
                  <li>Institutional Email</li>
                  <li>Work Contact Number</li>
                </ul>
              </div>
              <div>
                <strong className="block text-zinc-800 text-xs uppercase tracking-wider mb-2">B. Statistical Data</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Aggregated bite counts</li>
                  <li>Vaccine inventory usage</li>
                  <li>Category summaries</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <Eye size={18} className="text-blue-600" />
              3. Use and Disclosure
            </h3>
            <p className="mb-2">
              Data is processed solely for automated accomplishment reports, <strong>Animal Bite Treatment Center</strong> monitoring, and security maintenance.
            </p>
            <p className="italic text-zinc-500 border-l-2 border-zinc-200 pl-3">
              We do not sell, trade, or transfer your personally identifiable information to outside parties.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <Lock size={18} className="text-amber-600" />
              4. Security Measures
            </h3>
            <p className="mb-3">The System utilizes industry-standard security protocols to protect your data:</p>
            <ul className="list-disc pl-4 space-y-2">
              <li><strong>Encryption:</strong> All data is encrypted-at-rest and encrypted-in-transit via the platform provider (Supabase).</li>
              <li><strong>Access Control:</strong> Strict Role-Based Access Control (RBAC) ensures only authorized personnel can access <strong>ABTC data</strong>.</li>
              <li><strong>Compliance:</strong> The infrastructure provider adheres to SOC2 and HIPAA compliance standards.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <UserCheck size={18} className="text-teal-600" />
              5. Contact Information (Data Protection)
            </h3>
            <p className="mb-3">For privacy concerns or to exercise your rights under RA 10173:</p>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
              <p className="font-semibold text-zinc-900">Antonio L. Valera, MD</p>
              <p className="text-xs text-zinc-500">Assistant Provincial Health Officer</p>
              <p className="text-xs text-zinc-500">Data Protection Officer (Abra Provincial Health Office)</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-zinc-900 font-semibold mb-2 flex items-center gap-2">
              <History size={18} className="text-purple-600" />
              6. Data Retention Policy
            </h3>
            <ul className="list-disc pl-4 space-y-2">
              <li><strong>Statistical Data:</strong> Retained indefinitely for historical public health analysis.</li>
              <li><strong>Personnel Data:</strong> User account information is retained only as long as the account is active. Upon resignation or termination of an authorized representative, their personal contact details will be deactivated and purged from the live system within thirty (30) days.</li>
            </ul>
          </section>

        </div>

        {/* Footer - Centered Button */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 shrink-0 flex justify-center">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Acknowledge
          </button>
        </div>

      </div>
    </div>
  );
}